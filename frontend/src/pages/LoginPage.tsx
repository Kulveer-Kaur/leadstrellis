import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BrandLogo } from '@/components/layout';
import { Card } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function LoginPage() {
  const { status } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? ROUTES.dashboard;

  if (status === 'authenticated') return <Navigate to={from} replace />;

  return (
    <main className="grid h-full w-full place-items-center bg-frame px-4 py-10 overflow-y-auto">
      <div className="w-full max-w-md">
        <BrandLogo className="mx-auto mb-8 flex w-fit" />
        <Card className="p-6! sm:p-8!">
          <h1 className="text-headline-small">Welcome back</h1>
          <p className="mt-1 mb-6 text-body-medium text-muted">Sign in to your AI-powered lead dashboard.</p>
          <LoginForm onSuccess={() => navigate(from, { replace: true })} />
        </Card>
      </div>
    </main>
  );
}
