import { Card, CardHeader, CardSkeleton, ProgressBar, StatStrip } from '@/components/ui';
import { formatNumber, formatPercent } from '@/utils/format';
import { useEmailStats } from '../hooks/useReports';

export function EmailStatsCard() {
  const { data, isLoading } = useEmailStats();
  if (isLoading || !data) return <CardSkeleton className="h-40" />;
  return (
    <Card>
      <CardHeader title="Email" subtitle="Sent by agents and the team" action={<span />} />
      <StatStrip
        items={[
          { label: 'Sent, 24h', value: formatNumber(data.sent24h) },
          { label: 'Sent, 7d', value: formatNumber(data.sent7d) },
          { label: 'Replies, 7d', value: formatNumber(data.replies7d) },
        ]}
      />
      <div className="mt-4 flex items-baseline justify-between text-body-medium">
        <span className="text-text">Reply rate (7 days)</span>
        <span className="num text-title-medium text-heading">{formatPercent(data.replyRate)}</span>
      </div>
      <ProgressBar className="mt-2" value={data.replyRate} label="Reply rate over 7 days" />
    </Card>
  );
}
