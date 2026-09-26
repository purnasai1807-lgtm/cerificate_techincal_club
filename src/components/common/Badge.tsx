import React from 'react';
import { CertificateStatus, EligibilityStatus } from '../../types';

interface BadgeProps {
  status?: CertificateStatus | EligibilityStatus | 'VALID' | 'WARNING' | 'ERROR' | 'QUEUED' | string;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status = 'VALID', size = 'sm', className = '' }) => {
  const norm = status.toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

  if (norm === 'ELIGIBLE' || norm === 'VALID' || norm === 'SENT' || norm === 'SUCCESS') {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
  } else if (norm === 'NOT_ELIGIBLE' || norm === 'NOT ELIGIBLE' || norm === 'REJECTED' || norm === 'ERROR' || norm === 'FAILED') {
    styles = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800';
  } else if (norm === 'PENDING' || norm === 'WARNING' || norm === 'QUEUED' || norm === 'EMAIL_QUEUED') {
    styles = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
  } else if (norm === 'APPROVED') {
    styles = 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800';
  } else if (norm === 'GENERATING') {
    styles = 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800 animate-pulse';
  } else if (norm === 'GENERATED') {
    styles = 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border uppercase tracking-wider ${padding} ${styles} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 fill-current bg-current opacity-75" />
      {norm.replace('_', ' ')}
    </span>
  );
};
