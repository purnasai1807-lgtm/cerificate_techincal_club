import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Tag, 
  ArrowRight, 
  Search, 
  Filter, 
  Code, 
  Sparkles, 
  Terminal, 
  Cpu, 
  Compass,
  CheckCircle,
  Clock
} from 'lucide-react';
import { EventItem, EventCategory, User } from '../types';

interface EventCatalogProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  onRegisterClick: (eventId: string) => void;
  currentUser?: User | null;
  onOpenEventModal?: () => void;
  onOpenAuth?: () => void;
}

export const EventCatalog: React.FC<EventCatalogProps> = ({
  events,
  onSelectEvent,
  onRegisterClick,
  currentUser,
  onOpenEventModal,
  onOpenAuth,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories: { label: string; value: string }[] = [
    { label: 'All Technical Events', value: 'all' },
    { label: 'Workshops', value: 'workshop' },
    { label: 'Hackathons', value: 'hackathon' },
    { label: 'Coding Bootcamps', value: 'bootcamp' },
    { label: 'Seminars & Networking', value: 'seminar' },
  ];

  const filteredEvents = events.filter((ev) => {
    const matchesCategory = selectedCategory === 'all' || ev.category === selectedCategory;
    const matchesSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.topics.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryBadge = (cat: EventCategory) => {
    switch (cat) {
      case 'workshop':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">Workshop</span>;
      case 'hackathon':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30">36h Hackathon</span>;
      case 'bootcamp':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Bootcamp</span>;
      case 'seminar':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">Seminar</span>;
    }
  };

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider">
              Explore Technical Ecosystem
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Workshops, Hackathons & Tech Summits
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Engineered to elevate your engineering aptitude with hands-on practice, code reviews, and industry speaker sessions.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Python, Hackathon, Docker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Event Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEvents.map((event) => {
            const fillPercentage = Math.min(100, Math.round((event.registeredCount / event.capacity) * 100));

            return (
              <div
                key={event.id}
                className="group relative rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/5"
              >
                <div>
                  {/* Card Header & Badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      {getCategoryBadge(event.category)}
                      {event.isFlagship && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Flagship
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold text-white">
                        {event.price === 0 ? 'FREE' : `₹${event.price}`}
                      </span>
                      {event.price > 0 && <span className="text-[10px] text-slate-400 block font-normal">per pass</span>}
                    </div>
                  </div>

                  {/* Title & Tagline */}
                  <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-xs font-mono text-cyan-400/90 mt-1">{event.tagline}</p>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2.5 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>

                  {/* Event Meta Details */}
                  <div className="mt-4 space-y-2 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-slate-200">{event.dates}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{event.targetAudience}</span>
                    </div>
                  </div>

                  {/* Topics Pills */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {event.topics.slice(0, 4).map((topic, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 text-[11px] font-mono border border-slate-700/50"
                      >
                        {topic}
                      </span>
                    ))}
                    {event.topics.length > 4 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-800/40 text-slate-400 text-[10px] font-mono">
                        +{event.topics.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Capacity & Register Action */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Capacity Bar */}
                  <div className="w-full sm:w-48">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400 font-mono">Seats Filled</span>
                      <span className="text-cyan-400 font-mono font-medium">
                        {event.registeredCount}/{event.capacity} ({fillPercentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-500"
                        style={{ width: `${fillPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onRegisterClick(event.id)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-md shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <span>Register</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {events.length === 0 ? (
          <div className="text-center py-16 px-4 bg-slate-900/50 rounded-2xl border border-slate-800 max-w-2xl mx-auto shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 text-cyan-400">
              <Calendar className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Technical Events Scheduled Yet</h3>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
              Schedules and registrations for upcoming technical workshops, hackathons, and bootcamps will appear here once released by the department. Please check back soon.
            </p>
            {onOpenEventModal && currentUser?.role === 'admin' ? (
              <button
                onClick={onOpenEventModal}
                className="mt-6 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-md shadow-cyan-500/20 active:scale-95 transition-all inline-flex items-center gap-2"
              >
                <span>Post Technical Event</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800">
            <Filter className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <h4 className="text-base font-semibold text-white">No technical events match your filter</h4>
            <p className="text-xs text-slate-400 mt-1">Try searching for other keywords like Python, Hackathon, or WiDS.</p>
            <button
              onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
              className="mt-4 px-3 py-1.5 text-xs text-cyan-400 hover:underline font-medium"
            >
              Reset filters
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
};
