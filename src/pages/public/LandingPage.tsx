import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  Search,
  ArrowRight,
  FileSpreadsheet,
  Layers,
  Send,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const LandingPage: React.FC = () => {
  const [certQuery, setCertQuery] = useState('');
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (certQuery.trim()) {
      navigate(`/verify/${encodeURIComponent(certQuery.trim().toUpperCase())}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-purple-50/20 to-slate-100 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-900 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="h-20 border-b border-slate-200/80 dark:border-slate-800/80 px-6 lg:px-12 flex items-center justify-between backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
            <Award className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent">
              CertificateFlow
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Automated Certificate Approval & Distribution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/admin/login"
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-all shadow-md shadow-purple-600/20 flex items-center gap-1.5"
          >
            <span>Admin Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center px-6 lg:px-12 py-12 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 text-xs font-semibold mb-6 border border-purple-200 dark:border-purple-800">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Dedicated Educational Summit & Event Operations</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Automated Certificate Approval & Distribution
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mt-5 leading-relaxed font-normal">
            Upload attendance spreadsheets or check-in PDFs. Automatically evaluate eligibility,
            synthesize personalized high-resolution certificates, and dispatch directly to student
            inboxes with verifiable SHA-256 credentials.
          </p>

          {/* Public Verification Box */}
          <div className="mt-8 max-w-xl mx-auto bg-white dark:bg-slate-900 p-2.5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
            <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={certQuery}
                  onChange={(e) => setCertQuery(e.target.value)}
                  placeholder="Enter a real Certificate ID"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Credential</span>
              </button>
            </form>

          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base mb-2">Smart Attendance Parsing</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Accepts CSV and PDF formats with dynamic column matching. Computes attendance compliance
              enforcing check-in & check-out validation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base mb-2">Visual Template Studio</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Upload custom certificate artwork (PDF / PNG). Place dynamic placeholders like &#123;&#123;NAME&#125;&#125;
              and preview using an actual participant from your imported attendance data.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 flex items-center justify-center mb-4">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base mb-2">Lifecycle & Dispatch</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Batch review eligible candidates. Track statuses in real-time from PENDING to APPROVED,
              GENERATING, and SENT with delivery audit logging.
            </p>
          </div>
        </div>

        {/* Workflow Strip */}
        <div className="mt-14 p-6 rounded-2xl bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-purple-950/90 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="font-bold text-lg">Coordinator Administration Portal</h4>
            <p className="text-xs text-purple-200 mt-1">
              Ready to process your real attendee records? Secure login with role-based access.
            </p>
          </div>
          <Link
            to="/admin/login"
            className="px-6 py-3 rounded-xl bg-white text-purple-900 hover:bg-purple-50 font-bold text-xs shadow-lg transition-colors whitespace-nowrap"
          >
            Sign In to Admin Workspace →
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 px-6 text-center text-xs text-slate-400">
        <p>CertificateFlow • Automated Certificate Approval & Distribution Secretariat</p>
      </footer>
    </div>
  );
};
