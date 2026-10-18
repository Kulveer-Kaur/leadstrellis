import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { CardSkeleton } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { ProtectedRoute } from './guards/ProtectedRoute';

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const LeadsPage = lazy(() => import('@/pages/LeadsPage'));
const LeadDetailPage = lazy(() => import('@/pages/LeadDetailPage'));
const PipelinePage = lazy(() => import('@/pages/PipelinePage'));
const PropertiesPage = lazy(() => import('@/pages/PropertiesPage'));
const PropertyDetailPage = lazy(() => import('@/pages/PropertyDetailPage'));
const ViewingsPage = lazy(() => import('@/pages/ViewingsPage'));
const InboxPage = lazy(() => import('@/pages/InboxPage'));
const AgentsPage = lazy(() => import('@/pages/AgentsPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const ProposalPage = lazy(() => import('@/pages/ProposalPage'));
const RespondPage = lazy(() => import('@/pages/RespondPage'));
const SetupAccountPage = lazy(() => import('@/pages/SetupAccountPage'));

const withSuspense = (node: React.ReactNode) => <Suspense fallback={<CardSkeleton className="h-96" />}>{node}</Suspense>;

export const router = createBrowserRouter([
  { path: ROUTES.login, element: withSuspense(<LoginPage />) },
  { path: ROUTES.setupAccount, element: withSuspense(<SetupAccountPage />) },
  // Public: the page a lead opens from the proposal email (no login).
  { path: `${ROUTES.proposal}/:token`, element: withSuspense(<ProposalPage />) },
  { path: `${ROUTES.respond}/:token`, element: withSuspense(<RespondPage />) },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: withSuspense(<DashboardPage />) },
          { path: ROUTES.leads, element: withSuspense(<LeadsPage />) },
          { path: `${ROUTES.leads}/:id`, element: withSuspense(<LeadDetailPage />) },
          { path: ROUTES.pipeline, element: withSuspense(<PipelinePage />) },
          { path: ROUTES.properties, element: withSuspense(<PropertiesPage />) },
          { path: `${ROUTES.properties}/:id`, element: withSuspense(<PropertyDetailPage />) },
          { path: ROUTES.viewings, element: withSuspense(<ViewingsPage />) },
          { path: ROUTES.communications, element: withSuspense(<InboxPage />) },
          { path: ROUTES.automations, element: withSuspense(<AgentsPage />) },
          { path: ROUTES.reports, element: withSuspense(<ReportsPage />) },
          { path: ROUTES.settings, element: withSuspense(<SettingsPage />) },
          { path: '*', element: withSuspense(<NotFoundPage />) },
        ],
      },
    ],
  },
]);
