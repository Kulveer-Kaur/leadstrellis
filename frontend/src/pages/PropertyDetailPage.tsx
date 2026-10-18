import { useState } from 'react';
import { AlertTriangle, ArrowLeft, Edit3 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, CardSkeleton, EmptyState } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { EditPropertyModal, PropertyFactsCard, PropertyGallery, PropertyMatchedLeadsCard, PropertySpecs, PropertyStatusBadge } from '@/features/properties/components';
import { useProperty } from '@/features/properties/hooks/useProperties';
import { formatAedCompact } from '@/utils/format';

export default function PropertyDetailPage() {
  const { user } = useAuth();
  const { id = '' } = useParams();
  const { data: property, isLoading, isError, error } = useProperty(id);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) return <CardSkeleton className="h-96" />;
  if (isError || !property) {
    return (
      <Card>
        <EmptyState tone="danger" icon={<AlertTriangle className="size-5" aria-hidden />} title="Could not open this property" description={error?.message} />
      </Card>
    );
  }

  return (
    <>
      <Link to={ROUTES.properties} className="mb-3 inline-flex items-center gap-1.5 text-label-large text-muted hover:text-heading">
        <ArrowLeft className="size-4" aria-hidden /> All properties
      </Link>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-title-large sm:text-headline-small">{property.title}</h1>
          <p className="mt-1 text-body-medium text-muted">
            {property.community}, {property.emirate} · <span className="num">{property.refCode}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PropertyStatusBadge status={property.status} />
          <p className="num text-headline-small text-heading">{formatAedCompact(property.priceAed)}</p>
          {user?.role === 'ADMIN' && (
            <Button
              variant="outline"
              onClick={() => setEditOpen(true)}
              className="gap-2 px-4 py-2 min-h-0 text-body-medium"
            >
              <Edit3 className="size-4" /> Edit Property
            </Button>
          )}
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-5 xl:col-span-2">
          <Card>
            <PropertyGallery images={property.imageUrls} title={property.title} />
            <PropertySpecs property={property} className="mt-4" />
            <p className="mt-3 text-body-medium text-text">{property.description}</p>
          </Card>
          <PropertyMatchedLeadsCard matches={property.matches} />
        </div>
        <PropertyFactsCard property={property} />
      </div>
      <EditPropertyModal property={property} open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
}
