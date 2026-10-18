import { Card, CardHeader, Skeleton } from '@/components/ui';
import { useUpcomingViewings } from '../hooks/useDashboardQueries';
import { ViewingItem } from './ViewingItem';

export function UpcomingViewingsCard() {
  const { data, isLoading } = useUpcomingViewings();
  return (
    <Card>
      <CardHeader title="Upcoming viewings" subtitle="Next 48 hours" />
      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <ul className="-mx-2 flex flex-col gap-1">
          {data?.map((v) => <ViewingItem key={v.id} viewing={v} />)}
        </ul>
      )}
    </Card>
  );
}
