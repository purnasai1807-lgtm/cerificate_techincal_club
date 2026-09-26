import React, { useEffect, useState } from 'react';
import {
  Mail,
  RotateCw,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Search,
  FileCheck,
  Building2,
  Calendar,
} from 'lucide-react';
import { EmailLog } from '../../types';
import { emailsService } from '../../api/emails';
import { Badge } from '../../components/common/Badge';
import { useNotifications } from '../../context/NotificationContext';

export const EmailLogsPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'QUEUED' | 'SENT' | 'FAILED'>('ALL');
  const [isRetrying, setIsRetrying] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    const res = await emailsService.getEmailLogs();
    if (res.success) {
      setLogs(res.data);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRetry = async (logId: string) => {
    setIsRetrying(logId);
    try {
      const res = await emailsService.retryEmail(logId);
      if (res.success) {
        showToast('success', 'Email Dispatched', res.message || 'Email successfully sent.');
        await fetchLogs();
      } else {
        const errText = typeof res.error === 'object' ? res.error?.message : (res.error || 'Failed to re-dispatch email.');
        showToast('error', 'Retry Failed', errText);
      }
    } finally {
      setIsRetrying(null);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (statusFilter !== 'ALL' && log.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.recipient.toLowerCase().includes(q) ||
        log.studentName.toLowerCase().includes(q) ||
        log.certificateId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-2">
            <Mail className="w-3.5 h-3.5" />
            <span>Outbound Mail Transport</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Email Dispatch Logs</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track certificate transmission, SMTP delivery receipts, and automated retry queues.
          </p>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {(['ALL', 'QUEUED', 'SENT', 'FAILED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                statusFilter === s
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {s === 'ALL' ? 'All Deliveries' : s}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search email, recipient, ID..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Recipient</th>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Certificate ID</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Sent At</th>
                <th className="py-3.5 px-4">Attempts</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => (
                <React.Fragment key={log.id}>
                <tr
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-900 dark:text-white">
                    {log.recipient}
                  </td>
                  <td className="py-3.5 px-4 font-semibold">{log.studentName}</td>
                  <td className="py-3.5 px-4 font-mono text-purple-600 dark:text-purple-400 font-medium">
                    {log.certificateId}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge status={log.status} />
                    {log.error && (
                      <p className="text-[10px] text-rose-500 font-mono mt-1 max-w-xs truncate">
                        {log.error}
                      </p>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                    {log.sentAt ? new Date(log.sentAt).toLocaleString() : 'In Mail Queue'}
                  </td>
                  <td className="py-3.5 px-4 font-mono">{log.attempts}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-[11px] hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        {expandedLogId === log.id ? 'Hide Message' : 'View Message'}
                      </button>
                      {log.status === 'FAILED' && (
                        <button
                          onClick={() => handleRetry(log.id)}
                          disabled={isRetrying === log.id}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] transition-colors flex items-center gap-1"
                        >
                          <RotateCw className="w-3 h-3" />
                          <span>{isRetrying === log.id ? 'Sending...' : 'Retry'}</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedLogId === log.id && (
                  <tr className="bg-slate-50/80 dark:bg-slate-950/40">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="max-w-4xl space-y-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Subject</p>
                          <p className="text-xs font-semibold mt-1">{log.subject || 'No subject recorded'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Email Body — exact content sent</p>
                          <pre className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 font-sans">{log.body || 'No email body was recorded for this log.'}</pre>
                        </div>
                        {log.attachmentFilename && (
                          <p className="text-[11px] text-slate-500">Attachment: <span className="font-mono">{log.attachmentFilename}</span></p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="p-12 text-center text-xs text-slate-400">
            No email logs match the current query.
          </div>
        )}
      </div>

    </div>
  );
};
