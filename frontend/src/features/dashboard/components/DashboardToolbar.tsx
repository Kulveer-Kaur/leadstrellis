import { Plus } from 'lucide-react';
import { Button, PillSelect, SearchInput, Tabs, type PillOption, type TabItem } from '@/components/ui';
import type { DashboardFilters } from '../types';

const EMIRATES: PillOption[] = [
  { value: 'all', label: 'All emirates' },
  { value: 'dubai', label: 'Dubai' },
  { value: 'abu-dhabi', label: 'Abu Dhabi' },
  { value: 'sharjah', label: 'Sharjah' },
  { value: 'ras-al-khaimah', label: 'Ras Al Khaimah' },
];

const PERIODS: PillOption[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'qtd', label: 'This quarter' },
];

export const LEAD_VIEWS: TabItem[] = [
  { value: 'all', label: 'All leads' },
  { value: 'hot', label: 'Hot leads' },
  { value: 'action', label: 'Needs action' },
];

interface DashboardToolbarProps {
  search: string;
  onSearch: (v: string) => void;
  filters: DashboardFilters;
  onFilters: (f: DashboardFilters) => void;
  view: string;
  onView: (v: string) => void;
  onAddLead: () => void;
}

export function DashboardToolbar({ search, onSearch, filters, onFilters, view, onView, onAddLead }: DashboardToolbarProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="grid gap-3 sm:grid-cols-3 xl:flex">
        <SearchInput value={search} onChange={onSearch} placeholder="Search leads…" className="xl:w-52" />
        <PillSelect
          label="Emirate"
          value={filters.emirate}
          options={EMIRATES}
          onChange={(emirate) => onFilters({ ...filters, emirate })}
          className="xl:w-52"
        />
        <PillSelect
          label="Period"
          value={filters.period}
          options={PERIODS}
          onChange={(period) => onFilters({ ...filters, period })}
          className="xl:w-48"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 xl:flex-nowrap xl:justify-end">
        <Tabs label="Lead view" items={LEAD_VIEWS} value={view} onChange={onView} className="overflow-x-auto scrollbar-thin" />
        <Button onClick={onAddLead} icon={<Plus className="size-4" aria-hidden />} className="min-h-12">
          Add lead
        </Button>
      </div>
    </div>
  );
}
