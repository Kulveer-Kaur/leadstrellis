import type { ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/utils/cn';
import { IconButton } from './IconButton';

interface CardHeaderProps {
  title: string;
  subtitle?: ReactNode;
  /** Custom right-side content. Defaults to an overflow menu button. */
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <header className={cn('mb-4 flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h3 className="text-title-medium">{title}</h3>
        {subtitle && <p className="mt-1 text-body-medium text-muted">{subtitle}</p>}
      </div>
      {action ?? (
        <IconButton label={`${title} options`} size="sm" variant="ghost">
          <MoreHorizontal className="size-5" />
        </IconButton>
      )}
    </header>
  );
}
