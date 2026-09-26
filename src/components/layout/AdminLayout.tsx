import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  FileSpreadsheet,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  AlertTriangle,
  Users,
  Mail,
  ShieldCheck,
  Settings,
  Bell,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Search,
  ExternalLink,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { Modal } from '../common/Modal';
import { QuickApproveWidget } from '../common/QuickApproveWidget';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [certDropdownOpen, setCertDropdownOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [quickIssueModalOpen, setQuickIssueModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/admin/participants?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/import', label: 'Import Data', icon: UploadCloud },
    { to: '/admin/templates', label: 'Templates', icon: Award },
    {
      label: 'Certificates',
      icon: Award,
      isDropdown: true,
      children: [
        { to: '/admin/certificates', label: 'All Certificates' },
        { to: '/admin/certificates/pending', label: 'Pending Approval', badge: 'Review' },
        { to: '/admin/certificates/approved', label: 'Approved' },
        { to: '/admin/certificates/rejected', label: 'Rejected' },
        { to: '/admin/certificates/sent', label: 'Sent' },
        { to: '/admin/certificates/failed', label: 'Failed Ops', alert: true },
      ],
    },
    { to: '/admin/participants', label: 'Participants', icon: Users },
    { to: '/admin/emails', label: 'Emails', icon: Mail },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: ShieldCheck },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header / Branding */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
              <Award className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent">
                  CertificateFlow
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-semibold">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Automated Certificate Portal</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1.5">
          {navLinks.map((item, idx) => {
            if (item.isDropdown) {
              const isChildActive = item.children?.some((c) => location.pathname === c.to);
              return (
                <div key={idx} className="pt-2">
                  <button
                    onClick={() => setCertDropdownOpen(!certDropdownOpen)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isChildActive
                        ? 'text-purple-700 dark:text-purple-300 bg-purple-50/70 dark:bg-purple-950/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Award className="w-4 h-4 text-purple-600" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        certDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {certDropdownOpen && (
                    <div className="mt-1 ml-4 pl-4 border-l border-slate-200 dark:border-slate-800 space-y-1">
                      {item.children?.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          onClick={() => setSidebarOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                              isActive
                                ? 'bg-purple-600 text-white shadow-sm font-semibold'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <span>{child.label}</span>
                              {child.alert && (
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    isActive ? 'bg-white' : 'bg-rose-500'
                                  }`}
                                />
                              )}
                              {child.badge && !isActive && (
                                <span className="text-[10px] px-1.5 py-0.2 bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded-full font-semibold">
                                  {child.badge}
                                </span>
                              )}
                            </>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            const Icon = item.icon!;
            return (
              <NavLink
                key={item.to!}
                to={item.to!}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Public verification shortcut link */}
        <div className="p-4 mx-4 mb-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/60">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-purple-900 dark:text-purple-200">
              Public Portal
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-[11px] text-purple-700/80 dark:text-purple-300/80 mb-2">
            Instant certificate authenticity search for students.
          </p>
          <a
            href="/verify"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-purple-700 dark:text-purple-300 hover:underline flex items-center gap-1"
          >
            Open Verification Page →
          </a>
        </div>

        {/* Sidebar Footer User info */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center font-bold text-purple-700 dark:text-purple-300 text-sm">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="truncate max-w-[120px]">
              <p className="text-xs font-bold truncate">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || 'Administrator'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Navigation */}
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search */}
            <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center relative w-64 lg:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search participant, roll no, certificate ID..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </form>

            {/* Quick Approve by Roll No / Email ID Trigger Button */}
            <button
              type="button"
              onClick={() => setQuickIssueModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-950 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Enter roll number or email to approve & send immediately"
            >
              <Send className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden sm:inline">Approve by Roll / Email</span>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications Center */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-2 relative text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-600 ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>

              {/* Dropdown Popover */}
              {notifOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h4 className="font-bold text-sm">Notifications</h4>
                      <p className="text-[11px] text-slate-400">{unreadCount} unread announcements</p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] font-semibold text-purple-600 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-80 overflow-y-auto mt-2">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markAsRead(n.id);
                          if (n.link) navigate(n.link);
                          setNotifOpen(false);
                        }}
                        className={`py-3 px-2 rounded-lg cursor-pointer transition-colors ${
                          !n.read
                            ? 'bg-purple-50/60 dark:bg-purple-950/20'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <p className="text-xs font-semibold">{n.title}</p>
                          <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <span className="text-xs font-semibold hidden md:inline-block">
                  {user?.name?.split(' ')[0] || 'Admin'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold">{user?.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                    <span className="inline-block mt-1 text-[9px] uppercase font-mono px-1.5 py-0.2 bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded font-semibold">
                      {user?.role}
                    </span>
                  </div>
                  <NavLink
                    to="/admin/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 mt-1 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Settings className="w-4 h-4" />
                    <span>System Settings</span>
                  </NavLink>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Quick Issue Modal */}
      {quickIssueModalOpen && (
        <Modal
          isOpen={quickIssueModalOpen}
          onClose={() => setQuickIssueModalOpen(false)}
          title="Direct Certificate Approval & Email Dispatch"
          subtitle="Instant issuance by Roll Number or Email ID"
          maxWidth="2xl"
        >
          <QuickApproveWidget
            onSuccess={() => {}}
            compact={false}
          />
        </Modal>
      )}
    </div>
  );
};
