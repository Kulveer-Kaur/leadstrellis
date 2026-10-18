import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LISTING_LABEL } from '@/constants/property-meta';
import { propertyPath } from '@/constants/routes';
import type { Property } from '@/types';
import { formatAedCompact } from '@/utils/format';
import { PropertySpecs } from './PropertySpecs';
import { PropertyStatusBadge } from './PropertyStatusBadge';

export function PropertyCard({ property }: { property: Property }) {
  return (
    <article className="group animate-fade-up overflow-hidden rounded-card border border-border bg-surface shadow-soft">
      <Link to={propertyPath(property.id)} className="block">
        <div className="relative h-52 overflow-hidden bg-surface-2">
          {property.imageUrls[0] && (
            <img
              src={property.imageUrls[0]}
              alt={`${property.title}, ${property.community}`}
              loading="lazy"
              className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          )}
          <span className="absolute top-3 left-3 rounded-full bg-surface/90 px-3 py-1 text-label-medium text-heading backdrop-blur">{LISTING_LABEL[property.listingType]}</span>
          <PropertyStatusBadge status={property.status} className="absolute top-3 right-3 backdrop-blur" />
          {property.matchedLeads ? (
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-label-medium text-on-primary">
              <Users className="size-3.5" aria-hidden />
              <span className="num">{property.matchedLeads}</span> matched {property.matchedLeads === 1 ? 'lead' : 'leads'}
            </span>
          ) : null}
        </div>
        <div className="p-4">
          <p className="num text-title-medium text-heading">
            {formatAedCompact(property.priceAed)}
            {property.listingType === 'RENT' && <span className="text-body-small text-muted"> / year</span>}
          </p>
          <h3 className="mt-0.5 truncate text-body-medium font-medium text-heading group-hover:text-primary">{property.title}</h3>
          <p className="truncate text-body-small text-muted">
            {property.community}, {property.emirate} · {property.refCode}
          </p>
          <PropertySpecs property={property} className="mt-3 border-t border-border pt-3" />
        </div>
      </Link>
    </article>
  );
}
