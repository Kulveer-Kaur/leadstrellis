import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useLiveUpdates } from '@/hooks/useLiveUpdates';
import { MobileDrawer } from './MobileDrawer';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

/** Full-screen app shell: fixed header, fixed sidebar, scrolling page area. */
export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  useLiveUpdates();

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-frame">
      <Topbar onOpenMenu={() => setMenuOpen(true)} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar className="hidden border-r border-border lg:flex" />
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pt-2 pb-8 scrollbar-thin sm:px-8">
          <Outlet />
        </main>
      </div>
      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
