import { MessagesSquare } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Card, EmptyState } from '@/components/ui';
import { ConversationList, ConversationPane } from '@/features/messages/components';
import { useConversations } from '@/features/messages/hooks/useMessages';
import { useDebounce } from '@/hooks/useDebounce';
import { useUrlState } from '@/hooks/useUrlState';
import { cn } from '@/utils/cn';

const DEFAULTS = { lead: '', search: '' };

export default function InboxPage() {
  const [state, setState] = useUrlState(DEFAULTS);
  const { data, isLoading } = useConversations(useDebounce(state.search));
  const selected = data?.find((c) => c.leadId === state.lead);
  const waiting = data?.filter((c) => c.awaitingReply).length ?? 0;

  return (
    <>
      <PageHeader
        title="Inbox"
        description={waiting ? `${waiting} ${waiting === 1 ? 'lead is' : 'leads are'} waiting for a reply.` : 'Every email and message with your leads, newest first.'}
      />
      <Card className="grid h-[calc(100dvh-13rem)] min-h-[32rem] grid-cols-1 gap-5 lg:grid-cols-[22rem_1fr]">
        <div className={cn('min-h-0 min-w-0 flex-col lg:flex', selected ? 'hidden' : 'flex')}>
          <ConversationList
            conversations={data}
            loading={isLoading}
            search={state.search}
            onSearch={(search) => setState({ search })}
            selectedId={state.lead}
            onSelect={(lead) => setState({ lead })}
          />
        </div>
        <div className={cn('min-h-0 min-w-0 flex-col border-border lg:flex lg:border-l lg:pl-5', selected ? 'flex' : 'hidden')}>
          {selected ? (
            <ConversationPane conversation={selected} onBack={() => setState({ lead: '' })} />
          ) : (
            <EmptyState className="h-full" icon={<MessagesSquare className="size-5" aria-hidden />} title="Pick a conversation" description="Choose a lead on the left to read the thread and reply." />
          )}
        </div>
      </Card>
    </>
  );
}
