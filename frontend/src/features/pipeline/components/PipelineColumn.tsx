import { useState, type DragEvent } from 'react';
import { Skeleton } from '@/components/ui';
import { STATUS_META } from '@/constants/lead-meta';
import type { LeadStatus, LeadSummary } from '@/types';
import { cn } from '@/utils/cn';
import { formatAedCompact, formatNumber } from '@/utils/format';
import { PipelineCard } from './PipelineCard';

interface PipelineColumnProps {
  status: LeadStatus;
  leads: LeadSummary[] | undefined;
  total: number;
  loading: boolean;
  dragged: LeadSummary | null;
  /** The dragged card may be dropped here. */
  canDrop: boolean;
  onDragStart: (lead: LeadSummary) => void;
  onDragEnd: () => void;
  onDrop: (to: LeadStatus) => void;
}

export function PipelineColumn({ status, leads, total, loading, dragged, canDrop, onDragStart, onDragEnd, onDrop }: PipelineColumnProps) {
  const [over, setOver] = useState(false);
  const meta = STATUS_META[status];
  const value = (leads ?? []).reduce((sum, l) => sum + (l.requirement?.budgetMaxAed ?? 0), 0);
  const blocked = dragged && !canDrop && dragged.status !== status;

  const dragOver = (e: DragEvent) => {
    if (!canDrop) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOver(true);
  };
  const drop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    if (canDrop) onDrop(status);
  };

  return (
    <section
      aria-label={`${meta.label}, ${total} leads`}
      onDragOver={dragOver}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
      className={cn(
        'flex w-72 shrink-0 flex-col rounded-card border bg-surface-2/70 transition-colors',
        over ? 'border-primary bg-primary-soft' : 'border-transparent',
        blocked && 'opacity-50',
      )}
    >
      <header className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
        <div>
          <h2 className="text-title-small text-heading">{meta.label}</h2>
          <p className="num text-body-small text-muted">{value ? `${formatAedCompact(value)} in budgets` : ' '}</p>
        </div>
        <span className="num rounded-full bg-surface px-2.5 py-0.5 text-label-medium text-heading">{formatNumber(total)}</span>
      </header>
      <ul className="flex min-h-24 flex-1 flex-col gap-2.5 overflow-y-auto px-3 pb-3 scrollbar-thin">
        {loading
          ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)
          : leads?.map((l) => <PipelineCard key={l.id} lead={l} onDragStart={onDragStart} onDragEnd={onDragEnd} dragging={dragged?.id === l.id} />)}
        {!loading && !leads?.length && <li className="grid flex-1 place-items-center py-6 text-body-small text-muted">No leads</li>}
        {!loading && leads && total > leads.length && <li className="text-center text-body-small text-muted">+{formatNumber(total - leads.length)} more</li>}
      </ul>
    </section>
  );
}
