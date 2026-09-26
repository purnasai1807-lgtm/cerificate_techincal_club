import React, { useState } from 'react';
import {
  Send,
  CheckCircle,
  Search,
  Sparkles,
  Award,
  AlertCircle,
  ExternalLink,
  Clock,
  ArrowRight,
  ShieldCheck,
  RotateCw,
  Mail,
} from 'lucide-react';
import { certificatesService } from '../../api/certificates';
import { Participant, Certificate } from '../../types';
import { Badge } from './Badge';
import { useNotifications } from '../../context/NotificationContext';
import confetti from 'canvas-confetti';
import { Link } from 'react-router-dom';

interface QuickApproveWidgetProps {
  onSuccess?: () => void;
  compact?: boolean;
}

export const QuickApproveWidget: React.FC<QuickApproveWidgetProps> = ({ onSuccess, compact = false }) => {
  const { showToast } = useNotifications();
  const [identifierInput, setIdentifierInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [overrideIneligibility, setOverrideIneligibility] = useState(true);

  // Result state
  const [previewResult, setPreviewResult] = useState<{
    participant: Participant | null;
    certificate: Certificate | null;
  } | null>(null);

  const [dispatchedResult, setDispatchedResult] = useState<{
    participant: Participant;
    certificate: Certificate;
    sentToEmail: string;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<string | null>(null);

  // Quick lookup as admin types or presses Lookup
  const handleLookup = async (idToLookUp?: string) => {
    const val = (idToLookUp !== undefined ? idToLookUp : identifierInput).trim();
    if (!val) return;

    setErrorMessage(null);
    setDispatchedResult(null);

    const res = await certificatesService.findByIdentifier(val);
    if (res.success && res.data.participant) {
      setPreviewResult(res.data);
    } else {
      setPreviewResult(null);
      setErrorMessage(res.error || `No participant found with Roll Number or Email "${val}".`);
    }
  };

  const handleExecuteApproval = async (idToApprove?: string) => {
    const val = (idToApprove !== undefined ? idToApprove : identifierInput).trim();
    if (!val) {
      setErrorMessage('Please enter a Roll Number or Email ID.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      setActiveStep('APPROVING');
      await new Promise((r) => setTimeout(r, 400));

      setActiveStep('GENERATING');
      await new Promise((r) => setTimeout(r, 500));

      setActiveStep('SENDING_EMAIL');
      const res = await certificatesService.approveAndDispatchByIdentifier(val, overrideIneligibility);

      if (res.success && res.data) {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        setDispatchedResult(res.data);
        setPreviewResult(null);
        showToast(
          'success',
          'Certificate Emailed',
          `Personalized certificate sent to ${res.data.sentToEmail}`
        );
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(res.error || 'Failed to approve and send certificate.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Error processing certificate.');
    } finally {
      setIsProcessing(false);
      setActiveStep(null);
    }
  };

  const handleChipClick = (id: string) => {
    setIdentifierInput(id);
    handleLookup(id);
  };

  return (
    <div
      className={`rounded-3xl border transition-all ${
        compact
          ? 'p-4 bg-white dark:bg-slate-900 border-purple-200 dark:border-purple-800/80 shadow-md'
          : 'p-6 sm:p-7 bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/20 dark:from-slate-900 dark:via-purple-950/20 dark:to-slate-900 border-purple-300 dark:border-purple-800 shadow-xl'
      }`}
    >
      {/* Title & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/25">
            <Send className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
              Instant Approval & Email Dispatch by Roll No / Email
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter an attendee's Roll Number or Email to immediately approve, generate, and email their certificate.
            </p>
          </div>
        </div>

        <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 self-start sm:self-auto">
          One-Click Delivery
        </span>
      </div>

      {/* Input & Action Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={identifierInput}
              onChange={(e) => {
                setIdentifierInput(e.target.value);
                setErrorMessage(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleExecuteApproval();
                }
              }}
              placeholder="Enter a real Roll Number or Email"
              className="w-full pl-10 pr-24 py-3 rounded-2xl text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-inner"
            />
            {identifierInput && (
              <button
                type="button"
                onClick={() => handleLookup()}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-lg transition-colors"
              >
                Look Up
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleExecuteApproval()}
            disabled={isProcessing || !identifierInput.trim()}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>
                  {activeStep === 'APPROVING'
                    ? 'Approving...'
                    : activeStep === 'GENERATING'
                    ? 'Generating PDF...'
                    : 'Dispatching Email...'}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Approve & Send to Email</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{errorMessage}</p>
            <p className="text-[11px] opacity-80 mt-0.5">
              Verify that the roll number matches your attendance file records.
            </p>
          </div>
        </div>
      )}

      {/* Lookup Preview Card */}
      {previewResult && previewResult.participant && !dispatchedResult && (
        <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-purple-200 dark:border-purple-800 shadow-sm animate-in fade-in space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-purple-600 dark:text-purple-400">
              Matched Attendee Record
            </span>
            <Badge status={previewResult.participant.eligibility} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-400 text-[11px]">Full Name</span>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                {previewResult.participant.name}
              </p>
            </div>
            <div>
              <span className="text-slate-400 text-[11px]">Registered Email</span>
              <p className="font-mono text-purple-600 dark:text-purple-400 mt-0.5 font-medium">
                {previewResult.participant.email}
              </p>
            </div>
            <div>
              <span className="text-slate-400 text-[11px]">Roll No / Student ID</span>
              <p className="font-mono font-medium mt-0.5">
                {previewResult.participant.rollNumber} • {previewResult.participant.studentId}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span>Check-in: {previewResult.participant.checkIn || 'None'}</span>
              <span>•</span>
              <span>Check-out: {previewResult.participant.checkOut || 'None'}</span>
            </div>

            <button
              type="button"
              onClick={() => handleExecuteApproval(previewResult.participant!.rollNumber)}
              disabled={isProcessing}
              className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-colors"
            >
              <span>Confirm & Dispatch Email</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Dispatched Success Card */}
      {dispatchedResult && (
        <div className="mt-4 p-5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 shadow-sm animate-in fade-in space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-sm">
                  Certificate Successfully Approved & Sent to Student Email!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                  Delivered personalized PDF certificate to{' '}
                  <span className="font-mono font-bold underline">{dispatchedResult.sentToEmail}</span>.
                </p>
              </div>
            </div>

            <Badge status="SENT" />
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-900/60 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase">Recipient</span>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {dispatchedResult.participant.name}
              </p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase">Certificate ID</span>
              <p className="font-mono font-bold text-purple-600 dark:text-purple-400">
                {dispatchedResult.certificate.certificateId}
              </p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase">Delivery Status</span>
              <p className="font-medium text-emerald-600 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                <span>SMTP Delivered</span>
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <a
                href={`/verify/${dispatchedResult.certificate.certificateId}`}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <span>View Public Verification Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <Link
                to={`/admin/certificates/${dispatchedResult.certificate.id}`}
                className="text-slate-600 dark:text-slate-400 hover:underline"
              >
                View Certificate Review Details →
              </Link>
            </div>

            <button
              type="button"
              onClick={() => {
                setDispatchedResult(null);
                setIdentifierInput('');
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
            >
              Approve Another Participant
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
