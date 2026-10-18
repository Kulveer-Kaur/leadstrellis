import { NAV_ITEMS } from '@/config/navigation';
import { cn } from '@/utils/cn';
import { AgentStatusPill } from './AgentStatusPill';
import { SidebarItem } from './SidebarItem';
import { TopActions } from './TopActions';

interface SidebarProps {
  onNavigate?: () => void;
  /** Show the notification / autopilot controls (used in the mobile drawer). */
  withActions?: boolean;
  className?: string;
}

export function Sidebar({ onNavigate, withActions, className }: SidebarProps) {
  return (
    <aside className={cn('flex w-60 shrink-0 flex-col min-h-0 h-full px-4 pt-4 pb-6 overflow-hidden', className)}>
      {withActions && <TopActions className="mb-6 px-2" />}
      <nav aria-label="Main" className="flex flex-1 flex-col gap-1.5 overflow-y-auto scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {NAV_ITEMS.map((item) => (
          <SidebarItem key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </nav>
      <div className="mt-auto pt-4 shrink-0">
        <AgentStatusPill />
      </div>
    </aside>
  );
}
