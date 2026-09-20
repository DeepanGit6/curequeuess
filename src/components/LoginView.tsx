import React, { useState } from 'react';
import {
  Activity,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Stethoscope,
  Building2,
  BarChart3,
  UserCheck
} from 'lucide-react';
import { User as UserType, Role } from '../types.js';
import { api } from '../utils/api.js';

interface LoginViewProps {
  onLoginSuccess: (user: UserType) => void;
  onCancel?: () => void;
  initialRole?: Role;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onCancel,
  initialRole = 'PATIENT'
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('ajith@curaqueue.com');
  const [password, setPassword] = useState('curaqueue123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<Role>('PATIENT');

  // The 7 Official Patients + Staff Quick Access
  const patientProfiles = [
    {
      id: 'user-pat-ajith',
      name: 'Ajith',
      email: 'ajith@curaqueue.com',
      token: 'A-031',
      status: 'Token A-031 • Cardiology Follow-up',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      badge: '#1 Patient'
    },
    {
      id: 'user-pat-vijay',
      name: 'Vijay',
      email: 'vijay@curaqueue.com',
      token: 'A-022',
      status: 'Token A-022 • Consultation Check',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
      badge: '#2 Patient'
    },
    {
      id: 'user-pat-dhanush',
      name: 'Dhanush',
      email: 'dhanush@curaqueue.com',
      token: 'A-023',
      status: 'Token A-023 • Pharmacy Grace Period',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      badge: '#3 Patient'
    },
    {
      id: 'user-pat-vikram',
      name: 'Vikram',
      email: 'vikram@curaqueue.com',
      token: 'A-024',
      status: 'Token A-024 • Currently in Room 3B',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
      badge: '#4 In Chair'
    },
    {
      id: 'user-pat-thrisha',
      name: 'Thrisha',
      email: 'thrisha@curaqueue.com',
      token: 'A-025',
      status: 'Token A-025 • Fast-Track Priority',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
      badge: '#5 Fast-Track'
    },
    {
      id: 'user-pat-mamitha',
      name: 'Mamitha',
      email: 'mamitha@curaqueue.com',
      token: 'A-026',
      status: 'Token A-026 • Waiting Bay A',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
      badge: '#6 Waiting'
    },
    {
      id: 'user-pat-nayanthara',
      name: 'Nayanthara',
      email: 'nayanthara@curaqueue.com',
      token: 'A-027',
      status: 'Token A-027 • Pathology Lab Pending',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      badge: '#7 Waiting'
    }
  ];

  const staffProfiles = [
    {
      id: 'doc-sarah',
      role: 'DOCTOR' as Role,
      name: 'Dr. Sarah Jenkins',
      title: 'Consultant Cardiologist',
      email: 'sarah.jenkins@curaqueue.com',
      icon: Stethoscope
    },
    {
      id: 'rec-clara',
      role: 'RECEPTIONIST' as Role,
      name: 'Clara Oswald, RN',
      title: 'OPD Reception Desk',
      email: 'reception@curaqueue.com',
      icon: Building2
    },
    {
      id: 'admin-sterling',
      role: 'ADMIN' as Role,
      name: 'Dr. Arthur Sterling',
      title: 'Medical Director',
      email: 'admin@curaqueue.com',
      icon: BarChart3
    }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login(email.trim(), password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        phone: regPhone.trim(),
        role: regRole
      });
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatientProfile = async (p: typeof patientProfiles[0]) => {
    setEmail(p.email);
    setPassword('curaqueue123');
    setError(null);
    setLoading(true);
    try {
      const res = await api.demoSwitch('PATIENT', undefined, p.id);
      onLoginSuccess(res.user);
    } catch (err: any) {
      try {
        const res = await api.login(p.email, 'curaqueue123');
        onLoginSuccess(res.user);
      } catch (loginErr: any) {
        setError(loginErr.message || 'Failed to authenticate user.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStaffProfile = async (staff: typeof staffProfiles[0]) => {
    setEmail(staff.email);
    setPassword('curaqueue123');
    setError(null);
    setLoading(true);
    try {
      const res = await api.demoSwitch(staff.role, staff.role === 'DOCTOR' ? staff.id : undefined);
      onLoginSuccess(res.user);
    } catch (err: any) {
      try {
        const res = await api.login(staff.email, 'curaqueue123');
        onLoginSuccess(res.user);
      } catch (loginErr: any) {
        setError(loginErr.message || 'Failed to authenticate staff.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-container" className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      {/* Top Banner */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200/80 rounded-full text-blue-700 text-xs font-bold mb-3">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Secure Clinical OS Authentication</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Welcome to CuraQueue
        </h1>
        <p className="text-sm text-slate-600 mt-2 font-medium">
          Sign in with your real patient account or select from the hospital's registered patients to experience live queue tracking, consultations, and doctor visits.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Real User Credentials Login Form */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          {/* Tab Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button
              id="tab-sign-in"
              type="button"
              onClick={() => { setActiveTab('login'); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'login'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In with Account
            </button>
            <button
              id="tab-register"
              type="button"
              onClick={() => { setActiveTab('register'); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'register'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register New Patient
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-800 text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Authentication Notice</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {activeTab === 'login' ? (
            <form id="form-login" onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="input-login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. ajith@curaqueue.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs font-semibold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Default: curaqueue123</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 text-xs font-semibold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-500" />
                  <span>Remember my session</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('ajith@curaqueue.com');
                    setPassword('curaqueue123');
                  }}
                  className="text-blue-600 hover:text-blue-800 font-bold"
                >
                  Reset to Ajith (Default)
                </button>
              </div>

              <button
                id="btn-submit-login"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Sign In to CuraQueue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                >
                  Continue as Guest / Return to Dashboard
                </button>
              )}
            </form>
          ) : (
            <form id="form-register" onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="input-reg-name"
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Anand Kumar"
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="input-reg-email"
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="anand@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone / Mobile *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="input-reg-phone"
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 98421 99999"
                      className="w-full pl-9 pr-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Role
                  </label>
                  <select
                    id="input-reg-role"
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as Role)}
                    className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="PATIENT">Patient</option>
                    <option value="DOCTOR">Doctor</option>
                    <option value="RECEPTIONIST">Receptionist</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="input-reg-password"
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                id="btn-submit-register"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <span>Registering...</span>
                ) : (
                  <>
                    <span>Create Patient Account & Sign In</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right Column: 1-Click Instant Login for the 7 Official Patients */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  <span>The 7 Official Patients</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any patient to instantly log in with their real ticket and appointment session
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                1-Click Sign In
              </span>
            </div>

            <div className="space-y-2">
              {patientProfiles.map((pat, idx) => (
                <button
                  key={pat.id}
                  id={`btn-login-patient-${idx + 1}`}
                  onClick={() => handleSelectPatientProfile(pat)}
                  disabled={loading}
                  className="w-full p-2.5 rounded-xl border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/60 transition flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={pat.avatar}
                        alt={pat.name}
                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-white shadow-xs"
                      />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 text-white text-[9px] font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 group-hover:text-blue-700">
                          {idx + 1}. {pat.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                          {pat.token}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {pat.status}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-blue-600 group-hover:underline flex items-center gap-1">
                      <span>Log in</span>
                      <ArrowRight className="w-3 h-3 transition transform group-hover:translate-x-0.5" />
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                      {pat.email}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Hospital Staff Fast Login */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Hospital Clinical Staff Access
                </h3>
                <p className="text-[11px] text-slate-400">Log in as Doctor, OPD Receptionist, or Medical Director</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {staffProfiles.map((staff) => {
                const Icon = staff.icon;
                return (
                  <button
                    key={staff.id}
                    id={`btn-staff-login-${staff.role.toLowerCase()}`}
                    onClick={() => handleSelectStaffProfile(staff)}
                    disabled={loading}
                    className="p-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition group"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase text-blue-300">
                        {staff.role}
                      </span>
                    </div>
                    <p className="text-xs font-black text-white truncate">{staff.name}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{staff.title}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
