import { Menu } from 'lucide-react';
import { IconButton } from '@/components/ui';
import { BrandLogo } from './BrandLogo';
import { TopActions } from './TopActions';
import { UserMenu } from './UserMenu';

interface TopbarProps {
  onOpenMenu: () => void;
}

/** Full-width header; the logo is centred on the screen, not on the content area. */
export function Topbar({ onOpenMenu }: TopbarProps) {
  return (
    <header className="relative flex min-h-20 shrink-0 items-center justify-between lg:min-h-28">
      <div className="flex items-center self-stretch px-4 sm:px-8 lg:w-60 lg:border-r lg:border-border lg:px-6">
        <IconButton label="Open menu" variant="soft" className="lg:hidden" onClick={onOpenMenu}>
          <Menu className="size-5" />
        </IconButton>
        <TopActions className="hidden lg:flex" />
      </div>

      <BrandLogo className="absolute top-1/2 left-1/2 -translate-1/2" />

      <div className="px-4 sm:px-8">
        <UserMenu />
      </div>
    </header>
  );
}
