import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { LeadScore, LeadStatus, LeadSource, LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS } from '@/types';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

const variants: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-sky-100 text-sky-700',
  purple: 'bg-purple-100 text-purple-700',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function LeadScoreBadge({ score }: { score: LeadScore | null | undefined }) {
  if (!score) return <span className="text-xs text-gray-400">—</span>;

  const config: Record<LeadScore, { variant: BadgeVariant; dot: string; label: string }> = {
    HOT: { variant: 'danger', dot: 'bg-red-500', label: '🔥 Hot' },
    WARM: { variant: 'warning', dot: 'bg-amber-500', label: '🌤 Warm' },
    COLD: { variant: 'info', dot: 'bg-sky-500', label: '❄️ Cold' },
  };

  const { variant, label } = config[score];
  return <Badge variant={variant}>{label}</Badge>;
}

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const config: Record<LeadStatus, BadgeVariant> = {
    NEW: 'default',
    CONTACTED: 'info',
    QUALIFIED: 'purple',
    PROPOSAL: 'warning',
    WON: 'success',
    LOST: 'danger',
  };
  return <Badge variant={config[status]}>{LEAD_STATUS_LABELS[status]}</Badge>;
}

export function LeadSourceBadge({ source }: { source: LeadSource }) {
  return <Badge variant="default">{LEAD_SOURCE_LABELS[source]}</Badge>;
}
