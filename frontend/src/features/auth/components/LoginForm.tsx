import { useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { TextField } from '@/components/form';
import { Button } from '@/components/ui';
import { env } from '@/config/env';
import { ApiError } from '@/services/http';
import { useAuth } from '../hooks/useAuth';

interface LoginFormProps {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <TextField label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} required />
      <TextField label="Password" type="password" autoComplete="current-password" value={password} onChange={setPassword} required />
      {error && (
        <p className="rounded-2xl bg-danger-soft px-4 py-3 text-body-medium text-danger" role="alert">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={submitting || !email || !password}
        className="mt-2 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
        trailingIcon={<ArrowRight className="size-4" aria-hidden />}
      >
        {submitting ? 'Signing in…' : 'Sign in'}
      </Button>
      {env.isDev && (
        <p className="text-center text-body-small text-muted">
          Demo admin: <span className="num text-text">admin@leadstrellis.com</span> / <span className="num text-text">Admin@123</span>
        </p>
      )}
    </form>
  );
}
