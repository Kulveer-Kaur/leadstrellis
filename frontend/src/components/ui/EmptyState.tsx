import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: 'neutral' | 'danger';
  className?: string;
}

/** Centred message for empty lists and failed loads. */
export function EmptyState({ icon, title, description, action, tone = 'neutral', className }: EmptyStateProps) {
  return (
    <div className={cn('grid place-items-center px-4 py-12 text-center', className)}>
      <div>
        <span
          className={cn(
            'mx-auto grid size-12 place-items-center rounded-full',
            tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-primary-soft text-primary',
          )}
        >
          {icon}
        </span>
        <p className="mt-3 text-title-medium text-heading">{title}</p>
        {description && <p className="mx-auto mt-1 max-w-[44ch] text-body-medium text-muted">{description}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}
