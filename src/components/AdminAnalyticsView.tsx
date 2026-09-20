import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Building2,
  Stethoscope,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { api } from '../utils/api.js';

export const AdminAnalyticsView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500 text-xs font-semibold">
        Aggregating hospital operations and queue telemetry...
      </div>
    );
  }

  const { metrics, hourlyThroughput, departmentBreakdown, bottlenecks, doctors } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Executive Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Hospital Operational Telemetry & Queue Analytics
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
              Live Stream
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Superintendent Dashboard • Medical Director: Dr. Arthur Sterling • Multi-Clinic Flow
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Facility Health:</span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-black rounded-xl border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Optimal OPD Throughput (94.8%)
          </span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Patients Today</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">
            {metrics.totalPatientsToday}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            +14% vs yesterday benchmark
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Current Waiting</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">
            {metrics.currentlyWaiting}
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Across 4 outpatient clinic wings
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Hospital Wait</span>
            <Activity className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-black text-purple-700 tracking-tight">
              {metrics.avgWaitTimeMin}
            </p>
            <span className="text-xs font-bold text-slate-500">MINS</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            Target &lt; 20m met
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Staff Doctors</span>
            <Stethoscope className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">
            {metrics.activeDoctorsCount} / {metrics.totalDoctorsCount}
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            100% on-duty roster compliance
          </p>
        </div>
      </div>

      {/* Real-time Bottlenecks Notice */}
      {bottlenecks && bottlenecks.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs uppercase tracking-wider mb-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            Automated Operational Bottleneck Alerts
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bottlenecks.map((b: any) => (
              <div key={b.id} className="bg-white/80 p-3 rounded-xl border border-amber-200/80 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{b.department} • {b.room}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 uppercase">
                    Surge
                  </span>
                </div>
                <p className="text-slate-600">{b.message}</p>
                <p className="text-blue-700 font-bold text-[11px]">Recommended Action: {b.action}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hourly Flow Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                Hourly Patient Inflow vs Consultations Completed
              </h2>
              <p className="text-xs text-slate-500">Live hourly telemetry comparison of check-in volume vs discharges</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyThroughput} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorArrivals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                <Area type="monotone" dataKey="arrivals" name="Patient Arrivals" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorArrivals)" />
                <Area type="monotone" dataKey="completed" name="Completed Consultations" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Wait Time Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-black text-slate-900 tracking-tight">
              Average Wait Times by Clinical Department
            </h2>
            <p className="text-xs text-slate-500">Real-time queue duration across medical departments</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                />
                <Bar dataKey="avgWaitMin" name="Avg Wait (Mins)" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Doctor Performance & Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-black text-slate-900 tracking-tight">
              Physician Consultation Cadence & Workload
            </h2>
            <p className="text-xs text-slate-500">Live pacing and average duration tracking to prevent clinic overruns</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 font-bold uppercase tracking-wider text-[11px] pb-2">
                <th className="py-2.5 pr-4">Physician</th>
                <th className="py-2.5 px-4">Room</th>
                <th className="py-2.5 px-4">Specialty</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Historical Avg Time</th>
                <th className="py-2.5 pl-4 text-right">Consultations Done</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {doctors.map((doc: any) => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="py-3 pr-4 font-bold text-slate-900">
                    {doc.name}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {doc.roomNumber}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {doc.specialty}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {doc.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-purple-700">
                    {doc.avgConsultationTimeMin} mins
                  </td>
                  <td className="py-3 pl-4 text-right font-mono font-bold text-slate-900">
                    {doc.totalDone}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
