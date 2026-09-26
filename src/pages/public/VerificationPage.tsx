import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Award,
  Calendar,
  Building2,
  CheckCircle2,
  XCircle,
  Search,
  ExternalLink,
  ArrowLeft,
  Eye,
  FileCheck,
  Share2,
  Download,
} from 'lucide-react';
import { verificationService, VerifiedCertificateData, downloadVerifiedCertificate } from '../../api/verification';
import { Modal } from '../../components/common/Modal';

export const VerificationPage: React.FC = () => {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [data, setData] = useState<VerifiedCertificateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchId, setSearchId] = useState(certificateId || '');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();



  useEffect(() => {
    if (certificateId) {
      setSearchId(certificateId);
      setIsLoading(true);
      verificationService.verifyCertificate(certificateId).then((res) => {
        setData(res.data);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [certificateId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/verify/${encodeURIComponent(searchId.trim().toUpperCase())}`);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between bg-white dark:bg-slate-900">
        <Link to="/" className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-purple-600 text-xs font-semibold">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-purple-600" />
          <span className="font-bold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            CertificateFlow Registry
          </span>
        </div>
        <Link
          to="/admin/login"
          className="text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400"
        >
          Admin Login
        </Link>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        {/* Search header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Public Credential Verification</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Validate authentic certificates issued by verified event secretariats.
          </p>

          <form onSubmit={handleSearch} className="mt-6 flex gap-2 max-w-lg mx-auto">
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter Certificate ID"
              className="flex-1 px-4 py-2.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Verify</span>
            </button>
          </form>
        </div>

        {/* Verification Result Card */}
        {isLoading ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-lg">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs text-slate-500 font-medium">Validating cryptographic signature in registry...</p>
          </div>
        ) : data && data.isValid ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-500/40 shadow-xl overflow-hidden">
            {/* Success Banner */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[11px] font-mono tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded font-semibold">
                    Cryptographically Validated
                  </span>
                  <h2 className="text-xl font-bold mt-1">Certificate Verified</h2>
                </div>
              </div>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied!' : 'Share'}</span>
              </button>
            </div>

            {/* Certificate Details */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-6">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Presented To
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {data.recipientName}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-purple-600" />
                    <span>Event Name</span>
                  </span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                    {data.eventName}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Issued By Organization</span>
                  </span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                    {data.organization}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Certificate Identifier</span>
                  </span>
                  <p className="text-sm font-mono font-bold text-purple-600 dark:text-purple-400 mt-1">
                    {data.certificateId}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Issue Date</span>
                  </span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                    {data.issueDate}
                  </p>
                </div>
              </div>

              {/* View Certificate Button */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Verified against official institutional attendance register.</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={async () => {
                      try {
                        await downloadVerifiedCertificate(data.certificateId);
                      } catch (error) {
                        console.error(error);
                      }
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm hover:bg-purple-100 dark:hover:bg-purple-900/60"
                  >
                    <Download className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={() => setViewModalOpen(true)}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-purple-600/20"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Certificate</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-rose-300 dark:border-rose-900/60 text-center shadow-lg">
            <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Certificate Not Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
              We could not locate an approved or officially issued certificate with ID{' '}
              <span className="font-mono font-bold text-rose-600">{certificateId || 'specified'}</span>.
              Please check the certificate ID and try again, or contact the event secretariat.
            </p>
            <div className="mt-6">

            </div>
          </div>
        )}
      </div>

      {/* Certificate Modal */}
      {data && (
        <Modal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          title={`Certificate of Completion — ${data.recipientName}`}
          subtitle={`Credential ID: ${data.certificateId}`}
          maxWidth="4xl"
        >
          <div className="space-y-4">
            <div className="w-full aspect-[1.414/1] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50">
              <iframe
                title={`Issued certificate ${data.certificateId}`}
                src={`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/public/certificates/${encodeURIComponent(data.certificateId)}/file`}
                className="w-full h-full"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Print / Save PDF
              </button>
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
