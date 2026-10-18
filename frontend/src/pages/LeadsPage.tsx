import { useCallback, useState } from 'react';
import { AlertTriangle, Users } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card, EmptyState, Notice, Pagination } from '@/components/ui';
import { AddLeadModal } from '@/features/leads/components/AddLeadModal';
import { LeadsTable, LeadsToolbar, type LeadFilters } from '@/features/leads/components';
import { useLeads } from '@/features/leads/hooks/useLeads';
import { useDebounce } from '@/hooks/useDebounce';
import { useUrlState } from '@/hooks/useUrlState';
import { formatNumber } from '@/utils/format';

const PAGE_SIZE = 20;
const DEFAULTS = { search: '', view: 'all', status: '', intent: '', source: '', sort: '-createdAt', page: '1' };

export default function LeadsPage() {
  const [state, setState] = useUrlState(DEFAULTS);
  const [addOpen, setAddOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const dismissNotice = useCallback(() => setNotice(null), []);
  const search = useDebounce(state.search);
  const page = Number(state.page) || 1;

  const { data, isLoading, isError, error } = useLeads({
    page,
    pageSize: PAGE_SIZE,
    search: search.trim() || undefined,
    view: state.view,
    status: state.status || undefined,
    intent: state.intent || undefined,
    source: state.source || undefined,
    sort: state.sort,
  });
  const leads = data?.data ?? [];
  const meta = data?.meta;

  // Any filter change goes back to page 1.
  const onFilters = (patch: Partial<LeadFilters>) => setState({ ...patch, page: '1' });

  return (
    <>
      <PageHeader
        title="Leads"
        description={meta ? `${formatNumber(meta.total)} leads, scored and followed up by your AI agents.` : 'Every enquiry, scored and followed up by your AI agents.'}
      />
      <LeadsToolbar filters={state} onChange={onFilters} onAddLead={() => setAddOpen(true)} />

      <Card>
        {isError ? (
          <EmptyState tone="danger" icon={<AlertTriangle className="size-5" aria-hidden />} title="Could not load leads" description={error.message} />
        ) : (
          <>
            <LeadsTable leads={leads} loading={isLoading} skeletonRows={8} />
            {!isLoading && leads.length === 0 && (
              <EmptyState icon={<Users className="size-5" aria-hidden />} title="No leads match these filters" description="Try another status or clear the search." />
            )}
            {meta && <Pagination className="mt-4 border-t border-border pt-4" page={meta.page} totalPages={meta.totalPages} total={meta.total} pageSize={meta.pageSize} onPage={(p) => setState({ page: String(p) })} />}
          </>
        )}
      </Card>

      <AddLeadModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(lead) => setNotice(`${lead.code} ${lead.fullName} added${lead.assignedTo ? ` and assigned to ${lead.assignedTo.name.split(' ')[0]}` : ''}. The AI is analysing it now.`)}
      />
      <Notice message={notice} onDismiss={dismissNotice} />
    </>
  );
}
