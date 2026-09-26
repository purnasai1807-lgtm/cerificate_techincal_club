import React, { useEffect, useState } from 'react';
import {
  Settings,
  Save,
  Award,
  CheckCircle,
  Mail,
  ShieldCheck,
  Lock,
  Database,
  Calendar,
  Sparkles,
  Server,
} from 'lucide-react';
import { SystemSettings, CertificateTemplate } from '../../types';
import { settingsService } from '../../api/settings';
import { templatesService } from '../../api/templates';
import { useNotifications } from '../../context/NotificationContext';

export const SettingsPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [settings, setSettings] = useState<SystemSettings>({ eventName: '', organizationName: '', certificateIdPrefix: 'CERT', issueDate: '', activeTemplateId: '', requireCheckIn: true, requireCheckOut: true, senderName: '', replyToAddress: '', emailSubject: '', emailBodyTemplate: '' });
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    settingsService.getSettings().then((res) => { if (res.success && res.data) setSettings(res.data); });
    templatesService.getTemplates().then((res) => { if (res.success && res.data) setTemplates(res.data); });
  }, []);

  const handleChange = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await settingsService.updateSettings(settings);
      if (res.success) {
        showToast('success', 'Settings Synchronized', 'Event parameters and eligibility rules updated.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-2">
            <Settings className="w-3.5 h-3.5" />
            <span>Platform Configuration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">System Settings</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure event credentials, attendance eligibility criteria, email templates, and security policies.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/25 transition-all flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save Changes</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* SECTION 1: Event & Summit Identity */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Award className="w-4 h-4 text-purple-600" />
            <h2 className="font-bold text-base">Event & Issuer Settings</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Official Event Name
              </label>
              <input
                type="text"
                required
                value={settings.eventName}
                onChange={(e) => handleChange('eventName', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Issuing Organization / Secretariat
              </label>
              <input
                type="text"
                required
                value={settings.organizationName}
                onChange={(e) => handleChange('organizationName', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Certificate ID Prefix
              </label>
              <input
                type="text"
                required
                value={settings.certificateIdPrefix}
                onChange={(e) => handleChange('certificateIdPrefix', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Official Issue Date
              </label>
              <input
                type="date"
                required
                value={settings.issueDate}
                onChange={(e) => handleChange('issueDate', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Attendance Eligibility Engine */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-base">Eligibility Policy Settings</h2>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Specify the institutional conditions required before a participant is declared{' '}
            <span className="font-bold text-emerald-600">ELIGIBLE</span> for certificate issuance.
          </p>

          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireCheckIn}
                onChange={(e) => handleChange('requireCheckIn', e.target.checked)}
                className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Mandatory Check-in Timestamp
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Participant must have logged entry at the event registration counter.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireCheckOut}
                onChange={(e) => handleChange('requireCheckOut', e.target.checked)}
                className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Mandatory Check-out Timestamp
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Participant must have logged departure after workshop sessions conclusion.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* SECTION 3: Email Delivery & Template Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Mail className="w-4 h-4 text-indigo-600" />
            <h2 className="font-bold text-base">Email Dispatch Settings</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Sender Name
              </label>
              <input
                type="text"
                required
                value={settings.senderName}
                onChange={(e) => handleChange('senderName', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Reply-To Email Address
              </label>
              <input
                type="email"
                required
                value={settings.replyToAddress}
                onChange={(e) => handleChange('replyToAddress', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Email Subject Line
            </label>
            <input
              type="text"
              required
              value={settings.emailSubject}
              onChange={(e) => handleChange('emailSubject', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Email Body Template
            </label>
            <textarea
              rows={6}
              required
              value={settings.emailBodyTemplate}
              onChange={(e) => handleChange('emailBodyTemplate', e.target.value)}
              className="w-full p-4 rounded-2xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono leading-relaxed"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Supported placeholders: <span className="font-mono text-purple-600">&#123;&#123;NAME&#125;&#125;</span>,{' '}
              <span className="font-mono text-purple-600">&#123;&#123;EVENT_NAME&#125;&#125;</span>,{' '}
              <span className="font-mono text-purple-600">&#123;&#123;CERTIFICATE_ID&#125;&#125;</span>
            </p>
          </div>
        </div>

        {/* SECTION 4: Security & Compliance Standards */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <h2 className="font-bold text-base">Security & Disaster Recovery Compliance</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Data Encryption</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-500" />
                <span>{settings.dataEncryption}</span>
              </p>
              <p className="text-[11px] text-slate-400">Cryptographically secure payload transit</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Disaster Recovery</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Server className="w-4 h-4 text-indigo-500" />
                <span>{settings.backupSchedule}</span>
              </p>
              <p className="text-[11px] text-slate-400">Failover redundancy & automated point-in-time restore</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/60">
            <div>
              <p className="text-xs font-bold text-purple-900 dark:text-purple-200">
                Multi-Factor Authentication (MFA)
              </p>
              <p className="text-[11px] text-purple-700/80 dark:text-purple-300/80">
                Mandatory TOTP / hardware key verification on all administrative logins
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.mfaEnabled}
                onChange={(e) => handleChange('mfaEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
};
