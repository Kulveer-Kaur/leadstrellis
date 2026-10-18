import { CardSkeleton } from '@/components/ui';
import type { DashboardSummary } from '../types';
import { AiRouteBoardCard } from './AiRouteBoardCard';
import { LeadOverviewCard } from './LeadOverviewCard';
import { PipelineValueCard } from './PipelineValueCard';

/** First fold: the AI route board (the lead journey) next to the lead totals. */
export function OverviewGrid({ summary }: { summary?: DashboardSummary }) {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <AiRouteBoardCard className="xl:col-span-2" />
      <div className="flex flex-col gap-5">
        {summary ? (
          <>
            <LeadOverviewCard data={summary.overview} />
            <PipelineValueCard data={summary.pipelineValue} />
          </>
        ) : (
          <>
            <CardSkeleton className="h-72" />
            <CardSkeleton className="h-40" />
          </>
        )}
      </div>
    </div>
  );
}
