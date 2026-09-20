import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Printer,
  Users,
  Building2,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  QrCode,
  Sparkles
} from 'lucide-react';
import { Queue, Doctor, Department, QueueEntry } from '../types.js';
import { api } from '../utils/api.js';

interface ReceptionViewProps {
  queue: Queue | null;
  onQueueUpdated: () => void;
}

export const ReceptionView: React.FC<ReceptionViewProps> = ({ queue, onQueueUpdated }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('doc-sarah');

  // Walk-in form state
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [mrn, setMrn] = useState('');
  const [triageCategory, setTriageCategory] = useState<'General' | 'Priority Senior' | 'Fast-Track' | 'Emergency'>('General');
  const [complaint, setComplaint] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dispensed Ticket Modal
  const [dispensedTicket, setDispensedTicket] = useState<{
    tokenNumber: string;
    patientName: string;
    doctorName: string;
    room: string;
    triage: string;
    time: string;
    hospitalName?: string;
    location?: string;
  } | null>(null);

  useEffect(() => {
    api.getDoctors().then(setDoctors).catch(console.error);
  }, []);

  const handleIssueToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.issueWalkInToken(selectedDoctorId, {
        patientName,
        phone,
        mrn: mrn || `MRN-${Math.floor(100000 + Math.random() * 900000)}`,
        triageCategory,
        chiefComplaint: complaint || 'Walk-in Consultation'
      });

      const doc = doctors.find((d) => d.id === selectedDoctorId);

      setDispensedTicket({
        tokenNumber: res.tokenNumber,
        patientName,
        doctorName: doc?.user?.name || 'Dr. Sarah Jenkins',
        room: doc?.roomNumber || 'Room 3B',
        triage: triageCategory,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hospitalName: doc?.hospitalName || 'Manipal Hospital, Salem',
        location: doc?.location || 'Salem, Tamil Nadu'
      });

      // Clear fields
      setPatientName('');
      setPhone('');
      setMrn('');
      setComplaint('');
      onQueueUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async (entryId: string) => {
    await api.restoreEntry(entryId);
    onQueueUpdated();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Desk Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Reception Desk & Walk-In Ticket Kiosk
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              West Lobby Central Reception • Desk 1 • Operator: Clara Oswald, RN
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Queue Kiosks 1-4 Online
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Rapid Intake & Ticket Dispenser (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Ticket className="w-4 h-4 text-blue-600" />
                Issue Walk-in Queue Token
              </h2>
              <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full uppercase">
                Direct Intake
              </span>
            </div>

            <form onSubmit={handleIssueToken} className="space-y-3.5">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ajith or Vijay"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Phone / Mobile
                  </label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    MRN (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated if blank"
                    value={mrn}
                    onChange={(e) => setMrn(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Attending Doctor & Clinic
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full text-xs font-bold border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.user?.name} — {doc.hospitalName ? doc.hospitalName.replace(', Salem', '') : 'Manipal Hospital'} ({doc.roomNumber} • {doc.specialty})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Triage Category
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setTriageCategory('General')}
                    className={`p-2 rounded-xl border text-center transition ${
                      triageCategory === 'General' ? 'bg-blue-50 text-blue-700 border-blue-400' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    General Intake
                  </button>
                  <button
                    type="button"
                    onClick={() => setTriageCategory('Priority Senior')}
                    className={`p-2 rounded-xl border text-center transition ${
                      triageCategory === 'Priority Senior' ? 'bg-indigo-50 text-indigo-700 border-indigo-400' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Priority Senior (65+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTriageCategory('Fast-Track')}
                    className={`p-2 rounded-xl border text-center transition ${
                      triageCategory === 'Fast-Track' ? 'bg-purple-50 text-purple-700 border-purple-400' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Fast-Track (ECG/Lab)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTriageCategory('Emergency')}
                    className={`p-2 rounded-xl border text-center transition ${
                      triageCategory === 'Emergency' ? 'bg-red-50 text-red-700 border-red-400' : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    STAT Emergency
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Primary Symptom / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chest tightness, blood pressure prescription refill"
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !patientName.trim()}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
                >
                  <Printer className="w-4 h-4" />
                  {isSubmitting ? 'Dispensing...' : 'Dispense Thermal Queue Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Live Queue Operations & Grace Recovery (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Cardiology OPD Floor Queue
                </h2>
                <p className="text-xs text-slate-500">Live reception monitoring of active waiting bays & grace entries</p>
              </div>
              <span className="text-xs font-bold text-slate-600">
                {queue?.entries.length || 0} Registered
              </span>
            </div>

            {/* Queue Table */}
            <div className="divide-y divide-slate-100 overflow-x-auto max-h-[520px]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase tracking-wider text-[11px] pb-2">
                    <th className="py-2 pr-3">Token</th>
                    <th className="py-2 px-3">Patient</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 pl-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {queue?.entries.map((entry) => {
                    const isSkipped = entry.status === 'SKIPPED';
                    const isServing = entry.status === 'IN_PROGRESS';
                    const isDone = entry.status === 'COMPLETED';

                    return (
                      <tr key={entry.id} className="hover:bg-slate-50">
                        <td className="py-2.5 pr-3 font-mono font-bold text-slate-900">
                          {entry.tokenNumber}
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-slate-900">{entry.patient?.user?.name || 'Walk-in'}</p>
                          <p className="text-[10px] text-slate-400">{entry.patient?.mrn}</p>
                        </td>
                        <td className="py-2.5 px-3">
                          {isServing ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              In Chair
                            </span>
                          ) : isSkipped ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                              Grace 15m
                            </span>
                          ) : isDone ? (
                            <span className="text-slate-400 text-[10px]">Concluded</span>
                          ) : (
                            <span className="text-blue-600 text-[10px] font-bold">Waiting</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] text-slate-500 font-medium">
                            {entry.triageCategory}
                          </span>
                        </td>
                        <td className="py-2.5 pl-3 text-right">
                          {isSkipped && (
                            <button
                              onClick={() => handleRestore(entry.id)}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[10px] font-bold border border-red-200 transition"
                            >
                              Restore
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Thermal Ticket Slip Modal */}
      {dispensedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-center relative">
            <button
              onClick={() => setDispensedTicket(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 text-sm font-bold w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
            >
              ✕
            </button>

            <div className="border-b-2 border-dashed border-slate-300 pb-4 space-y-1">
              <p className="text-xs font-black tracking-widest text-slate-400 uppercase">CuraQueue Clinical OS</p>
              <h3 className="text-base font-extrabold text-slate-900">{dispensedTicket.hospitalName || 'Manipal Hospital, Salem'}</h3>
              <p className="text-[11px] text-slate-500">{dispensedTicket.location || 'Salem, Tamil Nadu'} • OPD Ambulatory Care</p>
            </div>

            <div className="space-y-2 py-2">
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Your Token Number</p>
              <div className="text-5xl font-black font-mono text-slate-900 tracking-tighter">
                {dispensedTicket.tokenNumber}
              </div>
              <span className="inline-block px-3 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800">
                {dispensedTicket.triage}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left text-xs space-y-1">
              <p className="text-slate-500">Patient: <strong className="text-slate-900">{dispensedTicket.patientName}</strong></p>
              <p className="text-slate-500">Physician: <strong className="text-slate-900">{dispensedTicket.doctorName}</strong></p>
              <p className="text-slate-500">Consultation Room: <strong className="text-blue-700">{dispensedTicket.room}</strong></p>
              <p className="text-slate-400 text-[10px] mt-1">Issued At: {dispensedTicket.time}</p>
            </div>

            <div className="flex items-center justify-center py-2 text-slate-400">
              <QrCode className="w-16 h-16" />
            </div>

            <p className="text-[10px] text-slate-400">
              Please take a seat in Bay A. Watch the TV display board for your audio token call.
            </p>

            <button
              onClick={() => { window.print(); }}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Thermal Slip
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
