import { Card } from './Card';
import { Skeleton } from './Skeleton';
import { cn } from '@/utils/cn';

/** Placeholder while a dashboard card's data loads. */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('flex flex-col gap-4', className)} aria-busy="true" aria-label="Loading">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="min-h-24 flex-1" />
    </Card>
  );
}
