import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Award,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Sparkles,
  Send,
  Download,
  Mail,
  Calendar,
  Clock,
  ExternalLink,
  ShieldCheck,
  User,
  RotateCw,
} from 'lucide-react';
import { Certificate, CertificateTemplate } from '../../types';
import { certificatesService } from '../../api/certificates';
import { templatesService } from '../../api/templates';
import { Badge } from '../../components/common/Badge';
import { LifecycleTimeline } from '../../components/common/LifecycleTimeline';
import { CertificatePreviewCanvas } from '../../components/common/CertificatePreviewCanvas';
import { Modal } from '../../components/common/Modal';
import { useNotifications } from '../../context/NotificationContext';
import { downloadSingleCertificatePdf } from '../../utils/pdfGenerator';
import confetti from 'canvas-confetti';

export const CertificateDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useNotifications();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    const res = await certificatesService.getCertificateById(id);
    if (res.success && res.data) {
      setCert(res.data);
      const tpls = await templatesService.getTemplates();
      if (tpls.success && tpls.data) setTemplate(tpls.data.find((t) => t.id === res.data!.templateId) || null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleApprove = async () => {
    if (!cert) return;
    setIsActionLoading(true);
    try {
      const res = await certificatesService.approveCertificate(cert.id);
      if (res.success) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
        showToast('success', 'Certificate Approved', 'Authorized for vector synthesis.');
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!cert) return;
    setIsActionLoading(true);
    try {
      const res = await certificatesService.rejectCertificate(cert.id, rejectionReason);
      if (res.success) {
        showToast('warning', 'Certificate Rejected', 'Certificate marked as rejected.');
        setRejectModalOpen(false);
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!cert) return;
    setIsActionLoading(true);
    try {
      const res = await certificatesService.generateCertificate(cert.id);
      if (res.success) {
        showToast('success', 'PDF Synthesized', 'Personalized certificate generated.');
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!cert) return;
    setIsActionLoading(true);
    try {
      const res = await certificatesService.sendCertificate(cert.id);
      if (res.success) {
        showToast('success', 'Email Dispatched', `Certificate sent to ${cert.participantEmail}`);
      } else {
        const errText = typeof res.error === 'object' ? res.error?.message : (res.error || 'Failed to dispatch email.');
        showToast('error', 'Delivery Failed', errText);
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading || !cert) {
    return (
      <div className="p-16 text-center text-xs text-slate-400">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p>Loading certificate review record...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/certificates"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                {cert.participantName}
              </h1>
              <Badge status={cert.status} />
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {cert.certificateId} • {cert.participantRollNumber}
            </p>
          </div>
        </div>

        {/* Action Buttons Header */}
        <div className="flex items-center gap-2 flex-wrap">
          {cert.status === 'PENDING' && (
            <>
              <button
                onClick={() => setRejectModalOpen(true)}
                disabled={isActionLoading}
                className="px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors"
              >
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={isActionLoading}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/25 transition-all flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Approve Certificate</span>
              </button>
            </>
          )}

          {cert.status === 'APPROVED' && (
            <button
              onClick={handleGenerate}
              disabled={isActionLoading}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/25 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Certificate</span>
            </button>
          )}

          {cert.status === 'GENERATING' && (
            <div className="px-4 py-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-semibold flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <span>Synthesizing Vector PDF...</span>
            </div>
          )}

          {(cert.status === 'APPROVED' || cert.status === 'GENERATED' || cert.status === 'SENT' || cert.status === 'EMAIL_QUEUED') && (
            <button
              onClick={() => {
                downloadSingleCertificatePdf(cert);
                showToast('success', 'Certificate Downloaded', `PDF saved for ${cert.participantName}`);
              }}
              className="px-4 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors flex items-center gap-1.5 shadow-sm"
              title="Download high-resolution vector PDF certificate"
            >
              <Download className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Download PDF Certificate</span>
            </button>
          )}

          {(cert.status === 'GENERATED' || cert.status === 'EMAIL_QUEUED') && (
            <button
              onClick={handleSendEmail}
              disabled={isActionLoading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Certificate Email</span>
            </button>
          )}

          {cert.status === 'SENT' && (
            <div className="flex items-center gap-2">
              <Link
                to="/admin/emails"
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-purple-600" />
                <span>View Email Status</span>
              </Link>
              <a
                href={`/verify/${cert.certificateId}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <span>Public Verification</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {cert.status === 'FAILED' && (
            <button
              onClick={handleGenerate}
              disabled={isActionLoading}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Retry Generation</span>
            </button>
          )}
        </div>
      </div>

      {/* Lifecycle Status Timeline */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
          Certificate Lifecycle Progress
        </h3>
        <LifecycleTimeline
          status={cert.status}
          approvedAt={cert.approvedAt}
          generatedAt={cert.generatedAt}
          sentAt={cert.sentAt}
          rejectionReason={cert.rejectionReason}
        />
      </div>

      {/* Main Grid: Certificate Visual Canvas (Left) & Participant Details (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Visual Certificate Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-slate-100 dark:bg-slate-950/80 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-inner">
            {template && (
              <CertificatePreviewCanvas
                template={template}
                sampleData={{
                  name: cert.participantName,
                  email: cert.participantEmail,
                  studentId: cert.participantStudentId,
                  rollNumber: cert.participantRollNumber,
                  eventName: cert.eventName,
                  date: cert.issueDate,
                  certificateId: cert.certificateId,
                }}
              />
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 px-2">
            <span>Dynamic substitution: {cert.participantName} inserted at &#123;&#123;NAME&#125;&#125;</span>
            <span className="font-mono">SHA-256 Vector Signed</span>
          </div>
        </div>

        {/* Participant & Credential Info Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3 text-slate-400">
              <User className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Participant Information</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Full Name</span>
                <span className="font-bold text-slate-900 dark:text-white">{cert.participantName}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Registered Email</span>
                <span className="font-mono text-purple-600 dark:text-purple-400">
                  {cert.participantEmail}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Roll Number</span>
                <span className="font-mono font-medium">{cert.participantRollNumber}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Student ID</span>
                <span className="font-mono text-slate-500">{cert.participantStudentId}</span>
              </div>
            </div>
          </div>

          {/* Attendance Breakdown */}
          <div>
            <div className="flex items-center gap-2 mb-3 text-slate-400">
              <Clock className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Attendance Verification</h3>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Check-in Timestamp</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{cert.checkIn || 'Not logged'}</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Check-out Timestamp</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{cert.checkOut || 'Not logged'}</span>
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  Eligibility Decision
                </span>
                <Badge status="ELIGIBLE" />
              </div>
            </div>
          </div>

          {/* Certificate Specifications */}
          <div>
            <div className="flex items-center gap-2 mb-3 text-slate-400">
              <Award className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Credential Metadata</h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Certificate ID</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {cert.certificateId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Template Used</span>
                <span className="text-slate-700 dark:text-slate-300">{cert.templateName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Event Title</span>
                <span className="text-slate-700 dark:text-slate-300 max-w-[200px] text-right truncate">
                  {cert.eventName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Issue Date</span>
                <span>{cert.issueDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* REJECTION MODAL */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Certificate Request"
        subtitle="Participant credential cancellation"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
          <p>
            You are rejecting the certificate for{' '}
            <span className="font-bold text-slate-900 dark:text-white">{cert.participantName}</span>.
          </p>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Rejection Reason
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Failure to satisfy 100% physical presence requirement."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Reject Certificate
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
