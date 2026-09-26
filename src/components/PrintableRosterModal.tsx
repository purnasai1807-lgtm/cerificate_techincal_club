import React from 'react';
import { X, Printer, Download, CheckCircle, FileText } from 'lucide-react';
import { StudentRegistration } from '../types';

interface PrintableRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentRegistration[];
}

export const PrintableRosterModal: React.FC<PrintableRosterModalProps> = ({
  isOpen,
  onClose,
  students,
}) => {
  if (!isOpen) return null;

  const total = students.length;
  const firstYear = students.filter((s) => s.year === '1st Year').length;
  const secondYear = students.filter((s) => s.year === '2nd Year').length;
  const checkedIn = students.filter((s) => s.attended).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white text-slate-900 shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Toolbar (hidden during actual print) */}
        <div className="px-6 py-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-base text-slate-800">
              Printable Attendee Roster (PDF Ready)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="p-8 overflow-y-auto font-sans text-xs bg-white text-slate-900">
          {/* Institution Header */}
          <div className="border-b-2 border-slate-800 pb-4 mb-6 text-center">
            <h1 className="text-xl font-extrabold uppercase tracking-tight text-slate-900">
              ACE ENGINEERING COLLEGE
            </h1>
            <p className="text-xs font-semibold text-slate-700">
              Department of Computer Science & Design (CSD)
            </p>
            <div className="mt-2 inline-block px-3 py-1 bg-slate-100 rounded-md border border-slate-300 font-mono text-[11px] font-bold">
              WiDS ACEEC Chapter × Synapse Club — Official Event Attendee Register
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </p>
          </div>

          {/* Roster Summary Statistics */}
          <div className="grid grid-cols-4 gap-3 mb-6 text-center">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Total Attendees</span>
              <span className="text-lg font-bold text-slate-900 font-mono">{total}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">1st Year CSD</span>
              <span className="text-lg font-bold text-slate-900 font-mono">{firstYear}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">2nd Year CSD</span>
              <span className="text-lg font-bold text-slate-900 font-mono">{secondYear}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Verified Check-in</span>
              <span className="text-lg font-bold text-emerald-700 font-mono">{checkedIn}</span>
            </div>
          </div>

          {/* Attendee Roster Table */}
          <table className="w-full text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-800 text-[10px] uppercase font-bold">
                <th className="border border-slate-300 p-2">S.No</th>
                <th className="border border-slate-300 p-2">Reg ID</th>
                <th className="border border-slate-300 p-2">Student Name</th>
                <th className="border border-slate-300 p-2">Roll Number</th>
                <th className="border border-slate-300 p-2">Year</th>
                <th className="border border-slate-300 p-2">Sec</th>
                <th className="border border-slate-300 p-2">Email</th>
                <th className="border border-slate-300 p-2">Event</th>
                <th className="border border-slate-300 p-2 text-center">Status</th>
                <th className="border border-slate-300 p-2 text-center w-24">Sign</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st, index) => (
                <tr key={st.id} className="text-[11px] hover:bg-slate-50">
                  <td className="border border-slate-300 p-1.5 text-center font-mono">{index + 1}</td>
                  <td className="border border-slate-300 p-1.5 font-mono font-bold text-indigo-900">
                    {st.registrationId}
                  </td>
                  <td className="border border-slate-300 p-1.5 font-medium">{st.fullName}</td>
                  <td className="border border-slate-300 p-1.5 font-mono font-bold">{st.rollNumber}</td>
                  <td className="border border-slate-300 p-1.5">{st.year}</td>
                  <td className="border border-slate-300 p-1.5 text-center font-bold">{st.section}</td>
                  <td className="border border-slate-300 p-1.5 text-[10px] text-slate-600 truncate max-w-[140px]">
                    {st.email}
                  </td>
                  <td className="border border-slate-300 p-1.5 text-[10px] truncate max-w-[120px]">
                    {st.eventTitle}
                  </td>
                  <td className="border border-slate-300 p-1.5 text-center font-mono text-[10px]">
                    {st.attended ? 'Present' : 'Pending'}
                  </td>
                  <td className="border border-slate-300 p-1.5 border-dashed"></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Sign-off / Verification Block */}
          <div className="mt-12 pt-8 border-t border-slate-300 flex justify-between text-xs text-slate-700">
            <div>
              <p className="font-bold">Faculty Coordinator / HOD</p>
              <p className="text-[10px] text-slate-500">Department of CSD, ACEEC</p>
            </div>
            <div>
              <p className="font-bold">WiDS Chapter Ambassador</p>
              <p className="text-[10px] text-slate-500">ACE Engineering College</p>
            </div>
            <div className="text-right">
              <p className="font-bold">Synapse Club President</p>
              <p className="text-[10px] text-slate-500">Technical Board Lead</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
