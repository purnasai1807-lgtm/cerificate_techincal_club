import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Send,
  AlertTriangle,
  UploadCloud,
  FileSpreadsheet,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import { dashboardService } from '../../api/dashboard';
import { settingsService } from '../../api/settings';
import { auditService } from '../../api/audit';
import { AuditLog, SystemSettings } from '../../types';
import { Badge } from '../../components/common/Badge';
import { QuickApproveWidget } from '../../components/common/QuickApproveWidget';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({ eventName: '', organizationName: '', certificateIdPrefix: 'CERT', issueDate: '', activeTemplateId: '', requireCheckIn: true, requireCheckOut: true, senderName: '', replyToAddress: '', emailSubject: '', emailBodyTemplate: '' });
  const [stats, setStats] = useState({participants:0, eligible:0, ineligible:0, pending:0, approved:0, rejected:0, generated:0, sent:0, failed:0});

  const loadData = async () => {
    const [statsRes, settingsRes, auditRes] = await Promise.all([dashboardService.getStats(), settingsService.getSettings(), auditService.getAuditLogs()]);
    if (statsRes.success && statsRes.data) setStats(statsRes.data);
    if (settingsRes.success && settingsRes.data) setSettings(settingsRes.data);
    if (auditRes.success && auditRes.data) setAuditLogs(auditRes.data.slice(0, 5));
  };

  useEffect(() => { loadData(); }, []);

  const totalParticipants = stats.participants;
  const eligibleCount = stats.eligible;
  const notEligibleCount = stats.ineligible;
  const pendingCount = stats.pending;
  const approvedCount = stats.approved;
  const rejectedCount = stats.rejected;
  const generatedCount = stats.generated;
  const sentCount = stats.sent;
  const failedCount = stats.failed;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Event Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-purple-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-mono tracking-wider font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30">
                Certificate Operations
              </span>
              <span className="text-xs text-purple-200/80">• {settings.organizationName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{settings.eventName}</h1>
            <p className="text-xs sm:text-sm text-purple-200/80 mt-1 max-w-2xl leading-relaxed">
              Automated attendee attendance verification, high-resolution certificate generation, and
              tamper-proof verifiable email delivery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/admin/certificates/pending"
              className="px-5 py-2.5 rounded-xl bg-white text-purple-950 hover:bg-purple-50 text-xs font-bold shadow-lg transition-colors flex items-center gap-1.5"
            >
              <Award className="w-4 h-4 text-purple-700" />
              <span>Review Pending ({pendingCount})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary Statistics Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Lifecycle & Attendance Metrics
          </h2>
          <span className="text-xs text-slate-400">Real-time synchronization</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Total Participants */}
          <div
            onClick={() => navigate('/admin/participants')}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Participants</span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-3xl font-extrabold tracking-tight">{totalParticipants}</div>
            <div className="text-[11px] text-slate-400 mt-1">Uploaded attendance records</div>
          </div>

          {/* Eligible */}
          <div
            onClick={() => navigate('/admin/participants?filter=eligible')}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 shadow-sm hover:shadow-md cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Eligible</span>
              <CheckCircle className="w-4 h-4" />
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
              {eligibleCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Check-in & out verified</div>
          </div>

          {/* Not Eligible */}
          <div
            onClick={() => navigate('/admin/participants?filter=ineligible')}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 shadow-sm hover:shadow-md cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Not Eligible</span>
              <XCircle className="w-4 h-4" />
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">
              {notEligibleCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Incomplete attendance</div>
          </div>

          {/* Pending Approval */}
          <div
            onClick={() => navigate('/admin/certificates/pending')}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 shadow-sm hover:shadow-md cursor-pointer transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Approval</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-purple-600 dark:text-purple-400">
              {pendingCount}
            </div>
            <div className="text-[11px] text-purple-600/80 dark:text-purple-400/80 mt-1 font-medium">
              Requires coordinator sign-off
            </div>
          </div>

          {/* Sent */}
          <div
            onClick={() => navigate('/admin/certificates/sent')}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Sent to Email</span>
              <Send className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {sentCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Dispatched credentials</div>
          </div>
        </div>
      </div>

      {/* Secondary Status Row (Approved, Generated, Rejected, Failed) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/admin/certificates/approved')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:border-purple-400"
        >
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Approved</p>
            <p className="text-xl font-bold mt-0.5">{approvedCount}</p>
          </div>
          <Badge status="APPROVED" />
        </div>

        <div
          onClick={() => navigate('/admin/certificates/rejected')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:border-rose-400"
        >
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Rejected</p>
            <p className="text-xl font-bold mt-0.5">{rejectedCount}</p>
          </div>
          <Badge status="REJECTED" />
        </div>

        <div
          onClick={() => navigate('/admin/certificates')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:border-violet-400"
        >
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Generated</p>
            <p className="text-xl font-bold mt-0.5">{generatedCount}</p>
          </div>
          <Badge status="GENERATED" />
        </div>

        <div
          onClick={() => navigate('/admin/certificates/failed')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:border-rose-400"
        >
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Failed Ops</p>
            <p className="text-xl font-bold mt-0.5">{failedCount}</p>
          </div>
          <Badge status="FAILED" />
        </div>
      </div>

      {/* Instant Approval & Email Dispatch Bar */}
      <QuickApproveWidget onSuccess={loadData} />

      {/* Quick Actions Bar */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/admin/import')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 text-left transition-all group flex items-start justify-between shadow-sm"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm">Upload Attendance</h3>
              <p className="text-xs text-slate-400 mt-0.5">Parse CSV or PDF sheet</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
          </button>

          <button
            onClick={() => navigate('/admin/templates/upload')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-left transition-all group flex items-start justify-between shadow-sm"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm">Upload Template</h3>
              <p className="text-xs text-slate-400 mt-0.5">Add PDF or vector design</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </button>

          <button
            onClick={() => navigate('/admin/certificates/pending')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 text-left transition-all group flex items-start justify-between shadow-sm"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm">Review Certificates</h3>
              <p className="text-xs text-slate-400 mt-0.5">{pendingCount} eligible waiting</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
          </button>

          <button
            onClick={() => navigate('/admin/participants')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-violet-500 text-left transition-all group flex items-start justify-between shadow-sm"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm">View Participants</h3>
              <p className="text-xs text-slate-400 mt-0.5">Directory & check-in logs</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 transition-colors" />
          </button>
        </div>
      </div>

      {/* Two Column Layout: Workflow Guide & Recent Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Automated Lifecycle Diagram */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base">Complete Production Lifecycle</h3>
              <p className="text-xs text-slate-400">Strict end-to-end verification gate</p>
            </div>
            <Link
              to="/admin/import"
              className="text-xs font-semibold text-purple-600 hover:underline flex items-center gap-1"
            >
              <span>Import Flow</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 font-mono text-xs leading-loose space-y-2">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="w-6 h-6 rounded-md bg-purple-600 text-white flex items-center justify-center font-bold text-[11px]">1</span>
              <span className="font-semibold">UPLOAD CSV/PDF</span>
              <span className="text-slate-400 font-sans text-[11px]">→ Extract Name, Email, Student ID, Roll No, Check-in, Check-out</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="w-6 h-6 rounded-md bg-purple-600 text-white flex items-center justify-center font-bold text-[11px]">2</span>
              <span className="font-semibold">VALIDATE ELIGIBILITY</span>
              <span className="text-slate-400 font-sans text-[11px]">→ Rule: Check-in + Check-out mandatory (220 Eligible, 30 Not Eligible)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="w-6 h-6 rounded-md bg-purple-600 text-white flex items-center justify-center font-bold text-[11px]">3</span>
              <span className="font-semibold">MAP TEMPLATE</span>
              <span className="text-slate-400 font-sans text-[11px]">→ Place dynamic &#123;&#123;NAME&#125;&#125;, &#123;&#123;EVENT_NAME&#125;&#125;, &#123;&#123;CERTIFICATE_ID&#125;&#125;</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="w-6 h-6 rounded-md bg-purple-600 text-white flex items-center justify-center font-bold text-[11px]">4</span>
              <span className="font-semibold">ADMIN APPROVAL</span>
              <span className="text-slate-400 font-sans text-[11px]">→ Coordinator review & batch sign-off</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="w-6 h-6 rounded-md bg-purple-600 text-white flex items-center justify-center font-bold text-[11px]">5</span>
              <span className="font-semibold">GENERATE & EMAIL</span>
              <span className="text-slate-400 font-sans text-[11px]">→ PDF synthesis, verifiable SHA-256 ID, delivery to student mailbox</span>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/60">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-xs font-bold text-purple-900 dark:text-purple-200">
                  Backend API Enforcement
                </p>
                <p className="text-[11px] text-purple-700 dark:text-purple-300">
                  Frontend never assumes email delivery or generation until confirmed by API.
                </p>
              </div>
            </div>
            <Link
              to="/admin/settings"
              className="text-xs font-semibold text-purple-700 dark:text-purple-300 underline"
            >
              Configure Rules
            </Link>
          </div>
        </div>

        {/* Right 1 Col: Live Audit Feed */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">Recent Audit Logs</h3>
              <Link
                to="/admin/audit-logs"
                className="text-xs text-purple-600 hover:underline font-semibold"
              >
                View All
              </Link>
            </div>

            <div className="space-y-3.5">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {log.date.split(' ')[1] || log.date}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
                    {log.record}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Admin: Alex Vance</span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Audit Stream Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
