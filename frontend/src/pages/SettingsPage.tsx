import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, RefreshCw, Save, Trash2, UserPlus } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Button, Card, CardHeader, CardSkeleton, ProgressBar, Switch } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { deleteAgent, resendInvite } from '@/features/leads/api/leads.api';
import { useTeam } from '@/features/leads/hooks/useLeads';
import { InviteAgentModal } from '@/features/settings/components/InviteAgentModal';
import { useSettings, useUpdateSettings } from '@/features/settings/hooks/useSettings';
import { queryKeys } from '@/services/query-keys';
import type { AppSettings, TeamMember } from '@/types';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const fmtHour = (h: number) => `${h.toString().padStart(2, '0')}:00`;

type HoursDraft = Pick<AppSettings, 'workingDays' | 'workingHoursStart' | 'workingHoursEnd' | 'aiDailyTokenBudget' | 'dailySendCap' | 'emailsPerLeadPerDay' | 'emailsPerLeadPerWeek'>;

export default function SettingsPage() {
  const { user } = useAuth();
  const { data, isLoading } = useSettings();
  const update = useUpdateSettings();
  const [draft, setDraft] = useState<HoursDraft | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Keep the local draft in sync with the server when nothing is pending.
  useEffect(() => {
    if (!data) return;
    setDraft((prev) => prev ?? pickDraft(data.settings));
  }, [data]);

  if (isLoading || !data || !draft) {
    return (
      <>
        <PageHeader title="Settings" />
        <div className="grid gap-5 md:grid-cols-2">
          <CardSkeleton className="h-56" />
          <CardSkeleton className="h-56" />
          <CardSkeleton className="h-72 md:col-span-2" />
        </div>
      </>
    );
  }

  const { settings, aiBudget } = data;
  const dirty = JSON.stringify(draft) !== JSON.stringify(pickDraft(settings));
  const toggleDay = (d: number) =>
    setDraft((v) => (v ? { ...v, workingDays: v.workingDays.includes(d) ? v.workingDays.filter((x) => x !== d) : [...v.workingDays, d].sort() } : v));

  return (
    <>
      <PageHeader title="Settings" description="How LeadsTrellis works for your team — toggles, hours and limits." />

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader title="Automation" action={<span />} />
          <ToggleRow
            label="LeadsTrellis pilot"
            help="Checks the pipeline every 10 minutes for stuck or hot leads. Rules-based, no AI tokens."
            checked={settings.pilotEnabled}
            onChange={(v) => update.mutate({ pilotEnabled: v })}
          />
          <ToggleRow
            label="Live feed (dev)"
            help="Seeds a new lead every 20–40 minutes during working hours and simulates occasional replies."
            checked={settings.liveFeedEnabled}
            onChange={(v) => update.mutate({ liveFeedEnabled: v })}
          />
        </Card>

        <Card>
          <CardHeader title="AI daily budget" action={<span />} />
          <p className="num text-display-small text-heading">
            {aiBudget.used.toLocaleString()}
            <span className="text-body-medium text-muted"> / {aiBudget.budget.toLocaleString()} tokens</span>
          </p>
          <ProgressBar className="mt-3" value={aiBudget.percent} label="AI tokens used today" />
          <p className="mt-3 text-body-small text-muted">
            {aiBudget.exhausted ? (
              <span className="inline-flex items-center gap-1.5 text-warning">
                <AlertTriangle className="size-4" aria-hidden /> Budget exhausted — agents are using template responses until midnight.
              </span>
            ) : (
              <>Resets daily. Lower this if the free tier runs out before the end of the day.</>
            )}
          </p>
          <label className="mt-4 block text-label-medium text-heading">Daily token cap</label>
          <input
            type="number"
            min={1000}
            step={1000}
            value={draft.aiDailyTokenBudget}
            onChange={(e) => setDraft((v) => (v ? { ...v, aiDailyTokenBudget: Number(e.target.value) || 0 } : v))}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-body-medium"
          />
        </Card>

        <Card className="md:col-span-2">
          <CardHeader title="Working hours (Dubai)" action={<span />} />
          <p className="text-body-small text-muted">
            Emails and automations only go out inside these hours. Anything created outside the window waits for the next open slot.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {DAY_LABELS.map((label, i) => {
              const active = draft.workingDays.includes(i);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={
                    'inline-flex min-w-14 justify-center rounded-full border px-3 py-1.5 text-label-medium transition-colors ' +
                    (active ? 'border-primary bg-primary text-on-primary' : 'border-border text-text hover:bg-surface-2')
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <HourSelect
              label="Start"
              value={draft.workingHoursStart}
              onChange={(v) => setDraft((d) => (d ? { ...d, workingHoursStart: v } : d))}
            />
            <HourSelect
              label="End"
              value={draft.workingHoursEnd}
              onChange={(v) => setDraft((d) => (d ? { ...d, workingHoursEnd: v } : d))}
            />
          </div>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader title="Email limits" action={<span />} />
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberField
              label="Per lead per day"
              value={draft.emailsPerLeadPerDay}
              onChange={(v) => setDraft((d) => (d ? { ...d, emailsPerLeadPerDay: v } : d))}
            />
            <NumberField
              label="Per lead per week"
              value={draft.emailsPerLeadPerWeek}
              onChange={(v) => setDraft((d) => (d ? { ...d, emailsPerLeadPerWeek: v } : d))}
            />
            <NumberField
              label="Daily send cap"
              value={draft.dailySendCap}
              onChange={(v) => setDraft((d) => (d ? { ...d, dailySendCap: v } : d))}
            />
          </div>
          <p className="mt-3 text-body-small text-muted">
            {settings.dailySendCount} sent today. The cap keeps the mailbox inside Gmail's deliverability limits.
          </p>
        </Card>

        {user?.role === 'ADMIN' && (
          <TeamManagementCard onInviteClick={() => setShowInviteModal(true)} />
        )}
      </div>

      <div className="mt-5 flex items-center justify-end gap-3">
        <Button variant="outline" onClick={() => setDraft(pickDraft(settings))} disabled={!dirty || update.isPending}>
          Reset
        </Button>
        <Button onClick={() => update.mutate(draft)} disabled={!dirty || update.isPending}>
          <Save className="size-4" aria-hidden /> Save changes
        </Button>
      </div>

      <InviteAgentModal open={showInviteModal} onClose={() => setShowInviteModal(false)} />
    </>
  );
}

function pickDraft(s: AppSettings): HoursDraft {
  return {
    workingDays: s.workingDays,
    workingHoursStart: s.workingHoursStart,
    workingHoursEnd: s.workingHoursEnd,
    aiDailyTokenBudget: s.aiDailyTokenBudget,
    dailySendCap: s.dailySendCap,
    emailsPerLeadPerDay: s.emailsPerLeadPerDay,
    emailsPerLeadPerWeek: s.emailsPerLeadPerWeek,
  };
}

function ToggleRow({ label, help, checked, onChange }: { label: string; help: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="mt-4 flex items-start justify-between gap-4">
      <div>
        <p className="text-label-large text-heading">{label}</p>
        <p className="mt-1 max-w-[52ch] text-body-small text-muted">{help}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

function HourSelect({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="text-label-medium text-heading">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-body-medium"
      >
        {HOUR_OPTIONS.map((h) => (
          <option key={h} value={h}>
            {fmtHour(h)}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="text-label-medium text-heading">{label}</span>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-body-medium"
      />
    </label>
  );
}

function TeamManagementCard({ onInviteClick }: { onInviteClick: () => void }) {
  const queryClient = useQueryClient();
  const { data: team = [], isLoading } = useTeam();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const handleResend = async (m: TeamMember) => {
    setActionLoadingId(m.id);
    try {
      const res = await resendInvite(m.id);
      if (res.inviteUrl) {
        navigator.clipboard.writeText(res.inviteUrl);
        setCopiedId(m.id);
        setTimeout(() => setCopiedId(null), 3000);
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.users });
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to resend invite');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (m: TeamMember) => {
    if (!confirm(`Are you sure you want to remove agent "${m.name}"? Any leads assigned to them can be reassigned.`)) {
      return;
    }
    setActionLoadingId(m.id);
    try {
      await deleteAgent(m.id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.users });
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to delete agent');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <Card className="md:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="text-title-large text-heading">Agent Team</h2>
          <p className="mt-1 text-body-small text-muted">
            Manage agents who work your leads. Agents only see leads assigned directly to them.
          </p>
        </div>
        <Button onClick={onInviteClick} className="gap-2">
          <UserPlus className="h-4 w-4" /> Invite New Agent
        </Button>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-muted">Loading team members...</div>
      ) : team.length === 0 ? (
        <div className="py-8 text-center text-muted">
          No team members yet. Click &ldquo;Invite New Agent&rdquo; to add your first agent.
        </div>
      ) : (
        <div className="mt-4 divide-y divide-border">
          {team.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-4 py-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-label-large font-bold text-primary uppercase">
                  {m.name.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-label-large font-medium text-heading truncate">{m.name}</p>
                    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-label-small font-medium bg-surface-2 text-muted uppercase">
                      {m.role}
                    </span>
                    {m.invitePending ? (
                      <span className="inline-flex items-center rounded-md px-2 py-0.5 text-label-small font-medium bg-amber-500/10 text-amber-500">
                        Invite Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md px-2 py-0.5 text-label-small font-medium bg-emerald-500/10 text-emerald-500">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-body-small text-muted truncate">{m.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-body-small text-muted">
                  <strong className="text-heading font-medium">{m.openLeads}</strong> active leads
                </span>

                {m.invitePending && (
                  <Button
                    variant="outline"
                    onClick={() => handleResend(m)}
                    disabled={actionLoadingId === m.id}
                    className="gap-1.5 px-3 py-1.5 min-h-0 text-body-small"
                    title="Resend invitation email and copy link"
                  >
                    {copiedId === m.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" /> Link Copied
                      </>
                    ) : (
                      <>
                        <RefreshCw className={`h-3.5 w-3.5 ${actionLoadingId === m.id ? 'animate-spin' : ''}`} /> Resend Link
                      </>
                    )}
                  </Button>
                )}

                {m.role !== 'ADMIN' && (
                  <button
                    type="button"
                    onClick={() => handleDelete(m)}
                    disabled={actionLoadingId === m.id}
                    className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-500/10 hover:text-red-600 cursor-pointer disabled:opacity-50"
                    title="Remove agent"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

