import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  MapPin, 
  Users, 
  Tag, 
  Plus, 
  Trash2, 
  Sparkles, 
  Award, 
  Clock, 
  FileText, 
  DollarSign,
  Layers,
  Code2,
  Check
} from 'lucide-react';
import { EventItem, EventCategory } from '../types';
import { api } from '../services/api';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: EventItem | null;
  onSaveSuccess: (event: EventItem) => void;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSaveSuccess,
}) => {
  const isEditing = Boolean(initialData);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('workshop');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [organizer, setOrganizer] = useState('Synapse Club');
  const [coOrganizer, setCoOrganizer] = useState('');
  const [dates, setDates] = useState('');
  const [venue, setVenue] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [price, setPrice] = useState(0);
  const [capacity, setCapacity] = useState(150);
  const [topicsString, setTopicsString] = useState('');
  const [isFlagship, setIsFlagship] = useState(false);

  // Schedule items
  const [schedule, setSchedule] = useState<{ day: string; title: string; time: string; description: string }[]>([]);

  // Speakers
  const [speakers, setSpeakers] = useState<{ name: string; role: string; organization: string; avatar: string }[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setCategory(initialData.category);
      setTagline(initialData.tagline || '');
      setDescription(initialData.description || '');
      setOrganizer(initialData.organizer || 'Synapse Club');
      setCoOrganizer(initialData.coOrganizer || '');
      setDates(initialData.dates || '');
      setVenue(initialData.venue || '');
      setTargetAudience(initialData.targetAudience || '');
      setPrice(initialData.price || 0);
      setCapacity(initialData.capacity || 100);
      setTopicsString(initialData.topics ? initialData.topics.join(', ') : '');
      setIsFlagship(Boolean(initialData.isFlagship));
      setSchedule(initialData.schedule || []);
      setSpeakers(initialData.speakers || []);
    } else {
      // Default initial state - empty for admin to input real event details
      setTitle('');
      setCategory('workshop');
      setTagline('');
      setDescription('');
      setOrganizer('Synapse Club');
      setCoOrganizer('');
      setDates('');
      setVenue('');
      setTargetAudience('');
      setPrice(0);
      setCapacity(150);
      setTopicsString('');
      setIsFlagship(false);
      setSchedule([]);
      setSpeakers([]);
    }
  }, [initialData, isOpen]);

  // Quick Preset Helpers for Admin
  const loadPreset = (type: 'python' | 'hackathon' | 'bootcamp') => {
    if (type === 'python') {
      setTitle('3-Day Interactive Python & Data Analytics Workshop');
      setCategory('workshop');
      setTagline('WiDS ACEEC × Synapse Club Flagship Hands-on Program');
      setDescription('A comprehensive 3-day deep dive into Python, Pandas, Matplotlib, Seaborn, exploratory data analysis, and real-world data science workflows specifically tailored for CSD students.');
      setOrganizer('Synapse Club — WiDS ACEEC Chapter');
      setCoOrganizer('ACE Engineering College, CSD Department');
      setDates('17–18 September 2026 (Hands-on Labs & Capstone)');
      setVenue('Computer Science Lab 4 & Central Seminar Hall, ACEEC');
      setTargetAudience('1st and 2nd Year CSD Students & Tech Enthusiasts');
      setPrice(0);
      setCapacity(250);
      setTopicsString('Python Programming Fundamentals, Pandas Data Cleaning, Exploratory Data Analysis (EDA), Matplotlib & Seaborn, Capstone Mini-Project');
      setIsFlagship(true);
      setSchedule([
        { day: 'Day 1', title: 'Python Foundations & Data Cleaning', time: '09:30 AM - 04:30 PM', description: 'Syntax recap, Jupyter Notebooks, Pandas DataFrames, handling missing values.' },
        { day: 'Day 2', title: 'Exploratory Analytics & Visualizations', time: '09:30 AM - 04:30 PM', description: 'Matplotlib plots, Seaborn statistical charts, correlation heatmaps.' },
        { day: 'Day 3', title: 'Capstone Project & Hack Challenge', time: '10:00 AM - 05:00 PM', description: 'Team dataset challenge, presentation of insights, certificates & awards ceremony.' }
      ]);
      setSpeakers([
        { name: 'Dr. K. Ananya Reddy', role: 'WiDS Ambassador & AI Researcher', organization: 'WiDS Global / ACEEC', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
        { name: 'Purna Sai', role: 'Lead Architect & Synapse Club President', organization: 'Synapse Club', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
        { name: 'Vikram Joshi', role: 'Senior Data Scientist', organization: 'Hyperscale Cloud AI', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' }
      ]);
    } else if (type === 'hackathon') {
      setTitle('Synapse AI & Web3 36-Hour HackFest');
      setCategory('hackathon');
      setTagline('Build the next wave of intelligent decentralized systems');
      setDescription('A 36-hour sprint where developer teams build prototypes spanning Agentic AI, smart contracts, decentralized storage, and high-performance developer tooling.');
      setOrganizer('Synapse Club Technical Board');
      setCoOrganizer('ACEEC Innovation Hub');
      setDates('26–27 September 2026');
      setVenue('ACEEC Innovation Hub & Hybrid Discord');
      setTargetAudience('Coders, Designers, Full-Stack Developers (All Years)');
      setPrice(199);
      setCapacity(120);
      setTopicsString('Agentic Workflows, Smart Contracts, RAG Pipelines, Zero-Knowledge Proofs, Rapid MVP Prototyping');
      setIsFlagship(false);
      setSchedule([
        { day: 'Day 1', title: 'Opening Keynote & Hacking Begins', time: '09:00 AM', description: 'Problem statements revealed, team formation, API keys distribution.' },
        { day: 'Day 2', title: 'Midnight Mentorship & Checkpoints', time: '12:00 AM - 06:00 AM', description: 'One-on-one architecture reviews with industry mentors.' },
        { day: 'Day 2', title: 'Pitch Finale & Prize Ceremony', time: '04:00 PM', description: 'Top 10 teams pitch to jury. ₹1,50,000 prize distribution.' }
      ]);
      setSpeakers([
        { name: 'Aditya Varma', role: 'Staff Engineer', organization: 'Syntropic Systems', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' }
      ]);
    } else if (type === 'bootcamp') {
      setTitle('Microservices & Distributed Systems Bootcamp');
      setCategory('bootcamp');
      setTagline('From Monolith to 100k Req/Sec Cloud Architecture');
      setDescription('An intensive weekend bootcamp covering Docker, Kubernetes, Kafka event-streaming, Redis caching, and horizontal load balancing architectures.');
      setOrganizer('Synapse Cloud & Backend Guild');
      setCoOrganizer('Department of CSD');
      setDates('October 3 – 25, 2026 (Every Sat & Sun)');
      setVenue('Virtual Classroom + ACEEC Cloud Lab');
      setTargetAudience('2nd, 3rd, 4th Year Computer Science Students');
      setPrice(499);
      setCapacity(80);
      setTopicsString('Docker Containerization, Kubernetes Orchestration, Kafka Streaming, Database Sharding & Caching, High-Concurrency Load Testing');
      setIsFlagship(false);
    }
  };

  const handleAddScheduleItem = () => {
    setSchedule([
      ...schedule,
      { day: `Day ${schedule.length + 1}`, title: '', time: '10:00 AM - 04:00 PM', description: '' }
    ]);
  };

  const handleRemoveScheduleItem = (index: number) => {
    setSchedule(schedule.filter((_, i) => i !== index));
  };

  const handleUpdateScheduleItem = (index: number, field: string, value: string) => {
    setSchedule(schedule.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleAddSpeaker = () => {
    setSpeakers([
      ...speakers,
      { name: '', role: '', organization: '', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }
    ]);
  };

  const handleRemoveSpeaker = (index: number) => {
    setSpeakers(speakers.filter((_, i) => i !== index));
  };

  const handleUpdateSpeaker = (index: number, field: string, value: string) => {
    setSpeakers(speakers.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide an event title.');
      return;
    }
    if (!dates.trim() || !venue.trim()) {
      setError('Please specify both dates and venue.');
      return;
    }

    const topicsArray = topicsString
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      const payload: Partial<EventItem> = {
        title: title.trim(),
        category,
        tagline: tagline.trim(),
        description: description.trim(),
        organizer: organizer.trim(),
        coOrganizer: coOrganizer.trim() || undefined,
        dates: dates.trim(),
        venue: venue.trim(),
        targetAudience: targetAudience.trim(),
        price: Number(price) || 0,
        capacity: Number(capacity) || 100,
        topics: topicsArray,
        schedule,
        speakers,
        isFlagship,
      };

      let result;
      if (isEditing && initialData) {
        result = await api.updateEvent(initialData.id, payload);
      } else {
        result = await api.createEvent(payload);
      }

      onSaveSuccess(result.event);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save technical event.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {isEditing ? 'Edit Technical Event' : 'Post New Technical Event'}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Admin Publisher: Synapse Club × WiDS ACEEC
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Quick Preset Buttons */}
          {!isEditing && (
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-slate-200">
                  Quick Event Templates (Optional Fast-Fill)
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => loadPreset('python')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors flex items-center gap-1.5"
                >
                  <span>🐍 WiDS Python Workshop</span>
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset('hackathon')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 hover:bg-fuchsia-500/30 transition-colors flex items-center gap-1.5"
                >
                  <span>⚡ 36h AI HackFest</span>
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset('bootcamp')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors flex items-center gap-1.5"
                >
                  <span>☁️ Microservices Bootcamp</span>
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>1. Event Details</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Event Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3-Day Interactive Python & Data Analytics Workshop"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Event Category <span className="text-rose-400">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EventCategory)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="workshop">Workshop</option>
                  <option value="hackathon">Hackathon</option>
                  <option value="bootcamp">Bootcamp</option>
                  <option value="seminar">Seminar / Summit</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Subheading / Tagline
              </label>
              <input
                type="text"
                placeholder="e.g. WiDS ACEEC × Synapse Club Flagship Hands-on Program"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Description & Objectives
              </label>
              <textarea
                rows={3}
                placeholder="Comprehensive technical breakdown of what will be learned, covered tools, and target outcomes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Organizer Club / Body
                </label>
                <input
                  type="text"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Co-Organizer / Department (Optional)
                </label>
                <input
                  type="text"
                  value={coOrganizer}
                  onChange={(e) => setCoOrganizer(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Dates, Venue & Logistics */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-mono font-bold text-fuchsia-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>2. Schedule & Logistics</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Event Dates <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 17–18 September 2026 (Hands-on Labs)"
                  value={dates}
                  onChange={(e) => setDates(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Venue / Location <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science Lab 4 & Central Seminar Hall, ACEEC"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Audience
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1st & 2nd Year CSD Students"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Total Seat Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Ticket Fee (₹ INR, 0 = Free)
                </label>
                <input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Topics Covered (comma-separated tags)
              </label>
              <input
                type="text"
                placeholder="Python Basics, Pandas, Data Cleaning, Matplotlib, Seaborn, Real-world Capstone"
                value={topicsString}
                onChange={(e) => setTopicsString(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <input
                type="checkbox"
                id="isFlagshipToggle"
                checked={isFlagship}
                onChange={(e) => setIsFlagship(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 bg-slate-800 border-slate-700 focus:ring-cyan-500"
              />
              <label htmlFor="isFlagshipToggle" className="text-xs text-slate-300 cursor-pointer">
                <strong className="text-white">Flagship Program</strong> — Highlight prominently on the home page hero section
              </label>
            </div>
          </div>

          {/* Section 3: Daily Agenda / Schedule */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>3. Daily Schedule & Modules ({schedule.length})</span>
              </h4>
              <button
                type="button"
                onClick={handleAddScheduleItem}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Day</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {schedule.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="grid grid-cols-3 gap-2 flex-1">
                      <input
                        type="text"
                        placeholder="Day 1"
                        value={item.day}
                        onChange={(e) => handleUpdateScheduleItem(idx, 'day', e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="Module Title"
                        value={item.title}
                        onChange={(e) => handleUpdateScheduleItem(idx, 'title', e.target.value)}
                        className="col-span-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveScheduleItem(idx)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="09:30 AM - 04:30 PM"
                      value={item.time}
                      onChange={(e) => handleUpdateScheduleItem(idx, 'time', e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Session description / tools covered..."
                      value={item.description}
                      onChange={(e) => handleUpdateScheduleItem(idx, 'description', e.target.value)}
                      className="sm:col-span-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Key Speakers */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>4. Instructors & Key Speakers ({speakers.length})</span>
              </h4>
              <button
                type="button"
                onClick={handleAddSpeaker}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Speaker</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {speakers.map((sp, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-2 relative">
                  <button
                    type="button"
                    onClick={() => handleRemoveSpeaker(idx)}
                    className="absolute top-2 right-2 p-1 text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <input
                    type="text"
                    placeholder="Full Name (e.g. Dr. K. Ananya Reddy)"
                    value={sp.name}
                    onChange={(e) => handleUpdateSpeaker(idx, 'name', e.target.value)}
                    className="w-full pr-6 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Role (e.g. WiDS Ambassador / AI Researcher)"
                    value={sp.role}
                    onChange={(e) => handleUpdateSpeaker(idx, 'role', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300"
                  />
                  <input
                    type="text"
                    placeholder="Organization (e.g. WiDS Global / ACEEC)"
                    value={sp.organization}
                    onChange={(e) => handleUpdateSpeaker(idx, 'organization', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              {loading ? (
                <span>Publishing Event...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEditing ? 'Save Event Changes' : 'Publish Technical Event'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
