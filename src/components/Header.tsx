import React, { useState } from 'react';
import {
  Activity,
  Users,
  Stethoscope,
  Calendar,
  Building2,
  BarChart3,
  Tv,
  Bell,
  Volume2,
  Sparkles,
  ChevronDown,
  MapPin,
  Edit3,
  Check,
  X,
  UserCheck,
  LogIn,
  LogOut
} from 'lucide-react';
import { User, Role } from '../types.js';
import { playHospitalChime } from '../utils/audio.js';
import { api } from '../utils/api.js';

interface HeaderProps {
  currentUser: User | null;
  currentView: string;
  onSelectView: (view: string) => void;
  onSwitchRole: (role: Role, doctorId?: string) => void;
  socketConnected: boolean;
  unreadCount: number;
  onOpenNotifications: () => void;
  onProfileUpdated?: (user: User) => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentView,
  onSelectView,
  onSwitchRole,
  socketConnected,
  unreadCount,
  onOpenNotifications,
  onProfileUpdated,
  onLogout
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || 'Ajith');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '+91 98421 11001');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setIsSavingProfile(true);
    try {
      const res = await api.updateProfile({
        name: editName.trim(),
        phone: editPhone.trim()
      });
      if (res.user && onProfileUpdated) {
        onProfileUpdated(res.user);
      }
      setIsEditingProfile(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const navItems = [
    { id: 'patient-queue', label: 'Live Queue Tracking', icon: Users, roleHint: 'PATIENT' },
    { id: 'doctor-console', label: 'Doctor Clinical Console', icon: Stethoscope, roleHint: 'DOCTOR' },
    { id: 'booking', label: 'Book Appointment', icon: Calendar, roleHint: 'ALL' },
    { id: 'reception', label: 'Reception Desk & Kiosk', icon: Building2, roleHint: 'RECEPTIONIST' },
    { id: 'analytics', label: 'Hospital Telemetry', icon: BarChart3, roleHint: 'ADMIN' },
    { id: 'tv-display', label: 'Lobby TV Board', icon: Tv, roleHint: 'PUBLIC' },
    { id: 'login', label: 'Login', icon: LogIn, roleHint: 'AUTH' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/80 shadow-xs">
      {/* Top Telemetry & Fast Access Bar */}
      <div className="bg-slate-900 text-slate-200 px-4 py-1.5 text-xs font-medium flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            {socketConnected ? 'Live Real-Time Sync (WebSocket Active)' : 'Connecting to Socket.IO...'}
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-300 hidden md:inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Location: <strong className="text-white font-semibold">Salem, Tamil Nadu</strong></span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300">Hospital: <strong className="text-blue-300 font-semibold">Manipal Hospital, Salem</strong></span>
          </span>
        </div>

        {/* Demo Fast Switcher & Real User Login */}
        <div className="flex items-center gap-2">
          <button
            id="btn-nav-login"
            onClick={() => onSelectView('login')}
            className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition flex items-center gap-1.5 ${
              currentView === 'login'
                ? 'bg-blue-500 text-white'
                : 'bg-blue-600/90 hover:bg-blue-500 text-white shadow-xs'
            }`}
          >
            <LogIn className="w-3 h-3" />
            <span>Login Page</span>
          </button>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-slate-400 font-normal hidden sm:inline">Quick Role:</span>
          <div className="flex items-center gap-1 bg-slate-800/90 p-0.5 rounded-md border border-slate-700">
            <button
              onClick={() => { onSwitchRole('PATIENT'); onSelectView('patient-queue'); }}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                currentUser?.role === 'PATIENT'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              Patient ({currentUser?.role === 'PATIENT' ? (currentUser.name || 'Ajith').split(' ')[0] : 'Ajith'})
            </button>
            <button
              onClick={() => { onSwitchRole('DOCTOR', 'doc-sarah'); onSelectView('doctor-console'); }}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                currentUser?.role === 'DOCTOR'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              Doctor (Dr. Sarah)
            </button>
            <button
              onClick={() => { onSwitchRole('RECEPTIONIST'); onSelectView('reception'); }}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                currentUser?.role === 'RECEPTIONIST'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              Receptionist (Clara)
            </button>
            <button
              onClick={() => { onSwitchRole('ADMIN'); onSelectView('analytics'); }}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                currentUser?.role === 'ADMIN'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              Admin
            </button>
          </div>
        </div>
      </div>

      {/* Main App Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 ring-4 ring-blue-50">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">CuraQueue</span>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Clinical OS</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Healthcare Appointment & Real-time Queue Engine</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Utilities */}
          <div className="flex items-center gap-2.5">
            {/* Audio Chime Test */}
            <button
              onClick={() => playHospitalChime()}
              title="Test Hospital Chime Audio"
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition border border-slate-200"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition border border-slate-200"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Profile Chip */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition"
              >
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                  alt={currentUser?.name || 'User'}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-300"
                />
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                    {currentUser?.name?.split(',')[0] || 'User'}
                  </p>
                  <p className="text-[10px] text-blue-600 font-semibold tracking-wide uppercase">
                    {currentUser?.role || 'PATIENT'}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900">{currentUser?.name}</p>
                      <button
                        onClick={() => {
                          setEditName(currentUser?.name || '');
                          setEditPhone(currentUser?.phone || '');
                          setIsEditingProfile(!isEditingProfile);
                        }}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        {isEditingProfile ? 'Cancel' : 'Edit'}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">{currentUser?.email}</p>
                    {currentUser?.phone && (
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{currentUser.phone}</p>
                    )}
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full">
                      Role: {currentUser?.role}
                    </span>
                  </div>

                  {isEditingProfile && (
                    <div className="p-2.5 bg-slate-50 border-b border-slate-200 space-y-2">
                      <p className="text-[11px] font-bold text-slate-700">Update Profile Details</p>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Full Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full text-xs font-bold border border-slate-300 rounded-lg p-1.5 bg-white"
                          placeholder="Deepan"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Phone</label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-white"
                          placeholder="+91 98427 12345"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          onClick={handleSaveProfile}
                          disabled={isSavingProfile}
                          className="flex-1 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          {isSavingProfile ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={() => setIsEditingProfile(false)}
                          className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <p className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Switch</p>
                    <button
                      onClick={() => { onSwitchRole('PATIENT'); setShowRoleMenu(false); onSelectView('patient-queue'); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-between"
                    >
                      <span>Patient Profile</span>
                      <span className="text-[10px] text-blue-600 font-semibold">{currentUser?.role === 'PATIENT' ? currentUser.name : 'Ajith'}</span>
                    </button>
                    <button
                      onClick={() => { onSwitchRole('DOCTOR', 'doc-sarah'); setShowRoleMenu(false); onSelectView('doctor-console'); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-between"
                    >
                      <span>Doctor Console</span>
                      <span className="text-[10px] text-slate-400">Dr. Sarah J.</span>
                    </button>
                    <button
                      onClick={() => { onSwitchRole('RECEPTIONIST'); setShowRoleMenu(false); onSelectView('reception'); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-between"
                    >
                      <span>Reception Desk</span>
                      <span className="text-[10px] text-slate-400">Clara O.</span>
                    </button>
                    <button
                      onClick={() => { onSwitchRole('ADMIN'); setShowRoleMenu(false); onSelectView('analytics'); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-between"
                    >
                      <span>Hospital Admin</span>
                      <span className="text-[10px] text-slate-400">Director</span>
                    </button>

                    <div className="border-t border-slate-100 mt-2 pt-2 space-y-1">
                      <button
                        onClick={() => { setShowRoleMenu(false); onSelectView('login'); }}
                        className="w-full text-left px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 font-bold rounded-lg flex items-center gap-2"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Sign In / Switch Real User</span>
                      </button>
                      {onLogout && (
                        <button
                          onClick={() => { setShowRoleMenu(false); onLogout(); }}
                          className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 font-bold rounded-lg flex items-center gap-2"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="lg:hidden border-t border-slate-200 px-2 py-1.5 flex items-center justify-around overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap ${
                isActive ? 'text-blue-600 font-bold' : 'text-slate-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label.split(' ')[0]}
            </button>
          );
        })}
      </div>
    </header>
  );
};
