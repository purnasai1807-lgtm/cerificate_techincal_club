import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Download, 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  ShieldCheck, 
  BarChart2, 
  ArrowUpDown, 
  FileSpreadsheet, 
  FileText, 
  Bell, 
  AlertTriangle, 
  Eye, 
  Lock, 
  Server, 
  Check, 
  Calendar,
  Sparkles,
  TrendingUp,
  Cpu,
  Layers,
  ChevronDown,
  Plus,
  Code2,
  Edit3,
  MapPin,
  Clock,
  DollarSign,
  Ticket,
  PartyPopper,
  Flame,
  QrCode
} from 'lucide-react';
import { StudentRegistration, AnalyticsData, User, EventItem } from '../types';
import { api } from '../services/api';
import { EventFormModal } from './EventFormModal';
import { RegistrationGrowthChart } from './RegistrationGrowthChart';
import { EventAttendanceQR } from './EventAttendanceQR';

interface AdminDashboardProps {
  currentUser: User | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenPrintRoster: (students: StudentRegistration[]) => void;
  onTriggerCelebration?: (celebration: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onOpenAuth,
  onOpenPrintRoster,
  onTriggerCelebration,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'events' | 'students' | 'analytics' | 'attendance-qr'>('events');
  const [selectedEventForQr, setSelectedEventForQr] = useState<string | undefined>(undefined);
  const [students, setStudents] = useState<StudentRegistration[]>([]);
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGrowthInAttendees, setShowGrowthInAttendees] = useState(true);

  // Celebration Fireworks States
  const [celebrateModalOpen, setCelebrateModalOpen] = useState(false);
  const [selectedEventToCelebrate, setSelectedEventToCelebrate] = useState<EventItem | null>(null);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const [isSubmittingCelebration, setIsSubmittingCelebration] = useState(false);
  const [celebrateSuccessToast, setCelebrateSuccessToast] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [attendedFilter, setAttendedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Modals inside Admin
  const [selectedStudent, setSelectedStudent] = useState<StudentRegistration | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentRegistration | null>(null);
  
  // Event Management Modal
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<EventItem | null>(null);
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);

  // Broadcast Modal
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'update' | 'reminder' | 'announcement'>('update');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Load Data
  const fetchData = async () => {
    if (currentUser?.role !== 'admin') return;
    setLoading(true);
    try {
      const [studRes, analRes, evRes] = await Promise.all([
        api.getAdminStudents({
          search,
          year: yearFilter,
          section: sectionFilter,
          eventId: eventFilter,
          attended: attendedFilter,
          sort: sortBy,
        }),
        api.getAdminAnalytics(),
        api.getEvents(),
      ]);
      setStudents(studRes.students);
      setAnalytics(analRes);
      setEventsList(evRes);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser, search, yearFilter, sectionFilter, eventFilter, attendedFilter, sortBy]);

