import { Skeleton } from '@/components/ui';
import type { LeadSummary } from '@/types';
import { LeadRow } from './LeadRow';

const COLUMNS = ['Lead', 'Source', 'AI-extracted need', 'Score', 'Status', 'Next AI action'];

interface LeadsTableProps {
  leads: LeadSummary[];
  loading: boolean;
  skeletonRows?: number;
}

export function LeadsTable({ leads, loading, skeletonRows = 4 }: LeadsTableProps) {
  return (
    <div className="-mx-1 overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-[50rem] text-left">
        <thead>
          <tr>
            {COLUMNS.map((c, i) => (
              <th key={c} scope="col" className={`py-2 text-title-small text-muted ${i === 0 ? 'pl-1' : 'px-4'}`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: skeletonRows }, (_, i) => (
                <tr key={i}>
                  <td colSpan={COLUMNS.length} className="py-2">
                    <Skeleton className="h-12" />
                  </td>
                </tr>
              ))
            : leads.map((lead) => <LeadRow key={lead.id} lead={lead} />)}
        </tbody>
      </table>
    </div>
  );
}
