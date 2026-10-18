import { cn } from '@/utils/cn';

/**
 * LeadsTrellis Minimal Brand Logo:
 * A clean, modern 6-stroke architectural diamond trellis lattice mark
 * with rounded caps in deep primary green, paired with refined typography.
 */
export function BrandLogo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-3 whitespace-nowrap text-primary', className)}>
      <svg
        viewBox="0 0 48 48"
        className="size-10 shrink-0 sm:size-11"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        aria-hidden
      >
        {/* Minimal Trellis Lattice - Diagonal Axis 1 (SW to NE) */}
        <line x1="8" y1="26" x2="26" y2="8" />
        <line x1="7" y1="41" x2="41" y2="7" strokeWidth="3.4" />
        <line x1="22" y1="40" x2="40" y2="22" />

        {/* Minimal Trellis Lattice - Diagonal Axis 2 (NW to SE) */}
        <line x1="22" y1="8" x2="40" y2="26" />
        <line x1="7" y1="7" x2="41" y2="41" strokeWidth="3.4" />
        <line x1="8" y1="22" x2="26" y2="40" />
      </svg>
      {!compact && (
        <span className="flex flex-col items-center text-center">
          <span className="font-serif text-[1.875rem] leading-8 font-semibold tracking-[0.06em] text-primary">
            LeadsTrellis
          </span>
          {/* Trailing tracking is offset with a matching right margin so the line stays centred */}
          <span className="-mr-[0.32em] text-label-medium tracking-[0.32em] text-primary">AI</span>
        </span>
      )}
      <span className="sr-only">LeadsTrellis AI</span>
    </span>
  );
}
