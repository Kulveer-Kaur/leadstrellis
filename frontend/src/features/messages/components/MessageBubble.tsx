import { AlertCircle, Sparkles } from 'lucide-react';
import { CHANNEL_LABEL } from '@/constants/lead-meta';
import type { Message } from '@/types';
import { cn } from '@/utils/cn';
import { formatDateTime } from '@/utils/format';
import { MessageBody } from './MessageBody';

export function MessageBubble({ message }: { message: Message }) {
  const out = message.direction === 'OUT';
  return (
    <li className={cn('flex flex-col gap-1', out ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'max-w-[min(100%,40rem)] rounded-2xl px-4 py-3',
          out ? 'rounded-br-md bg-primary-soft text-heading' : 'rounded-bl-md border border-border bg-surface text-text',
          message.status === 'FAILED' && 'border border-danger',
        )}
      >
        {message.subject && <p className="mb-1 text-label-large text-heading">{message.subject}</p>}
        <MessageBody body={message.body} title={message.subject ?? 'Email'} />
      </div>
      <p className="flex items-center gap-1.5 px-1 text-body-small text-muted">
        {out && message.aiGenerated && <Sparkles className="size-3.5 text-primary" aria-label="Written by AI" />}
        {CHANNEL_LABEL[message.channel]} · {formatDateTime(message.createdAt)}
        {message.status === 'FAILED' && (
          <span className="inline-flex items-center gap-1 text-danger" title={message.error ?? undefined}>
            <AlertCircle className="size-3.5" aria-hidden /> Not sent
          </span>
        )}
      </p>
    </li>
  );
}
