import { FunnelBars, type FunnelStage } from '@/components/charts';
import { Card, CardHeader } from '@/components/ui';
import { formatPercent } from '@/utils/format';

export function ConversionFunnelCard({ stages }: { stages: FunnelStage[] }) {
  const first = stages[0]?.value ?? 0;
  const last = stages[stages.length - 1]?.value ?? 0;
  const rate = first ? (last / first) * 100 : 0;

  return (
    <Card>
      <CardHeader title="Pipeline funnel" subtitle="Leads moved by the AI through each stage" />
      <FunnelBars stages={stages} />
      <div className="mt-5 flex items-center justify-between rounded-panel bg-surface-2 px-4 py-3">
        <span className="text-body-medium text-text">New to closed</span>
        <span className="num text-title-medium text-heading">{formatPercent(rate)}</span>
      </div>
    </Card>
  );
}
