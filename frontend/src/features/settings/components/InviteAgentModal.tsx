import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Modal } from '@/components/ui';
import { inviteAgent } from '@/features/leads/api/leads.api';
import { queryKeys } from '@/services/query-keys';
import { CheckCircle2, Copy, Check, Mail, User } from 'lucide-react';

interface InviteAgentModalProps {
  open: boolean;
  onClose: () => void;
}

export function InviteAgentModal({ open, onClose }: InviteAgentModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<{ inviteUrl: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const resetState = () => {
    setName('');
    setEmail('');
    setError(null);
    setInviteResult(null);
    setCopied(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim()) {
      setError('Please provide both name and email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await inviteAgent({ name: name.trim(), email: email.trim().toLowerCase() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.users });
      setInviteResult({ inviteUrl: res.inviteUrl, email: res.email });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!inviteResult?.inviteUrl) return;
    navigator.clipboard.writeText(inviteResult.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={inviteResult ? 'Invitation Sent' : 'Invite New Agent'}
      description={
        inviteResult
          ? `An invitation email has been sent to ${inviteResult.email}.`
          : 'Invited agents will receive an email with a link to set their password and access assigned leads.'
      }
    >
      {inviteResult ? (
        <div className="py-2 space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 p-4 text-emerald-500">
            <CheckCircle2 className="h-6 w-6 shrink-0" />
            <p className="text-body-medium">
              Agent account created! They can click the link in their email or you can share the link directly.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-label-medium text-heading">Setup Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteResult.inviteUrl}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-body-small text-muted font-mono select-all"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleCopy}
                className="shrink-0 gap-1.5 px-3 py-1.5 min-h-0 text-body-small"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button onClick={handleClose}>Done</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="rounded-lg bg-red-500/10 p-3 text-body-small text-red-500">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-label-medium text-heading">Agent Full Name</label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Sarah Jenkins"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-body-medium pl-9 text-foreground focus:outline-none focus:border-primary"
              />
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-label-medium text-heading">Email Address</label>
            <div className="relative">
              <input
                type="email"
                placeholder="agent@company.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-body-medium pl-9 text-foreground focus:outline-none focus:border-primary"
              />
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending Invite...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
