import { BarChart, type BarDatum } from '@/components/charts';
import { Card, CardHeader } from '@/components/ui';

export function LeadsBySourceCard({ data }: { data: BarDatum[] }) {
  return (
    <Card>
      <CardHeader title="Leads by source" />
      <BarChart data={data} unit="leads" />
    </Card>
  );
}
