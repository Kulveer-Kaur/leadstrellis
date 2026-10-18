import { Sparkles } from 'lucide-react';
import { IconButton } from '@/components/ui';
import { useSettings, useUpdateSettings } from '@/features/settings/hooks/useSettings';
import { cn } from '@/utils/cn';

/**
 * Control at the top of the sidebar / topbar:
 * LeadsTrellis pilot switch (filled when on).
 *
 * The pilot runs every 10 minutes to check the pipeline — flipping this off stops
 * all pilot token spend while leaving the per-event agents alone.
 */
export function TopActions({ className }: { className?: string }) {
  const { data, isLoading } = useSettings();
  const update = useUpdateSettings();
  const pilotEnabled = Boolean(data?.settings.pilotEnabled);
  const toggle = () => update.mutate({ pilotEnabled: !pilotEnabled });
  const label = pilotEnabled ? 'LeadsTrellis pilot on (checks every 10 minutes)' : 'LeadsTrellis pilot off';

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <IconButton
        label={label}
        aria-pressed={pilotEnabled}
        variant={pilotEnabled ? 'primary' : 'outline'}
        size="lg"
        onClick={toggle}
        disabled={isLoading || update.isPending}
        title={label}
      >
        <Sparkles className="size-5" strokeWidth={1.75} fill={pilotEnabled ? 'currentColor' : 'none'} />
      </IconButton>
    </div>
  );
}
