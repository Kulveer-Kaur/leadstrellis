import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardSkeleton, EmptyState } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import {
  AiRouteCard,
  ContactCard,
  EditLeadModal,
  LeadConversationCard,
  LeadHeader,
  LeadMatchesCard,
  LeadTimelineCard,
  LeadViewingsCard,
  ProcessingBanner,
  RequirementCard,
  ScoreCard,
} from '@/features/leads/components/detail';
import { useLead } from '@/features/leads/hooks/useLead';
import { BookViewingModal } from '@/features/viewings/components';

export default function LeadDetailPage() {
  const { id = '' } = useParams();
  const { data: lead, isLoading, isError, error } = useLead(id);
  // undefined = closed; '' = open with the first match preselected.
  const [bookFor, setBookFor] = useState<string | undefined>();
  const [editing, setEditing] = useState(false);

  if (isLoading) {
    return (
      <div className="grid gap-5 xl:grid-cols-3">
        <CardSkeleton className="h-80 xl:col-span-2" />
        <CardSkeleton className="h-80" />
      </div>
    );
  }
  if (isError || !lead) {
    return (
      <Card>
        <EmptyState
          tone="danger"
          icon={<AlertTriangle className="size-5" aria-hidden />}
          title="Could not open this lead"
          description={error?.message}
          action={
            <Link to={ROUTES.leads} className="text-label-large text-primary">
              Back to leads
            </Link>
          }
        />
      </Card>
    );
  }

  const properties = lead.matches.map((m) => ({ id: m.property.id, label: `${m.property.title} · ${m.property.community}` }));

  return (
    <>
      <LeadHeader lead={lead} onEdit={() => setEditing(true)} />
      <ProcessingBanner lead={lead} />
      <AiRouteCard lead={lead} />
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-5 xl:col-span-2">
          <RequirementCard requirement={lead.requirement} rawMessage={lead.rawMessage} onEdit={() => setEditing(true)} />
          <LeadMatchesCard leadId={lead.id} matches={lead.matches} proposedPropertyId={lead.proposals[0]?.property.id} onBook={setBookFor} />
          <LeadConversationCard lead={lead} />
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <ScoreCard score={lead.score} winProbability={lead.winProbability} latest={lead.scores[0]} />
          <ContactCard lead={lead} onEdit={() => setEditing(true)} />
          <LeadViewingsCard viewings={lead.viewings} onBook={() => setBookFor('')} />
          <LeadTimelineCard leadId={lead.id} />
        </div>
      </div>

      {editing && <EditLeadModal lead={lead} onClose={() => setEditing(false)} />}

      {bookFor !== undefined && (
        <BookViewingModal
          open
          onClose={() => setBookFor(undefined)}
          leadId={lead.id}
          leadName={lead.fullName}
          properties={properties}
          defaultPropertyId={bookFor || undefined}
        />
      )}
    </>
  );
}
