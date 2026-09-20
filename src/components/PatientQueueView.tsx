import React, { useState } from 'react';
import {
  Clock,
  MapPin,
  Stethoscope,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Volume2,
  RotateCcw,
  Accessibility,
  ArrowRight,
  Calendar,
  Sparkles,
  Share2
} from 'lucide-react';
import { Queue, QueueEntry, Doctor, User } from '../types.js';
import { playHospitalChime } from '../utils/audio.js';

interface PatientQueueViewProps {
  queue: Queue | null;
  currentUser?: User | null;
  onDelayToken: (tokenNumber: string) => void;
  onBookClick: () => void;
}

export const PatientQueueView: React.FC<PatientQueueViewProps> = ({
  queue,
  currentUser,
  onDelayToken,
  onBookClick
}) => {
  const [delaySuccess, setDelaySuccess] = useState<string | null>(null);
  const [assistanceRequested, setAssistanceRequested] = useState(false);

  const myPatientName = currentUser?.name || 'Deepan';
  const myUserId = currentUser?.id;
  const myPatientId = currentUser?.patient?.id;

  // Dynamically resolve the patient's token entry in this queue
  const myEntry =
    queue?.entries.find(
      (e) =>
        (myUserId && e.patient?.userId === myUserId) ||
        (myPatientId && e.patientId === myPatientId) ||
        (e.patient?.user?.name?.toLowerCase() === myPatientName.toLowerCase())
    ) ||
    queue?.entries.find((e) => e.tokenNumber === 'A-031') ||
    queue?.entries[0];

  const displayName = myEntry?.patient?.user?.name || currentUser?.name || 'Deepan';

  const currentlyInRoom = queue?.entries.find((e) => e.status === 'IN_PROGRESS');
  const doctor = queue?.doctor;

  // Calculate live dynamic waiting metrics
  const aheadEntries = queue?.entries.filter(
    (e) => (e.status === 'WAITING' || e.status === 'CALLED') && (myEntry ? e.position < myEntry.position : true)
  ) || [];

  const patientsAhead = aheadEntries.length;
  const avgTime = doctor?.avgConsultationTimeMin || 11.4;
  const estimatedWaitMinutes = Math.max(0, Math.round(patientsAhead * avgTime));

  const handleDelay = () => {
    if (!myEntry) return;
    onDelayToken(myEntry.tokenNumber);
    setDelaySuccess('Your token was shifted 2 spots back. Your registration is securely maintained.');
    setTimeout(() => setDelaySuccess(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Clinic Telemetry Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {queue?.department?.name || 'Cardiology OPD'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-600" />
                {queue?.hospitalName || 'Manipal Hospital, Salem'} ({queue?.location || 'Salem, Tamil Nadu'})
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {queue?.department?.wing || 'Wing B (West Pavilion)'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Clinic Active
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-700 mt-1">
              Attending: <span className="text-slate-900 font-bold">{doctor?.user?.name || 'Dr. Sarah Jenkins, MD, FACC'}</span> • {doctor?.title || 'Chief of Cardiology'}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 mt-1.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {doctor?.roomNumber || 'Consultation Room 3B'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Historical Avg. Consultation: <strong className="text-slate-800">{avgTime} mins</strong>
              </span>
              <span>•</span>
              <span className="text-blue-600 font-semibold">Today's Date: {queue?.date || new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Quick action to book next slot */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBookClick}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
          >
            <Calendar className="w-4 h-4" />
            Book Another Doctor
          </button>
        </div>
      </div>

      {/* Currently In Room Alert Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-blue-500/10 -skew-x-12 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
              <Volume2 className="w-6 h-6 text-blue-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-400/20 text-blue-200 border border-blue-300/30 px-2 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
                  Currently In Consultation Room 3B
                </span>
                <span className="text-xs text-blue-300">Live Doctor Telemetry</span>
              </div>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Token {currentlyInRoom?.tokenNumber || 'A-024'}
                </span>
                <span className="text-sm font-semibold text-blue-200">
                  {currentlyInRoom?.patient?.user?.name || 'Vikram'} ({currentlyInRoom?.patient?.age || 57}y {currentlyInRoom?.patient?.gender === 'Female' ? 'F' : 'M'})
                </span>
              </div>
              <p className="text-xs text-blue-300/80 mt-0.5">
                Chief Complaint: {currentlyInRoom?.chiefComplaint || 'Routine post-stent follow-up & medication review'}
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2.5 border border-white/15 flex items-center gap-3 shrink-0">
            <Clock className="w-5 h-5 text-blue-300" />
            <div>
              <p className="text-[11px] text-blue-200 uppercase font-bold tracking-wider">Estimated Turnaround</p>
              <p className="text-sm font-black text-white">~4 to 6 mins remaining</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Focus: Target Patient Live Token Card */}
      <div className="bg-white rounded-3xl border-2 border-blue-600/30 shadow-xl overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-white flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-white text-blue-700 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Your Personal Token
            </span>
            <span className="text-xs font-semibold text-blue-100">CuraQueue Real-Time Patient Tracker</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-blue-100">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Real-Time Socket Stream Active
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Left: Token Highlight */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Token Allocation</span>
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-extrabold rounded-md border border-blue-200">
                  {queue?.hospitalName || 'Manipal Hospital, Salem'} • Bay A Waiting Lounge
                </span>
              </div>
              <div className="flex flex-wrap items-baseline gap-4">
                <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-mono">
                  {myEntry?.tokenNumber || 'A-031'}
                </h2>
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Verified & Checked In</span>
                </div>
              </div>

              <p className="text-sm font-medium text-slate-600">
                Patient: <strong className="text-slate-900">{displayName}</strong> • MRN: <span className="font-mono">{myEntry?.patient?.mrn || 'MRN-SLM-8829'}</span>
              </p>
              <p className="text-xs text-slate-500">
                Reason: {myEntry?.chiefComplaint || 'Consultation & Follow-up with Dr. Sarah Jenkins'}
              </p>
            </div>

            {/* Right: Dynamic Wait Time Gauge */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/90 text-center flex flex-col items-center justify-center">
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Estimated Wait Time</p>
              <div className="my-2 flex items-baseline justify-center gap-1">
                <span className="text-4xl sm:text-5xl font-black text-blue-600 tracking-tight">
                  ~{estimatedWaitMinutes}
                </span>
                <span className="text-sm font-bold text-slate-600">MINS</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>{patientsAhead} Patients Ahead of You</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Dynamically calculated: {patientsAhead} ahead × {avgTime}m avg duration
              </p>
            </div>
          </div>

          {/* 5-Step Clinical Progression Journey */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">
              Your Visit Progress
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {/* Step 1 */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3">
                <div className="flex items-center justify-between text-emerald-700 mb-1">
                  <span className="text-xs font-bold">Step 1: Check-in</span>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <p className="text-[11px] text-slate-600">Kiosk 2 • 09:42 AM</p>
                <span className="text-[10px] font-extrabold text-emerald-700 uppercase">Completed</span>
              </div>

              {/* Step 2 */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3">
                <div className="flex items-center justify-between text-emerald-700 mb-1">
                  <span className="text-xs font-bold">Step 2: Triage</span>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <p className="text-[11px] text-slate-600">Nurse Station B</p>
                <span className="text-[10px] font-extrabold text-emerald-700 uppercase">Vitals Logged</span>
              </div>

              {/* Step 3: Current */}
              <div className="bg-blue-50 border-2 border-blue-500 rounded-xl p-3 shadow-xs">
                <div className="flex items-center justify-between text-blue-700 mb-1">
                  <span className="text-xs font-extrabold">Step 3: Waiting</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
                </div>
                <p className="text-[11px] font-semibold text-slate-800">Bay A Lounge</p>
                <span className="text-[10px] font-black text-blue-700 uppercase">You Are Here (#7)</span>
              </div>

              {/* Step 4 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-400">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">Step 4: Called</span>
                  <span className="text-xs font-bold text-slate-400">4</span>
                </div>
                <p className="text-[11px] text-slate-500">Room 3B Ready</p>
                <span className="text-[10px] text-slate-400 uppercase font-medium">Next in line</span>
              </div>

              {/* Step 5 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-400">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">Step 5: Conclude</span>
                  <span className="text-xs font-bold text-slate-400">5</span>
                </div>
                <p className="text-[11px] text-slate-500">Rx & Discharge</p>
                <span className="text-[10px] text-slate-400 uppercase font-medium">Pending</span>
              </div>
            </div>
          </div>

          {/* Interactive Patient Actions */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handleDelay}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-slate-200"
            >
              <RotateCcw className="w-4 h-4 text-slate-600" />
              Delay My Token (Shift 2 Spots Back)
            </button>

            <button
              onClick={() => setAssistanceRequested(true)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                assistanceRequested
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
              }`}
            >
              <Accessibility className="w-4 h-4 text-blue-600" />
              {assistanceRequested ? 'Attendant Notified for Bay A' : 'Request Wheelchair / Assistance'}
            </button>

            <button
              onClick={() => playHospitalChime()}
              className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-blue-200"
            >
              <Volume2 className="w-4 h-4 text-blue-600" />
              Test Audio Announcement Chime
            </button>
          </div>

          {delaySuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {delaySuccess}
            </div>
          )}
        </div>
      </div>

      {/* Live Queue Flow List (All Tokens in Cardiology OPD) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Live Queue Sequence • Cardiology OPD
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Real-time sequence stream synchronized across kiosks, doctor desk, and patient mobiles.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Total in Queue: <strong className="text-slate-900">{queue?.entries.length || 0}</strong>
          </div>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 font-bold uppercase tracking-wider text-[11px] pb-2">
                <th className="py-2.5 pr-4">Token #</th>
                <th className="py-2.5 px-4">Patient</th>
                <th className="py-2.5 px-4">Triage Priority</th>
                <th className="py-2.5 px-4">Check-in</th>
                <th className="py-2.5 px-4">Current Status</th>
                <th className="py-2.5 pl-4 text-right">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {queue?.entries.map((entry) => {
                const isMe =
                  entry.id === myEntry?.id ||
                  entry.tokenNumber === myEntry?.tokenNumber ||
                  (myUserId && entry.patient?.userId === myUserId) ||
                  (myPatientId && entry.patientId === myPatientId) ||
                  (entry.patient?.user?.name?.toLowerCase() === myPatientName.toLowerCase());
                const isCurrent = entry.status === 'IN_PROGRESS';
                const isCompleted = entry.status === 'COMPLETED';
                const isSkipped = entry.status === 'SKIPPED';

                return (
                  <tr
                    key={entry.id}
                    className={`transition-colors ${
                      isMe
                        ? 'bg-blue-50/70 hover:bg-blue-50 font-semibold'
                        : isCurrent
                        ? 'bg-amber-50/60 hover:bg-amber-50'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Token */}
                    <td className="py-3 pr-4 font-mono font-bold text-sm">
                      <div className="flex items-center gap-2">
                        <span className={isMe ? 'text-blue-700 font-black' : isCurrent ? 'text-amber-700 font-black' : 'text-slate-900'}>
                          {entry.tokenNumber}
                        </span>
                        {isMe && (
                          <span className="bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                            YOU
                          </span>
                        )}
                        {isCurrent && (
                          <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                            IN ROOM
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Patient Name */}
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-slate-900">
                          {entry.patient?.user?.name || 'Walk-in Patient'}
                        </span>
                        <p className="text-[11px] text-slate-400 font-normal">
                          {entry.patient?.mrn || 'General OPD'}
                        </p>
                      </div>
                    </td>

                    {/* Triage */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          entry.triageCategory === 'Fast-Track'
                            ? 'bg-purple-100 text-purple-700'
                            : entry.triageCategory === 'Priority Senior'
                            ? 'bg-indigo-100 text-indigo-700'
                            : entry.triageCategory === 'Emergency'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {entry.triageCategory}
                      </span>
                    </td>

                    {/* Check In Time */}
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {entry.checkInTime}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-slate-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                          Completed
                        </span>
                      ) : isCurrent ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                          In Consultation
                        </span>
                      ) : isSkipped ? (
                        <span className="inline-flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-md">
                          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                          Grace (Active 15m)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          Waiting ({entry.waitDurationMin || 10}m elapsed)
                        </span>
                      )}
                    </td>

                    {/* Location */}
                    <td className="py-3 pl-4 text-right font-medium text-slate-600">
                      {entry.roomAssignment || 'Room 3B'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
