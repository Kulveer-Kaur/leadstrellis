import {
  Building2,
  CalendarDays,
  Columns3,
  LayoutDashboard,
  MessagesSquare,
  PieChart,
  Settings,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: number;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: ROUTES.dashboard, icon: LayoutDashboard },
  { label: 'Leads', to: ROUTES.leads, icon: Users },
  { label: 'Pipeline', to: ROUTES.pipeline, icon: Columns3 },
  { label: 'Properties', to: ROUTES.properties, icon: Building2 },
  { label: 'Viewings', to: ROUTES.viewings, icon: CalendarDays },
  { label: 'Inbox', to: ROUTES.communications, icon: MessagesSquare },
  { label: 'Automations', to: ROUTES.automations, icon: Workflow },
  { label: 'Reports', to: ROUTES.reports, icon: PieChart },
  { label: 'Settings', to: ROUTES.settings, icon: Settings },
];
