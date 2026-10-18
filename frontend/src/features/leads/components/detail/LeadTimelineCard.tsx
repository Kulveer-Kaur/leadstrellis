import { Bot, Settings2, User } from 'lucide-react';
import { Card, CardHeader, Skeleton } from '@/components/ui';
import type { ActivityEntry, ActorType } from '@/types';
import { formatRelative } from '@/utils/format';
import { useLeadTimeline } from '../../hooks/useLead';

const ACTOR_ICON: Record<ActorType, typeof Bot> = { AI: Bot, USER: User, SYSTEM: Settings2 };
const ACTOR_LABEL: Record<ActorType, string> = { AI: 'AI agent', USER: 'Team member', SYSTEM: 'System' };

function TimelineItem({ entry }: { entry: ActivityEntry }) {
  const Icon = ACTOR_ICON[entry.actorType];
  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      <span className="absolute top-8 bottom-0 left-4 w-px bg-border" aria-hidden />
      <span className={`grid size-8 shrink-0 place-items-center rounded-full ${entry.actorType === 'AI' ? 'bg-primary-soft text-primary' : 'bg-surface-2 text-text'}`} title={ACTOR_LABEL[entry.actorType]}>
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 pt-1">
        <p className="text-body-medium text-heading">{entry.title}</p>
        {entry.detail && <p className="line-clamp-2 text-body-small text-muted">{entry.detail}</p>}
        <p className="mt-0.5 text-body-small text-muted">{formatRelative(entry.createdAt)}</p>
      </div>
    </li>
  );
}

export function LeadTimelineCard({ leadId }: { leadId: string }) {
  const { data, isLoading } = useLeadTimeline(leadId);
  return (
    <Card>
      <CardHeader title="Timeline" subtitle="Everything the AI and the team did" action={<span />} />
      {isLoading ? (
        <Skeleton className="h-48" />
      ) : data?.length ? (
        <ol className="max-h-[32rem] overflow-y-auto pr-1 scrollbar-thin">
          {data.map((e) => (
            <TimelineItem key={e.id} entry={e} />
          ))}
        </ol>
      ) : (
        <p className="text-body-medium text-muted">Nothing yet.</p>
      )}
    </Card>
  );
}
