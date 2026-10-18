import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bath, BedDouble, CalendarCheck, Check, Download, MapPin, Ruler } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { Button, Card, CardSkeleton } from '@/components/ui';
import { http } from '@/services/http';
import { cn } from '@/utils/cn';
import { formatAed } from '@/utils/format';

interface PublicProposal {
  number: string;
  status: 'SENT' | 'FAILED' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
  leadFirstName: string;
  agent: { name: string; email: string; phone: string | null } | null;
  fitScore: number | null;
  headline: string;
  intro: string;
  whyItFits: string[];
  nextSteps: string[];
  slots: { at: string; label: string }[];
  property: {
    refCode: string;
    title: string;
    description: string;
    type: string;
    listingType: 'SALE' | 'RENT';
    priceAed: number;
    bedrooms: number;
    bathrooms: number;
    areaSqft: number;
    completionStatus: string;
    furnished: boolean;
    view: string | null;
    amenities: string[];
    imageUrls: string[];
    address: string;
    mapsUrl: string;
  };
  alternatives: { propertyId: string; refCode: string; title: string; community: string; priceAed: number; bedrooms: number; fitScore: number | null; reason: string | null }[];
  pdfUrl: string;
  visit: { at: string; label: string; propertyTitle: string } | null;
}

/** Public page the lead opens from the proposal email: the full proposal and a one-click site-visit booking. */
export default function ProposalPage() {
  const { token = '' } = useParams();
  const qc = useQueryClient();
  const key = ['public-proposal', token];
  const { data, isLoading, isError, error } = useQuery({ queryKey: key, queryFn: () => http.get<PublicProposal>(`/public/proposals/${token}`), retry: false });
  const [slot, setSlot] = useState<number | null>(null);
  const confirm = useMutation({
    mutationFn: (slotIndex: number) => http.post<PublicProposal>(`/public/proposals/${token}/confirm`, { slotIndex }),
    onSuccess: (d) => qc.setQueryData(key, d),
  });

  return (
    <div className="h-full w-full overflow-y-auto bg-canvas">
      <header className="border-b border-border bg-surface px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <BrandLogo />
          {data && <span className="num hidden text-label-large text-muted sm:inline">Proposal {data.number}</span>}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        {isLoading && <CardSkeleton className="h-[32rem]" />}
        {isError && (
          <Card>
            <h1 className="text-title-large text-heading">Proposal not found</h1>
            <p className="mt-2 text-body-medium text-muted">{error.message}. Please use the link in your email, or reply to it and we will help.</p>
          </Card>
        )}
        {data && <ProposalBody p={data} slot={slot} setSlot={setSlot} confirm={confirm} />}
      </main>
    </div>
  );
}

interface BodyProps {
  p: PublicProposal;
  slot: number | null;
  setSlot: (i: number) => void;
  confirm: { mutate: (i: number) => void; isPending: boolean; error: Error | null };
}

