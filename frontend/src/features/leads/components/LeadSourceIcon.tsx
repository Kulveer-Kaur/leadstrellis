import { Building2, Camera, Globe, Mail, Megaphone, MessageCircle, Phone, Share2, ThumbsUp, UserPen, type LucideIcon } from 'lucide-react';
import { SOURCE_LABEL } from '@/constants/lead-meta';
import type { LeadSource } from '@/types';
import { cn } from '@/utils/cn';

const ICONS: Record<LeadSource, LucideIcon> = {
  WEBSITE: Globe,
  WHATSAPP: MessageCircle,
  INSTAGRAM: Camera,
  EMAIL: Mail,
  MANUAL: UserPen,
  ADS: Megaphone,
  PHONE: Phone,
  GOOGLE_BUSINESS: Building2,
  FACEBOOK: ThumbsUp,
  PROPERTY_PORTAL: Building2,
  REFERRAL: Share2,
};

interface LeadSourceIconProps {
  source: LeadSource;
  withLabel?: boolean;
  className?: string;
}

export function LeadSourceIcon({ source, withLabel, className }: LeadSourceIconProps) {
  const Icon = ICONS[source];
  return (
    <span className={cn('inline-flex items-center gap-2 text-body-medium text-text', className)} title={SOURCE_LABEL[source]}>
      <span className="grid size-8 place-items-center rounded-full bg-surface-2">
        <Icon className="size-4" strokeWidth={1.75} aria-hidden />
      </span>
      {withLabel ? SOURCE_LABEL[source] : <span className="sr-only">{SOURCE_LABEL[source]}</span>}
    </span>
  );
}
