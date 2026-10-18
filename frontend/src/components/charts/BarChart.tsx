import { useState } from 'react';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import { ChartTooltip } from './ChartTooltip';

export interface BarDatum {
  key: string;
  label: string;
  /** Short label drawn inside the bar; `label` is used in the tooltip. */
  short?: string;
  value: number;
}

interface BarChartProps {
  data: BarDatum[];
  unit: string;
  /** Key of the bar to emphasise. Defaults to the highest value. */
  highlightKey?: string;
  height?: number;
}

/** Pill-shaped columns in the track colour, one emphasised bar in primary. */
export function BarChart({ data, unit, highlightKey, height = 152 }: BarChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), 1);
  const topKey = highlightKey ?? data.reduce((a, b) => (b.value > a.value ? b : a), data[0])?.key;

  return (
    <div className="relative">
      <ul className="flex items-end justify-between gap-2" style={{ height }} aria-label={`Bar chart, ${unit}`}>
        {data.map((d, i) => {
          const pct = Math.max(18, (d.value / max) * 100);
          const active = d.key === topKey;
          return (
            <li
              key={d.key}
              className="relative flex h-full flex-1 flex-col items-center justify-end"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {active && (
                <span className="num mb-1.5 text-label-large text-heading" aria-hidden>
                  {formatNumber(d.value)}
                </span>
              )}
              <div
                className={cn(
                  'flex w-full max-w-8 items-end justify-center rounded-full pb-2 transition-colors',
                  active ? 'bg-primary text-on-primary' : 'bg-track text-muted hover:bg-border-strong',
                )}
                style={{ height: `${active ? pct * 0.86 : pct}%` }}
                aria-label={`${d.label}: ${formatNumber(d.value)} ${unit}`}
                role="img"
              >
                <span className="text-label-small">{d.short ?? d.label}</span>
              </div>
            </li>
          );
        })}
      </ul>
      {hover !== null && (
        <ChartTooltip x={((hover + 0.5) / data.length) * 100} y={0}>
          <span className="block text-body-small opacity-80">{data[hover].label}</span>
          <span className="num text-label-large">
            {formatNumber(data[hover].value)} {unit}
          </span>
        </ChartTooltip>
      )}
    </div>
  );
}
