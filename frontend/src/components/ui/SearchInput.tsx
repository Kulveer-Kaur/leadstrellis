import { Search } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className }: SearchInputProps) {
  return (
    <label className={cn('relative inline-flex', className)}>
      <span className="sr-only">Search</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-14 w-full rounded-full border border-border bg-surface pr-12 pl-6 text-body-large text-heading placeholder:text-muted hover:border-border-strong"
      />
      <Search className="pointer-events-none absolute top-1/2 right-5 size-5 -translate-y-1/2 text-heading" aria-hidden />
    </label>
  );
}
