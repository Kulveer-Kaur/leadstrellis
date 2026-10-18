import { AlertTriangle, CheckCircle2, CircleAlert, Info, type LucideIcon } from 'lucide-react';
import { Card, CardHeader, CardSkeleton } from '@/components/ui';
import { cn } from '@/utils/cn';
import { usePilotInsights } from '../hooks/useReports';
import type { PilotInsight } from '../types';

/** Status colours always come with an icon and a word, never colour alone. */
const SEVERITY: Record<PilotInsight['severity'], { icon: LucideIcon; label: string; className: string }> = {
  high: { icon: AlertTriangle, label: 'Act now', className: 'bg-danger-soft text-danger' },
  medium: { icon: CircleAlert, label: 'Watch', className: 'bg-warning-soft text-warning' },
  info: { icon: Info, label: 'Info', className: 'bg-info-soft text-info' },
  ok: { icon: CheckCircle2, label: 'All clear', className: 'bg-success-soft text-success' },
};

export function PilotInsightsCard() {
  const { data, isLoading } = usePilotInsights();
  if (isLoading || !data) return <CardSkeleton className="h-64" />;
  return (
    <Card>
      <CardHeader title="Pilot check" subtitle="What LeadsTrellis is watching in the pipeline" action={<span />} />
      <ul className="flex flex-col gap-2">
        {data.map((i) => {
          const s = SEVERITY[i.severity];
          return (
            <li key={i.key} className="flex items-center gap-3 rounded-panel bg-surface-2 px-4 py-3">
              <span className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-label-medium', s.className)}>
                <s.icon className="size-3.5" aria-hidden />
                {s.label}
              </span>
              <span className="flex-1 text-body-medium text-text">{i.title}</span>
              <span className="num text-title-medium text-heading">{i.count}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
