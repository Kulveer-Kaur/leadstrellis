import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface ChartTooltipProps {
  /** Position in % of the chart box. */
  x: number;
  y: number;
  children: ReactNode;
  className?: string;
}

export function ChartTooltip({ x, y, children, className }: ChartTooltipProps) {
  return (
    <div
      role="status"
      className={cn(
        'pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-heading px-3 py-2 text-body-small whitespace-nowrap text-on-primary shadow-float',
        className,
      )}
      style={{ left: `${x}%`, top: `${y}%`, marginTop: -10 }}
    >
      {children}
    </div>
  );
}