function ProposalBody({ p, slot, setSlot, confirm }: BodyProps) {
  const pr = p.property;
  const upcoming = p.slots.map((s, i) => ({ ...s, i })).filter((s) => new Date(s.at).getTime() > Date.now());
  const price = `${formatAed(pr.priceAed)}${pr.listingType === 'RENT' ? ' / year' : ''}`;

  return (
    <article className="flex flex-col gap-5">
      <section>
        <p className="text-body-medium text-muted">Prepared for {p.leadFirstName}</p>
        <h1 className="mt-1 text-headline-small text-heading sm:text-headline-medium">{p.headline}</h1>
        <p className="mt-3 max-w-[70ch] text-body-large text-text">{p.intro}</p>
      </section>

      <Card padded={false} className="overflow-hidden">
        {pr.imageUrls[0] && <img src={pr.imageUrls[0]} alt={pr.title} className="h-64 w-full object-cover sm:h-80" />}
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-title-large text-heading">{pr.title}</h2>
              <p className="text-body-small text-muted">Ref {pr.refCode}</p>
            </div>
            <div className="text-right">
              <p className="num text-title-large text-primary">{price}</p>
              {p.fitScore != null && <p className="text-body-small text-muted">{p.fitScore}% match to your brief</p>}
            </div>
          </div>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-body-medium text-text">
            <li className="inline-flex items-center gap-1.5"><BedDouble className="size-4 text-muted" aria-hidden />{pr.bedrooms === 0 ? 'Studio' : `${pr.bedrooms} bedrooms`}</li>
            <li className="inline-flex items-center gap-1.5"><Bath className="size-4 text-muted" aria-hidden />{pr.bathrooms} bathrooms</li>
            <li className="inline-flex items-center gap-1.5"><Ruler className="size-4 text-muted" aria-hidden />{pr.areaSqft.toLocaleString()} sqft</li>
            <li>{pr.completionStatus === 'READY' ? 'Ready to move in' : 'Off-plan'}</li>
            {pr.view && <li>{pr.view} view</li>}
            {pr.furnished && <li>Furnished</li>}
          </ul>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-panel bg-surface-2 px-4 py-3">
            <p className="inline-flex items-start gap-2 text-body-medium text-heading">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              {pr.address}
            </p>
            <a href={pr.mapsUrl} target="_blank" rel="noreferrer" className="text-label-large text-primary hover:underline">
              Open in Google Maps
            </a>
          </div>
          {pr.amenities.length > 0 && <p className="mt-3 text-body-small text-muted">Amenities: {pr.amenities.join(' · ')}</p>}
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <h2 className="text-title-medium text-heading">Why it fits what you asked for</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {p.whyItFits.map((w) => (
              <li key={w} className="flex items-start gap-2 text-body-medium text-text">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> {w}
              </li>
            ))}
          </ul>
        </Card>

        <Card id="book">
          <h2 className="text-title-medium text-heading">Book your site visit</h2>
          {p.visit ? (
            <div className="mt-3 rounded-panel bg-success-soft px-4 py-3 text-success">
              <p className="inline-flex items-center gap-2 text-title-small"><CalendarCheck className="size-5" aria-hidden /> Your visit is confirmed</p>
              <p className="mt-1 text-body-medium">{p.visit.propertyTitle}, {p.visit.label} (Dubai time). We have emailed you the address and a calendar invite.</p>
            </div>
          ) : p.status === 'DECLINED' ? (
            <p className="mt-3 text-body-medium text-muted">This proposal is closed. Reply to our email if you would like to see it again.</p>
          ) : upcoming.length === 0 ? (
            <p className="mt-3 text-body-medium text-muted">These times have passed. Reply to our email with a day and time that suits you.</p>
          ) : (
            <>
              <p className="mt-1 text-body-medium text-muted">Choose a time (Dubai time). You can also reply to our email.</p>
              <div className="mt-3 flex flex-col gap-2" role="radiogroup" aria-label="Visit time">
                {upcoming.map((s) => (
                  <button
                    key={s.at}
                    type="button"
                    role="radio"
                    aria-checked={slot === s.i}
                    onClick={() => setSlot(s.i)}
                    className={cn('min-h-11 rounded-panel border px-4 py-2.5 text-left text-body-medium transition-colors', slot === s.i ? 'border-primary bg-primary-soft text-heading' : 'border-border hover:bg-surface-2')}
                  >
                    <span className="font-medium">Option {s.i + 1}</span> · {s.label}
                  </button>
                ))}
              </div>
              <Button className="mt-4 w-full justify-center" disabled={slot === null || confirm.isPending} onClick={() => slot !== null && confirm.mutate(slot)} icon={<CalendarCheck className="size-4" aria-hidden />}>
                {confirm.isPending ? 'Confirming…' : 'Confirm site visit'}
              </Button>
              {confirm.error && <p className="mt-2 text-body-medium text-danger" role="alert">{confirm.error.message}</p>}
            </>
          )}
        </Card>
      </div>

      {p.alternatives.length > 0 && (
        <Card>
          <h2 className="text-title-medium text-heading">Other options we matched for you</h2>
          <ul className="mt-3 divide-y divide-border">
            {p.alternatives.map((a) => (
              <li key={a.refCode} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-title-small text-heading">{a.title}</p>
                  <p className="text-body-small text-muted">{a.community} · {a.bedrooms === 0 ? 'Studio' : `${a.bedrooms} BR`} · Ref {a.refCode}</p>
                  {a.reason && <p className="mt-1 text-body-medium text-text">{a.reason}</p>}
                </div>
                <div className="text-right">
                  <p className="num text-title-small text-primary">{formatAed(a.priceAed)}</p>
                  {a.fitScore != null && <p className="text-body-small text-muted">{a.fitScore}% match</p>}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-body-small text-muted">Prefer one of these? Reply to our email and we will arrange it.</p>
        </Card>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <h2 className="text-title-medium text-heading">Next steps</h2>
          <ol className="mt-3 flex list-decimal flex-col gap-1.5 pl-5 text-body-medium text-text">
            {p.nextSteps.map((s) => <li key={s}>{s}</li>)}
          </ol>
        </Card>
        <Card className="flex flex-col justify-between gap-4">
          {p.agent && (
            <div>
              <h2 className="text-title-medium text-heading">Your agent</h2>
              <p className="mt-2 text-title-small text-heading">{p.agent.name}</p>
              <p className="text-body-medium text-muted">{[p.agent.phone, p.agent.email].filter(Boolean).join(' · ')}</p>
            </div>
          )}
          <a href={`${p.pdfUrl}?download=1`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border-strong bg-surface px-5 text-label-large text-heading hover:bg-surface-2">
            <Download className="size-4" aria-hidden /> Download PDF
          </a>
        </Card>
      </div>

      <p className="text-body-small text-muted">Prices and availability are taken from the listing on {new Date(p.createdAt).toLocaleDateString()} and remain subject to confirmation by the owner or developer.</p>
    </article>
  );
}
