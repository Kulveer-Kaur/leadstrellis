import { cn } from '@/utils/cn';

export interface StatItem {
  label: string;
  value: string | number;
}

interface StatStripProps {
  items: StatItem[];
  className?: string;
}

/** Inner panel with evenly split stats separated by hairlines. */
export function StatStrip({ items, className }: StatStripProps) {
  return (
    <dl className={cn('grid rounded-panel bg-surface-2 py-4', className)} style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((item, i) => (
        <div key={item.label} className={cn('flex flex-col items-center px-2 text-center', i > 0 && 'border-l border-border-strong')}>
          <dd className="num text-headline-small text-heading">{item.value}</dd>
          <dt className="mt-1 text-body-small text-muted">{item.label}</dt>
        </div>
      ))}
    </dl>
  );
}
