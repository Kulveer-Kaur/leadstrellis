import { CardSkeleton } from '@/components/ui';
import type { DashboardSummary } from '../types';
import { AgentFeedCard } from './AgentFeedCard';
import { ConversionFunnelCard } from './ConversionFunnelCard';
import { LeadsBySourceCard } from './LeadsBySourceCard';
import { RecentLeadsCard } from './RecentLeadsCard';
import { UpcomingViewingsCard } from './UpcomingViewingsCard';

interface InsightsGridProps {
  summary?: DashboardSummary;
  view: string;
  search: string;
}

/** Below the fold: recent leads with the live agent feed, then the funnel, sources and site visits. */
export function InsightsGrid({ summary, view, search }: InsightsGridProps) {
  return (
    <>
      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <RecentLeadsCard view={view} search={search} className="xl:col-span-2" />
        <AgentFeedCard />
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {summary ? <ConversionFunnelCard stages={summary.funnel} /> : <CardSkeleton />}
        {summary ? <LeadsBySourceCard data={summary.sources} /> : <CardSkeleton />}
        <div className="md:col-span-2 xl:col-span-1"><UpcomingViewingsCard /></div>
      </div>
    </>
  );
}
