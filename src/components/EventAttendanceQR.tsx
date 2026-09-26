import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Maximize2,
  Minimize2,
  Printer,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Users,
  CheckCircle2,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  ExternalLink,
  Search,
  UserCheck,
  AlertCircle,
  Volume2,
  Info
} from 'lucide-react';
import { EventItem, StudentRegistration, EventQrInfo } from '../types';
import { api } from '../services/api';
import { VenueCheckInModal } from './VenueCheckInModal';

interface EventAttendanceQRProps {
  events: EventItem[];
  students: StudentRegistration[];
  selectedEventId?: string;
  onSelectEvent?: (eventId: string) => void;
  onRefreshData?: () => void;
}

export const EventAttendanceQR: React.FC<EventAttendanceQRProps> = ({
  events,
  students,
  selectedEventId: propSelectedEventId,
  onSelectEvent,
  onRefreshData,
}) => {
  const [selectedId, setSelectedId] = useState<string>(
    propSelectedEventId || (events.length > 0 ? events[0].id : '')
  );
  const [kioskMode, setKioskMode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [venueToken, setVenueToken] = useState<string>('');
  const [tokenRefreshing, setTokenRefreshing] = useState(false);
  const [qrMeta, setQrMeta] = useState<EventQrInfo | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);

  // Manual fast check-in by admin
  const [manualInput, setManualInput] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [manualStatus, setManualStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Preview Student Check-in Modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Search in attended list
  const [attendeeSearch, setAttendeeSearch] = useState('');

  // Live time for Kiosk mode
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  const qrContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update selected event if prop changes
  useEffect(() => {
    if (propSelectedEventId && propSelectedEventId !== selectedId) {
      setSelectedId(propSelectedEventId);
    }
  }, [propSelectedEventId]);

  // Load QR info and token from server
  const loadQrInfo = async (id: string) => {
    if (!id) return;
    setLoadingMeta(true);
    try {
      const data = await api.getEventQrInfo(id);
      setQrMeta(data);
      setVenueToken(data.token);
    } catch (err) {
      console.error('Failed to load event QR metadata:', err);
    } finally {
      setLoadingMeta(false);
    }
  };

  useEffect(() => {
    if (selectedId) {
      loadQrInfo(selectedId);
    }
  }, [selectedId]);

  const currentEvent = events.find((e) => e.id === selectedId) || events[0] || null;

  // Filter students for this event
  const eventStudents = currentEvent
    ? students.filter((s) => s.eventId === currentEvent.id)
    : [];
  const attendedStudents = eventStudents.filter((s) => s.attended);
  const attendanceRate = eventStudents.length > 0
    ? Math.round((attendedStudents.length / eventStudents.length) * 100)
    : 0;

  // Filtered recent attended list
  const filteredAttended = attendedStudents.filter((s) => {
    if (!attendeeSearch.trim()) return true;
    const q = attendeeSearch.toLowerCase();
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.rollNumber.toLowerCase().includes(q) ||
      s.registrationId.toLowerCase().includes(q) ||
      s.section.toLowerCase().includes(q)
    );
  });

  // Construct check-in URL for QR code
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://aceec.ac.in';
  const checkInUrl = `${origin}/#checkin?event=${currentEvent?.id || ''}&token=${venueToken || 'live'}`;

  // Copy check-in link to clipboard
  const handleCopyLink = () => {
    if (!checkInUrl) return;
    navigator.clipboard.writeText(checkInUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Refresh venue security token
  const handleRefreshToken = async () => {
    if (!currentEvent) return;
    setTokenRefreshing(true);
    try {
      const res = await api.refreshEventVenueToken(currentEvent.id);
      setVenueToken(res.token);
      loadQrInfo(currentEvent.id);
    } catch (err) {
      console.error('Failed to refresh token:', err);
    } finally {
      setTokenRefreshing(false);
    }
  };

  // Download QR Code as PNG image
  const handleDownloadQr = () => {
    if (!qrContainerRef.current) return;
    const svgElement = qrContainerRef.current.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 600;
    canvas.height = 600;

    img.onload = () => {
      if (!ctx) return;
      // White background for print/scan clarity
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 50, 50, 500, 500);

      const a = document.createElement('a');
      a.download = `ACEEC-Attendance-QR-${currentEvent?.id || 'event'}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };

    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  };

  // Print Venue Attendance Poster
  const handlePrintPoster = () => {
    if (!currentEvent) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the printable attendance poster.');
      return;
    }

    const svgElement = qrContainerRef.current?.querySelector('svg');
    const svgHtml = svgElement ? svgElement.outerHTML : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>ACEEC Venue Attendance Poster — ${currentEvent.title}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 20px;
            text-align: center;
          }
          .poster {
            border: 3px solid #0f172a;
            border-radius: 20px;
            padding: 30px;
            max-width: 680px;
            margin: 0 auto;
          }
          .header-badge {
            display: inline-block;
            background: #0f172a;
            color: #ffffff;
            font-weight: 700;
            font-size: 13px;
            padding: 6px 16px;
            border-radius: 9999px;
            letter-spacing: 1px;
            margin-bottom: 15px;
          }
          .college-title {
            font-size: 22px;
            font-weight: 800;
            color: #1e293b;
            margin: 0 0 6px 0;
            text-transform: uppercase;
          }
          .club-sub {
            font-size: 14px;
            color: #475569;
            margin-bottom: 20px;
          }
          .event-card {
            background: #f8fafc;
            border: 2px dashed #cbd5e1;
            border-radius: 16px;
            padding: 16px;
            margin: 15px 0 25px 0;
          }
          .event-title {
            font-size: 26px;
            font-weight: 900;
            color: #0f172a;
            margin: 0 0 8px 0;
            line-height: 1.2;
          }
          .event-meta {
            font-size: 15px;
            color: #334155;
            font-weight: 600;
          }
          .qr-wrapper {
            display: inline-block;
            background: #ffffff;
            padding: 20px;
            border: 4px solid #0f172a;
            border-radius: 24px;
            margin: 10px 0 20px 0;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          }
          .instructions {
            text-align: left;
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 12px;
            padding: 16px 20px;
            margin-top: 20px;
          }
          .step-item {
            font-size: 14px;
            margin: 6px 0;
            font-weight: 500;
            color: #1e3a8a;
          }
          .footer-note {
            margin-top: 25px;
            font-size: 12px;
            color: #64748b;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="poster">
          <div class="header-badge">VENUE ATTENDANCE & CHECK-IN DESK</div>
          <h1 class="college-title">ACE Engineering College</h1>
          <div class="club-sub">Department of Computer Science & Design • Synapse Club × WiDS ACEEC Chapter</div>
          
          <div class="event-card">
            <h2 class="event-title">${currentEvent.title}</h2>
            <div class="event-meta">
              📍 <strong>${currentEvent.venue}</strong> &nbsp;|&nbsp; 🗓️ <strong>${currentEvent.dates}</strong>
            </div>
          </div>

          <div style="font-size: 18px; font-weight: 800; color: #0284c7; letter-spacing: 0.5px; margin-bottom: 8px;">
            SCAN WITH SMARTPHONE CAMERA TO CHECK IN
          </div>

          <div class="qr-wrapper">
            ${svgHtml}
          </div>

          <div class="instructions">
            <div style="font-weight: 800; font-size: 14px; color: #1e40af; margin-bottom: 6px;">3 QUICK STEPS FOR ARRIVING STUDENTS:</div>
            <div class="step-item">1. Open your default Phone Camera or Google Lens and point at this QR code.</div>
            <div class="step-item">2. Tap the link and enter your 10-character College Roll Number (e.g., 25AG1A6701).</div>
            <div class="step-item">3. Show your green verified screen to the coordinator at the entrance door.</div>
          </div>

          <div class="footer-note">
            Organized with high-concurrency event registration infrastructure. Need assistance? Visit the help desk coordinator.
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Fast manual check-in by admin
  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent || !manualInput.trim()) return;

    setManualLoading(true);
    setManualStatus(null);

    try {
      const res = await api.venueCheckIn(currentEvent.id, manualInput.trim(), venueToken);
      setManualStatus({
        success: true,
        message: `${res.student.fullName} (${res.student.rollNumber}) verified successfully!`,
      });
      setManualInput('');
      loadQrInfo(currentEvent.id);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setManualStatus({
        success: false,
        message: err.message || 'Verification failed. Student may not be registered for this event.',
      });
    } finally {
      setManualLoading(false);
    }
  };

  if (!currentEvent) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400">
        <QrCode className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-1">No Technical Events Available</h3>
        <p className="text-xs">Create or publish a technical event first to generate attendance QR codes.</p>
      </div>
    );
  }

  // ==========================================
  // KIOSK / PROJECTOR FULLSCREEN MODE
  // ==========================================
  if (kioskMode) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-10 overflow-y-auto">
        {/* Top Kiosk Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  VENUE ENTRANCE KIOSK
                </span>
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  LIVE CHECK-IN ACTIVE
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                ACE Engineering College — Venue Check-in Desk
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-mono text-slate-400">Auditorium Clock</span>
              <span className="text-base font-mono font-bold text-cyan-400">{currentTime}</span>
            </div>
            <button
              onClick={() => setKioskMode(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all shadow-md"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Exit Kiosk Mode</span>
            </button>
          </div>
        </div>

        {/* Center Stage: Huge QR & Instructions */}
        <div className="my-auto py-6 max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Event Context & Stats */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-mono uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {currentEvent.category} • {currentEvent.organizer}
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 leading-tight">
                {currentEvent.title}
              </h1>
              <p className="text-sm text-slate-300 mt-2">
                {currentEvent.tagline || currentEvent.description}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-sm">
              <div className="flex items-center gap-2.5 text-slate-200">
                <MapPin className="w-4 h-4 text-fuchsia-400 shrink-0" />
                <span className="font-semibold">{currentEvent.venue}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{currentEvent.dates}</span>
              </div>
            </div>

            {/* Check-In Progress Meter */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-mono text-slate-400 uppercase">Live Checked In:</span>
                <span className="text-lg font-mono font-bold text-emerald-400">
                  {attendedStudents.length} / {eventStudents.length} ({attendanceRate}%)
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-indigo-500 transition-all duration-500"
                  style={{ width: `${attendanceRate}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-2">
                <span>Capacity: {currentEvent.capacity} seats</span>
                <span>Unattended remaining: {Math.max(0, eventStudents.length - attendedStudents.length)}</span>
              </div>
            </div>

            {/* Step-by-step instructions */}
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-slate-300 space-y-2">
              <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                <span>Quick Student Instructions</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-300">
                <li>Point your mobile camera directly at the QR Code on the right.</li>
                <li>Tap the prompt to open the Venue Check-in screen.</li>
                <li>Type your 10-character Hall Ticket / Roll Number (e.g. 25AG1A6701).</li>
                <li>Display the green digital pass to the volunteer at the door.</li>
              </ol>
            </div>
          </div>

          {/* Right Column: Giant QR Frame */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            <div className="p-8 sm:p-10 rounded-3xl bg-white shadow-2xl shadow-cyan-500/20 border-4 border-cyan-400 text-center">
              <div ref={qrContainerRef} className="inline-block">
                <QRCodeSVG
                  value={checkInUrl}
                  size={320}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: 'https://api.dicebear.com/7.x/identicon/svg?seed=ACEEC-SYNAPSE',
                    x: undefined,
                    y: undefined,
                    height: 48,
                    width: 48,
                    excavate: true,
                  }}
                />
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 block">
                  SCAN TO CONFIRM ATTENDANCE
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {currentEvent.id}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => setPreviewModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors"
              >
                Test Check-in Flow
              </button>
              <button
                onClick={handlePrintPoster}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                Print Poster
              </button>
            </div>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="border-t border-slate-800 pt-3 flex flex-wrap items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted Token Verification: {venueToken.slice(0, 14)}...</span>
          </div>
          <div>Department of Computer Science & Design • Synapse Club</div>
        </div>

        {/* Preview Modal in Kiosk */}
        <VenueCheckInModal
          isOpen={previewModalOpen}
          onClose={() => {
            setPreviewModalOpen(false);
            loadQrInfo(currentEvent.id);
            if (onRefreshData) onRefreshData();
          }}
          event={currentEvent}
          events={events}
          venueToken={venueToken}
          onCheckInSuccess={() => {
            loadQrInfo(currentEvent.id);
            if (onRefreshData) onRefreshData();
          }}
        />
      </div>
    );
  }

  // ==========================================
  // STANDARD ADMIN DASHBOARD VIEW
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Component Header & Fast Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5" />
              <span>VENUE SCANNER & ATTENDANCE SYSTEM</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Unique QR per Event
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">
            Event Attendance QR Code & Venue Check-in
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Display or project this unique QR code at the entrance doors or registration desk. Arriving students scan with their mobile phone cameras to verify attendance.
          </p>
        </div>

        {/* Quick Mode Switches */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setKioskMode(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all active:scale-95"
            title="Open Fullscreen Kiosk for Projector Screen or Door Tablet"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Auditorium Kiosk Mode</span>
          </button>

          <button
            onClick={handlePrintPoster}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            title="Print Attendance Flyer for A4 Door Poster"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Print Flyer</span>
          </button>

          <button
            onClick={handleDownloadQr}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            title="Download QR code image as PNG"
          >
            <Download className="w-4 h-4 text-fuchsia-400" />
            <span>Save PNG</span>
          </button>

          <button
            onClick={() => setPreviewModalOpen(true)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
            title="Simulate student scanning experience"
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Test Student Scan</span>
          </button>
        </div>
      </div>

      {/* Event Selector Strip */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-mono font-semibold uppercase text-slate-300 flex items-center gap-1.5">
            <span>Select Event to Display Unique QR Code:</span>
            <span className="text-cyan-400 font-normal">({events.length} Available)</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshToken}
              disabled={tokenRefreshing}
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              title="Rotate security token for this event"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${tokenRefreshing ? 'animate-spin' : ''}`} />
              <span>Rotate Security Token</span>
            </button>
          </div>
        </div>

        {/* Horizontal Event Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {events.map((ev) => {
            const isSelected = ev.id === currentEvent.id;
            const evRegs = students.filter((s) => s.eventId === ev.id);
            const evAttended = evRegs.filter((s) => s.attended).length;
            const evRate = evRegs.length > 0 ? Math.round((evAttended / evRegs.length) * 100) : 0;

            return (
              <button
                key={ev.id}
                onClick={() => {
                  setSelectedId(ev.id);
                  if (onSelectEvent) onSelectEvent(ev.id);
                }}
                className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600 hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-900/80 text-slate-300">
                      {ev.category}
                    </span>
                    <span className={`text-[10px] font-mono font-semibold ${isSelected ? 'text-cyan-300' : 'text-slate-400'}`}>
                      {evAttended}/{evRegs.length} ({evRate}%)
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white line-clamp-1">
                    {ev.title}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-1.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-fuchsia-400 shrink-0" />
                  <span className="truncate">{ev.venue}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: QR Code Display Card & Live Attendance Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT / CENTER: QR Code Presentation Frame (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center text-center shadow-lg relative overflow-hidden">
          {/* Subtle glow effect in background */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-full flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              OFFICIAL VENUE SCANNER
            </span>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
          </div>

          {/* QR Code Container Plate */}
          <div className="p-5 rounded-2xl bg-white shadow-xl border-4 border-slate-800 text-center relative group">
            <div ref={qrContainerRef} className="inline-block">
              <QRCodeSVG
                value={checkInUrl}
                size={230}
                level="H"
                includeMargin={true}
                imageSettings={{
                  src: 'https://api.dicebear.com/7.x/identicon/svg?seed=ACEEC-SYNAPSE',
                  x: undefined,
                  y: undefined,
                  height: 36,
                  width: 36,
                  excavate: true,
                }}
              />
            </div>
          </div>

          <div className="mt-4 w-full text-center">
            <h3 className="text-base font-bold text-white line-clamp-1">
              {currentEvent.title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Students point phone camera at this QR code upon arrival.
            </p>
          </div>

          {/* URL & Fast Actions */}
          <div className="mt-4 w-full space-y-2.5">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
              <span className="text-slate-400 truncate flex-1 font-mono text-[11px] text-left">
                {checkInUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-cyan-300 flex items-center gap-1 shrink-0 font-medium transition-colors"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setKioskMode(true)}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Fullscreen Kiosk</span>
              </button>
              <button
                onClick={handlePrintPoster}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>Print Poster</span>
              </button>
            </div>
          </div>

          {/* Security Token Detail */}
          <div className="mt-4 pt-3 border-t border-slate-800 w-full flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>Security Token: {venueToken ? venueToken.slice(0, 16) : 'syncing...'}</span>
            <button
              onClick={handleRefreshToken}
              className="text-cyan-400 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-2.5 h-2.5" /> Refresh
            </button>
          </div>
        </div>

        {/* RIGHT: Live Attendance Monitor & Walk-in Check-in (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Real-time Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Total Registered</span>
              <div className="text-xl sm:text-2xl font-black text-white mt-1">
                {eventStudents.length}
              </div>
              <span className="text-[11px] text-slate-500">Capacity: {currentEvent.capacity}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-emerald-400 block">Checked In</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-1">
                {attendedStudents.length}
              </div>
              <span className="text-[11px] text-emerald-500/80">{attendanceRate}% turnout</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-amber-400 block">Awaiting Arrival</span>
              <div className="text-xl sm:text-2xl font-black text-amber-300 mt-1">
                {Math.max(0, eventStudents.length - attendedStudents.length)}
              </div>
              <span className="text-[11px] text-slate-500">Expected at gate</span>
            </div>
          </div>

          {/* Turnout Progress Bar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-white">Live Turnout Rate</span>
              <span className="font-mono font-bold text-cyan-400">{attendanceRate}% of registered</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${attendanceRate}%` }}
              />
            </div>
          </div>

          {/* Admin Walk-In / Manual Check-In Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                <span>Door Volunteer Quick Check-in</span>
              </div>
              <span className="text-[11px] text-slate-400">
                (If student has low battery or no smartphone)
              </span>
            </div>

            <form onSubmit={handleManualCheckIn} className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                placeholder="Enter Roll No (e.g. 25AG1A6701) or Reg ID"
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 uppercase tracking-wider"
              />
              <button
                type="submit"
                disabled={manualLoading || !manualInput.trim()}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-xs font-bold text-white transition-colors shrink-0"
              >
                {manualLoading ? 'Checking...' : 'Check In'}
              </button>
            </form>

            {manualStatus && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  manualStatus.success
                    ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
                }`}
              >
                {manualStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{manualStatus.message}</span>
              </div>
            )}
          </div>

          {/* Recent Live Check-In Feed for this Event */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Verified Attendees Feed</span>
                  <span className="text-xs font-mono text-emerald-400">
                    ({attendedStudents.length})
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Live roster of students who scanned the QR code or checked in at the door.
                </p>
              </div>

              {/* Search Attendee */}
              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={attendeeSearch}
                  onChange={(e) => setAttendeeSearch(e.target.value)}
                  placeholder="Search checked-in..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* List */}
            {filteredAttended.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-800/40 border border-slate-800/60 text-slate-400 text-xs">
                {attendedStudents.length === 0 ? (
                  <>
                    <QrCode className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-300">No Check-ins Yet</p>
                    <p className="text-[11px] mt-0.5">
                      Show or project the QR code to arriving attendees. Their names will appear here automatically.
                    </p>
                  </>
                ) : (
                  <p>No checked-in attendees match your search "{attendeeSearch}".</p>
                )}
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-800">
                {filteredAttended.map((student) => (
                  <div
                    key={student.id}
                    className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{student.fullName}</span>
                        <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300">
                          {student.rollNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {student.year} • Sec {student.section}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span className="font-mono text-slate-500">{student.registrationId}</span>
                        <span>•</span>
                        <span className="text-emerald-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {student.checkInTime
                            ? new Date(student.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Verified'}
                        </span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                      Attended
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Student Check-In Simulator Modal */}
      <VenueCheckInModal
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          loadQrInfo(currentEvent.id);
          if (onRefreshData) onRefreshData();
        }}
        event={currentEvent}
        events={events}
        venueToken={venueToken}
        onCheckInSuccess={() => {
          loadQrInfo(currentEvent.id);
          if (onRefreshData) onRefreshData();
        }}
      />
    </div>
  );
};
