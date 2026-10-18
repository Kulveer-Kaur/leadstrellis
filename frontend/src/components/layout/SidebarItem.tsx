import { NavLink } from 'react-router-dom';
import type { NavItem } from '@/config/navigation';
import { cn } from '@/utils/cn';

interface SidebarItemProps {
  item: NavItem;
  onNavigate?: () => void;
}

export function SidebarItem({ item, onNavigate }: SidebarItemProps) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group flex min-h-14 items-center gap-3.5 rounded-2xl px-4 text-label-large transition-colors',
          isActive ? 'bg-primary text-on-primary shadow-float' : 'text-text hover:bg-surface-2 hover:text-heading',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className="size-6 shrink-0" strokeWidth={1.5} aria-hidden />
          <span className="flex-1">{item.label}</span>
          {item.badge !== undefined && (
            <span
              className={cn(
                'num min-w-6 rounded-full px-1.5 text-center text-label-small',
                isActive ? 'bg-on-primary/15 text-on-primary' : 'bg-primary-soft text-primary',
              )}
            >
              {item.badge}
              <span className="sr-only"> new</span>
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}
