import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatNumber } from '@/utils/format';
import { cn } from '@/utils/cn';
import { IconButton } from './IconButton';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages, total, pageSize, onPage, className }: PaginationProps) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <nav aria-label="Pagination" className={cn('flex items-center justify-between gap-3', className)}>
      <p className="num text-body-medium text-muted">
        {formatNumber(from)}–{formatNumber(to)} of {formatNumber(total)}
      </p>
      <div className="flex items-center gap-2">
        <IconButton label="Previous page" variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)} className="disabled:cursor-default disabled:opacity-40">
          <ChevronLeft className="size-4" />
        </IconButton>
        <span className="num text-label-large text-heading">
          {page} / {Math.max(1, totalPages)}
        </span>
        <IconButton label="Next page" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className="disabled:cursor-default disabled:opacity-40">
          <ChevronRight className="size-4" />
        </IconButton>
      </div>
    </nav>
  );
}
