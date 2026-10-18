export type AgentRunResult =
  | { outcome: 'done'; detail?: string }
  | { outcome: 'skipped'; reason: string }
  | { outcome: 'reschedule'; runAfter: Date; reason: string }
  | { outcome: 'failed'; error: string };
