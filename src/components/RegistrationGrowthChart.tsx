import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  Filter,
  Sparkles,
  ArrowUpRight,
  Target,
  Zap,
  CheckCircle2,
  Users
} from 'lucide-react';
import { StudentRegistration, EventItem, AnalyticsData } from '../types';

interface RegistrationGrowthChartProps {
  students: StudentRegistration[];
  events: EventItem[];
  analytics?: AnalyticsData | null;
}

// Distinctive event color palette
const EVENT_COLORS = [
  { stroke: '#06b6d4', fill: '#06b6d4', bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' }, // Cyan
  { stroke: '#d946ef', fill: '#d946ef', bg: 'bg-fuchsia-500/15', text: 'text-fuchsia-400', border: 'border-fuchsia-500/30' }, // Fuchsia
  { stroke: '#10b981', fill: '#10b981', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' }, // Emerald
  { stroke: '#f59e0b', fill: '#f59e0b', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' }, // Amber
  { stroke: '#6366f1', fill: '#6366f1', bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30' }, // Indigo
];

export const RegistrationGrowthChart: React.FC<RegistrationGrowthChartProps> = ({
  students,
  events,
  analytics,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [chartMode, setChartMode] = useState<'cumulative' | 'daily' | 'comparison'>('cumulative');
  const [dayRange, setDayRange] = useState<number>(14);

  // Map each event ID to a distinct color
  const eventColorMap = useMemo(() => {
    const map = new Map<string, typeof EVENT_COLORS[0]>();
    events.forEach((ev, idx) => {
      map.set(ev.id, EVENT_COLORS[idx % EVENT_COLORS.length]);
    });
    return map;
  }, [events]);

  // Selected event object (if single event selected)
  const activeEvent = useMemo(() => {
    if (selectedEventId === 'all') return null;
    return events.find((e) => e.id === selectedEventId) || null;
  }, [selectedEventId, events]);

  // Generate daily time-series data for the selected range
  const chartData = useMemo(() => {
    const now = new Date();
    const daysList: { dateKey: string; displayDate: string; fullDate: string }[] = [];

    for (let i = dayRange - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const isToday = i === 0;
      const displayDate = isToday
        ? `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const fullDate = d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      daysList.push({ dateKey, displayDate, fullDate });
    }

    // Filter registrations matching selected event
    const relevantStudents = students.filter((s) => {
      if (selectedEventId !== 'all') {
        return s.eventId === selectedEventId;
      }
      return true;
    });

    // Running cumulative counter
    let runningCumulative = 0;
    // For earlier registrations prior to the start of this window
    const windowStartDate = daysList[0]?.dateKey || '';
    const priorCount = relevantStudents.filter((s) => {
      const regDate = s.registeredAt.slice(0, 10);
      return regDate < windowStartDate;
    }).length;

    runningCumulative = priorCount;

    return daysList.map((day) => {
      // Find students registered on this date
      const daysStudents = relevantStudents.filter((s) => {
        return s.registeredAt.startsWith(day.dateKey);
      });

      const dailyCount = daysStudents.length;
      runningCumulative += dailyCount;

      // Event breakdown for multi-series / comparison
      const eventCounts: Record<string, number> = {};
      events.forEach((ev) => {
        const countForEv = daysStudents.filter((s) => s.eventId === ev.id).length;
        eventCounts[ev.id] = countForEv;
      });

      return {
        date: day.displayDate,
        fullDate: day.fullDate,
        dateKey: day.dateKey,
        daily: dailyCount,
        cumulative: runningCumulative,
        ...eventCounts,
      };
    });
  }, [students, events, selectedEventId, dayRange]);

  // Compute summary growth metrics
  const metrics = useMemo(() => {
    if (chartData.length === 0) {
      return { totalWindow: 0, peakDaily: 0, peakDate: '-', avgDaily: '0', currentTotal: 0 };
    }

    let totalWindow = 0;
    let peakDaily = 0;
    let peakDate = '-';

    chartData.forEach((d) => {
      totalWindow += d.daily;
      if (d.daily > peakDaily) {
        peakDaily = d.daily;
        peakDate = d.date;
      }
    });

    const avgDaily = (totalWindow / chartData.length).toFixed(1);
    const currentTotal = chartData[chartData.length - 1]?.cumulative || 0;

    return { totalWindow, peakDaily, peakDate, avgDaily, currentTotal };
  }, [chartData]);

  // Capacity calculation for selected event or all events
  const capacityInfo = useMemo(() => {
    if (activeEvent) {
      const current = students.filter((s) => s.eventId === activeEvent.id).length;
      const pct = Math.min(100, Math.round((current / activeEvent.capacity) * 100));
      return {
        target: activeEvent.capacity,
        current,
        pct,
        remaining: Math.max(0, activeEvent.capacity - current),
        label: activeEvent.title,
      };
    }

    const totalCapacity = events.reduce((acc, ev) => acc + (ev.capacity || 0), 0);
    const current = students.length;
    const pct = totalCapacity > 0 ? Math.min(100, Math.round((current / totalCapacity) * 100)) : 0;
    return {
      target: totalCapacity,
      current,
      pct,
      remaining: Math.max(0, totalCapacity - current),
      label: 'All Upcoming Events',
    };
  }, [activeEvent, events, students]);

  // Custom tooltip renderer
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataPoint = payload[0]?.payload;
    if (!dataPoint) return null;

    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3.5 shadow-2xl text-xs max-w-xs z-50">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2 mb-2">
          <span className="font-mono text-cyan-300 font-semibold">{dataPoint.fullDate}</span>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
            Day {label}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Daily Registrations:</span>
            <span className="font-mono font-bold text-white text-sm">
              +{dataPoint.daily} <span className="text-[10px] text-slate-400 font-normal">students</span>
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Cumulative Total:</span>
            <span className="font-mono font-bold text-cyan-400 text-sm">
              {dataPoint.cumulative} <span className="text-[10px] text-slate-400 font-normal">registered</span>
            </span>
          </div>

          {/* If viewing all events or comparison, show breakdown by upcoming event */}
          {(selectedEventId === 'all' || chartMode === 'comparison') && events.length > 0 && (
            <div className="pt-2 mt-2 border-t border-slate-800/80 space-y-1">
              <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">
                Upcoming Events Breakdown
              </span>
              {events.map((ev) => {
                const count = dataPoint[ev.id] || 0;
                const col = eventColorMap.get(ev.id);
                return (
                  <div key={ev.id} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: col?.stroke || '#06b6d4' }}
                      />
                      <span className="text-slate-300 truncate">{ev.title}</span>
                    </div>
                    <span className="font-mono font-semibold text-white ml-2">
                      {count > 0 ? `+${count}` : '0'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-6">
      {/* Top Header: Title, Controls, and Event Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Registration Growth & Daily Velocity</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Recharts
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Live daily registration trajectories across upcoming technical events
              </p>
            </div>
          </div>
        </div>

        {/* Filter & View Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Upcoming Event Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
            >
              <option value="all">All Upcoming Events ({events.length})</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title.length > 28 ? `${ev.title.slice(0, 28)}...` : ev.title}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Selector */}
          <div className="inline-flex rounded-xl bg-slate-800/90 p-1 border border-slate-700 text-xs">
            <button
              onClick={() => setDayRange(7)}
              className={`px-2.5 py-1 rounded-lg transition-all font-mono text-[11px] ${
                dayRange === 7 ? 'bg-cyan-500 text-black font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              7D
            </button>
            <button
              onClick={() => setDayRange(14)}
              className={`px-2.5 py-1 rounded-lg transition-all font-mono text-[11px] ${
                dayRange === 14 ? 'bg-cyan-500 text-black font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              14D
            </button>
            <button
              onClick={() => setDayRange(30)}
              className={`px-2.5 py-1 rounded-lg transition-all font-mono text-[11px] ${
                dayRange === 30 ? 'bg-cyan-500 text-black font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              30D
            </button>
          </div>

          {/* Chart Display Mode Tabs */}
          <div className="inline-flex rounded-xl bg-slate-800/90 p-1 border border-slate-700 text-xs">
            <button
              onClick={() => setChartMode('cumulative')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 text-[11px] ${
                chartMode === 'cumulative'
                  ? 'bg-slate-700 text-cyan-300 font-semibold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Cumulative Registrations Area Chart"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cumulative</span>
            </button>
            <button
              onClick={() => setChartMode('daily')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 text-[11px] ${
                chartMode === 'daily'
                  ? 'bg-slate-700 text-cyan-300 font-semibold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Daily New Registrations Bar Velocity"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Daily Bars</span>
            </button>
            {events.length > 1 && (
              <button
                onClick={() => setChartMode('comparison')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 text-[11px] ${
                  chartMode === 'comparison'
                    ? 'bg-slate-700 text-cyan-300 font-semibold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Multi-Event Comparison"
              >
                <Zap className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>Compare Events</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Period Additions</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-300">
              +{metrics.totalWindow}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">in {dayRange} days</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Peak Daily Surge</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono text-amber-300">
              {metrics.peakDaily}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">on {metrics.peakDate}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Daily Run Rate</span>
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono text-cyan-300">
              {metrics.avgDaily}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">students / day</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Capacity Filled</span>
            <Target className="w-3.5 h-3.5 text-fuchsia-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono text-fuchsia-300">
              {capacityInfo.pct}%
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({capacityInfo.current}/{capacityInfo.target})
            </span>
          </div>
        </div>
      </div>

      {/* Main Recharts Container */}
      <div className="h-72 sm:h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'cumulative' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="growthAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="dailyBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d946ef" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#d946ef" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="cumulative"
                name="Total Registered"
                stroke="#06b6d4"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#growthAreaGradient)"
                activeDot={{ r: 6, fill: '#06b6d4', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          ) : chartMode === 'daily' ? (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="barColorCyan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#0891b2" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="daily"
                name="Daily Registrations"
                fill="url(#barColorCyan)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : (
            // Comparison Mode: Multi-line chart comparing daily velocities for each upcoming event
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {events.map((ev) => {
                const color = eventColorMap.get(ev.id)?.stroke || '#06b6d4';
                return (
                  <Line
                    key={ev.id}
                    type="monotone"
                    dataKey={ev.id}
                    name={ev.title}
                    stroke={color}
                    strokeWidth={2}
                    dot={{ r: 3, fill: color }}
                    activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2 }}
                  />
                );
              })}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Bottom Events Trajectory Pills / Legend */}
      <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500 uppercase">Upcoming Events:</span>
          {events.map((ev) => {
            const col = eventColorMap.get(ev.id);
            const isSelected = selectedEventId === ev.id;
            const regCount = students.filter((s) => s.eventId === ev.id).length;
            const pct = Math.min(100, Math.round((regCount / (ev.capacity || 100)) * 100));

            return (
              <button
                key={ev.id}
                onClick={() => setSelectedEventId(isSelected ? 'all' : ev.id)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? `${col?.bg} ${col?.border} ${col?.text} font-semibold ring-1 ring-cyan-500/50`
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-600'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: col?.stroke || '#06b6d4' }}
                />
                <span className="truncate max-w-[140px] sm:max-w-[180px]">{ev.title}</span>
                <span className="font-mono text-[10px] text-slate-400 ml-1">
                  ({regCount}/{ev.capacity})
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-[11px] font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Sync: Real-time Live Stream</span>
        </div>
      </div>
    </div>
  );
};
