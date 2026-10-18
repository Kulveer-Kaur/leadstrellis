import { Bot } from 'lucide-react';
import { Card, CardHeader, CardSkeleton, LiveDot } from '@/components/ui';
import { useAgentFeed } from '../hooks/useDashboardQueries';

const AGENT_LABELS: Record<string, string> = {
  INTAKE: 'Intake agent',
  QUALIFIER: 'Qualifier agent',
  MATCHMAKER: 'Matchmaker agent',
  OUTREACH: 'Outreach agent',
  INBOX: 'Inbox agent',
  FOLLOW_UP: 'Follow-up agent',
  DEAL: 'Deal agent',
  PILOT: 'LeadsTrellis',
};

/**
 * Live feed of recently-finished AgentTasks. Replaces the legacy AI activity feed on
 * the Phase-2 dashboard; polled every 10 seconds so new sends appear within the hook
 * window without socket plumbing.
 */
export function AgentFeedCard({ className }: { className?: string }) {
  const { data, isLoading } = useAgentFeed();
  if (isLoading) return <CardSkeleton className={className ?? 'h-80'} />;
  const rows = data ?? [];

  return (
    <Card className={className}>
      <CardHeader
        title="Live agent feed"
        action={
          <span className="inline-flex items-center gap-1.5 text-label-medium text-success">
            <LiveDot /> live
          </span>
        }
      />
      {rows.length === 0 ? (
        <div className="grid min-h-32 place-items-center text-body-small text-muted">
          No agent activity yet. Assign a lead to Auto (rules) or the AI agent to start.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id} className="flex items-start gap-3 py-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                <Bot className="size-4" strokeWidth={1.75} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-label-large text-heading">
                  {AGENT_LABELS[r.agent] ?? r.agent} <span className="text-body-small text-muted">· {r.type.replace(/_/g, ' ')}</span>
                </p>
                <p className="truncate text-body-small text-muted">
                  {r.leadLabel ? `${r.leadLabel} — ` : ''}
                  {r.detail ?? r.outcome}
                </p>
              </div>
              <time className="shrink-0 text-body-small text-muted">
                {new Date(r.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </time>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
