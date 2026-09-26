import React from 'react';
import { CertificateStatus } from '../../types';
import { Check, Clock, AlertCircle, Sparkles, Send, FileCheck } from 'lucide-react';

interface LifecycleTimelineProps {
  status: CertificateStatus;
  approvedAt?: string;
  generatedAt?: string;
  sentAt?: string;
  rejectionReason?: string;
}

interface Step {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

export const LifecycleTimeline: React.FC<LifecycleTimelineProps> = ({
  status,
  approvedAt,
  generatedAt,
  sentAt,
  rejectionReason,
}) => {
  const steps: Step[] = [
    { key: 'IMPORTED', label: 'Data Imported', description: 'Attendance records registered', icon: FileCheck },
    { key: 'ELIGIBILITY', label: 'Eligibility Checked', description: 'Check-in & check-out verified', icon: Check },
    { key: 'PENDING', label: 'Pending Review', description: 'Queued for coordinator approval', icon: Clock },
    { key: 'APPROVED', label: 'Approved', description: approvedAt ? new Date(approvedAt).toLocaleDateString() : 'Awaiting sign-off', icon: Check },
    { key: 'GENERATED', label: 'Certificate Generated', description: generatedAt ? 'PDF Synthesized' : 'Vector rendering', icon: Sparkles },
    { key: 'SENT', label: 'Email Dispatched', description: sentAt ? 'Delivered with attachment' : 'Mail transport queue', icon: Send },
  ];

  // Determine active level (0 to 5)
  const getActiveLevel = (s: CertificateStatus): number => {
    switch (s) {
      case 'REJECTED':
        return 2; // stops at pending/rejected
      case 'PENDING':
        return 2;
      case 'APPROVED':
        return 3;
      case 'GENERATING':
        return 4;
      case 'GENERATED':
      case 'EMAIL_QUEUED':
        return 4;
      case 'SENT':
        return 5;
      case 'FAILED':
        return 4;
      default:
        return 2;
    }
  };

  const currentLevel = getActiveLevel(status);
  const isRejected = status === 'REJECTED';
  const isFailed = status === 'FAILED';

  return (
    <div className="w-full py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 relative">
        {steps.map((step, idx) => {
          const isDone = idx < currentLevel || (idx === currentLevel && status === 'SENT');
          const isCurrent = idx === currentLevel && status !== 'SENT';
          const Icon = step.icon;

          return (
            <div
              key={step.key}
              className={`p-3.5 rounded-xl border transition-all relative overflow-hidden ${
                isCurrent && isRejected
                  ? 'bg-rose-50 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800'
                  : isCurrent && isFailed
                  ? 'bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800'
                  : isCurrent
                  ? 'bg-purple-50/80 border-purple-400 dark:bg-purple-950/40 dark:border-purple-600 shadow-sm'
                  : isDone
                  ? 'bg-white/80 border-emerald-300/80 dark:bg-slate-900/80 dark:border-emerald-700/60'
                  : 'bg-slate-50/60 border-slate-200 text-slate-400 dark:bg-slate-900/30 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold ${
                    isCurrent && isRejected
                      ? 'bg-rose-600 text-white'
                      : isCurrent && isFailed
                      ? 'bg-amber-600 text-white'
                      : isCurrent
                      ? 'bg-purple-600 text-white animate-pulse'
                      : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {isCurrent && isRejected ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : isDone ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  0{idx + 1}
                </span>
              </div>
              <p
                className={`text-xs font-bold ${
                  isCurrent
                    ? 'text-purple-900 dark:text-purple-200'
                    : isDone
                    ? 'text-slate-800 dark:text-slate-200'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {step.label}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>

      {isRejected && rejectionReason && (
        <div className="mt-3 p-3 bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Rejection reason:</span> {rejectionReason}
          </div>
        </div>
      )}
    </div>
  );
};
