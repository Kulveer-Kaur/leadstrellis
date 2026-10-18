import { Bot, Download, ExternalLink, Route, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge, Card, CardHeader, CardSkeleton, EmptyState, StatStrip } from '@/components/ui';
import type { Tone } from '@/constants/lead-meta';
import { leadPath } from '@/constants/routes';
import { cn } from '@/utils/cn';
import { formatAedCompact, formatRelative } from '@/utils/format';
import type { AiRouteBoardLead } from '../api/dashboard.api';
import { useAiRouteBoard } from '../hooks/useDashboardQueries';

const STEP: Record<AiRouteBoardLead['aiRouteStep'], { label: string; tone: Tone }> = {
  ANALYSING: { label: 'Analysing', tone: 'info' },
  MATCHING: { label: 'Matching', tone: 'info' },
  PROPOSING: { label: 'Writing proposal', tone: 'info' },
  AWAITING_REPLY: { label: 'Awaiting reply', tone: 'warning' },
  WON: { label: 'Won', tone: 'success' },
  LOST: { label: 'Declined', tone: 'neutral' },
  NEEDS_ATTENTION: { label: 'Needs attention', tone: 'danger' },
};

/** Every lead on the AI route: where it is, which property was proposed, and quick links to the proposal. */
export function AiRouteBoardCard({ className }: { className?: string }) {
  const { data, isLoading } = useAiRouteBoard();
  if (isLoading || !data) return <CardSkeleton className={cn('h-96', className)} />;
  const c = data.counts;

  return (
    <Card className={className}>
      <CardHeader title="Lead agents" subtitle="Leads assigned to Auto (rules) or the AI agent, from enquiry to a confirmed site visit." action={<span />} />
      <StatStrip
        items={[
          { label: 'In progress', value: c.ANALYSING + c.MATCHING + c.PROPOSING },
          { label: 'Awaiting reply', value: c.AWAITING_REPLY },
          { label: 'Won', value: c.WON },
          { label: 'Needs attention', value: c.NEEDS_ATTENTION },
        ]}
      />
      {data.leads.length === 0 ? (
        <EmptyState
          icon={<Route className="size-5" aria-hidden />}
          title="No lead assigned to an agent yet"
          description="Open a lead and choose Auto (rules) or AI agent, or pick one when adding a lead."
        />
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {data.leads.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <div className="min-w-0 flex-1 basis-56">
                <Link to={leadPath(l.id)} className="text-title-small text-heading hover:text-primary">
                  {l.fullName} <span className="num text-body-small text-muted">· {l.code}</span>
                </Link>
                <p className="truncate text-body-small text-muted">
                  {l.proposal
                    ? `${l.proposal.propertyTitle}, ${l.proposal.community}${l.proposal.fitScore != null ? ` · ${l.proposal.fitScore}% match` : ''}${l.proposal.viewedAt ? ' · opened' : ''}`
                    : (l.aiRouteNote ?? '')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={l.agentMode === 'AI' ? 'primary' : 'neutral'} icon={l.agentMode === 'AI' ? <Sparkles className="size-3" aria-hidden /> : <Bot className="size-3" aria-hidden />}>
                  {l.agentMode === 'AI' ? 'AI agent' : 'Auto'}
                </Badge>
                <Badge tone={STEP[l.aiRouteStep].tone} dot>
                  {STEP[l.aiRouteStep].label}
                </Badge>
                {l.aiRouteStep === 'WON' && l.dealValueAed ? <span className="num text-label-large text-success">{formatAedCompact(l.dealValueAed)}</span> : null}
                <span className="hidden text-body-small text-muted sm:inline">{formatRelative(l.updatedAt)}</span>
              </div>
              {l.proposal && (
                <div className="flex items-center gap-1.5">
                  <a href={l.proposal.url} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 text-label-large text-on-primary hover:bg-primary-hover">
                    <ExternalLink className="size-3.5" aria-hidden /> View proposal
                  </a>
                  <a href={`${l.proposal.pdfUrl}?download=1`} aria-label={`Download ${l.fullName}'s proposal PDF`} className="grid size-9 place-items-center rounded-full border border-border-strong text-heading hover:bg-surface-2">
                    <Download className="size-4" aria-hidden />
                  </a>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
