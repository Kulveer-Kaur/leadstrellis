import { useState } from 'react';
import { canMoveTo, PIPELINE_STAGES } from '@/constants/lead-meta';
import type { LeadSummary } from '@/types';
import { useMoveLead, usePipelineStages } from '../hooks/usePipeline';
import { PipelineColumn } from './PipelineColumn';

/** Kanban across every status. Drag a card to move the lead; columns it can't move to fade out. */
export function PipelineBoard({ search, onError }: { search: string; onError: (message: string) => void }) {
  const stages = usePipelineStages(search);
  const move = useMoveLead(search);
  const [dragged, setDragged] = useState<LeadSummary | null>(null);

  return (
    <div className="-mx-4 flex h-[calc(100dvh-14rem)] min-h-[28rem] gap-3 overflow-x-auto px-4 pb-2 scrollbar-thin sm:-mx-8 sm:px-8">
      {PIPELINE_STAGES.map((status, i) => {
        const q = stages[i];
        return (
          <PipelineColumn
            key={status}
            status={status}
            leads={q.data?.data}
            total={q.data?.meta?.total ?? q.data?.data.length ?? 0}
            loading={q.isLoading}
            dragged={dragged}
            canDrop={Boolean(dragged && canMoveTo(dragged.status, status))}
            onDragStart={setDragged}
            onDragEnd={() => setDragged(null)}
            onDrop={(to) => {
              if (!dragged) return;
              move.mutate({ lead: dragged, to }, { onError: (err) => onError(err.message) });
              setDragged(null);
            }}
          />
        );
      })}
    </div>
  );
}
