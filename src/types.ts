export type Role = 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  phone?: string;
  patient?: Patient;
  doctor?: Doctor;
  receptionist?: Receptionist;
}

export interface Hospital {
  id: string;
  name: string;
  location: string;
  city: string;
  state?: string;
  address: string;
  phone: string;
  emergencyPhone?: string;
  rating: number;
  totalBeds: number;
  departmentsCount?: number;
  departments?: string[];
  type: string;
  accreditation?: string;
  description?: string;
  image?: string;
  isPopular?: boolean;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  floor: string;
  wing: string;
  description: string;
  icon: string;
  doctorsCount?: number;
  activeQueueCount?: number;
  leadDoctor?: string;
}

export interface Doctor {
  id: string;
  userId: string;
  departmentId: string;
  hospitalId?: string;
  hospitalName?: string;
  hospitalAddress?: string;
  location?: string;
  roomNumber: string;
  specialty: string;
  title: string;
  qualifications: string;
  experienceYears: number;
  avgConsultationTimeMin: number;
  totalConsultationsDone: number;
  consultationFee: number;
  copayFee: number;
  status: 'ON_DUTY' | 'ON_BREAK' | 'OFF_DUTY';
  rating: number;
  reviewCount: number;
  bio: string;
  user?: User;
  department?: Department;
  hospital?: Hospital;
  waitingCount?: number;
  currentServingToken?: string | null;
  estimatedWaitTime?: number;
}

export interface Patient {
  id: string;
  userId: string;
  mrn: string;
  age: number;
  gender: string;
  bloodGroup: string;
  allergies: string;
  emergencyContact: string;
  insuranceProvider: string;
  insurancePolicyNo: string;
  user?: User;
}

export interface Receptionist {
  id: string;
  userId: string;
  deskNumber: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;
  doctorId: string;
  departmentId: string;
  hospitalId?: string;
  hospitalName?: string;
  hospitalAddress?: string;
  location?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'BOOKED' | 'CONFIRMED' | 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  tokenNumber?: string;
  reason: string;
  mode: 'IN_PERSON' | 'TELECONSULT' | 'EXPRESS';
  createdAt: string;
  patient?: Patient;
  doctor?: Doctor;
  department?: Department;
  hospital?: Hospital;
}

export interface QueueEntry {
  id: string;
  queueId: string;
  appointmentId?: string;
  patientId: string;
  tokenNumber: string;
  position: number;
  status: 'WAITING' | 'CALLED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'NO_SHOW';
  triageCategory: 'General' | 'Priority Senior' | 'Fast-Track' | 'Emergency' | 'Follow-up';
  checkInTime: string;
  callTime?: string;
  startTime?: string;
  endTime?: string;
  waitDurationMin: number;
  roomAssignment: string;
  gracePeriodEnds?: string;
  notes?: string;
  chiefComplaint?: string;
  patient?: Patient;
  appointment?: Appointment;
  hospitalName?: string;
  location?: string;
}

export interface Queue {
  id: string;
  doctorId: string;
  departmentId: string;
  hospitalId?: string;
  hospitalName?: string;
  hospitalAddress?: string;
  location?: string;
  date: string;
  currentServingToken?: string;
  isActive: boolean;
  entries: QueueEntry[];
  doctor?: Doctor;
  department?: Department;
  hospital?: Hospital;
  metrics?: {
    totalInQueue: number;
    waitingCount: number;
    completedCount: number;
    skippedCount: number;
    avgConsultationTimeMin: number;
    estimatedWaitTimeMinutes: number;
    currentServingToken: string | null;
  };
}

export interface Consultation {
  id: string;
  appointmentId?: string;
  doctorId: string;
  patientId: string;
  chiefComplaint: string;
  bloodPressure: string;
  pulseBpm: number;
  assessmentNotes: string;
  plan: string;
  prescriptions: string[];
  labOrders: string[];
  durationMinutes: number;
  createdAt: string;
  doctor?: Doctor;
  patient?: Patient;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'QUEUE_ALERT' | 'DOCTOR_CALLED' | 'APPOINTMENT' | 'APPOINTMENT_CONFIRMED' | 'QUEUE_UPDATE';
  isRead: boolean;
  createdAt: string;
}
