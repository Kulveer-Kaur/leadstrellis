import { Card, CardSkeleton } from '@/components/ui';
import { formatAedCompact, formatNumber } from '@/utils/format';
import { useForecast } from '../hooks/useReports';

/** Hero number: open deal value weighted by each lead's chance to close. */
export function ForecastCard() {
  const { data, isLoading } = useForecast();
  if (isLoading || !data) return <CardSkeleton className="h-40" />;
  return (
    <Card className="flex flex-col">
      <h2 className="text-body-medium text-text">Expected revenue</h2>
      <p className="num mt-2 flex items-baseline gap-1.5 text-display-small text-heading">
        <span className="text-body-medium text-muted">AED</span>
        {formatAedCompact(data.expectedAed).replace('AED ', '')}
      </p>
      <p className="mt-auto pt-3 text-body-small text-muted">
        Across <span className="num text-heading">{formatNumber(data.openLeads)}</span> open leads, each deal value × its win probability.
      </p>
    </Card>
  );
}
