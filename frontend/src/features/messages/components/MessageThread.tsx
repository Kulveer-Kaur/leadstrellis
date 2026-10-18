import { useEffect, useRef } from 'react';
import { MessagesSquare } from 'lucide-react';
import { EmptyState, Skeleton } from '@/components/ui';
import type { Message } from '@/types';
import { MessageBubble } from './MessageBubble';

interface MessageThreadProps {
  messages: Message[] | undefined;
  loading: boolean;
  className?: string;
}

/** Oldest at the top; scrolls its own container (not the page) to the newest message. */
export function MessageThread({ messages, loading, className }: MessageThreadProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const lastId = messages?.at(-1)?.id;
  useEffect(() => {
    const box = boxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [lastId]);

  if (loading) return <Skeleton className="h-64" />;
  if (!messages?.length) return <EmptyState icon={<MessagesSquare className="size-5" aria-hidden />} title="No messages yet" description="Write the first one below, or let the AI draft it." />;
  return (
    <div ref={boxRef} className={className}>
      <ul className="flex flex-col gap-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </ul>
    </div>
  );
}
