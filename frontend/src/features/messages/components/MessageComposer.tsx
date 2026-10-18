import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { inputClass } from '@/components/form/input-styles';
import { Button, PillSelect, type PillOption } from '@/components/ui';
import { ApiError } from '@/services/http';
import { cn } from '@/utils/cn';
import { useDraftMessage, useSendMessage } from '../hooks/useMessages';
import type { MessagePurpose, TextChannel } from '../types';

const CHANNELS: PillOption[] = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'SMS', label: 'SMS' },
];

const PURPOSES: PillOption[] = [
  { value: 'FOLLOW_UP', label: 'Follow-up' },
  { value: 'INTRO', label: 'Introduction + matches' },
  { value: 'NO_REPLY_RETRY', label: 'No-reply nudge' },
  { value: 'VIEWING_CONFIRMATION', label: 'Viewing confirmation' },
  { value: 'NURTURE', label: 'Market update' },
];

interface MessageComposerProps {
  leadId: string;
  defaultChannel?: TextChannel;
}

/** Write a message, or have the AI draft one to edit first. */
export function MessageComposer({ leadId, defaultChannel = 'EMAIL' }: MessageComposerProps) {
  const [channel, setChannel] = useState<TextChannel>(defaultChannel);
  const [purpose, setPurpose] = useState<MessagePurpose>('FOLLOW_UP');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const send = useSendMessage(leadId);
  const draft = useDraftMessage(leadId);
  const busy = send.isPending || draft.isPending;

  const onError = (err: unknown) => setError(err instanceof ApiError ? err.message : 'Something went wrong.');

  const writeDraft = () => {
    setError(null);
    draft.mutate(
      { channel, purpose },
      {
        onSuccess: (d) => {
          setBody(d.body);
          if (d.subject) setSubject(d.subject);
        },
        onError,
      },
    );
  };

  const submit = () => {
    setError(null);
    send.mutate(
      { channel, purpose, body: body.trim(), subject: channel === 'EMAIL' ? subject.trim() || undefined : undefined },
      {
        onSuccess: () => {
          setBody('');
          setSubject('');
        },
        onError,
      },
    );
  };

  return (
    <div className="flex flex-col gap-3 rounded-panel border border-border bg-surface p-3">
      <div className="flex flex-wrap items-center gap-2">
        <PillSelect label="Channel" size="sm" value={channel} options={CHANNELS} onChange={(v) => setChannel(v as TextChannel)} />
        <PillSelect label="Purpose" size="sm" value={purpose} options={PURPOSES} onChange={(v) => setPurpose(v as MessagePurpose)} />
        <Button variant="soft" className="ml-auto min-h-10" onClick={writeDraft} disabled={busy} icon={<Sparkles className="size-4" aria-hidden />}>
          {draft.isPending ? 'Drafting…' : 'Draft with AI'}
        </Button>
      </div>
      {channel === 'EMAIL' && (
        <input aria-label="Subject" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} className={cn(inputClass(), 'min-h-11 rounded-full')} />
      )}
      <textarea
        aria-label="Message"
        rows={3}
        placeholder="Write a message…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className={cn(inputClass(), 'resize-y rounded-2xl py-3')}
      />
      {error && (
        <p role="alert" className="text-body-small text-danger">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button onClick={submit} disabled={busy || !body.trim()} icon={<Send className="size-4" aria-hidden />}>
          {send.isPending ? 'Sending…' : 'Send'}
        </Button>
      </div>
    </div>
  );
}
