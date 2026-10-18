import type { DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui';
import { leadPath } from '@/constants/routes';
import { IntentBadge, LeadScore, LeadSourceIcon } from '@/features/leads/components';
import { describeNeed } from '@/features/leads/utils/describe-need';
import type { LeadSummary } from '@/types';
import { cn } from '@/utils/cn';
import { formatAedCompact } from '@/utils/format';

interface PipelineCardProps {
  lead: LeadSummary;
  onDragStart: (lead: LeadSummary) => void;
  onDragEnd: () => void;
  dragging: boolean;
}

export function PipelineCard({ lead, onDragStart, onDragEnd, dragging }: PipelineCardProps) {
  const r = lead.requirement;
  const start = (e: DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', lead.id);
    onDragStart(lead);
  };
  return (
    <li
      draggable
      onDragStart={start}
      onDragEnd={onDragEnd}
      className={cn(
        'cursor-grab rounded-panel border border-border bg-surface p-3 shadow-soft transition-opacity active:cursor-grabbing',
        dragging && 'opacity-40',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={lead.fullName} size="sm" />
          <div className="min-w-0">
            <Link to={leadPath(lead.id)} className="block truncate text-label-large text-heading hover:text-primary">
              {lead.fullName}
            </Link>
            <p className="num text-body-small text-muted">{lead.code}</p>
          </div>
        </div>
        <LeadScore score={lead.score} />
      </div>
      <p className="mt-2 truncate text-body-small text-text">
        {r ? describeNeed(r) : 'Waiting for AI…'}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="num text-label-medium text-primary">{r?.budgetMaxAed ? formatAedCompact(r.budgetMaxAed) : 'No budget yet'}</span>
        <div className="flex items-center gap-1.5">
          <IntentBadge intent={lead.intent} />
          <LeadSourceIcon source={lead.source} />
        </div>
      </div>
      {lead.assignedTo && <p className="mt-2 border-t border-border pt-2 text-body-small text-muted">{lead.assignedTo.name}</p>}
    </li>
  );
}
