import type { z } from 'zod';
import { aiConfig, type AiTaskName } from '../../config/ai.config.js';
import { logger } from '../../lib/logger.js';
import { prisma } from '../../lib/prisma.js';
import { getLlm } from '../llm/llm.factory.js';
import { LlmRequestError, type JsonMode, type LlmMessage } from '../llm/llm.types.js';
import { toStrictJsonSchema } from './json-schema.js';
import { redactPii } from './pii.redactor.js';
import { hasTokenBudget, recordTokenUsage } from './token-budget.js';

export interface JsonTaskInput<T> {
  task: AiTaskName;
  promptVersion: string;
  system: string;
  user: string;
  schema: z.ZodType<T>;
  /** Deterministic result used offline (mock mode) or when the AI fails twice. */
  fallback: () => T | Promise<T>;
  /** False = use the free rule-based fallback without calling the AI (lead not on the AI agent). */
  useAi?: boolean;
}

export interface JsonTaskResult<T> {
  data: T;
  source: 'ai' | 'fallback';
  model?: string;
}

/**
 * Runs one AI task with guard rails:
 * 1. strict JSON Schema request → 2. on schema rejection, JSON-object mode with the schema in the prompt
 * → 3. on a validation failure, one corrective retry → 4. rule-based fallback. Every attempt is logged.
 */
export async function runJsonTask<T>(input: JsonTaskInput<T>): Promise<JsonTaskResult<T>> {
  const llm = getLlm();
  if (input.useAi === false) return { data: await input.fallback(), source: 'fallback' };
  if (!llm) return { data: await input.fallback(), source: 'fallback' };

  const settings = aiConfig.tasks[input.task];
  // Daily token budget guard: once the Groq free-tier cap is reached, every task
  // falls back to the deterministic rule-based result until the budget resets.
  if (!(await hasTokenBudget(settings.maxTokens))) {
    logger.warn({ task: input.task }, 'daily ai token budget exhausted, using fallback');
    return { data: await input.fallback(), source: 'fallback' };
  }
  const jsonSchema = toStrictJsonSchema(input.schema);
  const messages: LlmMessage[] = [
    { role: 'system', content: input.system },
    { role: 'user', content: input.user },
  ];
  let mode: JsonMode = 'strict';

  for (let attempt = 1; attempt <= 2; attempt++) {
    const started = Date.now();
    const request = {
      model: settings.model,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
      schemaName: input.task.replace(/-/g, '_'),
      jsonSchema,
      mode,
      messages:
        mode === 'object'
          ? [{ role: 'system' as const, content: `${input.system}\n\nReturn a JSON object matching this JSON Schema:\n${JSON.stringify(jsonSchema)}` }, ...messages.slice(1)]
          : messages,
    };

    try {
      const res = await llm.completeJson(request);
      void recordTokenUsage(res.inputTokens, res.outputTokens);
      const parsed = input.schema.safeParse(safeJson(res.content));
      void logAiCall(input, llm.name, res.model, Date.now() - started, parsed.success, res, parsed.success ? undefined : parsed.error.message);
      if (parsed.success) return { data: parsed.data, source: 'ai', model: res.model };

      // Ask the model to fix its own output once.
      messages.push(
        { role: 'assistant', content: res.content },
        { role: 'user', content: `That JSON failed validation: ${parsed.error.message.slice(0, 600)}. Return the corrected JSON only.` },
      );
      mode = 'object';
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      void logAiCall(input, llm.name, settings.model, Date.now() - started, false, undefined, message);
      // A 400 in strict mode usually means the schema or strict output failed; retry in object mode.
      if (err instanceof LlmRequestError && err.status === 400 && mode === 'strict') {
        mode = 'object';
        continue;
      }
      logger.warn({ task: input.task, err: message }, 'AI task failed, using fallback');
      break;
    }
  }

  logger.warn({ task: input.task }, 'AI output invalid after retry, using fallback');
  return { data: await input.fallback(), source: 'fallback' };
}

function safeJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

async function logAiCall(
  input: JsonTaskInput<unknown>,
  provider: string,
  model: string,
  latencyMs: number,
  success: boolean,
  usage?: { inputTokens?: number; outputTokens?: number },
  error?: string,
) {
  try {
    await prisma.aiCallLog.create({
      data: {
        task: input.task,
        provider,
        model,
        promptVersion: input.promptVersion,
        latencyMs,
        success,
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
        error: error ? redactPii(error).slice(0, 2000) : undefined,
      },
    });
  } catch (err) {
    logger.debug({ err }, 'failed to write AI call log');
  }
}
