import { z } from 'zod';

/** Zod schema → JSON Schema accepted by Groq strict mode (all keys required, no extras). */
export function toStrictJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema, { io: 'output', unrepresentable: 'any' }) as Record<string, unknown>;
  return clean(json) as Record<string, unknown>;
}

function clean(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(clean);
  if (!node || typeof node !== 'object') return node;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === '$schema' || key === 'default') continue;
    out[key] = clean(value);
  }
  if (out.type === 'object' && out.properties) {
    out.required = Object.keys(out.properties as object);
    out.additionalProperties = false;
  }
  return out;
}
