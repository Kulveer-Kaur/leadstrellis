import { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface NoticeProps {
  message: string | null;
  onDismiss: () => void;
  autoHideMs?: number;
}

/** Floating success message (bottom centre), auto-dismissed. */
export function Notice({ message, onDismiss, autoHideMs = 6000 }: NoticeProps) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, autoHideMs);
    return () => clearTimeout(t);
  }, [message, onDismiss, autoHideMs]);

  if (!message) return null;
  return (
    <div role="status" className="fixed bottom-6 left-1/2 z-50 flex w-[min(92vw,30rem)] -translate-x-1/2 animate-fade-up items-center gap-3 rounded-2xl bg-heading px-4 py-3 text-body-medium text-on-primary shadow-float">
      <CheckCircle2 className="size-5 shrink-0" aria-hidden />
      <span className="flex-1">{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className="cursor-pointer rounded-full p-1 hover:bg-white/10">
        <X className="size-4" />
      </button>
    </div>
  );
}
