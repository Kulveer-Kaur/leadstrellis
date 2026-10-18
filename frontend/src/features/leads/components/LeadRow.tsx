import { Loader2, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui';
import { leadPath } from '@/constants/routes';
import type { LeadSummary } from '@/types';
import { formatAedCompact, formatRelative } from '@/utils/format';
import { describeNeed } from '../utils/describe-need';
import { LeadScore } from './LeadScore';
import { LeadSourceIcon } from './LeadSourceIcon';
import { LeadStatusBadge } from './LeadStatusBadge';

/** One lead in a table. The whole row opens the lead; the name is the keyboard-reachable link. */
export function LeadRow({ lead }: { lead: LeadSummary }) {
  const navigate = useNavigate();
  const r = lead.requirement;
  return (
    <tr onClick={() => navigate(leadPath(lead.id))} className="cursor-pointer border-t border-border transition-colors hover:bg-surface-2/60">
      <td className="py-3 pr-4 pl-1">
        <div className="flex items-center gap-3">
          <Avatar name={lead.fullName} />
          <div className="min-w-0">
            <Link to={leadPath(lead.id)} onClick={(e) => e.stopPropagation()} className="block truncate text-body-medium font-medium text-heading hover:text-primary">
              {lead.fullName}
            </Link>
            <p className="num text-body-small whitespace-nowrap text-muted">
              {lead.code} · {formatRelative(lead.createdAt)}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <LeadSourceIcon source={lead.source} />
      </td>
      <td className="px-4 py-3">
        {r ? (
          <>
            <p className="text-body-medium whitespace-nowrap text-heading" title={r.summary ?? undefined}>
              {describeNeed(r)}
            </p>
            <p className="num text-body-small text-muted">{r.budgetMaxAed ? `Up to ${formatAedCompact(r.budgetMaxAed)}` : 'Budget not given yet'}</p>
          </>
        ) : (
          <p className="text-body-medium text-muted">Waiting for AI…</p>
        )}
      </td>
      <td className="px-4 py-3">
        <LeadScore score={lead.score} />
      </td>
      <td className="px-4 py-3">
        <LeadStatusBadge status={lead.status} />
      </td>
      <td className="py-3 pr-1 pl-4">
        <span className="inline-flex max-w-44 items-start gap-1.5 text-body-medium text-text">
          {lead.processingState === 'PENDING' || lead.processingState === 'PROCESSING' ? (
            <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-primary" aria-hidden />
          ) : (
            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
          )}
          {lead.nextAction}
        </span>
      </td>
    </tr>
  );
}