  // Handle Attendance Toggle
  const handleToggleCheckIn = async (studentId: string) => {
    try {
      const res = await api.toggleCheckIn(studentId);
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, attended: res.attended, checkInTime: res.checkInTime } : s))
      );
      api.getAdminAnalytics().then(setAnalytics).catch(() => {});
    } catch (err: any) {
      alert(err.message || 'Failed to update attendance.');
    }
  };

  // Handle Delete Student
  const handleConfirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      await api.deleteStudent(studentToDelete.id);
      setStudents((prev) => prev.filter((s) => s.id !== studentToDelete.id));
      setStudentToDelete(null);
      api.getAdminAnalytics().then(setAnalytics).catch(() => {});
    } catch (err: any) {
      alert(err.message || 'Failed to delete registration.');
    }
  };

  // Handle Delete Event
  const handleConfirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    try {
      await api.deleteEvent(eventToDelete.id);
      setEventsList((prev) => prev.filter((e) => e.id !== eventToDelete.id));
      setEventToDelete(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete event.');
    }
  };

  // Handle CSV Download
  const handleDownloadCsv = async () => {
    try {
      const url = await api.getDownloadCsvUrl();
      const a = document.createElement('a');
      a.href = url;
      a.download = 'WiDS_Technical_Registrations.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'CSV download failed.');
    }
  };

  // Handle Broadcast Notification
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    try {
      await api.broadcastNotification({
        title: broadcastTitle,
        message: broadcastMessage,
        type: broadcastType,
      });
      setBroadcastSuccess(true);
      setTimeout(() => {
        setBroadcastSuccess(false);
        setBroadcastModalOpen(false);
        setBroadcastTitle('');
        setBroadcastMessage('');
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to send broadcast.');
    }
  };

  // Launch Site-Wide Fireworks Celebration for Event Success
  const handleLaunchCelebration = async (event?: EventItem, customMsg?: string) => {
    setIsSubmittingCelebration(true);
    try {
      const targetEvent = event || selectedEventToCelebrate || (eventsList.length > 0 ? eventsList[0] : null);
      const title = targetEvent ? targetEvent.title : 'Technical Events Milestone';
      const msg = customMsg || celebrationMessage || `Administrator ${currentUser?.username || 'Admin'} announced the successful milestone of ${title}! Let the celebration begin!`;

      const res = await api.triggerCelebration({
        eventId: targetEvent?.id,
        eventTitle: title,
        message: msg,
      });

      if (onTriggerCelebration) {
        onTriggerCelebration(res.celebration);
      }

      setCelebrateSuccessToast(`🎆 Fireworks launched across the entire website for ${title}!`);
      setCelebrateModalOpen(false);
      setCelebrationMessage('');
      setTimeout(() => setCelebrateSuccessToast(null), 4500);
    } catch (err: any) {
      alert(err.message || 'Failed to trigger celebration fireworks.');
    } finally {
      setIsSubmittingCelebration(false);
    }
  };

  // If not admin, show guard
  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-amber-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Administrator Access Required</h3>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          Access to the administrative dashboard, student rosters, event creation, CSV export, and attendance records is restricted to authenticated coordinators.
        </p>
        <button
          onClick={() => onOpenAuth('login')}
          className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
        >
          Login as Administrator
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ROLE-BASED ACCESS CONTROL • ACTIVE</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Admin: {currentUser.username}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Administrative Oversight & Event Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Post and manage technical events, monitor student check-ins, and export verified rosters.
          </p>
        </div>

        {/* Top Control Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setEventToEdit(null);
              setEventModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Post Technical Event</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('attendance-qr')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 transition-colors shadow-sm"
            title="Display Venue Attendance QR Code & Kiosk"
          >
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span>Venue Attendance QR</span>
          </button>

          <button
            onClick={() => setBroadcastModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Bell className="w-4 h-4 text-cyan-400" />
            <span>Broadcast Alert</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 transition-colors shadow-sm"
            title="Download Registrations CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => onOpenPrintRoster(students)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-4 h-4 text-fuchsia-400" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Admin Module Tabs */}
      <div className="flex items-center gap-2 my-6 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveAdminTab('events')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
            activeAdminTab === 'events'
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Technical Events</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-black/40">
            {eventsList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveAdminTab('students')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
            activeAdminTab === 'students'
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Attendees & Registrations</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-black/40">
            {students.length}
          </span>
        </button>

        <button
          onClick={() => setActiveAdminTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
            activeAdminTab === 'analytics'
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Analytics & Revenue</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('attendance-qr')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
            activeAdminTab === 'attendance-qr'
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <QrCode className="w-4 h-4 text-cyan-400" />
          <span>Venue Attendance QR</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Live
          </span>
        </button>
      </div>

      {/* TAB 1: TECHNICAL EVENTS MANAGEMENT */}
      {activeAdminTab === 'events' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Technical Events Control Center</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Admin posts, edits, or archives technical workshops, hackathons, coding bootcamps, and seminars.
              </p>
            </div>
            <button
              onClick={() => {
                setEventToEdit(null);
                setEventModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Technical Event</span>
            </button>
          </div>

          {eventsList.length === 0 ? (
            <div className="p-10 rounded-2xl bg-slate-900/60 border border-slate-800 text-center max-w-xl mx-auto my-6">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 text-cyan-400">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No Technical Events Posted At Present</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                Technical events are published directly by the administrator. Click the button below to publish your first technical workshop, hackathon, or seminar.
              </p>
              <button
                onClick={() => {
                  setEventToEdit(null);
                  setEventModalOpen(true);
                }}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 shadow-lg shadow-cyan-500/25 inline-flex items-center gap-2 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Post Technical Event Now</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {eventsList.map((ev) => {
                const fillPercent = Math.min(100, Math.round(((ev.registeredCount || 0) / (ev.capacity || 1)) * 100));
                return (
                  <div
                    key={ev.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          {ev.category}
                        </span>
                        {ev.isFlagship && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                            ★ Flagship
                          </span>
                        )}
                        <span className="text-xs font-mono font-bold text-emerald-400 ml-auto">
                          {ev.price === 0 ? 'FREE' : `₹${ev.price}`}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white leading-snug line-clamp-2">
                        {ev.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {ev.tagline || ev.description}
                      </p>

                      <div className="mt-4 space-y-1.5 text-xs text-slate-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="truncate">{ev.dates}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                          <span className="truncate">{ev.venue}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">{ev.targetAudience}</span>
                        </div>
                      </div>

                      {/* Capacity Progress Bar */}
                      <div className="mt-4 pt-3 border-t border-slate-800">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-400 font-mono">Registrations</span>
                          <span className="text-cyan-300 font-mono font-semibold">
                            {ev.registeredCount || 0} / {ev.capacity} ({fillPercent}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
                            style={{ width: `${fillPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEventFilter(ev.id);
                            setActiveAdminTab('students');
                          }}
                          className="text-xs font-semibold text-cyan-400 hover:underline"
                        >
                          Attendees
                        </button>
                        <span className="text-slate-600">•</span>
                        <button
                          onClick={() => {
                            setSelectedEventForQr(ev.id);
                            setActiveAdminTab('attendance-qr');
                          }}
                          className="px-2 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/30 transition-colors flex items-center gap-1 text-[11px] font-medium"
                          title="View Attendance QR Code"
                        >
                          <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Venue QR</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEventToEdit(ev);
                            setEventModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="Edit Event Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEventToDelete(ev)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition-colors"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ATTENDEES & REGISTRATIONS */}
      {activeAdminTab === 'students' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
              <span className="text-[11px] font-mono text-slate-400 block uppercase">Total Registrations</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">
                  {analytics?.totalRegistrations ?? 0}
                </span>
                <span className="text-[11px] font-semibold text-emerald-400">+12%</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Live across all events</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
              <span className="text-[11px] font-mono text-cyan-400 block uppercase">1st Year CSD</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">
                  {analytics?.firstYearCount ?? 0}
                </span>
                <span className="text-[10px] text-slate-400">Students</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Registered</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
              <span className="text-[11px] font-mono text-indigo-400 block uppercase">2nd Year CSD</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">
                  {analytics?.secondYearCount ?? 0}
                </span>
                <span className="text-[10px] text-slate-400">Students</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Registered</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
              <span className="text-[11px] font-mono text-fuchsia-400 block uppercase">Today's Registrations</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">
                  {analytics?.todayRegistrations ?? 0}
                </span>
                <span className="text-[10px] font-semibold text-emerald-400">Active</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Last 24 hours</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm col-span-2 lg:col-span-1">
              <span className="text-[11px] font-mono text-emerald-400 block uppercase">Total Revenue</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">
                  ₹{analytics?.totalRevenue ?? 0}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Hackathons & Bootcamps</span>
            </div>
          </div>

          {/* Collapsible Registration Growth Chart for Attendees */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold uppercase text-slate-400">
                  Registration Trajectory
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  Interactive Recharts
                </span>
              </div>
              <button
                onClick={() => setShowGrowthInAttendees((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  showGrowthInAttendees
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>{showGrowthInAttendees ? 'Collapse Chart' : 'Expand Growth Chart'}</span>
              </button>
            </div>

            {showGrowthInAttendees && (
              <RegistrationGrowthChart
                students={students}
                events={eventsList}
                analytics={analytics}
              />
            )}
          </div>

          {/* Filter and Search Bar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex flex-col md:flex-row items-center gap-3">
              {/* Search */}
              <div className="relative w-full md:flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Name, Roll No (e.g. 25AG1A6701), Email, or Reg ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              {/* Filter: Event */}
              {eventsList.length > 0 && (
                <select
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                  className="w-full md:w-44 px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Events ({eventsList.length})</option>
                  {eventsList.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title.slice(0, 30)}...
                    </option>
                  ))}
                </select>
              )}

              {/* Filter: Year */}
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full md:w-32 px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Years</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>

              {/* Filter: Section */}
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="w-full md:w-32 px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
                <option value="Other">Other</option>
              </select>

              {/* Filter: Attendance */}
              <select
                value={attendedFilter}
                onChange={(e) => setAttendedFilter(e.target.value)}
                className="w-full md:w-36 px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Attendance</option>
                <option value="true">Checked In</option>
                <option value="false">Pending</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full md:w-36 px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Sort by Name</option>
                <option value="roll">Sort by Roll No</option>
              </select>
            </div>
          </div>

          {/* Registrations Table */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-300 font-mono text-[11px] uppercase border-b border-slate-700/80">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Reg ID</th>
                    <th className="py-3.5 px-4 font-semibold">Student Name</th>
                    <th className="py-3.5 px-4 font-semibold">Email</th>
                    <th className="py-3.5 px-4 font-semibold">Phone</th>
                    <th className="py-3.5 px-4 font-semibold">Roll Number</th>
                    <th className="py-3.5 px-3 font-semibold">Year</th>
                    <th className="py-3.5 px-3 font-semibold">Sec</th>
                    <th className="py-3.5 px-4 font-semibold">Registered At</th>
                    <th className="py-3.5 px-3 font-semibold text-center">Attendance</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-sans">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400 whitespace-nowrap">
                        {student.registrationId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                        {student.fullName}
                      </td>
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap font-mono text-[11px]">
                        {student.email}
                      </td>
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap font-mono text-[11px]">
                        {student.phone}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-300 whitespace-nowrap">
                        {student.rollNumber}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-200 border border-slate-700">
                          {student.year}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-800/50">
                          {student.section}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        {new Date(student.registeredAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleCheckIn(student.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1 mx-auto ${
                            student.attended
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white hover:border-slate-600'
                          }`}
                        >
                          {student.attended ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                              <span>Present</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-500" />
                              <span>Pending</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-colors"
                            title="View Full Profile & Pass"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setStudentToDelete(student)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition-colors"
                            title="Delete Student Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {students.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold">No student registrations found.</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {eventsList.length === 0 
                      ? 'No technical events have been published yet. Post an event first to receive registrations.'
                      : 'Try adjusting your filters or searching for another roll number.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ANALYTICS & INSIGHTS */}
      {activeAdminTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-mono text-slate-400 uppercase">Total Capacity Filled</span>
              <div className="mt-2 text-2xl font-bold text-white">
                {analytics?.totalRegistrations ?? 0} Students
              </div>
              <p className="text-xs text-slate-400 mt-1">Across all published technical events</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-mono text-cyan-400 uppercase">Overall Attendance</span>
              <div className="mt-2 text-2xl font-bold text-white">
                {analytics?.attendanceRate ?? 0}%
              </div>
              <p className="text-xs text-slate-400 mt-1">In-person check-in rate</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-mono text-emerald-400 uppercase">Paid Gross Revenue</span>
              <div className="mt-2 text-2xl font-bold text-emerald-300">
                ₹{analytics?.totalRevenue ?? 0}
              </div>
              <p className="text-xs text-slate-400 mt-1">Processed via Razorpay gateway</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-mono text-fuchsia-400 uppercase">CSD Participation</span>
              <div className="mt-2 text-2xl font-bold text-white">
                {(analytics?.firstYearCount ?? 0) + (analytics?.secondYearCount ?? 0)}
              </div>
              <p className="text-xs text-slate-400 mt-1">1st & 2nd year CSD students</p>
            </div>
          </div>

          {/* Section Distribution */}
          {analytics && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <h4 className="text-sm font-bold text-white mb-4">CSD Section-wise Breakdown</h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <span className="text-[11px] text-slate-400 block font-mono">Section A</span>
                  <span className="text-xl font-bold text-white font-mono mt-1 block">
                    {analytics.sectionBreakdown?.A ?? 0}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <span className="text-[11px] text-slate-400 block font-mono">Section B</span>
                  <span className="text-xl font-bold text-white font-mono mt-1 block">
                    {analytics.sectionBreakdown?.B ?? 0}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <span className="text-[11px] text-slate-400 block font-mono">Section C</span>
                  <span className="text-xl font-bold text-white font-mono mt-1 block">
                    {analytics.sectionBreakdown?.C ?? 0}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <span className="text-[11px] text-slate-400 block font-mono">Section D</span>
                  <span className="text-xl font-bold text-white font-mono mt-1 block">
                    {analytics.sectionBreakdown?.D ?? 0}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <span className="text-[11px] text-slate-400 block font-mono">Other / Guests</span>
                  <span className="text-xl font-bold text-white font-mono mt-1 block">
                    {analytics.sectionBreakdown?.Other ?? 0}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Registration Growth & Daily Velocity Chart (Recharts) */}
          <RegistrationGrowthChart
            students={students}
            events={eventsList}
            analytics={analytics}
          />
        </div>
      )}

      {/* TAB 4: VENUE ATTENDANCE QR KIOSK & SCANNER */}
      {activeAdminTab === 'attendance-qr' && (
        <EventAttendanceQR
          events={eventsList}
          students={students}
          selectedEventId={selectedEventForQr}
          onSelectEvent={(id) => setSelectedEventForQr(id)}
          onRefreshData={fetchData}
        />
      )}

      {/* MODAL: Post / Edit Technical Event */}
      <EventFormModal
        isOpen={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        initialData={eventToEdit}
        onSaveSuccess={() => {
          fetchData();
        }}
      />

      {/* MODAL: Delete Event Confirmation */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-rose-500/40 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Delete Technical Event?</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">"{eventToDelete.title}"</strong>? All attendee records for this event will also be permanently deleted.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setEventToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteEvent}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/20"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Delete Student Confirmation */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-rose-500/40 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Delete Registration Record?</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Are you sure you want to delete the registration for <strong className="text-white">{studentToDelete.fullName}</strong> ({studentToDelete.rollNumber})? This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteStudent}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/20"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: View Full Student Details */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase">Registration ID</span>
                <h4 className="text-lg font-bold text-white">{selectedStudent.registrationId}</h4>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Full Name</span>
                <span className="font-bold text-white">{selectedStudent.fullName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Roll Number</span>
                <span className="font-mono font-bold text-amber-300">{selectedStudent.rollNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Year & Section</span>
                <span className="font-mono text-white">{selectedStudent.year} • Section {selectedStudent.section}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Email Address</span>
                <span className="font-mono text-slate-300">{selectedStudent.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Phone Number</span>
                <span className="font-mono text-slate-300">{selectedStudent.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Event Title</span>
                <span className="text-white text-right max-w-[200px] truncate">{selectedStudent.eventTitle}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Attendance Status</span>
                <span className={selectedStudent.attended ? 'font-bold text-emerald-400' : 'text-slate-400'}>
                  {selectedStudent.attended ? 'Present (Checked In)' : 'Pending'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Broadcast Notification */}
      {broadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Broadcast Notification</h3>
            <p className="text-xs text-slate-400 mb-4">
              Send an instant system-wide notification to all registered attendees.
            </p>

            {broadcastSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-center text-emerald-300 text-xs font-bold">
                ✓ Notification broadcasted successfully!
              </div>
            ) : (
              <form onSubmit={handleBroadcast} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Alert Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WiDS Workshop Room Assignment"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Message Content</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Important update or reminder for attendees..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Type</label>
                  <select
                    value={broadcastType}
                    onChange={(e) => setBroadcastType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  >
                    <option value="update">Update (Normal)</option>
                    <option value="reminder">Reminder</option>
                    <option value="announcement">Urgent Announcement</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setBroadcastModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-xs font-bold text-white shadow-md hover:from-cyan-400 hover:to-indigo-500"
                  >
                    Send to All Attendees
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
