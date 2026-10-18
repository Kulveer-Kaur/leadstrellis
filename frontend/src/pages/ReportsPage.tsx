import { useState } from 'react';
import { PageHeader } from '@/components/layout';
import { CardSkeleton, PillSelect } from '@/components/ui';
import { ConversionFunnelCard } from '@/features/dashboard/components/ConversionFunnelCard';
import { LeadsBySourceCard } from '@/features/dashboard/components/LeadsBySourceCard';
import { PipelineValueCard } from '@/features/dashboard/components/PipelineValueCard';
import { useDashboardSummary } from '@/features/dashboard/hooks/useDashboardQueries';
import { EmailStatsCard, ForecastCard, LikelyToWinCard, PilotInsightsCard } from '@/features/reports/components';

const PERIODS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'qtd', label: 'This quarter' },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState('30d');
  const { data: summary } = useDashboardSummary({ period, emirate: 'all' });

  return (
    <>
      <PageHeader
        title="Reports"
        description="How the pipeline is doing and where the next deals will come from."
        actions={<PillSelect label="Period" value={period} options={PERIODS} onChange={setPeriod} align="right" className="w-48" />}
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <ForecastCard />
        {summary ? <PipelineValueCard data={summary.pipelineValue} /> : <CardSkeleton className="h-40" />}
        <EmailStatsCard />
        {summary ? <ConversionFunnelCard stages={summary.funnel} /> : <CardSkeleton className="h-80" />}
        {summary ? <LeadsBySourceCard data={summary.sources} /> : <CardSkeleton className="h-80" />}
        <PilotInsightsCard />
        <div className="md:col-span-2 xl:col-span-3">
          <LikelyToWinCard />
        </div>
      </div>
    </>
  );
}
