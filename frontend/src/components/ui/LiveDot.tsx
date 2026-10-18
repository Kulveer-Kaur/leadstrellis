import { cn } from '@/utils/cn';

/** Pulsing dot that signals the AI is running in real time. */
export function LiveDot({ className }: { className?: string }) {
  return <span className={cn('inline-block size-2 animate-pulse-ring rounded-full bg-success', className)} aria-hidden />;
}
