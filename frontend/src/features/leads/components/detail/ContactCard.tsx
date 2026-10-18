import { Mail, Pencil, Phone } from 'lucide-react';
import { Card, CardHeader, DetailRow, IconButton } from '@/components/ui';
import { CHANNEL_LABEL } from '@/constants/lead-meta';
import type { LeadDetail } from '@/types';
import { formatDateTime } from '@/utils/format';

export function ContactCard({ lead, onEdit }: { lead: LeadDetail; onEdit: () => void }) {
  return (
    <Card>
      <CardHeader
        title="Contact"
        action={
          <IconButton label="Edit contact details" size="sm" variant="ghost" onClick={onEdit}>
            <Pencil className="size-4" />
          </IconButton>
        }
      />
      <dl>
        {lead.phone && (
          <DetailRow label="Phone">
            <a href={`tel:${lead.phone}`} className="num inline-flex items-center gap-1.5 hover:text-primary">
              <Phone className="size-3.5" aria-hidden /> {lead.phone}
            </a>
          </DetailRow>
        )}
        {lead.email && (
          <DetailRow label="Email">
            <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 break-all hover:text-primary">
              <Mail className="size-3.5 shrink-0" aria-hidden /> {lead.email}
            </a>
          </DetailRow>
        )}
        {lead.instagramHandle && <DetailRow label="Instagram">@{lead.instagramHandle.replace(/^@/, '')}</DetailRow>}
        <DetailRow label="Prefers">{lead.preferredChannel ? CHANNEL_LABEL[lead.preferredChannel] : 'No preference'}</DetailRow>
        <DetailRow label="Contact attempts">
          <span className="num">{lead.contactAttempts}</span>
        </DetailRow>
        <DetailRow label="Last contacted">{lead.lastContactedAt ? formatDateTime(lead.lastContactedAt) : 'Not yet'}</DetailRow>
        <DetailRow label="Last reply">{lead.lastInboundAt ? formatDateTime(lead.lastInboundAt) : 'No reply yet'}</DetailRow>
        {lead.automationPaused && <DetailRow label="Automation">Paused for this lead</DetailRow>}
        {lead.lostReason && <DetailRow label="Lost because">{lead.lostReason}</DetailRow>}
      </dl>
    </Card>
  );
}
