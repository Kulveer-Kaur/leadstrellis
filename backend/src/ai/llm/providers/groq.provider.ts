import { aiConfig } from '../../../config/ai.config.js';
import { logger } from '../../../lib/logger.js';
import { LlmRequestError, type JsonCompletion, type JsonCompletionRequest, type LlmProvider } from '../llm.types.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface GroqResponse {
  model: string;
  choices: { message: { content: string | null } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

/** Groq's OpenAI-compatible Chat Completions API, called with fetch (no SDK needed). */
export class GroqProvider implements LlmProvider {
  readonly name = 'groq';

  async completeJson(req: JsonCompletionRequest): Promise<JsonCompletion> {
    const isGptOss = req.model.startsWith('openai/gpt-oss');
    const body = {
      model: req.model,
      messages: req.messages,
      temperature: req.temperature,
      max_completion_tokens: req.maxTokens,
      response_format:
        req.mode === 'strict'
          ? { type: 'json_schema', json_schema: { name: req.schemaName, strict: true, schema: req.jsonSchema } }
          : { type: 'json_object' },
      // gpt-oss models reason before answering; low effort keeps latency and token use down.
      ...(isGptOss ? { reasoning_effort: 'low', include_reasoning: false } : {}),
    };

    const { maxRetries, timeoutMs, baseUrl, apiKey } = aiConfig.groq;
    for (let attempt = 0; ; attempt++) {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (res.ok) {
        const data = (await res.json()) as GroqResponse;
        const content = data.choices[0]?.message.content ?? '';
        return {
          content,
          model: data.model,
          inputTokens: data.usage?.prompt_tokens,
          outputTokens: data.usage?.completion_tokens,
        };
      }

      const text = await res.text();
      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable || attempt >= maxRetries) {
        throw new LlmRequestError(`Groq ${res.status}: ${text.slice(0, 400)}`, res.status);
      }
      // Free tier: 30 requests and 8K tokens per minute. Honour retry-after when Groq sends it.
      const retryAfter = Number(res.headers.get('retry-after'));
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** attempt;
      logger.warn({ status: res.status, waitMs, model: req.model }, 'Groq request throttled, retrying');
      await sleep(Math.min(waitMs, 30_000));
    }
  }
}
