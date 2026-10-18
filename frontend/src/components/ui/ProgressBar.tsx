import { cn } from '@/utils/cn';

interface ProgressBarProps {
  value: number; // 0–100
  label: string;
  className?: string;
}

export function ProgressBar({ value, label, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-track', className)}
    >
      <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${clamped}%` }} />
    </div>
  );
}
