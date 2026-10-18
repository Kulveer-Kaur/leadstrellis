import { Card, CardHeader, ProgressRing } from '@/components/ui';
import { formatNumber } from '@/utils/format';
import type { DashboardSummary } from '../types';

export function LeadOverviewCard({ data }: { data: DashboardSummary['overview'] }) {
  return (
    <Card>
      <CardHeader
        title="Lead overview"
        subtitle={`${data.qualifiedRate}% of this month's leads were qualified by AI.`}
      />
      <div className="mt-6 flex items-center gap-6">
        <ProgressRing value={data.qualifiedRate} label="Qualified rate" size={172}>
          <div>
            <p className="num text-headline-large text-heading">{data.qualifiedRate}%</p>
            <p className="text-body-medium text-muted">Qualified</p>
          </div>
        </ProgressRing>
        <dl className="flex flex-1 flex-col gap-4 border-l border-border pl-5">
          <div>
            <dd className="num text-headline-medium text-heading">{formatNumber(data.newLeads)}</dd>
            <dt className="text-body-medium text-muted">New leads</dt>
          </div>
          <hr className="w-14 border-border" />
          <div>
            <dd className="num text-headline-medium text-heading">{formatNumber(data.qualified)}</dd>
            <dt className="text-body-medium text-muted">Qualified</dt>
          </div>
        </dl>
      </div>
    </Card>
  );
}
