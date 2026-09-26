import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  QrCode, 
  Calendar, 
  MapPin, 
  Download, 
  Printer, 
  Share2, 
  User as UserIcon, 
  Mail, 
  Hash, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  BookOpen,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { StudentRegistration, User } from '../types';
import { api } from '../services/api';

interface StudentPortalProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onSelectRegistration: (reg: StudentRegistration) => void;
  onBrowseEvents: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentUser,
  onOpenAuth,
  onSelectRegistration,
  onBrowseEvents,
}) => {
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      api.getMyRegistrations()
        .then(setRegistrations)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4">
          <Ticket className="w-8 h-8 text-cyan-400" />
        </div>
        <h3 className="text-2xl font-extrabold text-white">Sign In to View Your Passes</h3>
        <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
          Access your digital entry badges, attendance status, QR codes, and event preparation material.
        </p>
        <button
          onClick={onOpenAuth}
          className="mt-6 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition-all"
        >
          Sign In / Student Login
        </button>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Attendee Profile Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-extrabold text-2xl font-mono">
            {currentUser.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                {currentUser.fullName}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Verified Attendee
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400 font-mono">
              <span>{currentUser.email}</span>
              {currentUser.rollNumber && (
                <>
                  <span>•</span>
                  <span className="text-amber-300 font-bold">Roll: {currentUser.rollNumber}</span>
                </>
              )}
              {currentUser.year && (
                <>
                  <span>•</span>
                  <span>{currentUser.year} ({currentUser.section})</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBrowseEvents}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Register for More Events</span>
          </button>
        </div>
      </div>

      {/* Passes List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-cyan-400" />
            <span>My Registered Passes & Tickets ({registrations.length})</span>
          </h3>
        </div>

        {registrations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {registrations.map((reg) => (
              <div
                key={reg.id}
                className="relative rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 border-b border-dashed border-slate-800 pb-4 mb-4">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">
                        Digital Entry Pass
                      </span>
                      <h4 className="text-base font-bold text-white mt-0.5">{reg.eventTitle}</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        ACE Engineering College • CSD Labs
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-white text-slate-900 shrink-0">
                      <QrCode className="w-10 h-10" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">REGISTRATION ID</span>
                      <span className="text-sm font-mono font-bold text-cyan-300">
                        {reg.registrationId}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">ATTENDANCE STATUS</span>
                      <span className={reg.attended ? 'text-emerald-400 font-bold' : 'text-amber-400 font-medium'}>
                        {reg.attended ? 'Checked In ✓' : 'Confirmed (Pending Event)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">STUDENT ROLL</span>
                      <span className="font-mono text-white font-semibold">{reg.rollNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">PASS TIER</span>
                      <span className="text-emerald-400 font-mono">{reg.ticketTier}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectRegistration(reg)}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View Pass & Share</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    title="Print Pass"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 rounded-2xl bg-slate-900/50 border border-slate-800">
            <Ticket className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-white">No registrations found yet</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              You haven't registered for any events yet. Register for the WiDS Python Workshop or hackathons today.
            </p>
            <button
              onClick={onBrowseEvents}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-900 transition-colors"
            >
              Browse Technical Events
            </button>
          </div>
        )}
      </div>

      {/* Preparation Resources Box */}
      <div className="mt-12 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <h4 className="text-base font-bold text-white flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>Workshop Resources & Prerequisites</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <span className="font-bold text-white block">Python 3.11 & Anaconda</span>
            <span className="text-slate-400 text-[11px]">Recommended setup before entering Lab 4.</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <span className="font-bold text-white block">Pandas & Matplotlib Cheat Sheet</span>
            <span className="text-slate-400 text-[11px]">Key syntax and vector operations reference.</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <span className="font-bold text-white block">WiDS Global Mentorship Portal</span>
            <span className="text-slate-400 text-[11px]">Connect with international researchers & mentors.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
