import type { ActorType, ViewingStatus } from './lead.types';

/** One row of GET /viewings. */
export interface Viewing {
  id: string;
  leadId: string;
  propertyId: string;
  scheduledAt: string;
  status: ViewingStatus;
  bookedBy: ActorType;
  notes: string | null;
  lead: { id: string; fullName: string };
  property: { id: string; title: string; community: string; refCode: string };
  agent: { id: string; name: string } | null;
}
