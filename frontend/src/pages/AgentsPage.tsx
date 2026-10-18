import { Play } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Button, Card, CardSkeleton, Switch } from '@/components/ui';
import { useRunPilot, useSetAgentActive, useSettings } from '@/features/settings/hooks/useSettings';
import type { AgentSetting, AgentType } from '@/types';

interface AgentMeta {
  title: string;
  blurb: string;
}

/** Human-friendly copy for each of the 8 Phase-2 agents (plan §2). */
const AGENT_META: Record<AgentType, AgentMeta> = {
  INTAKE: { title: 'Intake agent', blurb: 'Reads every new enquiry, extracts the needs and removes duplicates.' },
  QUALIFIER: { title: 'Qualifier agent', blurb: 'Scores the lead 0–100 and estimates win probability.' },
  MATCHMAKER: { title: 'Matchmaker agent', blurb: 'Picks the 2–3 best-fit properties and queues emails when new listings fit waiting leads.' },
  OUTREACH: { title: 'Outreach agent', blurb: 'Sends the first recommendation email or a short "a few quick questions" note.' },
  INBOX: { title: 'Inbox agent', blurb: 'Reads every reply, answers from listing facts, books viewings and sends calendar invites.' },
  FOLLOW_UP: { title: 'Follow-up agent', blurb: 'Short nudges on day 2, 5 and 10, plus a monthly nurture.' },
  DEAL: { title: 'Deal agent', blurb: 'Reminds about viewings, sends proposals and marks the lead Won when the client accepts.' },
  PILOT: { title: 'LeadsTrellis (the pilot)', blurb: 'Runs every 10 minutes to check the pipeline and hand tasks to the other agents.' },
};

const ORDER: AgentType[] = ['PILOT', 'INTAKE', 'QUALIFIER', 'MATCHMAKER', 'OUTREACH', 'INBOX', 'FOLLOW_UP', 'DEAL'];

export default function AgentsPage() {
  const { data, isLoading } = useSettings();
  const setActive = useSetAgentActive();
  const runPilot = useRunPilot();

  if (isLoading || !data) {
    return (
      <>
        <PageHeader title="AI agents" description="The team of agents working your leads." />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} className="h-40" />)}
        </div>
      </>
    );
  }

  const byAgent = new Map(data.agents.map((a) => [a.agent as AgentType, a]));

  return (
    <>
      <PageHeader
        title="AI agents"
        description="The team of agents working your leads. Flip any one off if you want to pause it."
        actions={
          <Button
            variant="outline"
            onClick={() => runPilot.mutate()}
            disabled={runPilot.isPending || !data.settings.pilotEnabled}
            title={data.settings.pilotEnabled ? 'Run the pilot now' : 'Enable the pilot in Settings first'}
          >
            <Play className="size-4" aria-hidden /> Run pilot now
          </Button>
        }
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {ORDER.map((agent) => {
          const row = byAgent.get(agent);
          if (!row) return null;
          return (
            <AgentCard
              key={agent}
              row={row}
              meta={AGENT_META[agent]}
              onToggle={(v) => setActive.mutate({ agent, isActive: v })}
              pending={setActive.isPending}
            />
          );
        })}
      </div>
    </>
  );
}

interface AgentCardProps {
  row: AgentSetting;
  meta: AgentMeta;
  onToggle: (isActive: boolean) => void;
  pending: boolean;
}

function AgentCard({ row, meta, onToggle, pending }: AgentCardProps) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-title-medium">{meta.title}</h3>
          <p className="mt-1 text-body-small text-muted">{meta.blurb}</p>
        </div>
        <Switch checked={row.isActive} onChange={onToggle} label={`${meta.title} on/off`} />
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 text-body-small text-muted">
        <span className={row.isActive ? 'text-success' : 'text-muted'}>{row.isActive ? 'Active' : 'Paused'}</span>
        <span>
          {row.tasksDoneToday} today ·{' '}
          {row.lastRunAt ? `last ${new Date(row.lastRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'not run yet'}
        </span>
      </div>
      {pending && <div className="pointer-events-none absolute" aria-hidden />}
    </Card>
  );
}
