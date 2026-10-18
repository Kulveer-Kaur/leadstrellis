import { Pencil, Sparkles } from 'lucide-react';
import { Badge, Card, CardHeader, DetailRow, IconButton } from '@/components/ui';
import { FINANCING_LABEL, PURPOSE_LABEL, TIMELINE_LABEL } from '@/constants/lead-meta';
import { PROPERTY_TYPE_LABEL } from '@/constants/property-meta';
import type { LeadRequirement, PropertyType } from '@/types';
import { formatAedCompact } from '@/utils/format';

const beds = (r: LeadRequirement) => {
  if (r.bedroomsMin == null) return 'Any';
  const label = (n: number) => (n === 0 ? 'Studio' : `${n}BR`);
  return r.bedroomsMax != null && r.bedroomsMax !== r.bedroomsMin ? `${label(r.bedroomsMin)}–${label(r.bedroomsMax)}` : label(r.bedroomsMin);
};

const budget = (r: LeadRequirement) => {
  if (r.budgetMin && r.budgetMax) return `${formatAedCompact(r.budgetMin)} – ${formatAedCompact(r.budgetMax)}`;
  if (r.budgetMax) return `Up to ${formatAedCompact(r.budgetMax)}`;
  if (r.budgetMin) return `From ${formatAedCompact(r.budgetMin)}`;
  return 'Not given';
};

/** What the lead is looking for, as the AI understood it. */
export function RequirementCard({ requirement, rawMessage, onEdit }: { requirement: LeadRequirement | null; rawMessage: string | null; onEdit: () => void }) {
  return (
    <Card>
      <CardHeader
        title="What they want"
        subtitle={
          requirement && (requirement.extractedBy === 'MANUAL' ? 'Entered by an agent' : `Read by AI · ${Math.round(requirement.confidence * 100)}% confident`)
        }
        action={
          <IconButton label="Edit requirements" size="sm" variant="ghost" onClick={onEdit}>
            <Pencil className="size-4" />
          </IconButton>
        }
      />
      {requirement?.summary && (
        <p className="mb-4 flex gap-2 rounded-panel bg-surface-2 px-4 py-3 text-body-medium text-text">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          {requirement.summary}
        </p>
      )}
      {requirement ? (
        <dl>
          <DetailRow label="Purpose">{requirement.purpose ? PURPOSE_LABEL[requirement.purpose] : 'Not given'}</DetailRow>
          <DetailRow label="Type">{requirement.propertyTypes.map((t) => PROPERTY_TYPE_LABEL[t as PropertyType] ?? t).join(', ') || 'Any'}</DetailRow>
          <DetailRow label="Bedrooms">{beds(requirement)}</DetailRow>
          <DetailRow label="Budget">
            <span className="num">{budget(requirement)}</span>
          </DetailRow>
          <DetailRow label="Area">{[...requirement.communities, requirement.emirate].filter(Boolean).join(', ') || 'Any'}</DetailRow>
          <DetailRow label="Timeline">{TIMELINE_LABEL[requirement.timeline]}</DetailRow>
          <DetailRow label="Financing">{FINANCING_LABEL[requirement.financing]}</DetailRow>
          {requirement.mustHaves.length > 0 && (
            <DetailRow label="Must have">
              <span className="flex flex-wrap justify-end gap-1.5">
                {requirement.mustHaves.map((m) => (
                  <Badge key={m}>{m}</Badge>
                ))}
              </span>
            </DetailRow>
          )}
          {requirement.missingFields.length > 0 && (
            <DetailRow label="Still to ask">
              <span className="text-warning">{requirement.missingFields.join(', ')}</span>
            </DetailRow>
          )}
        </dl>
      ) : (
        <p className="text-body-medium text-muted">Waiting for the AI to read the enquiry.</p>
      )}
      {rawMessage && (
        <figure className="mt-4 border-t border-border pt-4">
          <figcaption className="text-label-medium text-muted">Original enquiry</figcaption>
          <blockquote className="mt-1 text-body-medium whitespace-pre-wrap text-text">“{rawMessage}”</blockquote>
        </figure>
      )}
    </Card>
  );
}
