import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Search,
  Star,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  ChevronRight,
  Sparkles,
  Building2,
  Plus,
  Phone,
  Filter,
  Check,
  Printer,
  Copy,
  Bell,
  User as UserIcon,
  Mail
} from 'lucide-react';
import { Doctor, Department, Appointment, Hospital, User } from '../types.js';
import { api } from '../utils/api.js';

interface BookingViewProps {
  currentUser?: User | null;
  onAppointmentBooked?: (appointment: Appointment, tokenNumber: string) => void;
  onNavigateToQueue?: () => void;
}

export const BookingView: React.FC<BookingViewProps> = ({ currentUser, onAppointmentBooked, onNavigateToQueue }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [locations, setLocations] = useState<string[]>(['Salem, Tamil Nadu']);
  
  // Filters
  const [selectedLocation, setSelectedLocation] = useState<string>('Salem, Tamil Nadu');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Booking Modal State
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookingHospitalId, setBookingHospitalId] = useState<string>('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [visitReason, setVisitReason] = useState('Routine consultation & follow-up');
  const [patientName, setPatientName] = useState(currentUser?.name || 'Deepan');
  const [patientPhone, setPatientPhone] = useState(currentUser?.phone || '+91 98427 12345');
  const [patientEmail, setPatientEmail] = useState(currentUser?.email || 'deepandeepan52594@gmail.com');
  const [visitMode, setVisitMode] = useState<'IN_PERSON' | 'TELECONSULT' | 'EXPRESS'>('IN_PERSON');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookedResult, setBookedResult] = useState<{ appointment: Appointment; tokenNumber: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    if (currentUser?.name) setPatientName(currentUser.name);
    if (currentUser?.phone) setPatientPhone(currentUser.phone);
    if (currentUser?.email) setPatientEmail(currentUser.email);
  }, [currentUser]);

  // Add Hospital Modal State
  const [showAddHospitalModal, setShowAddHospitalModal] = useState(false);
  const [newHospName, setNewHospName] = useState('');
  const [newHospLocation, setNewHospLocation] = useState('Salem, Tamil Nadu');
  const [newHospAddress, setNewHospAddress] = useState('');
  const [newHospPhone, setNewHospPhone] = useState('+91 427 ');
  const [newHospType, setNewHospType] = useState('Multi-Specialty Hospital');
  const [isAddingHospital, setIsAddingHospital] = useState(false);
  const [addHospitalSuccess, setAddHospitalSuccess] = useState<string | null>(null);

  // Initial Data Load
  useEffect(() => {
    loadInitialMetadata();
  }, []);

  // Filter Trigger Load
  useEffect(() => {
    loadDoctors();
  }, [selectedDept, searchQuery, selectedHospitalId, selectedLocation]);

  const loadInitialMetadata = async () => {
    try {
      const [hosps, depts, locs] = await Promise.all([
        api.getHospitals(),
        api.getDepartments(),
        api.getLocations().catch(() => ['Salem, Tamil Nadu'])
      ]);
      setHospitals(hosps);
      setDepartments(depts);
      if (locs && locs.length > 0) {
        setLocations(locs);
      }
    } catch (err) {
      console.error('Failed to load initial metadata', err);
    }
  };

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const docs = await api.getDoctors(
        selectedDept,
        searchQuery,
        selectedHospitalId === 'all' ? undefined : selectedHospitalId,
        selectedLocation === 'all' ? undefined : selectedLocation
      );
      setDoctors(docs);
    } catch (err) {
      console.error('Failed to load doctors', err);
    } finally {
      setLoading(false);
    }
  };

  const openBookingModal = async (doc: Doctor) => {
    setSelectedDoctor(doc);
    setBookingHospitalId(doc.hospitalId || (hospitals[0]?.id ?? ''));
    setSelectedSlot(null);
    setBookingError(null);
    setBookedResult(null);

    try {
      const avail = await api.getDoctorAvailability(doc.id, bookingDate);
      setAvailableSlots(avail.slots || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDateChange = async (newDate: string) => {
    setBookingDate(newDate);
    setSelectedSlot(null);
    setBookingError(null);
    if (selectedDoctor) {
      const avail = await api.getDoctorAvailability(selectedDoctor.id, newDate);
      setAvailableSlots(avail.slots || []);
    }
  };

  const confirmBooking = async () => {
    if (!selectedDoctor || !selectedSlot) {
      setBookingError('Please pick an available time slot.');
      return;
    }
    if (!patientName.trim()) {
      setBookingError('Please enter the patient name.');
      return;
    }

    setIsSubmitting(true);
    setBookingError(null);

    try {
      const chosenHospital = hospitals.find((h) => h.id === bookingHospitalId) || selectedDoctor.hospital;
      const res = await api.bookAppointment({
        doctorId: selectedDoctor.id,
        patientId: currentUser?.patient?.id || currentUser?.id,
        userId: currentUser?.id,
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        patientEmail: patientEmail.trim(),
        date: bookingDate,
        startTime: selectedSlot,
        reason: visitReason,
        mode: visitMode,
        hospitalId: chosenHospital?.id || selectedDoctor.hospitalId,
        hospitalName: chosenHospital?.name || selectedDoctor.hospitalName || 'Manipal Hospital, Salem',
        hospitalAddress: chosenHospital?.address || selectedDoctor.hospitalAddress || 'Dalmia Board, Salem-Bangalore Highway, Salem, Tamil Nadu 636012',
        location: chosenHospital?.location || selectedDoctor.location || 'Salem, Tamil Nadu'
      });

      setBookedResult({
        appointment: res.appointment,
        tokenNumber: res.tokenNumber
      });

      if (onAppointmentBooked) {
        onAppointmentBooked(res.appointment, res.tokenNumber);
      }
    } catch (err: any) {
      setBookingError(err.message || 'Booking conflict or error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHospName.trim()) return;

    setIsAddingHospital(true);
    try {
      const created = await api.createHospital({
        name: newHospName.trim(),
        location: newHospLocation.trim() || 'Salem, Tamil Nadu',
        address: newHospAddress.trim() || 'Salem, Tamil Nadu 636001',
        city: 'Salem',
        state: 'Tamil Nadu',
        phone: newHospPhone.trim() || '+91 427 244 5566',
        rating: 4.8,
        totalBeds: 250,
        departments: ['Cardiology', 'Orthopedics', 'General Medicine', 'Pediatrics'],
        image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=600'
      });

      setHospitals((prev) => [...prev, created]);
      setSelectedHospitalId(created.id);
      setAddHospitalSuccess(`"${created.name}" registered successfully in Salem!`);
      setTimeout(() => {
        setAddHospitalSuccess(null);
        setShowAddHospitalModal(false);
        setNewHospName('');
        setNewHospAddress('');
      }, 1500);
      loadDoctors();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to add hospital');
    } finally {
      setIsAddingHospital(false);
    }
  };

  const copyTokenToClipboard = (token: string) => {
    navigator.clipboard?.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  const activeHospital = hospitals.find((h) => h.id === selectedHospitalId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Salem Location & Hospital Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-amber-950 font-black text-xs uppercase tracking-wider shadow-sm">
                <MapPin className="w-3.5 h-3.5 fill-amber-950" />
                Location: Salem, Tamil Nadu
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30 text-xs font-semibold">
                <Building2 className="w-3.5 h-3.5" />
                {hospitals.length} Real-World Hospitals Registered
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Salem Hospital Specialist & OPD Appointment Booking
            </h1>
            <p className="text-xs sm:text-sm text-blue-200/90 leading-relaxed">
              Book guaranteed OPD consultation slots and reserve live digital queue tokens across top real-world hospitals in <strong>Salem</strong> including Manipal Hospital, Sri Gokulam Hospital, Shanmuga Hospital, SKS Hospital, and Neuro Foundation.
            </p>
          </div>

          {/* Quick Action Button to Add New Hospital */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowAddHospitalModal(true)}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-900/30 border border-emerald-400/40"
            >
              <Plus className="w-4 h-4" />
              Add Hospital in Salem
            </button>
          </div>
        </div>

        {/* Real-World Salem Hospital Selection Grid */}
        <div className="mt-6 pt-5 border-t border-white/15">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-400" />
              Select Hospital in Salem:
            </span>
            <span className="text-xs text-blue-300 font-medium hidden sm:inline">
              Showing {selectedHospitalId === 'all' ? 'All Salem Hospitals' : activeHospital?.name}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
            <button
              onClick={() => setSelectedHospitalId('all')}
              className={`p-2.5 rounded-xl text-xs font-bold transition text-left border ${
                selectedHospitalId === 'all'
                  ? 'bg-white text-blue-900 border-white shadow-md'
                  : 'bg-white/10 text-white border-white/15 hover:bg-white/20'
              }`}
            >
              <p className="font-extrabold truncate">All Hospitals</p>
              <p className="text-[10px] opacity-80 truncate">Salem Citywide</p>
            </button>

            {hospitals.map((hosp) => (
              <button
                key={hosp.id}
                onClick={() => setSelectedHospitalId(hosp.id)}
                className={`p-2.5 rounded-xl text-xs font-semibold transition text-left border ${
                  selectedHospitalId === hosp.id
                    ? 'bg-white text-blue-950 border-white shadow-md'
                    : 'bg-white/10 text-white border-white/15 hover:bg-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <p className="font-bold truncate text-[11px]">{hosp.name.replace(', Salem', '')}</p>
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                </div>
                <p className="text-[10px] text-blue-200/90 truncate mt-0.5">{hosp.city}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Location & Hospital Indicator */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs">
              <MapPin className="w-4 h-4 text-red-500" />
              <span>Location:</span>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
                <option value="all">All Locations</option>
              </select>
            </div>

            {selectedHospitalId !== 'all' && activeHospital && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-semibold text-blue-800">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-bold truncate max-w-[220px]">{activeHospital.name}</span>
                <button
                  onClick={() => setSelectedHospitalId('all')}
                  className="ml-1 text-blue-600 hover:text-blue-900 font-bold"
                  title="Clear hospital filter"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search doctor, hospital, or specialty in Salem..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Department Specialty Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedDept('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
              selectedDept === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Specialties
          </button>
          {departments.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDept(d.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                selectedDept === d.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Cards Grid with Hospital Context */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-slate-500">Loading Salem Doctors & Clinics...</p>
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-800">No doctors match this filter in Salem</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try choosing another hospital or clear your specialty filter to view all available Salem medical specialists.
          </p>
          <button
            onClick={() => { setSelectedHospitalId('all'); setSelectedDept('all'); setSearchQuery(''); }}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => {
            const hosp = doc.hospital || hospitals.find((h) => h.id === doc.hospitalId);
            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4 relative"
              >
                <div className="space-y-3">
                  {/* Doctor Info */}
                  <div className="flex items-start gap-3">
                    <img
                      src={doc.user?.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200'}
                      alt={doc.user?.name}
                      className="w-16 h-16 rounded-2xl object-cover ring-1 ring-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-[10px] font-bold text-emerald-700 uppercase">Available Today</span>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight truncate">
                        {doc.user?.name}
                      </h3>
                      <p className="text-xs font-semibold text-blue-600 truncate">{doc.specialty}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{doc.department?.name}</p>
                    </div>
                  </div>

                  {/* Real-world Hospital Badge */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">{hosp?.name || doc.hospitalName || 'Manipal Hospital, Salem'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="truncate">{doc.location || hosp?.location || 'Salem, Tamil Nadu'}</span>
                      <span className="text-slate-300">•</span>
                      <span className="truncate">{doc.roomNumber}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">{doc.bio}</p>

                  {/* Metrics Pills */}
                  <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 rounded-xl text-center">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Rating</p>
                      <p className="text-xs font-black text-slate-800 flex items-center justify-center gap-0.5">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {doc.rating}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Live Queue</p>
                      <p className="text-xs font-black text-blue-600">
                        {doc.waitingCount || 0} Waiting
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">OPD Fee</p>
                      <p className="text-xs font-black text-slate-800">₹{doc.consultationFee * 10}</p>
                    </div>
                  </div>
                </div>

                {/* Book Slot CTA */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Avg ~{doc.avgConsultationTimeMin}m / consult
                  </span>
                  <button
                    onClick={() => openBookingModal(doc)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    Book Appointment
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Drawer / Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-100 relative">
            {/* Close Button */}
            <button
              onClick={() => setSelectedDoctor(null)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 text-sm font-bold w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
            >
              ✕
            </button>

            <div>
              <span className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wider">
                Schedule Salem Hospital Consultation
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {selectedDoctor.user?.name}
              </h2>
              <p className="text-xs text-slate-500">
                {selectedDoctor.specialty} • Room {selectedDoctor.roomNumber}
              </p>
            </div>

            {bookedResult ? (
              /* Success Confirmation */
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-emerald-950">Appointment Confirmed!</h3>
                  <p className="text-xs text-emerald-800 mt-1">
                    Your appointment has been registered at {bookedResult.appointment.hospitalName || 'Salem Hospital'}.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs text-left w-full space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Allocated Queue Token</p>
                      <p className="text-3xl font-black text-blue-600 font-mono">{bookedResult.tokenNumber}</p>
                    </div>
                    <button
                      onClick={() => copyTokenToClipboard(bookedResult.tokenNumber)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-1"
                    >
                      {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedToken ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      {bookedResult.appointment.hospitalName || selectedDoctor.hospitalName || 'Manipal Hospital, Salem'}
                    </p>
                    <p className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      {bookedResult.appointment.hospitalAddress || 'Salem, Tamil Nadu'}
                    </p>
                    <p className="text-slate-700 font-medium">
                      Date & Slot: <strong>{bookedResult.appointment.date}</strong> at <strong>{bookedResult.appointment.startTime}</strong>
                    </p>
                    <p className="text-slate-600">
                      Physician: <strong>{selectedDoctor.user?.name}</strong> (Room {selectedDoctor.roomNumber})
                    </p>
                    <p className="text-slate-800 font-semibold flex items-center justify-between border-t border-slate-100 pt-1.5">
                      <span className="flex items-center gap-1 text-slate-500">
                        <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                        Patient Name:
                      </span>
                      <strong className="text-blue-700 font-bold">{bookedResult.appointment.patientName || patientName}</strong>
                    </p>
                    <p className="text-slate-600 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        Patient Contact:
                      </span>
                      <span>{bookedResult.appointment.patientPhone || patientPhone}</span>
                    </p>
                    <div className="mt-2 bg-emerald-50 border border-emerald-300 rounded-xl p-2.5 flex items-center gap-2 text-[11px] text-emerald-900 font-medium">
                      <Bell className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Live confirmation notification has been delivered to your alerts center!</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    onClick={() => setSelectedDoctor(null)}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
                  >
                    Done
                  </button>
                  {onNavigateToQueue && (
                    <button
                      onClick={() => {
                        setSelectedDoctor(null);
                        onNavigateToQueue();
                      }}
                      className="flex-1 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition flex items-center justify-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      View in Live Queue
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Booking Form */
              <div className="space-y-4">
                {/* Hospital Selector in Salem */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Hospital Location & Branch (Salem)
                  </label>
                  <select
                    value={bookingHospitalId}
                    onChange={(e) => setBookingHospitalId(e.target.value)}
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
                  >
                    {hospitals.map((hosp) => (
                      <option key={hosp.id} value={hosp.id}>
                        {hosp.name} — {hosp.location}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Selection */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Available Slots */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Available Consultation Slots (25 min each)
                  </label>
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                    {availableSlots.map((slot, idx) => (
                      <button
                        key={idx}
                        disabled={!slot.isAvailable}
                        onClick={() => setSelectedSlot(slot.time)}
                        className={`p-2 rounded-xl text-xs font-bold transition border text-center ${
                          !slot.isAvailable
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                            : selectedSlot === slot.time
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visit Mode */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Consultation Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setVisitMode('IN_PERSON')}
                      className={`py-2 rounded-xl border text-center transition ${
                        visitMode === 'IN_PERSON'
                          ? 'bg-blue-50 text-blue-700 border-blue-500'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      In-Person (OPD)
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisitMode('TELECONSULT')}
                      className={`py-2 rounded-xl border text-center transition ${
                        visitMode === 'TELECONSULT'
                          ? 'bg-blue-50 text-blue-700 border-blue-500'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      Teleconsult (HD)
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisitMode('EXPRESS')}
                      className={`py-2 rounded-xl border text-center transition ${
                        visitMode === 'EXPRESS'
                          ? 'bg-blue-50 text-blue-700 border-blue-500'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      Express Refill
                    </button>
                  </div>
                </div>

                {/* Patient Information */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                      Patient Information (Name on Slip & Queue)
                    </label>
                    <span className="text-[10px] text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded-full">
                      Live Token & Alerts
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Patient Full Name *
                    </label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Deepan"
                      required
                      className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Phone Number (SMS / WhatsApp)
                      </label>
                      <input
                        type="tel"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        placeholder="+91 98427 12345"
                        className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Email Address (Receipt & Alerts)
                      </label>
                      <input
                        type="email"
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                        placeholder="deepandeepan52594@gmail.com"
                        className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Reason for Visit */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Chief Complaint / Clinical Reason
                  </label>
                  <input
                    type="text"
                    value={visitReason}
                    onChange={(e) => setVisitReason(e.target.value)}
                    placeholder="e.g. Arrhythmia review, ECG, fever check..."
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {bookingError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {bookingError}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={confirmBooking}
                    disabled={isSubmitting || !selectedSlot}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition shadow-md shadow-blue-500/20"
                  >
                    {isSubmitting ? 'Verifying Availability...' : 'Confirm Appointment & Generate Token'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add New Real-World Hospital in Salem */}
      {showAddHospitalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100 relative">
            <button
              onClick={() => setShowAddHospitalModal(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 text-sm font-bold w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                Register Healthcare Entity
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Add Real-World Hospital in Salem
              </h2>
              <p className="text-xs text-slate-500">
                Register a new hospital or medical clinic located in Salem for instant appointment scheduling.
              </p>
            </div>

            {addHospitalSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold">{addHospitalSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleCreateHospital} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Hospital Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dharan Hospital, Salem"
                    value={newHospName}
                    onChange={(e) => setNewHospName(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Location / City *
                  </label>
                  <input
                    type="text"
                    required
                    value={newHospLocation}
                    onChange={(e) => setNewHospLocation(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Address / Landmark in Salem
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Seelanaickenpatti Bypass, Salem, Tamil Nadu 636201"
                    value={newHospAddress}
                    onChange={(e) => setNewHospAddress(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                      Hospital Contact
                    </label>
                    <input
                      type="text"
                      value={newHospPhone}
                      onChange={(e) => setNewHospPhone(e.target.value)}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                      Hospital Type
                    </label>
                    <select
                      value={newHospType}
                      onChange={(e) => setNewHospType(e.target.value)}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option>Multi-Specialty Hospital</option>
                      <option>Super-Specialty Hospital</option>
                      <option>Government Medical Center</option>
                      <option>Speciality Eye/Heart Center</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isAddingHospital || !newHospName.trim()}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition shadow-md shadow-emerald-600/20"
                  >
                    {isAddingHospital ? 'Registering Hospital...' : 'Add Hospital to Salem Directory'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
