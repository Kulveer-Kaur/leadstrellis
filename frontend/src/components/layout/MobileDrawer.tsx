import { useEffect } from 'react';
import { X } from 'lucide-react';
import { IconButton } from '@/components/ui';
import { Sidebar } from './Sidebar';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

/** Off-canvas sidebar below the lg breakpoint. */
export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
      <button type="button" aria-label="Close menu" className="absolute inset-0 bg-heading/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative h-full w-fit animate-fade-up bg-frame shadow-float">
        <IconButton label="Close menu" variant="soft" size="sm" className="absolute top-4 right-4 z-10" onClick={onClose}>
          <X className="size-4" />
        </IconButton>
        <Sidebar onNavigate={onClose} withActions className="h-dvh pt-7" />
      </div>
    </div>
  );
}
