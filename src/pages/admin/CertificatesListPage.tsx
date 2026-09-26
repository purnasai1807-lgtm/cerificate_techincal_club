import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Award,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Send,
  RotateCw,
  Search,
  Filter,
  Eye,
  Check,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Download,
  FileDown,
  Archive,
} from 'lucide-react';
import { Certificate, CertificateStatus } from '../../types';
import { certificatesService } from '../../api/certificates';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useNotifications } from '../../context/NotificationContext';
import { QuickApproveWidget } from '../../components/common/QuickApproveWidget';
import { downloadCertificatesZip, downloadSingleCertificatePdf } from '../../utils/pdfGenerator';
import confetti from 'canvas-confetti';

interface CertificatesListPageProps {
  forcedStatus?: CertificateStatus;
}

export const CertificatesListPage: React.FC<CertificatesListPageProps> = ({ forcedStatus }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  // Determine current active filter tab
  const getTabFromPath = (): CertificateStatus | 'ALL' => {
    if (forcedStatus) return forcedStatus;
    if (location.pathname.includes('/pending')) return 'PENDING';
    if (location.pathname.includes('/approved')) return 'APPROVED';
    if (location.pathname.includes('/rejected')) return 'REJECTED';
    if (location.pathname.includes('/sent')) return 'SENT';
    if (location.pathname.includes('/failed')) return 'FAILED';
    return 'ALL';
  };

  const [activeTab, setActiveTab] = useState<CertificateStatus | 'ALL'>(getTabFromPath());
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [approveModalCert, setApproveModalCert] = useState<Certificate | null>(null);
  const [rejectModalCert, setRejectModalCert] = useState<Certificate | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Progress state for generation/batch
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number } | null>(null);

  const fetchCertificates = async () => {
    setIsLoading(true);
    const res = await certificatesService.getCertificates({
      status: activeTab,
      search: searchQuery,
    });
    if (res.success) {
      setCertificates(res.data.items);
      setCounts(res.data.countsByStatus);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  useEffect(() => {
    fetchCertificates();
  }, [activeTab, searchQuery]);

  // Computed selection sets
  const selectedCertificates = certificates.filter((c) => selectedIds.includes(c.id));
  const selectedApprovedOrSent = selectedCertificates.filter((c) =>
    ['APPROVED', 'GENERATED', 'SENT'].includes(c.status)
  );
  const selectedPending = selectedCertificates.filter((c) => c.status === 'PENDING');

  // ZIP download progress state
  const [downloadProgress, setDownloadProgress] = useState<{
    current: number;
    total: number;
    currentName: string;
  } | null>(null);

  // Bulk Selection Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(certificates.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Bulk ZIP Download for Approved / Sent certificates
  const handleBulkDownloadZip = async (customCerts?: Certificate[]) => {
    let targetCerts = customCerts;
    if (!targetCerts || targetCerts.length === 0) {
      targetCerts = selectedApprovedOrSent.length > 0 ? selectedApprovedOrSent : selectedCertificates;
    }

    if (!targetCerts || targetCerts.length === 0) {
      showToast('warning', 'No Certificates Selected', 'Please select at least one certificate to download.');
      return;
    }

    setIsProcessingAction(true);
    setDownloadProgress({
      current: 0,
      total: targetCerts.length,
      currentName: 'Initializing vector rendering engine...',
    });

    try {
      const tabSuffix =
        activeTab === 'SENT' ? 'Sent' : activeTab === 'APPROVED' ? 'Approved' : 'Selected';
      const zipFileName = `${tabSuffix}_Certificates_PyCore_2026.zip`;

      const res = await downloadCertificatesZip(
        targetCerts,
        (current, total, currentName) => {
          setDownloadProgress({ current, total, currentName });
        },
        zipFileName
      );

      if (res.success) {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        showToast(
          'success',
          'ZIP Archive Downloaded',
          `Successfully bundled and downloaded ${res.count} PDF certificates.`
        );
        setSelectedIds([]);
      } else {
        showToast('error', 'Download Failed', res.error || 'Failed to compile ZIP archive.');
      }
    } catch (err: any) {
      showToast('error', 'Download Error', err?.message || 'Error occurred while creating ZIP file.');
    } finally {
      setIsProcessingAction(false);
      setDownloadProgress(null);
    }
  };

  // Single Certificate PDF Download
  const handleSingleDownload = (cert: Certificate) => {
    try {
      downloadSingleCertificatePdf(cert);
      showToast('success', 'Certificate Downloaded', `PDF certificate saved for ${cert.participantName}`);
    } catch (err: any) {
      showToast('error', 'Download Failed', err?.message || 'Failed to download certificate.');
    }
  };

  // Single Approve
  const handleApproveSingle = async () => {
    if (!approveModalCert) return;
    setIsProcessingAction(true);
    try {
      const res = await certificatesService.approveCertificate(approveModalCert.id);
      if (res.success) {
        showToast('success', 'Certificate Approved', res.message || 'Approved successfully.');
        setApproveModalCert(null);
        await fetchCertificates();
      }
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Single Reject
  const handleRejectSingle = async () => {
    if (!rejectModalCert) return;
    setIsProcessingAction(true);
    try {
      const res = await certificatesService.rejectCertificate(rejectModalCert.id, rejectionReason);
      if (res.success) {
        showToast('warning', 'Certificate Rejected', res.message || 'Certificate request rejected.');
        setRejectModalCert(null);
        setRejectionReason('');
        await fetchCertificates();
      }
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Bulk Approve
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessingAction(true);
    try {
      const res = await certificatesService.bulkApproveCertificates(selectedIds);
      if (res.success) {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        showToast(
          'success',
          'Batch Approval Completed',
          `Approved ${res.data.approvedCount} certificate requests.`
        );
        setSelectedIds([]);
        setBulkModalOpen(false);
        await fetchCertificates();
      }
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Generate Certificate
  const handleGenerate = async (cert: Certificate) => {
    setIsProcessingAction(true);
    showToast('info', 'Generating Certificate', `Synthesizing personalized vector PDF for ${cert.participantName}...`);
    try {
      const res = await certificatesService.generateCertificate(cert.id);
      if (res.success) {
        showToast('success', 'Generation Complete', `Certificate ready for ${cert.participantName}.`);
        await fetchCertificates();
      }
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Send Email
  const handleSendEmail = async (cert: Certificate) => {
    setIsProcessingAction(true);
    showToast('info', 'Email Queued', `Dispatching to ${cert.participantEmail}...`);
    try {
      const res = await certificatesService.sendCertificate(cert.id);
      if (res.success) {
        showToast('success', 'Email Delivered', `Certificate sent to ${cert.participantEmail}`);
        await fetchCertificates();
      } else {
        const errText = typeof res.error === 'object' ? res.error?.message : (res.error || 'Mail delivery failed.');
        showToast('error', 'Email Failed', errText);
      }
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Retry Failed
  const handleRetry = async (cert: Certificate) => {
    setIsProcessingAction(true);
    try {
      const res = await certificatesService.retryCertificate(cert.id);
      if (res.success) {
        showToast('success', 'Operation Recovered', `Certificate successfully regenerated.`);
        await fetchCertificates();
      }
    } finally {
      setIsProcessingAction(false);
    }
  };

  const tabs: { key: CertificateStatus | 'ALL'; label: string; countKey: string }[] = [
    { key: 'ALL', label: 'All Certificates', countKey: 'ALL' },
    { key: 'PENDING', label: 'Pending Approval', countKey: 'PENDING' },
    { key: 'APPROVED', label: 'Approved', countKey: 'APPROVED' },
    { key: 'GENERATED', label: 'Generated', countKey: 'GENERATED' },
    { key: 'SENT', label: 'Sent to Email', countKey: 'SENT' },
    { key: 'REJECTED', label: 'Rejected', countKey: 'REJECTED' },
    { key: 'FAILED', label: 'Failed Ops', countKey: 'FAILED' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>Workflow & Distribution Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {activeTab === 'PENDING'
              ? 'Pending Certificate Approvals'
              : activeTab === 'FAILED'
              ? 'Failed Operations & Exceptions'
              : 'Certificate Management'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review attendee eligibility, authorize batch issuance, synthesize PDFs, and track mail delivery.
          </p>
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick full batch download for Approved tab */}
          {activeTab === 'APPROVED' && (counts.APPROVED || 0) > 0 && selectedApprovedOrSent.length === 0 && (
            <button
              onClick={() => handleBulkDownloadZip(certificates.filter((c) => c.status === 'APPROVED'))}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-600/25 transition-all flex items-center gap-2"
              title="Download all approved certificates as a single ZIP archive"
            >
              <Archive className="w-4 h-4" />
              <span>Download All Approved ({counts.APPROVED}) ZIP</span>
            </button>
          )}

          {/* Quick full batch download for Sent tab */}
          {activeTab === 'SENT' && (counts.SENT || 0) > 0 && selectedApprovedOrSent.length === 0 && (
            <button
              onClick={() => handleBulkDownloadZip(certificates.filter((c) => c.status === 'SENT'))}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2"
              title="Download all dispatched certificates as a single ZIP archive"
            >
              <Archive className="w-4 h-4" />
              <span>Download All Sent ({counts.SENT}) ZIP</span>
            </button>
          )}

          {/* Download Selected as ZIP */}
          {selectedApprovedOrSent.length > 0 && (
            <button
              onClick={() => handleBulkDownloadZip(selectedApprovedOrSent)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 animate-in fade-in"
              title="Package selected certificates into a ZIP file"
            >
              <Archive className="w-4 h-4" />
              <span>Download Selected ({selectedApprovedOrSent.length}) ZIP</span>
            </button>
          )}

          {/* Bulk Approve (for Pending) */}
          {selectedPending.length > 0 && (
            <button
              onClick={() => setBulkModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 animate-in fade-in"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Approve Selected ({selectedPending.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        {tabs.map((t) => {
          const isActive = activeTab === t.key;
          const countVal = counts[t.countKey] || 0;
          return (
            <button
              key={t.key}
              onClick={() => {
                setActiveTab(t.key);
                setSelectedIds([]);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {countVal}
              </span>
            </button>
          );
        })}
      </div>

      {/* Instant Issue & Dispatch by Roll No / Email ID */}
      <QuickApproveWidget onSuccess={fetchCertificates} />

      {/* Search & Bulk Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search attendee, email, ID..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              onChange={handleSelectAll}
              checked={
                certificates.length > 0 &&
                selectedIds.length === certificates.length
              }
              className="rounded border-slate-300 dark:border-slate-700 text-purple-600 focus:ring-purple-500"
            />
            <span>
              {selectedIds.length > 0 ? (
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  {selectedIds.length} of {certificates.length} selected
                </span>
              ) : (
                `Select all on page (${certificates.length})`
              )}
            </span>
          </label>
          <span>•</span>
          <span>Showing {certificates.length} records</span>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      certificates.length > 0 &&
                      selectedIds.length === certificates.length
                    }
                    className="rounded border-slate-300 dark:border-slate-700 text-purple-600 focus:ring-purple-500"
                  />
                </th>
                <th className="py-3 px-4">Participant</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Attendance</th>
                <th className="py-3 px-4">Certificate ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {certificates.map((cert) => {
                const isSelected = selectedIds.includes(cert.id);
                return (
                  <tr
                    key={cert.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-purple-50/50 dark:bg-purple-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(cert.id)}
                        className="rounded border-slate-300 dark:border-slate-700 text-purple-600 focus:ring-purple-500"
                      />
                    </td>

                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {cert.participantName}
                        </span>
                        <p className="text-[11px] text-slate-400 font-mono">{cert.participantEmail}</p>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono">{cert.participantRollNumber}</td>

                    <td className="py-3 px-4">
                      <div className="space-y-0.5 text-[11px]">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          In: {cert.checkIn || 'Missing'}
                        </span>
                        <br />
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Out: {cert.checkOut || 'Missing'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-medium text-purple-600 dark:text-purple-400">
                      {cert.certificateId}
                    </td>

                    <td className="py-3 px-4">
                      <Badge status={cert.status} />
                      {cert.failureReason && (
                        <p className="text-[10px] text-rose-500 mt-1 max-w-xs truncate">
                          {cert.failureReason}
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Status-specific action buttons */}
                        {cert.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => setApproveModalCert(cert)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectModalCert(cert)}
                              className="px-2.5 py-1 rounded-lg border border-rose-300 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold text-[11px] transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {cert.status === 'APPROVED' && (
                          <button
                            onClick={() => handleGenerate(cert)}
                            disabled={isProcessingAction}
                            className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[11px] transition-colors flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Generate</span>
                          </button>
                        )}

                        {cert.status === 'GENERATING' && (
                          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-mono animate-pulse">
                            Rendering PDF...
                          </span>
                        )}

                        {(cert.status === 'GENERATED' || cert.status === 'EMAIL_QUEUED') && (
                          <button
                            onClick={() => handleSendEmail(cert)}
                            disabled={isProcessingAction}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] transition-colors flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Send Email</span>
                          </button>
                        )}

                        {cert.status === 'SENT' && (
                          <a
                            href={`/verify/${cert.certificateId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-purple-600 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <span>Verify</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}

                        {cert.status === 'FAILED' && (
                          <button
                            onClick={() => handleRetry(cert)}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] transition-colors flex items-center gap-1"
                          >
                            <RotateCw className="w-3 h-3" />
                            <span>Retry</span>
                          </button>
                        )}

                        {['APPROVED', 'GENERATED', 'SENT'].includes(cert.status) && (
                          <button
                            onClick={() => handleSingleDownload(cert)}
                            title="Download PDF Certificate"
                            className="px-2 py-1 rounded-lg border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-[11px] font-semibold transition-colors flex items-center gap-1"
                          >
                            <Download className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                            <span>PDF</span>
                          </button>
                        )}

                        {/* View Details Link */}
                        <Link
                          to={`/admin/certificates/${cert.id}`}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="View Certificate Details"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {certificates.length === 0 && !isLoading && (
          <div className="p-12 text-center text-slate-400 text-xs">
            No certificates found in the <span className="font-semibold">{activeTab}</span> category.
          </div>
        )}
      </div>

      {/* SINGLE APPROVE MODAL */}
      {approveModalCert && (
        <Modal
          isOpen={!!approveModalCert}
          onClose={() => setApproveModalCert(null)}
          title="Approve this certificate?"
          subtitle="Institutional credential authorization"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Participant:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {approveModalCert.participantName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-mono">{approveModalCert.participantEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Roll Number:</span>
                <span className="font-mono">{approveModalCert.participantRollNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Attendance:</span>
                <span className="text-emerald-600 font-semibold">
                  In: {approveModalCert.checkIn} / Out: {approveModalCert.checkOut}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Eligibility:</span>
                <Badge status="ELIGIBLE" />
              </div>
            </div>

            <p className="text-slate-500 leading-relaxed">
              After approval, the system will authorize generation of the personalized certificate and
              queue it for delivery to the participant's registered email address.
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setApproveModalCert(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveSingle}
                disabled={isProcessingAction}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-md shadow-purple-600/20"
              >
                {isProcessingAction ? 'Approving...' : 'Approve Certificate'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* SINGLE REJECTION MODAL */}
      {rejectModalCert && (
        <Modal
          isOpen={!!rejectModalCert}
          onClose={() => setRejectModalCert(null)}
          title="Reject Certificate Request"
          subtitle="Provide authorization notes"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
              <p className="font-bold text-rose-800 dark:text-rose-200">
                {rejectModalCert.participantName} ({rejectModalCert.participantRollNumber})
              </p>
              <p className="text-[11px] text-rose-600 font-mono mt-0.5">{rejectModalCert.participantEmail}</p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Optional Rejection Reason
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Incomplete attendance check-out or academic record discrepancy."
                className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModalCert(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectSingle}
                disabled={isProcessingAction}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-md shadow-rose-600/20"
              >
                {isProcessingAction ? 'Rejecting...' : 'Reject Certificate'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* BULK APPROVE MODAL */}
      <Modal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        title={`Approve certificates for ${selectedIds.length} eligible participants?`}
        subtitle="Batch institutional authorization"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
          <p className="leading-relaxed">
            You have selected <span className="font-bold text-purple-600">{selectedIds.length}</span> eligible
            attendee records that satisfy the check-in and check-out criteria.
          </p>
          <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-1 text-[11px]">
            <p className="font-semibold text-purple-900 dark:text-purple-200">
              ✓ Automated Batch Generation Queue
            </p>
            <p className="text-purple-700 dark:text-purple-300">
              Each recipient will have an authentic vector certificate generated with dynamic placeholders and
              scheduled for email dispatch.
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setBulkModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBulkApprove}
              disabled={isProcessingAction}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/20"
            >
              {isProcessingAction ? 'Authorizing Batch...' : `Approve ${selectedIds.length} Certificates`}
            </button>
          </div>
        </div>
      </Modal>

      {/* BULK ZIP DOWNLOAD PROGRESS MODAL */}
      {downloadProgress && (
        <Modal
          isOpen={!!downloadProgress}
          onClose={() => {}}
          title="Bundling PDF Certificates into ZIP"
          subtitle="Compiling individual vector certificates into a compressed ZIP archive"
          maxWidth="md"
        >
          <div className="space-y-5 text-xs text-slate-700 dark:text-slate-300 py-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-950/80 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 shadow-inner">
                <Download className="w-5 h-5 animate-bounce" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  Generating PDF {downloadProgress.current} of {downloadProgress.total}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-sm mt-0.5">
                  {downloadProgress.currentName}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-slate-500">
                <span>Rendering Status</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  {Math.round((downloadProgress.current / Math.max(downloadProgress.total, 1)) * 100)}%
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-500 transition-all duration-150 rounded-full"
                  style={{
                    width: `${Math.round(
                      (downloadProgress.current / Math.max(downloadProgress.total, 1)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-[11px] text-purple-800 dark:text-purple-300 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <Archive className="w-3.5 h-3.5" />
                <span>Archive File Naming Pattern:</span>
              </p>
              <p className="font-mono text-[10px] text-purple-700 dark:text-purple-400">
                [Participant_Name]_[RollNumber_or_ID].pdf
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
