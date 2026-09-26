import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Download,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Clock,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Participant, EligibilityStatus, CertificateStatus } from '../../types';
import { participantsService, ParticipantFilterOptions } from '../../api/participants';
import { Badge } from '../../components/common/Badge';
import { useNotifications } from '../../context/NotificationContext';

export const ParticipantsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useNotifications();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [eligibilityFilter, setEligibilityFilter] = useState<EligibilityStatus | 'ALL'>(
    searchParams.get('filter') === 'eligible'
      ? 'ELIGIBLE'
      : searchParams.get('filter') === 'ineligible'
      ? 'NOT_ELIGIBLE'
      : 'ALL'
  );
  const [statusFilter, setStatusFilter] = useState<CertificateStatus | 'ALL'>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'rollNumber' | 'checkIn' | 'checkOut'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchParticipants = async () => {
    setIsLoading(true);
    const options: ParticipantFilterOptions = {
      search,
      eligibility: eligibilityFilter,
      certificateStatus: statusFilter,
      department: departmentFilter,
      page,
      pageSize,
      sortBy,
      sortOrder,
    };
    const res = await participantsService.getParticipants(options);
    if (res.success && res.data) {
      setParticipants(res.data.items);
      setTotalCount(res.data.total);
      setTotalPages(res.data.totalPages);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchParticipants();
  }, [search, eligibilityFilter, statusFilter, departmentFilter, page, sortBy, sortOrder]);

  const toggleSort = (field: 'name' | 'rollNumber' | 'checkIn' | 'checkOut') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleDeleteParticipant = async (p: Participant) => {
    const confirmed = window.confirm(
      `Delete ${p.name} (${p.rollNumber})? This will also remove its certificate and email-log records.`
    );
    if (!confirmed) return;

    try {
      const res = await participantsService.deleteParticipant(p.id);
      if (!res.success) throw new Error(res.message || 'Failed to delete participant.');
      showToast('success', 'Participant Deleted', `${p.name} was removed from the attendance registry.`);
      if (participants.length === 1 && page > 1) setPage((value) => value - 1);
      else fetchParticipants();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err?.message || 'Could not delete participant.');
    }
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allVisibleSelected = participants.length > 0 && participants.every((p) => selectedIds.has(p.id));

  const toggleSelectAll = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) participants.forEach((p) => next.delete(p.id));
      else participants.forEach((p) => next.add(p.id));
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) {
      showToast('error', 'Nothing Selected', 'Select at least one participant first.');
      return;
    }
    const confirmed = window.confirm(`Delete ${ids.length} selected participant(s)? Their certificates and email logs will also be removed.`);
    if (!confirmed) return;
    setIsBulkDeleting(true);
    try {
      const res = await participantsService.bulkDeleteParticipants(ids);
      if (!res.success) throw new Error(res.message || 'Failed to delete selected participants.');
      setSelectedIds(new Set());
      showToast('success', 'Participants Deleted', `${res.data.participantsDeleted} participant(s) were removed.`);
      await fetchParticipants();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err?.message || 'Could not delete selected participants.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!totalCount) {
      showToast('error', 'No Participants', 'There are no participants to delete.');
      return;
    }
    const confirmed = window.confirm(`DELETE ALL ${totalCount} PARTICIPANTS? This will also remove all related certificates and email logs. This action cannot be undone.`);
    if (!confirmed) return;
    const secondConfirmed = window.confirm('Are you absolutely sure? ALL imported participant data will be permanently removed.');
    if (!secondConfirmed) return;
    setIsBulkDeleting(true);
    try {
      const res = await participantsService.deleteAllParticipants();
      if (!res.success) throw new Error(res.message || 'Failed to delete all participants.');
      setSelectedIds(new Set());
      setPage(1);
      showToast('success', 'All Participants Deleted', `${res.data.participantsDeleted} participant(s) were removed.`);
      await fetchParticipants();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err?.message || 'Could not delete all participants.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleExportCSV = async () => {
    const all = await participantsService.getAllParticipants({ search, eligibility: eligibilityFilter, certificateStatus: statusFilter, department: departmentFilter });
    const headers = ['ID', 'Name', 'Email', 'Student ID', 'Roll Number', 'Check-in', 'Check-out', 'Eligibility', 'Status'];
    const rows = all.map((p) => [
      p.id,
      `"${p.name}"`,
      p.email,
      p.studentId,
      p.rollNumber,
      p.checkIn || 'None',
      p.checkOut || 'None',
      p.eligibility,
      p.certificateStatus,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'pycore_participants_attendance.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('success', 'Export Complete', 'Participant attendance registry exported as CSV.');
  };

  const departments = [
    'ALL',
    'Computer Science & Engineering',
    'Artificial Intelligence & Data Science',
    'Electronics & Communication',
    'Information Technology',
    'Electrical & Electronics',
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Attendee Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Participant Roster</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Search, filter, and inspect verified attendance timestamps and credential statuses.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-purple-600" />
          <span>Export Attendance CSV</span>
        </button>
      </div>

      {/* Bulk actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleSelectAll}
            disabled={isLoading || !participants.length || isBulkDeleting}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold disabled:opacity-40"
          >
            {allVisibleSelected ? 'Clear Selection' : 'Select All'}
          </button>
          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={!selectedIds.size || isBulkDeleting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Selected {selectedIds.size ? `(${selectedIds.size})` : ''}
          </button>
        </div>
        <button
          type="button"
          onClick={handleDeleteAll}
          disabled={!totalCount || isBulkDeleting}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-950/50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete All ({totalCount})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, email, roll no..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Eligibility Filter */}
          <div>
            <select
              value={eligibilityFilter}
              onChange={(e) => {
                setEligibilityFilter(e.target.value as EligibilityStatus | 'ALL');
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">All Eligibility (250)</option>
              <option value="ELIGIBLE">Eligible Only (220)</option>
              <option value="NOT_ELIGIBLE">Not Eligible (30)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as CertificateStatus | 'ALL');
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">All Certificate Statuses</option>
              <option value="PENDING">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="GENERATED">Generated</option>
              <option value="SENT">Sent to Email</option>
              <option value="REJECTED">Rejected</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d === 'ALL' ? 'All Academic Departments' : d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span>
            Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)} of {totalCount} participants
          </span>
          {(search || eligibilityFilter !== 'ALL' || statusFilter !== 'ALL' || departmentFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setEligibilityFilter('ALL');
                setStatusFilter('ALL');
                setDepartmentFilter('ALL');
                setPage(1);
              }}
              className="text-purple-600 dark:text-purple-400 font-semibold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3.5 px-3 w-10">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    disabled={!participants.length || isBulkDeleting}
                    aria-label="Select all visible participants"
                    className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                </th>
                <th
                  onClick={() => toggleSort('name')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Participant Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Email</th>
                <th
                  onClick={() => toggleSort('rollNumber')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Roll Number</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Student ID</th>
                <th
                  onClick={() => toggleSort('checkIn')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Check-in</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('checkOut')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Check-out</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Eligibility</th>
                <th className="py-3.5 px-4">Certificate Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {participants.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p.id)}
                      onChange={() => toggleSelected(p.id)}
                      disabled={isBulkDeleting}
                      aria-label={`Select ${p.name}`}
                      className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 dark:text-white">{p.name}</span>
                    <p className="text-[11px] text-slate-400">{p.department}</p>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                    {p.email}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium">{p.rollNumber}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">{p.studentId}</td>
                  <td className="py-3.5 px-4">
                    {p.checkIn ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {p.checkIn}
                      </span>
                    ) : (
                      <span className="text-rose-500 font-medium">Missing</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {p.checkOut ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {p.checkOut}
                      </span>
                    ) : (
                      <span className="text-rose-500 font-medium">Missing</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge status={p.eligibility} />
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge status={p.certificateStatus} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteParticipant(p)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 dark:border-rose-900/60 text-[11px] font-semibold transition-colors"
                      title="Delete participant"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Page <span className="font-bold text-slate-800 dark:text-slate-200">{page}</span> of{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">{totalPages}</span>
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
