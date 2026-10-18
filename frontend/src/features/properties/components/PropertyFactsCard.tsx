import { Badge, Card, CardHeader, DetailRow } from '@/components/ui';
import { LISTING_LABEL, PROPERTY_TYPE_LABEL } from '@/constants/property-meta';
import type { PropertyDetail } from '@/types';
import { formatAed, formatDay, formatNumber } from '@/utils/format';
import { PropertyLocationMap } from './PropertyLocationMap';

export function PropertyFactsCard({ property }: { property: PropertyDetail }) {
  return (
    <Card>
      <CardHeader title="Key facts" action={<span />} />
      <dl>
        <DetailRow label="Price">
          <span className="num">
            {formatAed(property.priceAed)}
            {property.listingType === 'RENT' && ' / year'}
          </span>
        </DetailRow>
        <DetailRow label="Listing">{LISTING_LABEL[property.listingType]}</DetailRow>
        <DetailRow label="Type">{PROPERTY_TYPE_LABEL[property.type]}</DetailRow>
        <DetailRow label="Size">
          <span className="num">{formatNumber(property.areaSqft)} sqft</span>
        </DetailRow>
        <DetailRow label="Completion">
          {property.completionStatus === 'READY' ? 'Ready' : `Off-plan${property.handoverDate ? ` · handover ${formatDay(property.handoverDate)}` : ''}`}
        </DetailRow>
        <DetailRow label="Furnished">{property.furnished ? 'Yes' : 'No'}</DetailRow>
        {property.view && <DetailRow label="View">{property.view}</DetailRow>}
        {property.developer && <DetailRow label="Developer">{property.developer}</DetailRow>}
        <DetailRow label="Location">{[property.building, property.community, property.emirate].filter(Boolean).join(', ')}</DetailRow>
      </dl>
      {property.amenities.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
          {property.amenities.map((a) => (
            <Badge key={a}>{a}</Badge>
          ))}
        </div>
      )}
      <div className="mt-4">
        <PropertyLocationMap lat={property.lat} lng={property.lng} />
      </div>
    </Card>
  );
}
