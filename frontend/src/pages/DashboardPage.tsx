import { useCallback, useState } from 'react';
import { Notice } from '@/components/ui';
import { DashboardToolbar, InsightsGrid, OverviewGrid } from '@/features/dashboard/components';
import { useDashboardSummary } from '@/features/dashboard/hooks/useDashboardQueries';
import type { DashboardFilters } from '@/features/dashboard/types';
import { AddLeadModal } from '@/features/leads/components/AddLeadModal';

export default function DashboardPage() {
  const [search, setSearch] = useState('');
  const [view, setView] = useState('all');
  const [filters, setFilters] = useState<DashboardFilters>({ emirate: 'all', period: '30d' });
  const [addOpen, setAddOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const { data: summary } = useDashboardSummary(filters);
  const dismissNotice = useCallback(() => setNotice(null), []);

  return (
    <>
      <h1 className="sr-only">Dashboard</h1>
      <DashboardToolbar
        search={search}
        onSearch={setSearch}
        filters={filters}
        onFilters={setFilters}
        view={view}
        onView={setView}
        onAddLead={() => setAddOpen(true)}
      />
      <OverviewGrid summary={summary} />
      <InsightsGrid summary={summary} view={view} search={search} />

      <AddLeadModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(lead) =>
          setNotice(`${lead.code} ${lead.fullName} added${lead.assignedTo ? ` and assigned to ${lead.assignedTo.name.split(' ')[0]}` : ''}. The AI is analysing it now.`)
        }
      />
      <Notice message={notice} onDismiss={dismissNotice} />
    </>
  );
}
