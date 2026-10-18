import { Badge } from '@/components/ui';
import { INTENT_META } from '@/constants/lead-meta';
import type { IntentLevel } from '@/types';

export function IntentBadge({ intent }: { intent: IntentLevel }) {
  const meta = INTENT_META[intent];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
