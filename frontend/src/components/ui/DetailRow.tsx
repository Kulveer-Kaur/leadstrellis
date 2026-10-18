import type { ReactNode } from 'react';

/** Label/value pair inside a detail card's <dl>. */
export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-border py-2.5 first:border-t-0">
      <dt className="shrink-0 text-body-medium text-muted">{label}</dt>
      <dd className="text-right text-body-medium text-heading">{children}</dd>
    </div>
  );
}
