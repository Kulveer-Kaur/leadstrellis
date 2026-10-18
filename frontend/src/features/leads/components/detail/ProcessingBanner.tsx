import { AlertTriangle, Loader2 } from 'lucide-react';
import type { LeadDetail } from '@/types';

/** Shown while the AI is reading the enquiry, or when it failed and needs a re-run. */
export function ProcessingBanner({ lead }: { lead: LeadDetail }) {
  if (lead.processingState === 'PENDING' || lead.processingState === 'PROCESSING') {
    return (
      <div role="status" className="mb-5 flex items-center gap-3 rounded-panel bg-primary-soft px-4 py-3 text-body-medium text-primary">
        <Loader2 className="size-4 animate-spin" aria-hidden /> The AI is reading this enquiry. Requirements, score and matches will appear in a moment.
      </div>
    );
  }
  if (lead.processingState === 'FAILED') {
    return (
      <div role="alert" className="mb-5 flex items-center gap-3 rounded-panel bg-danger-soft px-4 py-3 text-body-medium text-danger">
        <AlertTriangle className="size-4 shrink-0" aria-hidden /> AI processing failed{lead.processingError ? `: ${lead.processingError}` : ''}. Use the refresh button to run it again.
      </div>
    );
  }
  return null;
}
