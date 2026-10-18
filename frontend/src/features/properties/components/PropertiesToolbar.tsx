import { PillSelect, SearchInput, type PillOption } from '@/components/ui';
import { LISTING_LABEL, PROPERTY_STATUS_META, PROPERTY_TYPE_LABEL } from '@/constants/property-meta';
import { UAE_COMMUNITIES } from '@/constants/uae-communities';

const EMIRATES = [...new Set(UAE_COMMUNITIES.map((c) => c.emirate))];

const opts = (all: string, entries: [string, string][]): PillOption[] => [{ value: '', label: all }, ...entries.map(([value, label]) => ({ value, label }))];

const EMIRATE_OPTIONS = opts('All emirates', EMIRATES.map((e) => [e, e]));
const TYPE_OPTIONS = opts('Any type', Object.entries(PROPERTY_TYPE_LABEL));
const LISTING_OPTIONS = opts('Sale or rent', Object.entries(LISTING_LABEL));
const STATUS_OPTIONS = opts('Any status', Object.entries(PROPERTY_STATUS_META).map(([k, m]) => [k, m.label]));
const BED_OPTIONS = opts('Any beds', [['0', 'Studio'], ...[1, 2, 3, 4, 5].map((n): [string, string] => [String(n), `${n} bed`])]);
const SORT_OPTIONS: PillOption[] = [
  { value: '-createdAt', label: 'Newest' },
  { value: 'priceAed', label: 'Price: low to high' },
  { value: '-priceAed', label: 'Price: high to low' },
];

export interface PropertyFilters {
  search: string;
  emirate: string;
  community: string;
  type: string;
  listingType: string;
  status: string;
  bedrooms: string;
  sort: string;
}

export function PropertiesToolbar({ filters, onChange }: { filters: PropertyFilters; onChange: (patch: Partial<PropertyFilters>) => void }) {
  const communities = opts(
    'All communities',
    UAE_COMMUNITIES.filter((c) => !filters.emirate || c.emirate === filters.emirate).map((c) => [c.name, c.name]),
  );
  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <SearchInput value={filters.search} onChange={(search) => onChange({ search })} placeholder="Title, community or EP-1001" className="sm:col-span-2 lg:col-span-1" />
      <PillSelect label="Emirate" value={filters.emirate} options={EMIRATE_OPTIONS} onChange={(emirate) => onChange({ emirate, community: '' })} />
      <PillSelect label="Community" value={filters.community} options={communities} onChange={(community) => onChange({ community })} />
      <PillSelect label="Listing" value={filters.listingType} options={LISTING_OPTIONS} onChange={(listingType) => onChange({ listingType })} />
      <PillSelect label="Type" value={filters.type} options={TYPE_OPTIONS} onChange={(type) => onChange({ type })} />
      <PillSelect label="Bedrooms" value={filters.bedrooms} options={BED_OPTIONS} onChange={(bedrooms) => onChange({ bedrooms })} />
      <PillSelect label="Status" value={filters.status} options={STATUS_OPTIONS} onChange={(status) => onChange({ status })} />
      <PillSelect label="Sort" value={filters.sort} options={SORT_OPTIONS} onChange={(sort) => onChange({ sort })} align="right" />
    </div>
  );
}
