import { Bot, CircleOff, Sparkles, type LucideIcon } from 'lucide-react';
import type { AgentMode } from '@/types';
import { cn } from '@/utils/cn';

export const AGENT_MODES: { value: AgentMode; label: string; help: string; icon: LucideIcon }[] = [
  { value: 'OFF', label: 'Off', help: 'Read and scored by rules. Nothing is sent.', icon: CircleOff },
  { value: 'RULES', label: 'Auto (rules)', help: 'Full flow with templates and rules. No AI tokens.', icon: Bot },
  { value: 'AI', label: 'AI agent', help: 'AI reads, matches, writes the proposal and replies. Uses AI tokens.', icon: Sparkles },
];

export const AGENT_MODE_LABEL: Record<AgentMode, string> = { OFF: 'Off', RULES: 'Auto (rules)', AI: 'AI agent' };

interface AgentModePickerProps {
  value: AgentMode;
  onChange: (mode: AgentMode) => void;
  disabled?: boolean;
  /** Disable the modes that send email (no address on the lead). */
  noEmail?: boolean;
  className?: string;
}

/** Who works this lead: nobody, the free rule-based engine, or the AI agent. */
export function AgentModePicker({ value, onChange, disabled, noEmail, className }: AgentModePickerProps) {
  return (
    <div role="radiogroup" aria-label="Lead agent" className={cn('grid gap-2 sm:grid-cols-3', className)}>
      {AGENT_MODES.map((m) => {
        const selected = value === m.value;
        const blocked = disabled || (noEmail && m.value !== 'OFF');
        return (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={blocked}
            onClick={() => !selected && onChange(m.value)}
            className={cn(
              'flex min-h-11 cursor-pointer items-start gap-2.5 rounded-panel border px-3.5 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50',
              selected ? 'border-primary bg-primary-soft' : 'border-border bg-surface hover:bg-surface-2',
            )}
          >
            <m.icon className={cn('mt-0.5 size-4 shrink-0', selected ? 'text-primary' : 'text-muted')} aria-hidden />
            <span className="min-w-0">
              <span className="block text-label-large text-heading">{m.label}</span>
              <span className="block text-body-small text-muted">{m.help}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
