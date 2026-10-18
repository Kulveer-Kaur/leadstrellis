import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-title-large sm:text-headline-small">{title}</h1>
        {description && <p className="mt-1 text-body-medium text-muted">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
