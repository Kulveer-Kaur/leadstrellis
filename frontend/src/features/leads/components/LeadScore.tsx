import { cn } from '@/utils/cn';

/** Small score ring (0–100) used in tables and cards. */
export function LeadScore({ score, className }: { score: number; className?: string }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  const color = score >= 70 ? 'var(--color-primary)' : score >= 40 ? 'var(--color-warning)' : 'var(--color-muted)';
  return (
    <span className={cn('relative inline-grid size-10 place-items-center', className)} title={`AI score ${score} of 100`}>
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="18" cy="18" r={r} fill="none" stroke="var(--color-track)" strokeWidth="3" />
        <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />
      </svg>
      <span className="num text-label-medium text-heading">
        {score}
        <span className="sr-only"> out of 100</span>
      </span>
    </span>
  );
}
