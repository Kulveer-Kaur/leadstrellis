import { Sparkline } from '@/components/charts';
import { Card } from '@/components/ui';
import { formatAedCompact } from '@/utils/format';
import type { DashboardSummary } from '../types';

export function PipelineValueCard({ data }: { data: DashboardSummary['pipelineValue'] }) {
  return (
    <Card className="flex flex-col p-5!">
      <h3 className="text-body-medium text-text">Pipeline value</h3>
      <p className="num mt-2 flex items-baseline gap-1.5 text-headline-medium text-heading">
        <span className="text-body-medium text-muted">AED</span>
        {formatAedCompact(data.totalAed).replace('AED ', '')}
      </p>
      <Sparkline
        className="mt-auto"
        data={data.trend}
        format={formatAedCompact}
        label={`Pipeline value trend, up ${data.delta}% over 10 weeks`}
      />
    </Card>
  );
}
