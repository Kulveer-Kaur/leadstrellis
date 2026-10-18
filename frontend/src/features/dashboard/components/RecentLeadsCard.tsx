import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { LeadsTable } from '@/features/leads/components';
import { useDebounce } from '@/hooks/useDebounce';
import { useRecentLeads } from '../hooks/useDashboardQueries';

interface RecentLeadsCardProps {
  view: string;
  search: string;
  className?: string;
}

export function RecentLeadsCard({ view, search, className }: RecentLeadsCardProps) {
  const { data: leads = [], isLoading, isError, error } = useRecentLeads(view, useDebounce(search));

  return (
    <Card className={className}>
      <CardHeader
        title="Latest leads"
        subtitle="Captured, understood and scored by AI as they arrive"
        action={
          <Link to={ROUTES.leads} className="inline-flex min-h-10 items-center gap-1 rounded-full px-3 text-label-large text-primary hover:bg-primary-soft">
            View all <ChevronRight className="size-4" aria-hidden />
          </Link>
        }
      />
      <LeadsTable leads={leads} loading={isLoading} />
      {isError && <p className="py-10 text-center text-body-medium text-danger">{error.message}</p>}
      {!isLoading && !isError && leads.length === 0 && <p className="py-10 text-center text-body-medium text-muted">No leads match this view.</p>}
    </Card>
  );
}
