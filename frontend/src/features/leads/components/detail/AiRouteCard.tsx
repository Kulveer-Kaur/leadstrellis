import { useState } from 'react';
import { AlertTriangle, CalendarCheck, Check, Download, ExternalLink, Loader2, MessageSquareReply, RotateCw, Sparkles } from 'lucide-react';
import { Badge, Button, Card, Modal } from '@/components/ui';
import { TextAreaField } from '@/components/form';
import { AGENT_MODE_LABEL, AgentModePicker } from '../AgentModePicker';
import type { AiRouteStep, LeadDetail, LeadProposal } from '@/types';
import { ApiError } from '@/services/http';
import { cn } from '@/utils/cn';
import { formatAed, formatDateTime, formatRelative } from '@/utils/format';
import { useAddLeadReply, useConfirmVisit, useResendProposal, useSetAgentMode } from '../../hooks/useLeadMutations';

const STEPS: { key: string; label: string; covers: AiRouteStep[] }[] = [
  { key: 'analyse', label: 'Analyse enquiry', covers: ['ANALYSING'] },
  { key: 'match', label: 'Match properties', covers: ['MATCHING'] },
  { key: 'proposal', label: 'Send proposal', covers: ['PROPOSING'] },
  { key: 'reply', label: 'Site-visit reply', covers: ['AWAITING_REPLY'] },
  { key: 'won', label: 'Lead won', covers: ['WON'] },
];

const stepIndex = (step: AiRouteStep) => STEPS.findIndex((s) => s.covers.includes(step));

const PROPOSAL_TONE = {
  SENT: 'info',
  ACCEPTED: 'success',
  DECLINED: 'neutral',
  FAILED: 'danger',
} as const;
const PROPOSAL_LABEL = {
  SENT: 'Sent · awaiting reply',
  ACCEPTED: 'Accepted',
  DECLINED: 'Closed',
  FAILED: 'Not sent',
} as const;

/**
 * The lead's agent: Off, Auto (rules, no AI tokens) or the AI agent. Either engine runs the
 * same flow (match → proposal PDF by email → read the reply → book the site visit → won on a clear go-ahead).
 */
