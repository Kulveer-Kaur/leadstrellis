import { ArrowLeft, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, IconButton } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { LeadDetail } from '@/types';
import { formatRelative } from '@/utils/format';
import { useDeleteLead, useReprocessLead } from '../../hooks/useLeadMutations';
import { IntentBadge } from '../IntentBadge';
import { LeadSourceIcon } from '../LeadSourceIcon';
import { AssigneeSelect } from './AssigneeSelect';
import { StatusSelect } from './StatusSelect';

export function LeadHeader({ lead, onEdit }: { lead: LeadDetail; onEdit: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const reprocess = useReprocessLead(lead.id);
  const remove = useDeleteLead();

  const onDelete = () => {
    if (!window.confirm(`Delete ${lead.fullName} (${lead.code})? This removes their messages, matches and viewings too.`)) return;
    remove.mutate(lead.id, { onSuccess: () => navigate(ROUTES.leads, { replace: true }) });
  };

  return (
    <header className="mb-6">
      <Link to={ROUTES.leads} className="mb-3 inline-flex items-center gap-1.5 text-label-large text-muted hover:text-heading">
        <ArrowLeft className="size-4" aria-hidden /> All leads
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={lead.fullName} size="lg" />
          <div className="min-w-0">
            <h1 className="truncate text-title-large sm:text-headline-small">{lead.fullName}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-body-medium text-muted">
              <span className="num">{lead.code}</span>
              <span aria-hidden>·</span>
              <LeadSourceIcon source={lead.source} withLabel />
              <span aria-hidden>·</span>
              <span>Added {formatRelative(lead.createdAt)}</span>
              {lead.intentLevel && <IntentBadge intent={lead.intentLevel} />}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusSelect leadId={lead.id} status={lead.status} />
          <AssigneeSelect leadId={lead.id} assignedToId={lead.assignedToId} />
          <IconButton label="Edit lead" variant="outline" onClick={onEdit}>
            <Pencil className="size-4" />
          </IconButton>
          <IconButton label="Re-run AI analysis" variant="outline" onClick={() => reprocess.mutate()} disabled={reprocess.isPending}>
            <RefreshCw className={`size-4 ${reprocess.isPending ? 'animate-spin' : ''}`} />
          </IconButton>
          {user?.role === 'ADMIN' && (
            <IconButton label="Delete lead" variant="outline" onClick={onDelete} disabled={remove.isPending} className="text-danger">
              <Trash2 className="size-4" />
            </IconButton>
          )}
        </div>
      </div>
    </header>
  );
}
