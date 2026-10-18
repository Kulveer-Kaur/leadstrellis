import { Plus } from 'lucide-react';
import { Button, PillSelect, SearchInput, Tabs, type PillOption } from '@/components/ui';
import { INTENT_META, SOURCE_LABEL, STATUS_META } from '@/constants/lead-meta';
import { LEAD_VIEWS } from '@/features/dashboard/components/DashboardToolbar';

const toOptions = (all: string, meta: Record<string, string | { label: string }>): PillOption[] => [
  { value: '', label: all },
  ...Object.entries(meta).map(([value, m]) => ({ value, label: typeof m === 'string' ? m : m.label })),
];

const STATUS_OPTIONS = toOptions('All statuses', STATUS_META);
const INTENT_OPTIONS = toOptions('Any intent', INTENT_META);
const SOURCE_OPTIONS = toOptions('All sources', SOURCE_LABEL);
const SORT_OPTIONS: PillOption[] = [
  { value: '-createdAt', label: 'Newest first' },
  { value: 'createdAt', label: 'Oldest first' },
  { value: '-score', label: 'Highest score' },
  { value: 'score', label: 'Lowest score' },
];

export interface LeadFilters {
  search: string;
  view: string;
  status: string;
  intent: string;
  source: string;
  sort: string;
}

interface LeadsToolbarProps {
  filters: LeadFilters;
  onChange: (patch: Partial<LeadFilters>) => void;
  onAddLead: () => void;
}

export function LeadsToolbar({ filters, onChange, onAddLead }: LeadsToolbarProps) {
  return (
    <div className="mb-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs label="Lead view" items={LEAD_VIEWS} value={filters.view} onChange={(view) => onChange({ view })} className="overflow-x-auto scrollbar-thin" />
        <Button onClick={onAddLead} icon={<Plus className="size-4" aria-hidden />} className="min-h-12">
          Add lead
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SearchInput value={filters.search} onChange={(search) => onChange({ search })} placeholder="Name, email, phone or L-1042" />
        <PillSelect label="Status" value={filters.status} options={STATUS_OPTIONS} onChange={(status) => onChange({ status })} />
        <PillSelect label="Intent" value={filters.intent} options={INTENT_OPTIONS} onChange={(intent) => onChange({ intent })} />
        <PillSelect label="Source" value={filters.source} options={SOURCE_OPTIONS} onChange={(source) => onChange({ source })} />
        <PillSelect label="Sort" value={filters.sort} options={SORT_OPTIONS} onChange={(sort) => onChange({ sort })} align="right" />
      </div>
    </div>
  );
}
