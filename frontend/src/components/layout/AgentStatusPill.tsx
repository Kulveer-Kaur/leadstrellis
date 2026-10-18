import { Bot, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LiveDot } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { useSettings } from '@/features/settings/hooks/useSettings';

/**
 * Sidebar footer: LeadsTrellis pilot status. Clicking it opens the AI Agents page
 * where the admin can see what each agent did and toggle them.
 * Phase 2 — the previous "AI agent live" call button is removed (plan §0, decision #7).
 */
export function AgentStatusPill() {
  const { data } = useSettings();
  const live = Boolean(data?.settings.pilotEnabled);
  return (
    <Link
      to={ROUTES.automations}
      className="flex min-h-12 w-full cursor-pointer items-center gap-2.5 rounded-full border border-border-strong bg-surface px-4 text-label-medium text-heading transition-colors hover:bg-surface-2"
    >
      <Bot className="size-4" strokeWidth={1.75} aria-hidden />
      <span className="flex-1 text-left">{live ? 'LeadsTrellis active' : 'LeadsTrellis idle'}</span>
      {live && <LiveDot />}
      <ChevronRight className="size-4 text-muted" aria-hidden />
    </Link>
  );
}
