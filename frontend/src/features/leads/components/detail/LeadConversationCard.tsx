import { Link } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { MessageComposer, MessageThread } from '@/features/messages/components';
import type { TextChannel } from '@/features/messages/types';
import type { LeadDetail } from '@/types';

export function LeadConversationCard({ lead }: { lead: LeadDetail }) {
  const preferred = lead.preferredChannel && lead.preferredChannel !== 'CALL' ? (lead.preferredChannel as TextChannel) : 'EMAIL';
  return (
    <Card>
      <CardHeader
        title="Conversation"
        subtitle={`${lead.messages.length} messages`}
        action={
          <Link to={`${ROUTES.communications}?lead=${lead.id}`} className="inline-flex min-h-10 items-center rounded-full px-3 text-label-large text-primary hover:bg-primary-soft">
            Open in inbox
          </Link>
        }
      />
      <MessageThread messages={lead.messages} loading={false} className="mb-4 max-h-[36rem] overflow-y-auto pr-1 scrollbar-thin" />
      <MessageComposer leadId={lead.id} defaultChannel={preferred} />
    </Card>
  );
}
