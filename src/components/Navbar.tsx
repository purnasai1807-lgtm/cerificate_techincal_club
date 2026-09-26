import React, { useState } from 'react';
import { 
  Terminal, 
  ShieldCheck, 
  User as UserIcon, 
  LogOut, 
  Bell, 
  Activity, 
  Calendar, 
  Ticket, 
  Sparkles,
  Menu,
  X,
  Server
} from 'lucide-react';
import { User, NotificationItem } from '../types';

interface NavbarProps {
  currentUser: User | null;
  activeTab: 'home' | 'events' | 'student-portal' | 'admin-dashboard' | 'load-balancer';
  setActiveTab: (tab: 'home' | 'events' | 'student-portal' | 'admin-dashboard' | 'load-balancer') => void;
  onOpenAuth: (initialMode?: 'login' | 'register') => void;
  onLogout: () => void;
  notifications: NotificationItem[];
  onOpenRegisterModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onLogout,
  notifications,
  onOpenRegisterModal,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0b0f17]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand / Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('home')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 p-[2px] shadow-lg shadow-cyan-500/10 group-hover:shadow-cyan-500/25 transition-all duration-300">
              <div className="w-full h-full bg-[#0b0f17] rounded-[10px] flex items-center justify-center">
                <Terminal className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  SYNAPSE CLUB
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded font-mono font-semibold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                  WiDS × ACEEC
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Technical Events & Registration Portal</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <button
              id="nav-tab-home"
              onClick={() => setActiveTab('home')}
              className={`px-3.5 py-2 rounded-lg transition-colors ${
                activeTab === 'home'
                  ? 'bg-slate-800/80 text-cyan-400 shadow-sm border border-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              Workshop
            </button>
            <button
              id="nav-tab-events"
              onClick={() => setActiveTab('events')}
              className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'events'
                  ? 'bg-slate-800/80 text-cyan-400 shadow-sm border border-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              All Tech Events
            </button>
            
            {currentUser && (
              <button
                id="nav-tab-portal"
                onClick={() => setActiveTab('student-portal')}
                className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'student-portal'
                    ? 'bg-slate-800/80 text-cyan-400 shadow-sm border border-cyan-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Ticket className="w-4 h-4 text-emerald-400" />
                My Passes
              </button>
            )}

            {currentUser?.role === 'admin' ? (
              <button
                id="nav-tab-admin"
                onClick={() => setActiveTab('admin-dashboard')}
                className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'admin-dashboard'
                    ? 'bg-fuchsia-950/60 text-fuchsia-300 border border-fuchsia-500/40 shadow-sm'
                    : 'text-fuchsia-300/90 hover:text-fuchsia-200 hover:bg-fuchsia-950/30'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-fuchsia-400" />
                Admin Console
              </button>
            ) : null}

            <button
              id="nav-tab-load-balancer"
              onClick={() => setActiveTab('load-balancer')}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-mono ${
                activeTab === 'load-balancer'
                  ? 'bg-cyan-950/50 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/30'
              }`}
              title="View Distributed Horizontal Scaling & 2,000+ Concurrency Status"
            >
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cluster 2k+</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center gap-3">
            {/* Quick Register CTA */}
            <button
              id="quick-register-nav-btn"
              onClick={onOpenRegisterModal}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Register Now
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                id="notification-bell-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 relative transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-cyan-400 rounded-full ring-2 ring-[#0b0f17] animate-pulse" />
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl shadow-black/80 backdrop-blur-xl z-50 p-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-cyan-400" />
                      <h4 className="font-semibold text-sm text-white">Event Broadcasts & Alerts</h4>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {notifications.length} updates
                    </span>
                  </div>

                  <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-slate-600/80 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-semibold text-cyan-300">{n.title}</span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800 text-center">
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      Close notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Auth / Profile Area */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-200 truncate max-w-[120px]">
                    {currentUser.fullName}
                  </span>
                  <span className={`text-[10px] font-mono font-semibold uppercase ${
                    currentUser.role === 'admin' ? 'text-fuchsia-400' : 'text-cyan-400'
                  }`}>
                    {currentUser.role === 'admin' ? 'Super Admin' : currentUser.rollNumber || 'Student'}
                  </span>
                </div>
                <button
                  id="user-logout-btn"
                  onClick={onLogout}
                  title="Logout (Invalidates session token on server)"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="login-trigger-btn"
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-colors"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Mobile Hamburger Menu */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900/95 px-4 pt-3 pb-5 space-y-2 backdrop-blur-xl">
          <button
            onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'home' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300'
            }`}
          >
            WiDS Workshop
          </button>
          <button
            onClick={() => { setActiveTab('events'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'events' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300'
            }`}
          >
            All Technical Events
          </button>
          {currentUser && (
            <button
              onClick={() => { setActiveTab('student-portal'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                activeTab === 'student-portal' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300'
              }`}
            >
              <Ticket className="w-4 h-4 text-emerald-400" />
              My Passes & Tickets
            </button>
          )}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => { setActiveTab('admin-dashboard'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                activeTab === 'admin-dashboard' ? 'bg-fuchsia-500/20 text-fuchsia-300' : 'text-fuchsia-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-fuchsia-400" />
              Admin Console (Full Control)
            </button>
          )}
          <button
            onClick={() => { setActiveTab('load-balancer'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-mono flex items-center gap-2 ${
              activeTab === 'load-balancer' ? 'bg-cyan-950/60 text-cyan-300' : 'text-slate-400'
            }`}
          >
            <Server className="w-4 h-4 text-cyan-400" />
            Distributed 2k+ Load Balancer
          </button>
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => { onOpenRegisterModal(); setMobileMenuOpen(false); }}
              className="w-full py-2.5 rounded-lg text-center font-semibold text-sm bg-gradient-to-r from-cyan-500 to-indigo-600 text-white"
            >
              Register for Events
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
