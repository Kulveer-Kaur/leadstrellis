import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { BrandLogo } from '@/components/layout';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/features/auth/hooks/useAuth';

/** Renders the app only for signed-in users; otherwise sends them to /login and back afterwards. */
export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="grid h-dvh place-items-center bg-frame" aria-busy="true">
        <BrandLogo className="animate-pulse" />
      </div>
    );
  }
  if (status === 'anonymous') return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
