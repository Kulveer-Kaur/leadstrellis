import { AlertTriangle, CalendarDays } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Button, Card, CardSkeleton, EmptyState, StatStrip, Tabs } from '@/components/ui';
import { groupByDay, ViewingDayGroup } from '@/features/viewings/components';
import { useViewings } from '@/features/viewings/hooks/useViewings';
import { useUrlState } from '@/hooks/useUrlState';

const TABS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'all', label: 'All viewings' },
];
const DEFAULTS = { tab: 'upcoming' };

export default function ViewingsPage() {
  const [state, setState] = useUrlState(DEFAULTS);
  const upcoming = state.tab === 'upcoming';
  const { data = [], isLoading, isError, error } = useViewings(upcoming);

  const weekAhead = Date.now() + 7 * 86_400_000;
  const stats = [
    { label: upcoming ? 'Upcoming' : 'Shown', value: data.length },
    { label: 'Next 7 days', value: data.filter((v) => new Date(v.scheduledAt).getTime() <= weekAhead && new Date(v.scheduledAt).getTime() >= Date.now()).length },
    { label: 'Booked by AI', value: data.filter((v) => v.bookedBy === 'AI').length },
  ];

  return (
    <>
      <PageHeader
        title="Viewings"
        description="Every booked viewing. Book new ones from a lead's page."
        actions={<Tabs label="Viewings view" items={TABS} value={state.tab} onChange={(tab) => setState({ tab })} />}
      />
      {!isLoading && !isError && <StatStrip items={stats} className="mb-5" />}
      {isLoading ? (
        <div className="flex flex-col gap-5">
          <CardSkeleton className="h-48" />
          <CardSkeleton className="h-48" />
        </div>
      ) : isError ? (
        <Card>
          <EmptyState tone="danger" icon={<AlertTriangle className="size-5" aria-hidden />} title="Could not load viewings" description={error.message} />
        </Card>
      ) : data.length === 0 ? (
        <Card>
          <EmptyState icon={<CalendarDays className="size-5" aria-hidden />} title={upcoming ? 'No upcoming viewings' : 'No viewings yet'}
            description="The Inbox agent books viewings when a lead asks for one."
            action={
              upcoming && (
                <Button variant="outline" onClick={() => setState({ tab: 'all' })}>
                  See past viewings
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {groupByDay(data).map((day) => (
            <ViewingDayGroup key={day[0].id} viewings={day} />
          ))}
        </div>
      )}
    </>
  );
}
