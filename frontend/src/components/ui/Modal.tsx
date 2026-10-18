import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { IconButton } from './IconButton';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** Centred dialog on a blurred backdrop. Escape and the backdrop close it; focus moves into it on open. */
export function Modal({ open, onClose, title, description, children, footer, className }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  // Latest onClose without re-running effects (parents often pass a new function each render).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Runs only when the modal opens: focus the first field once (not on every re-render,
  // which would steal the cursor while typing) and listen for Escape.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    (panel?.querySelector<HTMLElement>('input, textarea, select') ?? panel?.querySelector<HTMLElement>('button'))?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button type="button" aria-label="Close" className="absolute inset-0 bg-heading/30 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={panelRef}
        className={cn('relative flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl animate-fade-up flex-col rounded-card border border-border bg-frame shadow-float', className)}
      >
        <header className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
          <div>
            <h2 id={titleId} className="text-title-large">
              {title}
            </h2>
            {description && <p className="mt-1 text-body-medium text-muted">{description}</p>}
          </div>
          <IconButton label="Close" variant="soft" size="sm" onClick={onClose}>
            <X className="size-4" />
          </IconButton>
        </header>
        <div className="flex-1 overflow-y-auto px-6 pb-2 scrollbar-thin">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-3 border-t border-border px-6 py-4">{footer}</footer>}
      </div>
    </div>
  );
}
