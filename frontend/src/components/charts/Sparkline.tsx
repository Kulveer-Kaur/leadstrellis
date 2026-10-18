import { useId, useState, type MouseEvent } from 'react';
import { cn } from '@/utils/cn';
import { ChartTooltip } from './ChartTooltip';

export interface SparkPoint {
  label: string;
  value: number;
}

interface SparklineProps {
  data: SparkPoint[];
  format: (value: number) => string;
  height?: number;
  label: string;
  className?: string;
}

const W = 100;

/** Compact trend line with a soft area fill and a hover crosshair. */
export function Sparkline({ data, format, height = 44, label, className }: SparklineProps) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;

  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * W,
    y: 4 + (1 - (d.value - min) / span) * (height - 8),
  }));
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
  const area = `${line} L${W},${height} L0,${height} Z`;

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    setHover(Math.round(ratio * (data.length - 1)));
  };

  const active = hover !== null ? pts[hover] : null;

  return (
    <div className={cn('relative pt-4', className)} onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img" aria-label={label}>
      <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="block w-full" style={{ height }}>
        <defs>
          <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.14" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${id})`} />
        <path d={line} fill="none" stroke="var(--color-primary)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {active && (
          <line x1={active.x} x2={active.x} y1={0} y2={height} stroke="var(--color-border-strong)" vectorEffect="non-scaling-stroke" />
        )}
      </svg>
      {active && hover !== null && (
        <>
          <span
            className="pointer-events-none absolute size-2.5 -translate-1/2 rounded-full border-2 border-surface bg-primary"
            style={{ left: `${active.x}%`, top: active.y }}
            aria-hidden
          />
          <ChartTooltip x={active.x} y={0}>
            <span className="block opacity-80">{data[hover].label}</span>
            <span className="num text-label-large">{format(data[hover].value)}</span>
          </ChartTooltip>
        </>
      )}
    </div>
  );
}
