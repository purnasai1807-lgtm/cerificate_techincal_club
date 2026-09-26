import React from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Code2, 
  Database, 
  BarChart3, 
  Award, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  Layers,
  BookOpen,
  TerminalSquare,
  PlusCircle,
  ShieldCheck,
  Zap,
  Terminal,
  Compass
} from 'lucide-react';
import { EventItem, User } from '../types';

interface WorkshopHeroProps {
  workshopEvent: EventItem | undefined;
  onRegisterClick: (eventId: string) => void;
  onExploreEvents: () => void;
  currentUser?: User | null;
  onOpenEventModal?: () => void;
  onOpenAuth?: () => void;
}

export const WorkshopHero: React.FC<WorkshopHeroProps> = ({
  workshopEvent,
  onRegisterClick,
  onExploreEvents,
  currentUser,
  onOpenEventModal,
  onOpenAuth,
}) => {
  // If an event is posted by admin, render the event hero
  if (workshopEvent) {
    const eventId = workshopEvent.id;

    return (
      <div className="relative overflow-hidden pt-6 pb-16">
        {/* Background ambient gradient blurs */}
        <div className="absolute top-0 left-1/4 -z-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-32 right-1/4 -z-10 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Flagship Banner Header */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-semibold shadow-inner mb-6">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-cyan-300 font-mono uppercase">
                {workshopEvent.category} • {workshopEvent.isFlagship ? 'FLAGSHIP PROGRAM' : 'FEATURED EVENT'}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-fuchsia-400">{workshopEvent.organizer}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {workshopEvent.title}
            </h1>

            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              {workshopEvent.tagline || workshopEvent.description}
            </p>

            {/* Key Event Badges */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-medium text-slate-300">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>{workshopEvent.dates}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
                <MapPin className="w-4 h-4 text-fuchsia-400" />
                <span>{workshopEvent.venue}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>{workshopEvent.targetAudience}</span>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                id="hero-register-now-btn"
                onClick={() => onRegisterClick(eventId)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5 text-cyan-200" />
                <span>REGISTER FOR {workshopEvent.category.toUpperCase()}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-browse-events-btn"
                onClick={onExploreEvents}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-sm text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <span>Explore All Tech Events</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono">
                  Catalog
                </span>
              </button>
            </div>
          </div>

          {/* Bento Grid: Topics & Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-12">
            {/* Box 1: Core Topics */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg hover:border-slate-700/80 transition-all">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4">
                <TerminalSquare className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">What You'll Learn</h3>
              <p className="text-xs text-slate-400 mb-4">
                Structured curriculum and hands-on modules for attendees.
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                {workshopEvent.topics?.map((topic, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Box 2: Schedule */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg hover:border-slate-700/80 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Program Schedule</h3>
              <p className="text-xs text-slate-400 mb-4">
                Daily sessions, breakout rooms, and practical lab exercises.
              </p>
              <div className="space-y-3">
                {workshopEvent.schedule?.map((item, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                    <div className="flex items-center justify-between text-xs font-semibold text-cyan-300">
                      <span>{item.day}: {item.title}</span>
                      <span className="font-mono text-slate-400 text-[11px]">{item.time}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Box 3: Instructors & Certification */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg hover:border-slate-700/80 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-fuchsia-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Speakers & Certification</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Delivered by recognized mentors with verifiable digital completion certificates.
                </p>
                <div className="space-y-3">
                  {workshopEvent.speakers?.map((sp, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/40 border border-slate-700/40">
                      <img
                        src={sp.avatar}
                        alt={sp.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-white">{sp.name}</h4>
                        <p className="text-[11px] text-slate-400">{sp.role}</p>
                        <p className="text-[10px] text-cyan-400 font-mono">{sp.organization}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Department authorized certification by Synapse Club & WiDS ACEEC</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // When no events are posted at present:
  return (
    <div className="relative overflow-hidden pt-8 pb-16">
      {/* Background ambient gradient blurs */}
      <div className="absolute top-0 left-1/4 -z-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-32 right-1/4 -z-10 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-semibold shadow-inner mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-300 font-mono">TECHNICAL EVENTS PORTAL</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">Department of CSD, ACEEC</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Synapse Club & WiDS ACEEC <br />
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">
              Technical Events Portal
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            The central platform for hands-on technical workshops, hackathons, coding bootcamps, and professional networking seminars.
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left max-w-xl mx-auto shadow-lg shadow-black/30">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono">
                  Upcoming Technical Programs in Development
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Curriculums and schedules for upcoming hands-on workshops, 36h hackathons, and bootcamp tracks will be announced here soon. Stay tuned!
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            {currentUser?.role === 'admin' ? (
              <button
                onClick={onOpenEventModal}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-5 h-5 text-cyan-200" />
                <span>POST TECHNICAL EVENT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : null}

            <button
              onClick={onExploreEvents}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-xl shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Compass className="w-5 h-5 text-cyan-200" />
              <span>Explore Events Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-left">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-3">
              <Code2 className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Hands-on Workshops</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Interactive coding sessions covering Python, Data Analytics, Pandas, and machine learning with lab-first curriculum.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-left">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5 text-fuchsia-400" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Hackathons & Bootcamps</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Fast-paced prototyping sprints, Web3 and Generative AI hackfests with mentor roundtables and cash prizes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-3">
              <Award className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Verified Digital Credentials</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instant digital passes, QR attendance verification, and institutional certificates issued by Synapse Club & WiDS ACEEC.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
