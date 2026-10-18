import { Sparkles } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { CHANNEL_LABEL } from '@/constants/lead-meta';
import { cn } from '@/utils/cn';
import { formatRelative } from '@/utils/format';
import type { Conversation } from '../types';

interface ConversationItemProps {
  conversation: Conversation;
  active: boolean;
  onSelect: () => void;
}

export function ConversationItem({ conversation: c, active, onSelect }: ConversationItemProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={active || undefined}
        className={cn('flex w-full cursor-pointer gap-3 rounded-panel p-3 text-left transition-colors', active ? 'bg-primary-soft' : 'hover:bg-surface-2')}
      >
        <Avatar name={c.fullName} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className={cn('truncate text-body-medium text-heading', c.awaitingReply && 'font-semibold')}>{c.fullName}</p>
            <span className="shrink-0 text-body-small text-muted">{formatRelative(c.last.createdAt)}</span>
          </div>
          <p className="truncate text-body-small text-muted">
            {c.last.direction === 'OUT' ? (
              <>
                {c.last.aiGenerated && <Sparkles className="mr-1 inline size-3 text-primary" aria-label="AI" />}
                You:{' '}
              </>
            ) : null}
            {c.last.subject ? `${c.last.subject} — ` : ''}
            {c.last.preview}
          </p>
          <p className="mt-1 flex items-center gap-2 text-body-small text-muted">
            <span>{CHANNEL_LABEL[c.last.channel]}</span>
            <span aria-hidden>·</span>
            <span className="num">{c.code}</span>
            {c.awaitingReply && <span className="ml-auto rounded-full bg-warning-soft px-2 py-0.5 text-label-small text-warning">Needs reply</span>}
          </p>
        </div>
      </button>
    </li>
  );
}
