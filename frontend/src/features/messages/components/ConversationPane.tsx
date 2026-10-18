import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { IconButton } from '@/components/ui';
import { leadPath } from '@/constants/routes';
import { LeadStatusBadge } from '@/features/leads/components';
import { useMessages } from '../hooks/useMessages';
import type { Conversation, TextChannel } from '../types';
import { MessageComposer } from './MessageComposer';
import { MessageThread } from './MessageThread';

interface ConversationPaneProps {
  conversation: Conversation;
  onBack: () => void;
}

/** One lead's thread with a composer underneath. */
export function ConversationPane({ conversation: c, onBack }: ConversationPaneProps) {
  const { data, isLoading } = useMessages(c.leadId);
  const lastChannel = c.last.channel === 'CALL' ? 'EMAIL' : (c.last.channel as TextChannel);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="mb-3 flex items-center gap-3 border-b border-border pb-3">
        <IconButton label="Back to conversations" size="sm" variant="soft" onClick={onBack} className="lg:hidden">
          <ArrowLeft className="size-4" />
        </IconButton>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-title-medium">{c.fullName}</h2>
          <p className="num text-body-small text-muted">
            {c.code} · {c.messageCount} messages
          </p>
        </div>
        <LeadStatusBadge status={c.status} />
        <Link to={leadPath(c.leadId)} className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-label-large text-primary hover:bg-primary-soft">
          Lead <ExternalLink className="size-3.5" aria-hidden />
        </Link>
      </header>
      <MessageThread messages={data} loading={isLoading} className="mb-3 min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-thin" />
      <MessageComposer key={c.leadId} leadId={c.leadId} defaultChannel={lastChannel} />
    </div>
  );
}
