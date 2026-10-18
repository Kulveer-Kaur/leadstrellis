import { formatNumber, formatPercent } from '@/utils/format';

export interface FunnelStage {
  key: string;
  label: string;
  value: number;
}

interface FunnelBarsProps {
  stages: FunnelStage[];
}

/** Horizontal funnel: one hue, bar length = count, label = conversion from top. */
export function FunnelBars({ stages }: FunnelBarsProps) {
  const top = stages[0]?.value || 1;
  return (
    <ol className="flex flex-col gap-3">
      {stages.map((s, i) => {
        const pct = (s.value / top) * 100;
        return (
          <li key={s.key} className="group grid grid-cols-[5.5rem_1fr_auto] items-center gap-3" title={`${s.label}: ${formatNumber(s.value)} leads`}>
            <span className="text-body-medium text-text">{s.label}</span>
            <div className="h-7 rounded-full bg-surface-2">
              <div
                className="h-full rounded-full transition-[width,opacity] duration-700 group-hover:opacity-90"
                style={{ width: `${Math.max(pct, 6)}%`, background: 'var(--color-primary)', opacity: 1 - i * 0.14 }}
              />
            </div>
            <span className="num w-20 text-right text-body-medium text-heading">
              {formatNumber(s.value)}
              <span className="ml-1.5 text-body-small text-muted">{i === 0 ? '' : formatPercent(pct)}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
