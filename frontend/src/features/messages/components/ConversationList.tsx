import { MessagesSquare } from 'lucide-react';
import { EmptyState, SearchInput, Skeleton } from '@/components/ui';
import type { Conversation } from '../types';
import { ConversationItem } from './ConversationItem';

interface ConversationListProps {
  conversations: Conversation[] | undefined;
  loading: boolean;
  search: string;
  onSearch: (v: string) => void;
  selectedId: string;
  onSelect: (leadId: string) => void;
}

export function ConversationList({ conversations, loading, search, onSearch, selectedId, onSelect }: ConversationListProps) {
  return (
    <div className="flex min-h-0 flex-col">
      <SearchInput value={search} onChange={onSearch} placeholder="Search by name, email or phone" className="mb-3" />
      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : !conversations?.length ? (
        <EmptyState icon={<MessagesSquare className="size-5" aria-hidden />} title="No conversations" description={search ? 'Nobody matches that search.' : 'Messages to and from leads will show here.'} />
      ) : (
        <ul className="-mx-1 flex flex-col gap-1 overflow-y-auto px-1 scrollbar-thin">
          {conversations.map((c) => (
            <ConversationItem key={c.leadId} conversation={c} active={c.leadId === selectedId} onSelect={() => onSelect(c.leadId)} />
          ))}
        </ul>
      )}
    </div>
  );
}
