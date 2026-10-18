import { useCallback, useRef, useState } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useClickOutside } from '@/hooks/useClickOutside';
import { cn } from '@/utils/cn';

/** Signed-in user with a small menu (role + sign out). */
export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);
  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-3 rounded-full p-1 pr-2 text-left transition-colors hover:bg-surface-2"
        aria-label={`Account menu for ${user.name}`}
      >
        <Avatar name={user.name} src={user.avatarUrl ?? undefined} size="md" className="sm:size-14" />
        <span className="hidden min-w-0 flex-col md:flex">
          <span className="truncate text-body-large text-heading">{user.name}</span>
          <span className="truncate text-body-small text-muted">{user.email}</span>
        </span>
        <ChevronDown className={cn('ml-2 hidden size-5 text-heading transition-transform md:block', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <div role="menu" className="absolute top-full right-0 z-50 mt-2 w-60 animate-fade-up rounded-2xl border border-border bg-surface p-1.5 shadow-float">
          <div className="px-3.5 py-2.5">
            <p className="truncate text-label-large text-heading">{user.name}</p>
            <p className="text-body-small text-muted">{user.role === 'ADMIN' ? 'Administrator' : 'Agent'}</p>
          </div>
          <hr className="my-1 border-border" />
          <button
            type="button"
            role="menuitem"
            onClick={() => void logout()}
            className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl px-3.5 text-label-large text-heading hover:bg-surface-2"
          >
            <LogOut className="size-4" aria-hidden /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
