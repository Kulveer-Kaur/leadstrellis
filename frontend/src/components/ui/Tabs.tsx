import { cn } from '@/utils/cn';

export interface TabItem {
  value: string;
  label: string;
}

interface TabsProps {
  label: string;
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/** Underline tabs with dividers, as in the theme's top-right switcher. */
export function Tabs({ label, items, value, onChange, className }: TabsProps) {
  return (
    <div role="tablist" aria-label={label} className={cn('flex items-center', className)}>
      {items.map((item, i) => {
        const active = item.value === value;
        return (
          <div key={item.value} className="flex items-center">
            {i > 0 && <span className="mx-1 h-5 w-px bg-border-strong" aria-hidden />}
            <button
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.value)}
              className={cn(
                'relative cursor-pointer px-4 py-3 text-body-large whitespace-nowrap transition-colors',
                active ? 'font-medium text-heading' : 'text-text hover:text-heading',
              )}
            >
              {item.label}
              <span
                className={cn(
                  'absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-primary transition-opacity',
                  active ? 'opacity-100' : 'opacity-0',
                )}
                aria-hidden
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
