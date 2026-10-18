export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** `strict` = JSON Schema enforced by the provider; `object` = any JSON object (schema given in the prompt). */
export type JsonMode = 'strict' | 'object';

export interface JsonCompletionRequest {
  model: string;
  messages: LlmMessage[];
  temperature: number;
  maxTokens: number;
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  mode: JsonMode;
}

export interface JsonCompletion {
  content: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface LlmProvider {
  readonly name: string;
  completeJson(req: JsonCompletionRequest): Promise<JsonCompletion>;
}

/** The provider rejected the request shape (e.g. schema unsupported), so retrying the same request is pointless. */
export class LlmRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}
