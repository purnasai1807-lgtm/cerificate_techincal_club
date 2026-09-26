import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  QrCode,
  X,
  AlertCircle,
  Clock,
  Calendar,
  MapPin,
  Sparkles,
  Search,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  HelpCircle,
  PartyPopper
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EventItem, StudentRegistration, VenueCheckInResult } from '../types';
import { api } from '../services/api';

interface VenueCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  events?: EventItem[];
  onEventSelect?: (ev: EventItem) => void;
  venueToken?: string;
  onCheckInSuccess?: (student: StudentRegistration) => void;
  prefilledRoll?: string;
}

export const VenueCheckInModal: React.FC<VenueCheckInModalProps> = ({
  isOpen,
  onClose,
  event,
  events = [],
  onEventSelect,
  venueToken,
  onCheckInSuccess,
  prefilledRoll = '',
}) => {
  const [identifier, setIdentifier] = useState(prefilledRoll);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VenueCheckInResult | null>(null);
  const [currentEvent, setCurrentEvent] = useState<EventItem | null>(event);

  useEffect(() => {
    setCurrentEvent(event);
    setResult(null);
    setError(null);
    if (prefilledRoll) {
      setIdentifier(prefilledRoll);
    }
  }, [event, prefilledRoll, isOpen]);

  if (!isOpen) return null;

  const handleSubmitCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent) {
      setError('Please select an event to check in.');
      return;
    }

    const trimmed = identifier.trim();
    if (!trimmed) {
      setError('Please enter your College Roll Number (e.g. 25AG1A6701) or Registration ID.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.venueCheckIn(currentEvent.id, trimmed, venueToken);
      setResult(res);

      if (res.newlyCheckedIn) {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#10b981', '#6366f1', '#f59e0b', '#ec4899'],
        });
      }

      if (onCheckInSuccess) {
        onCheckInSuccess(res.student);
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetForNext = () => {
    setIdentifier('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden my-6">
        {/* Top Header Banner */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  VENUE ATTENDANCE PORTAL
                </span>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">Student Attendance Check-in</h2>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Event Selector (if event not passed or admin allows switching) */}
          {(!currentEvent || (events && events.length > 1)) && (
            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-slate-400 mb-1.5">
                Select Venue Event:
              </label>
              <select
                value={currentEvent?.id || ''}
                onChange={(e) => {
                  const ev = events.find((item) => item.id === e.target.value) || null;
                  setCurrentEvent(ev);
                  if (onEventSelect && ev) onEventSelect(ev);
                  setResult(null);
                  setError(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="" disabled>-- Select Technical Event --</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.dates})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Current Event Highlights */}
          {currentEvent && (
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  {currentEvent.category}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Target: {currentEvent.targetAudience}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">{currentEvent.title}</h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{currentEvent.dates}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>{currentEvent.venue}</span>
                </div>
              </div>
            </div>
          )}

          {/* Result State or Input Form */}
          {result ? (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div
                className={`p-5 rounded-2xl border text-center ${
                  result.newlyCheckedIn
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3 bg-black/40 border border-current shadow-lg">
                  {result.newlyCheckedIn ? (
                    <PartyPopper className="w-7 h-7 text-emerald-400" />
                  ) : (
                    <CheckCircle2 className="w-7 h-7 text-cyan-400" />
                  )}
                </div>

                <span className="text-[11px] font-mono uppercase tracking-wider font-bold block mb-1">
                  {result.newlyCheckedIn ? 'ATTENDANCE CONFIRMED' : 'ALREADY VERIFIED'}
                </span>
                <h4 className="text-xl font-extrabold text-white">
                  {result.student.fullName}
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  {result.message}
                </p>

                {/* Digital Gate Pass Details */}
                <div className="mt-4 pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-left text-xs bg-slate-900/60 p-3 rounded-xl">
                  <div>
                    <span className="text-slate-500 font-mono text-[10px] block">Roll Number</span>
                    <span className="text-white font-mono font-bold">{result.student.rollNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-mono text-[10px] block">Registration ID</span>
                    <span className="text-cyan-400 font-mono font-semibold">{result.student.registrationId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-mono text-[10px] block">Year & Section</span>
                    <span className="text-slate-200">{result.student.year} • Sec {result.student.section}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-mono text-[10px] block">Check-in Timestamp</span>
                    <span className="text-emerald-400 font-mono font-medium">
                      {new Date(result.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Authorized Venue Admission • ACE Engineering College</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResetForNext}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors"
                >
                  Check In Another Attendee
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-xs font-bold text-white shadow-md shadow-cyan-500/20 transition-all"
                >
                  Done / Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitCheckIn} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold uppercase text-slate-300 mb-1.5">
                  Enter Your College Roll Number or Registration ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value.toUpperCase());
                      setError(null);
                    }}
                    placeholder="e.g. 25AG1A6701 or WIDS26-00101"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 uppercase tracking-wider"
                    autoFocus
                  />
                  <div className="absolute right-3 top-3 text-slate-400 pointer-events-none">
                    <UserCheck className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Enter the Hall Ticket / Roll Number you used during registration.
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !identifier.trim() || !currentEvent}
                className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying with Database...</span>
                  </div>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Venue Attendance</span>
                  </>
                )}
              </button>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                  Not registered yet?
                </span>
                <span className="text-cyan-400 font-semibold">
                  Visit the registration desk at the door
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
