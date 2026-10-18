import { useState } from 'react';
import { AlertTriangle, Building2, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Button, Card, EmptyState, Pagination, Skeleton } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AddPropertyModal, PropertiesToolbar, PropertyCard, type PropertyFilters } from '@/features/properties/components';
import { useProperties } from '@/features/properties/hooks/useProperties';
import { useDebounce } from '@/hooks/useDebounce';
import { useUrlState } from '@/hooks/useUrlState';
import { formatNumber } from '@/utils/format';

const PAGE_SIZE = 24;
const DEFAULTS = { search: '', emirate: '', community: '', type: '', listingType: '', status: '', bedrooms: '', sort: '-createdAt', page: '1' };

export default function PropertiesPage() {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [state, setState] = useUrlState(DEFAULTS);
  const search = useDebounce(state.search);
  const { data, isLoading, isError, error } = useProperties({
    page: Number(state.page) || 1,
    pageSize: PAGE_SIZE,
    search: search.trim() || undefined,
    emirate: state.emirate || undefined,
    community: state.community || undefined,
    type: state.type || undefined,
    listingType: state.listingType || undefined,
    status: state.status || undefined,
    bedrooms: state.bedrooms === '' ? undefined : Number(state.bedrooms),
    sort: state.sort,
  });
  const properties = data?.data ?? [];
  const meta = data?.meta;

  return (
    <>
      <PageHeader
        title="Properties"
        description={meta ? `${formatNumber(meta.total)} listings the AI matches against your leads.` : 'Listings the AI matches against your leads.'}
        actions={
          user?.role === 'ADMIN' ? (
            <Button onClick={() => setShowAddModal(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Add Property
            </Button>
          ) : undefined
        }
      />
      <PropertiesToolbar filters={state} onChange={(patch: Partial<PropertyFilters>) => setState({ ...patch, page: '1' })} />

      {isError ? (
        <Card>
          <EmptyState tone="danger" icon={<AlertTriangle className="size-5" aria-hidden />} title="Could not load properties" description={error.message} />
        </Card>
      ) : isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-80 rounded-card" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <Card>
          <EmptyState icon={<Building2 className="size-5" aria-hidden />} title="No listings match these filters" description="Widen the area or price range." />
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
      {meta && <Pagination className="mt-6" page={meta.page} totalPages={meta.totalPages} total={meta.total} pageSize={meta.pageSize} onPage={(p) => setState({ page: String(p) })} />}
      <AddPropertyModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </>
  );
}
