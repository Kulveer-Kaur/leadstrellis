import { Bath, BedDouble, Ruler } from 'lucide-react';
import type { Property } from '@/types';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';

/** Beds · baths · area, the three facts every listing card needs. */
export function PropertySpecs({ property, className }: { property: Property; className?: string }) {
  const items = [
    { icon: BedDouble, label: property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} bed` },
    { icon: Bath, label: `${property.bathrooms} bath` },
    { icon: Ruler, label: `${formatNumber(property.areaSqft)} sqft` },
  ];
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1 text-body-small text-text', className)}>
      {items.map(({ icon: Icon, label }) => (
        <li key={label} className="num inline-flex items-center gap-1.5">
          <Icon className="size-4 text-muted" strokeWidth={1.75} aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  );
}