export function AiRouteCard({ lead }: { lead: LeadDetail }) {
  const setMode = useSetAgentMode(lead.id);
  const resend = useResendProposal(lead.id);
  const [replyOpen, setReplyOpen] = useState(false);
  const [confirmFor, setConfirmFor] = useState<LeadProposal | null>(null);

  const step = lead.aiRouteStep;
  const current = stepIndex(step);
  const working = lead.aiRouteEnabled && ['ANALYSING', 'MATCHING', 'PROPOSING'].includes(step);
  const latest = lead.proposals[0];
  const openProposal = lead.proposals.find((p) => p.status === 'SENT');
  const error = setMode.error ?? resend.error;
  const won = lead.status === 'CLOSED_WON';
  const engine = lead.agentMode === 'AI' ? 'The AI agent' : 'The rules engine';

  return (
    <Card className="mb-5">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-title-medium text-heading">Lead agent</h2>
            {setMode.isPending && <Loader2 className="size-4 animate-spin text-muted" aria-hidden />}
          </div>
          <p className="mt-0.5 max-w-[70ch] text-body-medium text-muted">
            {won
              ? `Completed by ${AGENT_MODE_LABEL[lead.agentMode].toLowerCase()}: the lead agreed to go ahead and was marked won.`
              : step === 'LOST'
                ? 'Stopped: the lead declined or asked not to be contacted. Send a new proposal if their needs change.'
                : lead.aiRouteEnabled
                  ? `${engine} is working this lead: matching, proposal by email, reading replies and booking the site visit.`
                  : 'Choose who works this lead. Only the AI agent uses AI tokens; you can switch at any step.'}
          </p>
        </div>
      </div>

      {!won && (
        <AgentModePicker
          className="mt-4"
          value={lead.aiRouteEnabled || step === 'LOST' ? lead.agentMode : 'OFF'}
          onChange={(m) => setMode.mutate(m)}
          disabled={setMode.isPending}
          noEmail={!lead.email}
        />
      )}

      {!lead.email && !won && (
        <p className="mt-4 rounded-panel bg-warning-soft px-4 py-2.5 text-body-medium text-warning">
          Add an email address to assign an agent: the proposal is sent by email.
        </p>
      )}

      {/* Step tracker */}
      <ol className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-5">
        {STEPS.map((s, i) => {
          const done = step === 'WON' || (current > i && step !== 'OFF');
          const active = current === i && step !== 'WON';
          return (
            <li
              key={s.key}
              className={cn(
                'flex items-center gap-2.5 rounded-panel border px-3 py-2.5',
                done ? 'border-transparent bg-success-soft' : active ? 'border-primary bg-primary-soft' : 'border-border bg-surface',
              )}
            >
              <span
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-full text-label-medium',
                  done ? 'bg-success text-on-primary' : active ? 'bg-primary text-on-primary' : 'bg-surface-2 text-muted',
                )}
              >
                {done ? <Check className="size-3.5" aria-hidden /> : active && working ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : i + 1}
              </span>
              <span className={cn('text-label-large', done || active ? 'text-heading' : 'text-muted')}>{s.label}</span>
            </li>
          );
        })}
      </ol>

      {(lead.aiRouteNote || step === 'NEEDS_ATTENTION' || step === 'LOST') && (
        <p
          className={cn(
            'mt-3 flex items-start gap-2 rounded-panel px-4 py-2.5 text-body-medium',
            step === 'NEEDS_ATTENTION' ? 'bg-danger-soft text-danger' : step === 'WON' ? 'bg-success-soft text-success' : 'bg-surface-2 text-text',
          )}
          role={step === 'NEEDS_ATTENTION' ? 'alert' : undefined}
        >
          {step === 'NEEDS_ATTENTION' && <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />}
          <span>
            {step === 'LOST' ? 'Lead declined the proposal. ' : ''}
            {lead.aiRouteNote}
            {won && lead.dealValueAed ? ` · Deal value ${formatAed(lead.dealValueAed)}` : ''}
          </span>
        </p>
      )}

      {!lead.aiRouteEnabled && openProposal && (
        <p className="mt-3 rounded-panel bg-warning-soft px-4 py-2.5 text-body-medium text-warning">
          The agent is off: replies to the open proposal are saved but not answered. Choose Auto or AI agent to let it reply and book the visit.
        </p>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {latest && (
          <>
            <a
              href={latest.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-4 text-label-large text-on-primary hover:bg-primary-hover"
            >
              <ExternalLink className="size-4" aria-hidden /> View proposal
            </a>
            <a
              href={`${latest.pdfUrl}?download=1`}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border-strong bg-surface px-4 text-label-large text-heading hover:bg-surface-2"
            >
              <Download className="size-4" aria-hidden /> Download PDF
            </a>
          </>
        )}
        {openProposal && (
          <>
            <Button variant="outline" className="min-h-10 px-4" icon={<MessageSquareReply className="size-4" aria-hidden />} onClick={() => setReplyOpen(true)}>
              Add lead's reply
            </Button>
            <Button variant="outline" className="min-h-10 px-4" icon={<CalendarCheck className="size-4" aria-hidden />} onClick={() => setConfirmFor(openProposal)}>
              Confirm site visit
            </Button>
          </>
        )}
        {!won && lead.email && lead.agentMode !== 'OFF' && (latest || step === 'NEEDS_ATTENTION') && (
          <Button
            variant="soft"
            className="min-h-10 px-4"
            icon={<RotateCw className={cn('size-4', resend.isPending && 'animate-spin')} aria-hidden />}
            disabled={resend.isPending || working}
            onClick={() => resend.mutate()}
          >
            {latest ? 'Send new proposal' : 'Try again'}
          </Button>
        )}
      </div>
      {error && (
        <p className="mt-3 text-body-medium text-danger" role="alert">
          {error instanceof ApiError ? error.message : 'Something went wrong'}
        </p>
      )}

      {/* Proposal history */}
      {lead.proposals.length > 0 && (
        <div className="mt-5 border-t border-border pt-4">
          <h3 className="mb-2 text-title-small text-heading">Proposals</h3>
          <ul className="flex flex-col divide-y divide-border">
            {lead.proposals.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-body-medium font-medium text-heading">
                    <span className="num text-muted">{p.number}</span> · {p.property.title}
                  </p>
                  <p className="text-body-small text-muted">
                    {p.property.community} · {formatAed(p.property.priceAed)}
                    {p.fitScore != null && ` · ${p.fitScore}% match`}
                    {p.sentAt ? ` · sent ${formatRelative(p.sentAt)}` : ''}
                    {p.viewedAt ? ` · opened ${formatRelative(p.viewedAt)}` : ''}
                    {p.aiGenerated ? ' · AI-written' : ' · template'}
                  </p>
                  {p.error && <p className="text-body-small text-danger">{p.error}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={PROPOSAL_TONE[p.status]}>{PROPOSAL_LABEL[p.status]}</Badge>
                  <a href={p.url} target="_blank" rel="noreferrer" className="text-label-large text-primary hover:underline">
                    View
                  </a>
                  <a href={`${p.pdfUrl}?download=1`} className="text-label-large text-primary hover:underline">
                    PDF
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <AddReplyModal open={replyOpen} onClose={() => setReplyOpen(false)} leadId={lead.id} firstName={lead.fullName.split(' ')[0] ?? lead.fullName} />
      {confirmFor && <ConfirmVisitModal proposal={confirmFor} leadId={lead.id} onClose={() => setConfirmFor(null)} />}
    </Card>
  );
}

function AddReplyModal({ open, onClose, leadId, firstName }: { open: boolean; onClose: () => void; leadId: string; firstName: string }) {
  const [body, setBody] = useState('');
  const add = useAddLeadReply(leadId);
  const submit = () =>
    add.mutate(body.trim(), {
      onSuccess: () => {
        setBody('');
        onClose();
      },
    });
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Add ${firstName}'s reply`}
      description="Email replies are read automatically. Use this for a reply that came by phone or WhatsApp; the Inbox agent reads it the same way."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!body.trim() || add.isPending}>
            {add.isPending ? 'Saving…' : 'Add reply'}
          </Button>
        </div>
      }
    >
      <TextAreaField label="What did the lead say?" value={body} onChange={setBody} rows={5} placeholder='e.g. "Option 2 works for me, see you then."' />
      {add.error && <p className="mt-2 text-body-medium text-danger">{add.error.message}</p>}
    </Modal>
  );
}

function ConfirmVisitModal({ proposal, leadId, onClose }: { proposal: LeadProposal; leadId: string; onClose: () => void }) {
  const upcoming = proposal.slots.map((s, i) => ({ s, i })).filter(({ s }) => new Date(s).getTime() > Date.now());
  const [slot, setSlot] = useState(upcoming[0]?.i ?? 0);
  const confirm = useConfirmVisit(leadId);
  return (
    <Modal
      open
      onClose={onClose}
      title="Confirm the site visit"
      description={`For ${proposal.property.title}. This books the viewing, emails the lead the address and a calendar invite, and marks the lead won.`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => confirm.mutate({ proposalId: proposal.id, slotIndex: slot }, { onSuccess: onClose })} disabled={confirm.isPending || !upcoming.length}>
            {confirm.isPending ? 'Confirming…' : 'Confirm visit'}
          </Button>
        </div>
      }
    >
      {upcoming.length === 0 ? (
        <p className="text-body-medium text-muted">All offered times have passed. Send a new proposal to offer new times.</p>
      ) : (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-label-large text-heading">Time offered in the proposal</legend>
          {upcoming.map(({ s, i }) => (
            <label key={s} className={cn('flex cursor-pointer items-center gap-3 rounded-panel border px-4 py-3', slot === i ? 'border-primary bg-primary-soft' : 'border-border')}>
              <input type="radio" name="slot" checked={slot === i} onChange={() => setSlot(i)} className="accent-[var(--color-primary)]" />
              <span className="text-body-medium text-heading">
                Option {i + 1}: {formatDateTime(s)}
              </span>
            </label>
          ))}
        </fieldset>
      )}
      {confirm.error && <p className="mt-2 text-body-medium text-danger">{confirm.error.message}</p>}
    </Modal>
  );
}
