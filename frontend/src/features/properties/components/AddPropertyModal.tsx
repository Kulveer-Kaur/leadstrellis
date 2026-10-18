import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, UploadCloud, X } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { UAE_COMMUNITIES } from '@/constants/uae-communities';
import { createProperty, uploadPropertyImage } from '../api/properties.api';
import { queryKeys } from '@/services/query-keys';

interface AddPropertyModalProps {
  open: boolean;
  onClose: () => void;
}

const PROPERTY_TYPES = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'TOWNHOUSE', label: 'Townhouse' },
  { value: 'PENTHOUSE', label: 'Penthouse' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'PLOT', label: 'Plot' },
  { value: 'OFFICE', label: 'Office' },
];

export function AddPropertyModal({ open, onClose }: AddPropertyModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [refCode, setRefCode] = useState(`LP-${Math.floor(1000 + Math.random() * 9000)}`);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('APARTMENT');
  const [listingType, setListingType] = useState<'SALE' | 'RENT'>('SALE');
  const [priceAed, setPriceAed] = useState('');
  const [bedrooms, setBedrooms] = useState('2');
  const [bathrooms, setBathrooms] = useState('2');
  const [areaSqft, setAreaSqft] = useState('1100');
  const [community, setCommunity] = useState('Dubai Marina');
  const [building, setBuilding] = useState('');
  const [developer, setDeveloper] = useState('');
  const [completionStatus, setCompletionStatus] = useState<'READY' | 'OFF_PLAN'>('READY');
  const [furnished, setFurnished] = useState(false);
  const [view, setView] = useState('');
  const [amenitiesInput, setAmenitiesInput] = useState('Pool, Gym, Balcony, Covered Parking, Security');
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    const uploads: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await uploadPropertyImage(base64);
        if (res.url) {
          uploads.push(res.url);
        }
      }
      setImageUrls((prev) => [...prev, ...uploads]);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const price = parseInt(priceAed.replace(/\D/g, ''), 10);
    if (!price || price <= 0) {
      setError('Please enter a valid price in AED.');
      return;
    }

    const area = parseInt(areaSqft.replace(/\D/g, ''), 10);
    if (!area || area <= 0) {
      setError('Please enter area in square feet.');
      return;
    }

    const comm = UAE_COMMUNITIES.find((c) => c.name === community) || UAE_COMMUNITIES[0];
    const amenities = amenitiesInput
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      await createProperty({
        refCode: refCode.trim() || `LP-${Math.floor(1000 + Math.random() * 9000)}`,
        title: title.trim(),
        description: description.trim() || `Modern ${bedrooms} bedroom ${type.toLowerCase()} in ${community}.`,
        type: type as any,
        listingType,
        priceAed: price,
        bedrooms: parseInt(bedrooms, 10) || 0,
        bathrooms: parseInt(bathrooms, 10) || 1,
        areaSqft: area,
        emirate: comm.emirate,
        community: comm.name,
        building: building.trim() || undefined,
        developer: developer.trim() || undefined,
        lat: 25.2048,
        lng: 55.2708,
        completionStatus,
        furnished,
        view: view.trim() || undefined,
        amenities,
        imageUrls: imageUrls.length > 0 ? imageUrls : ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'],
        status: 'AVAILABLE',
      });

      await queryClient.invalidateQueries({ queryKey: queryKeys.properties.all });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create property');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add New Property"
      description="Create a new listing for AI-powered lead matching and recommendations."
      className="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 py-2">
        {error && (
          <div className="rounded-lg bg-red-500/10 p-3 text-body-small text-red-500">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-label-medium text-heading">Reference Code</label>
            <input
              type="text"
              value={refCode}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRefCode(e.target.value)}
              required
              placeholder="LP-1024"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-body-medium text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-label-medium text-heading">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              required
              placeholder="e.g. Luxury 2BR Marina View Apartment"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-body-medium text-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-label-medium text-heading">Type</label>
            <select
              value={type}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-body-medium text-foreground focus:outline-none focus:border-primary"
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-label-medium text-heading">Listing</label>
            <select
              value={listingType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setListingType(e.target.value as 'SALE' | 'RENT')}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-body-medium text-foreground focus:outline-none focus:border-primary"
            >
              <option value="SALE">For Sale</option>
              <option value="RENT">For Rent</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-label-medium text-heading">Price (AED)</label>
            <input
              type="text"
              value={priceAed}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPriceAed(e.target.value)}
              required
              placeholder="2,400,000"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-body-medium text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-label-medium text-heading">Area (sq ft)</label>
            <input
              type="text"
              value={areaSqft}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAreaSqft(e.target.value)}
              required
              placeholder="1,200"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-body-medium text-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-label-medium text-heading">Bedrooms</label>
            <select
              value={bedrooms}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBedrooms(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-body-medium text-foreground focus:outline-none focus:border-primary"
            >
              <option value="0">Studio (0 BR)</option>
              <option value="1">1 BR</option>
              <option value="2">2 BR</option>
              <option value="3">3 BR</option>
              <option value="4">4 BR</option>
              <option value="5">5+ BR</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-label-medium text-heading">Bathrooms</label>
            <select
              value={bathrooms}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBathrooms(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-body-medium text-foreground focus:outline-none focus:border-primary"
            >
              <option value="1">1 Bath</option>
              <option value="2">2 Baths</option>
              <option value="3">3 Baths</option>
              <option value="4">4 Baths</option>
              <option value="5">5+ Baths</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-label-medium text-heading">Community</label>
            <select
              value={community}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCommunity(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-body-medium text-foreground focus:outline-none focus:border-primary"
            >
              {UAE_COMMUNITIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.emirate})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-label-medium text-heading">Building / Tower</label>
            <input
              type="text"
              value={building}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBuilding(e.target.value)}
              placeholder="e.g. Marina Gate 1"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-body-medium text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-label-medium text-heading">Developer</label>
            <input
              type="text"
              value={developer}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeveloper(e.target.value)}
              placeholder="e.g. Select Group / Emaar"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-body-medium text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-label-medium text-heading">View</label>
            <input
              type="text"
              value={view}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setView(e.target.value)}
              placeholder="e.g. Full Marina & Sea View"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-body-medium text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-label-medium text-heading">Completion</label>
            <select
              value={completionStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCompletionStatus(e.target.value as 'READY' | 'OFF_PLAN')}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-body-medium text-foreground focus:outline-none focus:border-primary"
            >
              <option value="READY">Ready to Move</option>
              <option value="OFF_PLAN">Off-plan</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="furnished-checkbox"
            type="checkbox"
            checked={furnished}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFurnished(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="furnished-checkbox" className="text-body-medium text-foreground cursor-pointer">
            Furnished property
          </label>
        </div>

        <div>
          <label className="mb-1 block text-label-medium text-heading">Description</label>
          <textarea
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            rows={3}
            placeholder="Key highlights, views, layout details and location advantages..."
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-body-medium text-foreground focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-label-medium text-heading">Amenities (comma-separated)</label>
          <input
            type="text"
            value={amenitiesInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmenitiesInput(e.target.value)}
            placeholder="Pool, Gym, Balcony, Covered Parking, Concierge"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-body-medium text-foreground focus:outline-none focus:border-primary"
          />
        </div>

        {/* Image Upload Section */}
        <div>
          <label className="mb-2 block text-label-medium text-heading">Property Photos</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface-2/40 p-6 transition-colors hover:border-primary/50 hover:bg-surface-2"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            {isUploading ? (
              <div className="flex flex-col items-center gap-2 text-primary">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-body-medium font-medium">Uploading images...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center text-muted">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <p className="text-body-medium font-medium text-foreground">Click to upload property images</p>
                <p className="text-body-small">Supports JPG, PNG, WebP up to 10MB each</p>
              </div>
            )}
          </div>

          {imageUrls.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {imageUrls.map((url, i) => (
                <div key={i} className="group relative aspect-video overflow-hidden rounded-lg border border-border bg-surface">
                  <img src={url} alt={`Property upload ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || isUploading}>
            {isSubmitting ? 'Creating Property...' : 'Save & Publish Property'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
