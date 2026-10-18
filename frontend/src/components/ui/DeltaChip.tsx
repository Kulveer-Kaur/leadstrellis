import { cn } from '@/utils/cn';

interface DeltaChipProps {
  value: number;
  suffix?: string;
  className?: string;
}

/** Filled pill used for KPI trends, e.g. "+12%". */
export function DeltaChip({ value, suffix = '%', className }: DeltaChipProps) {
  const positive = value >= 0;
  return (
    <span
      className={cn(
        'num inline-flex min-h-8 items-center rounded-full px-3 text-label-medium',
        positive ? 'bg-primary text-on-primary' : 'bg-danger-soft text-danger',
        className,
      )}
    >
      <span className="sr-only">{positive ? 'Up' : 'Down'} </span>
      {positive ? '+' : ''}
      {value}
      {suffix}
    </span>
  );
}
