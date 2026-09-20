import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Users,
  Play,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertTriangle,
  FileText,
  Pill,
  Activity,
  Plus,
  Trash2,
  Send,
  Volume2,
  AlertCircle,
  Pause,
  ExternalLink
} from 'lucide-react';
import { Queue, QueueEntry, Doctor, Consultation } from '../types.js';
import { speakTokenAnnouncement } from '../utils/audio.js';

interface DoctorConsoleViewProps {
  queue: Queue | null;
  onCallNext: () => void;
  onCompleteConsultation: (clinicalData: any) => void;
  onSkipPatient: (entryId: string) => void;
  onRestorePatient: (entryId: string) => void;
  onStatusChange: (status: string) => void;
}

export const DoctorConsoleView: React.FC<DoctorConsoleViewProps> = ({
  queue,
  onCallNext,
  onCompleteConsultation,
  onSkipPatient,
  onRestorePatient,
  onStatusChange
}) => {
  const [filter, setFilter] = useState<'ALL' | 'WAITING' | 'IN_ROOM' | 'SKIPPED'>('ALL');
  const [timerSeconds, setTimerSeconds] = useState(254); // elapsed consultation timer
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Clinical inputs
  const [bp, setBp] = useState('132/84');
  const [pulse, setPulse] = useState(76);
  const [spo2, setSpo2] = useState(98);
  const [temp, setTemp] = useState('98.4');
  const [chiefComplaint, setChiefComplaint] = useState(
    'Routine post-stent follow-up & medication review. Mild intermittent exertional fatigue on stair climbing. Denies chest pain or shortness of breath.'
  );
  const [notes, setNotes] = useState(
    'Patient appears well-perfused and comfortable. Heart sounds: S1/S2 present, no audible murmurs or gallops. Lungs clear to auscultation bilaterally. EKG demonstrates stable sinus rhythm without ischemic shifts.'
  );
  const [plan, setPlan] = useState(
    '1. Continue Dual Antiplatelet Therapy (DAPT) - Clopidogrel 75mg QD + ASA 81mg QD.\n2. Atorvastatin maintained at 40mg nocte.\n3. Order Repeat Lipid Panel in 8 weeks.'
  );

  const [prescriptions, setPrescriptions] = useState<string[]>([
    'Clopidogrel 75mg Oral Tablet - 1 tab daily (30 days)',
    'Atorvastatin 40mg Oral Tablet - 1 tab at bedtime (90 days)'
  ]);
  const [newRx, setNewRx] = useState('');

  const [labOrders, setLabOrders] = useState<string[]>([
    'Repeat Lipid Panel with Reflex LDL',
    'Serum Creatinine & eGFR'
  ]);
  const [newLab, setNewLab] = useState('');

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const activeEntry = queue?.entries.find((e) => e.status === 'IN_PROGRESS');
  const nextWaiting = queue?.entries.find((e) => e.status === 'WAITING' || e.status === 'CALLED');
  const doctor = queue?.doctor;

  // Active consultation elapsed timer
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && activeEntry) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, activeEntry]);

  // Reset timer on patient change
  useEffect(() => {
    if (activeEntry) {
      setTimerSeconds(180);
      setIsTimerRunning(true);
    }
  }, [activeEntry?.id]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleCallNextWithVoice = () => {
    if (nextWaiting) {
      speakTokenAnnouncement(nextWaiting.tokenNumber, doctor?.roomNumber || 'Room 3B');
    }
    onCallNext();
    setNotificationMsg(
      nextWaiting
        ? `Token ${nextWaiting.tokenNumber} summoned to ${doctor?.roomNumber || 'Room 3B'}`
        : 'Next patient called.'
    );
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const handleConclude = () => {
    if (!activeEntry) return;
    onCompleteConsultation({
      chiefComplaint,
      bloodPressure: bp,
      pulseBpm: pulse,
      notes,
      plan,
      prescriptions,
      labOrders
    });
    setNotificationMsg(`Consultation for Token ${activeEntry.tokenNumber} completed and saved to EHR.`);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const addPrescription = () => {
    if (!newRx.trim()) return;
    setPrescriptions([...prescriptions, newRx.trim()]);
    setNewRx('');
  };

  const removePrescription = (idx: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== idx));
  };

  const addLabOrder = () => {
    if (!newLab.trim()) return;
    setLabOrders([...labOrders, newLab.trim()]);
    setNewLab('');
  };

  const removeLabOrder = (idx: number) => {
    setLabOrders(labOrders.filter((_, i) => i !== idx));
  };

  // Filtered Queue
  const filteredEntries = (queue?.entries || []).filter((e) => {
    if (filter === 'WAITING') return e.status === 'WAITING' || e.status === 'CALLED';
    if (filter === 'IN_ROOM') return e.status === 'IN_PROGRESS';
    if (filter === 'SKIPPED') return e.status === 'SKIPPED';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Doctor Status Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={doctor?.user?.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400'}
            alt="Doctor"
            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-blue-100 shadow-xs"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                {doctor?.user?.name || 'Dr. Sarah Jenkins, MD, FACC'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {doctor?.hospitalName || queue?.hospitalName || 'Manipal Hospital, Salem'} ({doctor?.location || 'Salem, Tamil Nadu'})
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {doctor?.roomNumber || 'Room 3B'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {doctor?.specialty || 'Cardiovascular Ambulatory Care & Interventions'} • {queue?.department?.name || 'Cardiology OPD'}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600 mt-1">
              <span>Avg Consult: <strong className="text-blue-600">{doctor?.avgConsultationTimeMin || 11.4} mins</strong></span>
              <span>•</span>
              <span>Attended Today: <strong className="text-emerald-700">{doctor?.totalConsultationsDone || 18}</strong></span>
              <span>•</span>
              <span>In Waiting Lounge: <strong className="text-amber-700">{queue?.entries.filter((e) => e.status === 'WAITING').length || 0}</strong></span>
            </div>
          </div>
        </div>

        {/* Doctor Duty Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1">Duty Status:</span>
          <button
            onClick={() => onStatusChange('ON_DUTY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              doctor?.status === 'ON_DUTY'
                ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse"></span>
            On Duty
          </button>
          <button
            onClick={() => onStatusChange('ON_BREAK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              doctor?.status === 'ON_BREAK'
                ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Break (15m)
          </button>
          <button
            onClick={() => onStatusChange('OFF_DUTY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              doctor?.status === 'OFF_DUTY'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Off Duty
          </button>
        </div>
      </div>

      {notificationMsg && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          {notificationMsg}
        </div>
      )}

      {/* Main Clinical Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Queue Patient Roster (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Active Queue Queue
              </h2>
              <span className="text-xs font-bold text-slate-400 font-mono">
                {queue?.entries.length || 0} Total
              </span>
            </div>

            {/* Filter Pills */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl text-[11px] font-bold text-slate-600">
              <button
                onClick={() => setFilter('ALL')}
                className={`py-1 rounded-lg transition ${filter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('IN_ROOM')}
                className={`py-1 rounded-lg transition ${filter === 'IN_ROOM' ? 'bg-white text-amber-700 shadow-xs' : 'hover:text-slate-900'}`}
              >
                In Room
              </button>
              <button
                onClick={() => setFilter('WAITING')}
                className={`py-1 rounded-lg transition ${filter === 'WAITING' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'}`}
              >
                Waiting
              </button>
              <button
                onClick={() => setFilter('SKIPPED')}
                className={`py-1 rounded-lg transition ${filter === 'SKIPPED' ? 'bg-white text-red-700 shadow-xs' : 'hover:text-slate-900'}`}
              >
                Grace
              </button>
            </div>

            {/* Queue Cards List */}
            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {filteredEntries.map((entry) => {
                const isInChair = entry.status === 'IN_PROGRESS';
                const isNext = entry.id === nextWaiting?.id;
                const isSkipped = entry.status === 'SKIPPED';
                const isCompleted = entry.status === 'COMPLETED';

                return (
                  <div
                    key={entry.id}
                    className={`p-3 rounded-xl border transition ${
                      isInChair
                        ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-200'
                        : isNext
                        ? 'bg-blue-50/70 border-blue-300'
                        : isSkipped
                        ? 'bg-red-50/50 border-red-200'
                        : isCompleted
                        ? 'bg-slate-50/70 border-slate-200 opacity-60'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-slate-900">
                          {entry.tokenNumber}
                        </span>
                        {isInChair && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500 text-white uppercase tracking-wider">
                            IN CHAIR
                          </span>
                        )}
                        {isNext && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-600 text-white uppercase tracking-wider">
                            NEXT CALL
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{entry.checkInTime}</span>
                    </div>

                    <p className="text-xs font-bold text-slate-800 mt-1">
                      {entry.patient?.user?.name || 'Walk-in Patient'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{entry.chiefComplaint || 'Consultation'}</p>

                    {/* Quick Card Controls */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-[10px] font-semibold text-slate-400">
                        {entry.triageCategory}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isSkipped && (
                          <button
                            onClick={() => onRestorePatient(entry.id)}
                            className="text-red-700 font-bold hover:underline text-[10px]"
                          >
                            Restore to Queue
                          </button>
                        )}
                        {!isCompleted && !isInChair && (
                          <button
                            onClick={() => onSkipPatient(entry.id)}
                            className="text-slate-400 hover:text-red-600 text-[10px] font-medium"
                          >
                            Skip
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Active Consultation & Clinical Workspace (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Active Patient In-Chair Card */}
          <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-sm p-6 space-y-5">
            {/* Header / Timer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-lg font-mono">
                  {activeEntry?.tokenNumber || 'A-024'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                      {activeEntry?.patient?.user?.name || 'Vikram'}
                    </h2>
                    <span className="text-xs font-semibold text-slate-500">
                      ({activeEntry?.patient?.age || 57}y {activeEntry?.patient?.gender || 'Male'})
                    </span>
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                      In Chair
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-500">
                    MRN: {activeEntry?.patient?.mrn || 'MRN-SLM-1004'} • Blood Group: {activeEntry?.patient?.bloodGroup || 'AB+'}
                  </p>
                </div>
              </div>

              {/* Consultation Elapsed Timer */}
              <div className="flex items-center gap-3 bg-amber-50/80 px-4 py-2 rounded-xl border border-amber-200">
                <Clock className="w-5 h-5 text-amber-600 animate-spin" />
                <div>
                  <p className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">Elapsed Time</p>
                  <p className="text-xl font-black font-mono text-amber-900">{formatTimer(timerSeconds)}</p>
                </div>
              </div>
            </div>

            {/* Primary Doctor Action Bar */}
            <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2">
                {/* CALL NEXT PATIENT (The Main Primary Action) */}
                <button
                  onClick={handleCallNextWithVoice}
                  className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-md shadow-blue-500/30"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Call Next Patient ({nextWaiting?.tokenNumber || 'Next in line'})
                </button>

                {/* Complete & Save Consultation */}
                <button
                  onClick={handleConclude}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Conclude & Save to EHR
                </button>
              </div>

              <div className="flex items-center gap-2">
                {activeEntry && (
                  <button
                    onClick={() => onSkipPatient(activeEntry.id)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition border border-slate-700"
                  >
                    Skip to Grace (15m)
                  </button>
                )}
              </div>
            </div>

            {/* Vitals Telemetry Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase">Blood Pressure</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <input
                    type="text"
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                    className="w-20 font-mono font-bold text-base text-slate-900 bg-transparent focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">mmHg</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase">Heart Rate</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <input
                    type="number"
                    value={pulse}
                    onChange={(e) => setPulse(Number(e.target.value))}
                    className="w-16 font-mono font-bold text-base text-slate-900 bg-transparent focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">bpm</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase">SpO2 (Oxygen)</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <input
                    type="number"
                    value={spo2}
                    onChange={(e) => setSpo2(Number(e.target.value))}
                    className="w-16 font-mono font-bold text-base text-slate-900 bg-transparent focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">%</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase">Temp</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <input
                    type="text"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    className="w-16 font-mono font-bold text-base text-slate-900 bg-transparent focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">°F</span>
                </div>
              </div>
            </div>

            {/* Allergies Alert */}
            {activeEntry?.patient?.allergies && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-800 font-bold">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                Critical Clinical Allergy Alert: {activeEntry.patient.allergies}
              </div>
            )}

            {/* Clinical SOAP Notes Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Chief Complaint / History of Present Illness
                </label>
                <textarea
                  rows={2}
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="w-full text-xs font-medium text-slate-800 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Objective Assessment & Clinical Observations
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs font-medium text-slate-800 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Management Plan & Follow-up
                </label>
                <textarea
                  rows={2}
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full text-xs font-medium text-slate-800 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                />
              </div>
            </div>

            {/* E-Prescription & Lab Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              {/* Prescriptions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-blue-600" />
                    Electronic Prescriptions
                  </span>
                </div>
                <div className="space-y-1.5">
                  {prescriptions.map((rx, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-blue-50/60 border border-blue-100 rounded-lg text-xs font-medium text-slate-800">
                      <span className="truncate">{rx}</span>
                      <button onClick={() => removePrescription(idx)} className="text-slate-400 hover:text-red-600 ml-2">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Lisinopril 10mg Oral QD (30 days)"
                    value={newRx}
                    onChange={(e) => setNewRx(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addPrescription()}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button onClick={addPrescription} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Lab Orders */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-purple-600" />
                    Diagnostic & Lab Orders
                  </span>
                </div>
                <div className="space-y-1.5">
                  {labOrders.map((lab, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-purple-50/60 border border-purple-100 rounded-lg text-xs font-medium text-slate-800">
                      <span className="truncate">{lab}</span>
                      <button onClick={() => removeLabOrder(idx)} className="text-slate-400 hover:text-red-600 ml-2">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 12-Lead Ambulatory Electrocardiogram"
                    value={newLab}
                    onChange={(e) => setNewLab(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addLabOrder()}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <button onClick={addLabOrder} className="p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
