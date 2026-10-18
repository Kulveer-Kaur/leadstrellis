import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BrandLogo } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import * as authApi from '@/features/auth/api/auth.api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { CheckCircle2, AlertCircle, Lock, ShieldCheck } from 'lucide-react';

export default function SetupAccountPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [invitee, setInvitee] = useState<{ name: string; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invitation link is missing or invalid.');
      setIsLoading(false);
      return;
    }

    authApi
      .verifyInvite(token)
      .then((data) => {
        setInvitee(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || err?.message || 'Invalid or expired invitation link.');
        setIsLoading(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    if (!token) return;

    setIsSubmitting(true);
    try {
      const res = await authApi.acceptInvite(token, password);
      setSuccess(true);
      setTimeout(() => {
        setSession(res.token, res.user);
        navigate(ROUTES.dashboard, { replace: true });
      }, 1500);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || 'Failed to set password. Link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid h-full w-full place-items-center bg-frame px-4 py-10 overflow-y-auto">
      <div className="w-full max-w-md">
        <BrandLogo className="mx-auto mb-8 flex w-fit" />

        <Card className="p-6! sm:p-8!">
          {isLoading ? (
            <div className="py-12 text-center text-muted">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-body-medium">Verifying invitation...</p>
            </div>
          ) : error ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h1 className="text-headline-small text-foreground">Invitation Invalid</h1>
              <p className="mt-2 text-body-medium text-muted">{error}</p>
              <div className="mt-6">
                <Link to={ROUTES.login}>
                  <Button variant="outline" className="w-full">
                    Return to Login
                  </Button>
                </Link>
              </div>
            </div>
          ) : success ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h1 className="text-headline-small text-foreground">Account Activated!</h1>
              <p className="mt-2 text-body-medium text-muted">
                Your password has been set. Redirecting you to your agent dashboard...
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h1 className="text-headline-small">Welcome, {invitee?.name || 'Agent'}</h1>
                <p className="mt-1 text-body-medium text-muted">
                  Set a password for <strong className="text-foreground">{invitee?.email}</strong> to activate your agent
                  account and access assigned leads.
                </p>
              </div>

              {formError && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-body-small text-red-500">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-label-medium font-medium text-foreground">Create Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                      required
                      autoFocus
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-body-medium pl-9 text-foreground focus:outline-none focus:border-primary"
                    />
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-label-medium font-medium text-foreground">Confirm Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-body-medium pl-9 text-foreground focus:outline-none focus:border-primary"
                    />
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
                  </div>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full mt-2">
                  {isSubmitting ? 'Activating Account...' : 'Set Password & Enter'}
                </Button>
              </form>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
