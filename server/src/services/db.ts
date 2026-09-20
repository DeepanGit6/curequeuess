import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN';
  avatar?: string;
  phone?: string;
  createdAt: string;
}

export interface Hospital {
  id: string;
  name: string;
  location: string;
  city: string;
  address: string;
  phone: string;
  emergencyPhone: string;
  rating: number;
  totalBeds: number;
  departmentsCount: number;
  type: string;
  accreditation: string;
  description: string;
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
  user?: User;
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
  hospitalName?: string;
  location?: string;
  patient?: Patient;
  appointment?: Appointment;
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
}

export interface DoctorAvailability {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMin: number;
  isAvailable: boolean;
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
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'QUEUE_ALERT' | 'DOCTOR_CALLED' | 'APPOINTMENT' | 'APPOINTMENT_CONFIRMED' | 'QUEUE_UPDATE';
  isRead: boolean;
  createdAt: string;
}

// In-Memory Real-Time Database with Typed Schema
class DatabaseStore {
  hospitals: Hospital[] = [];
  users: User[] = [];
  departments: Department[] = [];
  doctors: Doctor[] = [];
  patients: Patient[] = [];
  receptionists: Receptionist[] = [];
  appointments: Appointment[] = [];
  queues: Queue[] = [];
  queueEntries: QueueEntry[] = [];
  availabilities: DoctorAvailability[] = [];
  consultations: Consultation[] = [];
  notifications: Notification[] = [];

  constructor() {
    this.seed();
  }

  private seed() {
    const defaultPasswordHash = bcrypt.hashSync('curaqueue123', 8);

    // 0. Real-World Hospitals in Salem
    this.hospitals = [
      {
        id: 'hosp-manipal-salem',
        name: 'Manipal Hospital, Salem',
        location: 'Salem, Tamil Nadu',
        city: 'Salem',
        address: 'Dalmia Board, Salem-Bangalore Highway, Salem, Tamil Nadu 636012',
        phone: '+91 427 234 6666',
        emergencyPhone: '1059',
        rating: 4.9,
        totalBeds: 200,
        departmentsCount: 18,
        type: 'Tertiary Care Multi-Specialty Hospital',
        accreditation: 'NABH & NABL Accredited',
        description: 'Salem’s premier multi-specialty tertiary care center with 24/7 emergency cardiology, cath lab, pediatric cardiology, oncology, and robotic surgery.',
        image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600',
        isPopular: true
      },
      {
        id: 'hosp-gokulam-salem',
        name: 'Sri Gokulam Hospital & Research Institute',
        location: 'Salem, Tamil Nadu',
        city: 'Salem',
        address: '3/60, Meyyanur Bypass Road, Meyyanur, Salem, Tamil Nadu 636004',
        phone: '+91 427 244 8171',
        emergencyPhone: '+91 427 244 8172',
        rating: 4.8,
        totalBeds: 250,
        departmentsCount: 16,
        type: 'Multi-Specialty & Research Institute',
        accreditation: 'NABH Certified',
        description: 'Renowned hospital in Salem featuring advanced neonatal intensive care (NICU), pediatric super-specialty, critical care, and general medicine.',
        image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=600',
        isPopular: true
      },
      {
        id: 'hosp-shanmuga-salem',
        name: 'Shanmuga Hospital & Research Institute',
        location: 'Salem, Tamil Nadu',
        city: 'Salem',
        address: '24, Saradha College Road, Hasthampatti, Salem, Tamil Nadu 636016',
        phone: '+91 427 270 6666',
        emergencyPhone: '+91 427 270 6600',
        rating: 4.8,
        totalBeds: 180,
        departmentsCount: 14,
        type: 'Orthopedics & Surgical Trauma Hospital',
        accreditation: 'NABH Certified',
        description: 'Salem’s leading center of excellence for orthopedic surgery, joint replacement, spine trauma, arthroscopy, and rehabilitation.',
        image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=600',
        isPopular: true
      },
      {
        id: 'hosp-sks-salem',
        name: 'SKS Hospital & Post Graduate Medical Institute',
        location: 'Salem, Tamil Nadu',
        city: 'Salem',
        address: 'SKS Road, Alagapuram, Fairlands, Salem, Tamil Nadu 636016',
        phone: '+91 427 244 5555',
        emergencyPhone: '+91 427 233 4444',
        rating: 4.7,
        totalBeds: 300,
        departmentsCount: 20,
        type: 'Post Graduate Teaching & Multi-Specialty Hospital',
        accreditation: 'NABH Accredited',
        description: 'Comprehensive medical campus in Fairlands, Salem providing advanced diabetes management, internal medicine, pulmonology, and preventive care.',
        image: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&q=80&w=600'
      },
      {
        id: 'hosp-neuro-salem',
        name: 'Neuro Foundation Super Speciality Hospital',
        location: 'Salem, Tamil Nadu',
        city: 'Salem',
        address: 'Three Roads, Meyyanur, Salem, Tamil Nadu 636009',
        phone: '+91 427 244 9191',
        emergencyPhone: '+91 427 244 9192',
        rating: 4.9,
        totalBeds: 150,
        departmentsCount: 10,
        type: 'Super Speciality Neuro Science Hospital',
        accreditation: 'NABH Accredited',
        description: 'State-of-the-art neurosciences institute in Salem offering 24/7 stroke intervention, micro-neurosurgery, spine surgery, and neuro ICU.',
        image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=600'
      },
      {
        id: 'hosp-gmkmch-salem',
        name: 'Govt. Mohan Kumaramangalam Medical College Hospital',
        location: 'Salem, Tamil Nadu',
        city: 'Salem',
        address: 'Fort Main Road, Salem, Tamil Nadu 636001',
        phone: '+91 427 221 1213',
        emergencyPhone: '108',
        rating: 4.6,
        totalBeds: 1200,
        departmentsCount: 28,
        type: 'Government Apex Tertiary Medical College',
        accreditation: 'NMC Recognized',
        description: 'Salem’s historic apex government tertiary teaching hospital providing round-the-clock emergency trauma response and comprehensive clinical care.',
        image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600'
      }
    ];

    // 1. Departments
    this.departments = [
      {
        id: 'dept-cardio',
        name: 'Cardiology OPD',
        code: 'CARDIO',
        floor: '2nd Floor',
        wing: 'Wing B (West Pavilion)',
        description: 'Comprehensive adult and pediatric cardiovascular ambulatory care.',
        icon: 'cardiology'
      },
      {
        id: 'dept-er',
        name: 'Emergency Triage',
        code: 'EMERGENCY',
        floor: 'Ground Floor',
        wing: 'Red Corridor',
        description: 'High-acuity emergency and trauma immediate response.',
        icon: 'e911_emergency'
      },
      {
        id: 'dept-ped',
        name: 'Pediatrics Clinic',
        code: 'PEDIATRICS',
        floor: '2nd Floor',
        wing: 'Wing B',
        description: 'Neonatal, infant, and adolescent wellness & pathology.',
        icon: 'child_care'
      },
      {
        id: 'dept-ortho',
        name: 'Orthopedics & Trauma',
        code: 'ORTHOPEDICS',
        floor: '1st Floor',
        wing: 'Wing D (Rooms 108-112)',
        description: 'Surgical and non-surgical musculoskeletal management.',
        icon: 'orthopedics'
      },
      {
        id: 'dept-gen',
        name: 'General Medicine',
        code: 'GENMED',
        floor: 'Ground Floor',
        wing: 'Wing A (Main Atrium)',
        description: 'Primary internal health assessment and chronic disease stabilization.',
        icon: 'medical_services'
      },
      {
        id: 'dept-derm',
        name: 'Dermatology & Allergy',
        code: 'DERMATOLOGY',
        floor: '3rd Floor',
        wing: 'Wing E',
        description: 'Clinical dermatology, allergy testing, and minor excisions.',
        icon: 'dermatology'
      }
    ];

    // 2. Users (Doctors, Patients, Receptionist, Admin)
    const uDoctorSarah: User = {
      id: 'user-doc-sarah',
      email: 'sarah.jenkins@curaqueue.com',
      passwordHash: defaultPasswordHash,
      name: 'Dr. Sarah Jenkins, MD, FACC',
      role: 'DOCTOR',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
      phone: '+1 (555) 402-2810',
      createdAt: new Date().toISOString()
    };

    const uDoctorAris: User = {
      id: 'user-doc-aris',
      email: 'aris.thorne@curaqueue.com',
      passwordHash: defaultPasswordHash,
      name: 'Dr. Aris Thorne, MD',
      role: 'DOCTOR',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      phone: '+1 (555) 402-2811',
      createdAt: new Date().toISOString()
    };

    const uDoctorElena: User = {
      id: 'user-doc-elena',
      email: 'elena.rostova@curaqueue.com',
      passwordHash: defaultPasswordHash,
      name: 'Dr. Elena Rostova, FACS',
      role: 'DOCTOR',
      avatar: 'https://images.unsplash.com/photo-1594824813576-9051010b9381?auto=format&fit=crop&q=80&w=400',
      phone: '+1 (555) 402-2812',
      createdAt: new Date().toISOString()
    };

    const uDoctorMarcus: User = {
      id: 'user-doc-marcus',
      email: 'marcus.vance@curaqueue.com',
      passwordHash: defaultPasswordHash,
      name: 'Dr. Marcus Vance, DO',
      role: 'DOCTOR',
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400',
      phone: '+1 (555) 402-2813',
      createdAt: new Date().toISOString()
    };

    // The 7 Official Patients requested by user:
    // 1. Ajith , 2. Vijay , 3. Dhanush , 4. Vikram , 5. Thrisha , 6. Mamitha , 7. Nayanthara
    const uPatientAjith: User = {
      id: 'user-pat-ajith',
      email: 'ajith@curaqueue.com',
      passwordHash: defaultPasswordHash,
      name: 'Ajith',
      role: 'PATIENT',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
      phone: '+91 98421 11001',
      createdAt: new Date().toISOString()
    };

    const uPatientVijay: User = {
      id: 'user-pat-vijay',
      email: 'vijay@curaqueue.com',
      passwordHash: defaultPasswordHash,
      name: 'Vijay',
      role: 'PATIENT',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
      phone: '+91 98422 22002',
      createdAt: new Date().toISOString()
    };

    const uPatientDhanush: User = {
      id: 'user-pat-dhanush',
      email: 'dhanush@curaqueue.com',
      passwordHash: defaultPasswordHash,
      name: 'Dhanush',
      role: 'PATIENT',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      phone: '+91 98423 33003',
      createdAt: new Date().toISOString()
    };

    const uPatientVikram: User = {
      id: 'user-pat-vikram',
      email: 'vikram@curaqueue.com',
      passwordHash: defaultPasswordHash,
      name: 'Vikram',
      role: 'PATIENT',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300',
      phone: '+91 98424 44004',
      createdAt: new Date().toISOString()
    };

    const uPatientThrisha: User = {
      id: 'user-pat-thrisha',
      email: 'thrisha@curaqueue.com',
      passwordHash: defaultPasswordHash,
      name: 'Thrisha',
      role: 'PATIENT',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
      phone: '+91 98425 55005',
      createdAt: new Date().toISOString()
    };

    const uPatientMamitha: User = {
      id: 'user-pat-mamitha',
      email: 'mamitha@curaqueue.com',
      passwordHash: defaultPasswordHash,
      name: 'Mamitha',
      role: 'PATIENT',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300',
      phone: '+91 98426 66006',
      createdAt: new Date().toISOString()
    };

    const uPatientNayanthara: User = {
      id: 'user-pat-nayanthara',
      email: 'nayanthara@curaqueue.com',
      passwordHash: defaultPasswordHash,
      name: 'Nayanthara',
      role: 'PATIENT',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      phone: '+91 98427 77007',
      createdAt: new Date().toISOString()
    };

    // User alias for current environment email
    const uPatientCurrentEnv: User = {
      id: 'user-pat-deepan',
      email: 'deepandeepan52594@gmail.com',
      passwordHash: defaultPasswordHash,
      name: 'Ajith',
      role: 'PATIENT',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
      phone: '+91 98421 11001',
      createdAt: new Date().toISOString()
    };

    const uReceptionist: User = {
      id: 'user-rec-clara',
      email: 'reception@curaqueue.com',
      passwordHash: defaultPasswordHash,
      name: 'Clara Oswald, RN',
      role: 'RECEPTIONIST',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
      phone: '+1 (555) 402-2800',
      createdAt: new Date().toISOString()
    };

    const uAdmin: User = {
      id: 'user-admin-sterling',
      email: 'admin@curaqueue.com',
      passwordHash: defaultPasswordHash,
      name: 'Dr. Arthur Sterling',
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300',
      phone: '+1 (555) 402-2801',
      createdAt: new Date().toISOString()
    };

    const uDoctorRavindran: User = {
      id: 'user-doc-ravindran',
      email: 'k.ravindran@neurofoundation.org',
      passwordHash: defaultPasswordHash,
      name: 'Dr. K. Ravindran, MS, MCh (Neuro)',
      role: 'DOCTOR',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      phone: '+91 427 244 9191',
      createdAt: new Date().toISOString()
    };

    const uDoctorPriya: User = {
      id: 'user-doc-priya',
      email: 'priya.sundaram@manipalhospitals.com',
      passwordHash: defaultPasswordHash,
      name: 'Dr. Priya Sundaram, MD, DNB',
      role: 'DOCTOR',
      avatar: 'https://images.unsplash.com/photo-1594824813576-9051010b9381?auto=format&fit=crop&q=80&w=400',
      phone: '+91 427 234 6666',
      createdAt: new Date().toISOString()
    };

    this.users = [
      uDoctorSarah,
      uDoctorAris,
      uDoctorElena,
      uDoctorMarcus,
      uDoctorRavindran,
      uDoctorPriya,
      uPatientAjith,
      uPatientVijay,
      uPatientDhanush,
      uPatientVikram,
      uPatientThrisha,
      uPatientMamitha,
      uPatientNayanthara,
      uPatientCurrentEnv,
      uReceptionist,
      uAdmin
    ];

    // 3. Doctors Table with Real-World Salem Hospital Bindings
    this.doctors = [
      {
        id: 'doc-sarah',
        userId: uDoctorSarah.id,
        departmentId: 'dept-cardio',
        hospitalId: 'hosp-manipal-salem',
        hospitalName: 'Manipal Hospital, Salem',
        hospitalAddress: 'Dalmia Board, Salem-Bangalore Highway, Salem, Tamil Nadu 636012',
        location: 'Salem, Tamil Nadu',
        roomNumber: 'Room 3B',
        specialty: 'Cardiovascular Ambulatory Care & Interventions',
        title: 'Chief of Cardiology • FACC',
        qualifications: 'MD, FACC, FSCAI (Harvard Medical School)',
        experienceYears: 15,
        avgConsultationTimeMin: 11.4,
        totalConsultationsDone: 18,
        consultationFee: 90.0,
        copayFee: 20.0,
        status: 'ON_DUTY',
        rating: 4.9,
        reviewCount: 1240,
        bio: 'Specialist Senior Registrar specializing in post-stent management, hypertension titration, and echocardiogram telemetry at Manipal Hospital Salem.'
      },
      {
        id: 'doc-aris',
        userId: uDoctorAris.id,
        departmentId: 'dept-ped',
        hospitalId: 'hosp-gokulam-salem',
        hospitalName: 'Sri Gokulam Hospital & Research Institute',
        hospitalAddress: '3/60, Meyyanur Bypass Road, Meyyanur, Salem, Tamil Nadu 636004',
        location: 'Salem, Tamil Nadu',
        roomNumber: 'Room 2A',
        specialty: 'Pediatric Neurology & Child Health',
        title: 'Consultant Pediatric Neurologist',
        qualifications: 'MD, FAAP (Johns Hopkins)',
        experienceYears: 11,
        avgConsultationTimeMin: 14.2,
        totalConsultationsDone: 12,
        consultationFee: 95.0,
        copayFee: 25.0,
        status: 'ON_DUTY',
        rating: 4.8,
        reviewCount: 890,
        bio: 'Comprehensive developmental and neurologic consultations for children and young adults at Sri Gokulam Hospital, Salem.'
      },
      {
        id: 'doc-elena',
        userId: uDoctorElena.id,
        departmentId: 'dept-ortho',
        hospitalId: 'hosp-shanmuga-salem',
        hospitalName: 'Shanmuga Hospital & Research Institute',
        hospitalAddress: '24, Saradha College Road, Hasthampatti, Salem, Tamil Nadu 636016',
        location: 'Salem, Tamil Nadu',
        roomNumber: 'Room 4C',
        specialty: 'Orthopedic Surgery & Sports Medicine',
        title: 'Senior Orthopedic Surgeon, FACS',
        qualifications: 'MD, FACS, FAAOS',
        experienceYears: 18,
        avgConsultationTimeMin: 12.0,
        totalConsultationsDone: 15,
        consultationFee: 110.0,
        copayFee: 30.0,
        status: 'ON_DUTY',
        rating: 4.9,
        reviewCount: 1520,
        bio: 'Musculoskeletal evaluation, arthroscopy, joint reconstruction, and trauma restoration at Shanmuga Hospital Salem.'
      },
      {
        id: 'doc-marcus',
        userId: uDoctorMarcus.id,
        departmentId: 'dept-gen',
        hospitalId: 'hosp-sks-salem',
        hospitalName: 'SKS Hospital & Post Graduate Medical Institute',
        hospitalAddress: 'SKS Road, Alagapuram, Fairlands, Salem, Tamil Nadu 636016',
        location: 'Salem, Tamil Nadu',
        roomNumber: 'Room 1B',
        specialty: 'Internal Medicine & Diagnostic Triage',
        title: 'Head of Ambulatory General Medicine',
        qualifications: 'DO, FACP',
        experienceYears: 8,
        avgConsultationTimeMin: 10.5,
        totalConsultationsDone: 22,
        consultationFee: 80.0,
        copayFee: 15.0,
        status: 'ON_DUTY',
        rating: 4.7,
        reviewCount: 640,
        bio: 'Preventative screenings, adult complex multi-morbidity diagnostics, and chronic disease management at SKS Hospital Fairlands, Salem.'
      },
      {
        id: 'doc-ravindran',
        userId: uDoctorRavindran.id,
        departmentId: 'dept-er',
        hospitalId: 'hosp-neuro-salem',
        hospitalName: 'Neuro Foundation Super Speciality Hospital',
        hospitalAddress: 'Three Roads, Meyyanur, Salem, Tamil Nadu 636009',
        location: 'Salem, Tamil Nadu',
        roomNumber: 'Room 5A',
        specialty: 'Chief Neurosurgeon & Stroke Intervention',
        title: 'Senior Consultant Neurosurgeon • MCh',
        qualifications: 'MS, MCh (Neurosurgery), FINR',
        experienceYears: 20,
        avgConsultationTimeMin: 15.0,
        totalConsultationsDone: 19,
        consultationFee: 120.0,
        copayFee: 30.0,
        status: 'ON_DUTY',
        rating: 4.9,
        reviewCount: 980,
        bio: 'Salem’s leading senior neurosurgeon providing microsurgical brain and spine care and 24/7 hyperacute stroke intervention at Neuro Foundation.'
      },
      {
        id: 'doc-priya',
        userId: uDoctorPriya.id,
        departmentId: 'dept-gen',
        hospitalId: 'hosp-manipal-salem',
        hospitalName: 'Manipal Hospital, Salem',
        hospitalAddress: 'Dalmia Board, Salem-Bangalore Highway, Salem, Tamil Nadu 636012',
        location: 'Salem, Tamil Nadu',
        roomNumber: 'Room 2C',
        specialty: 'General Medicine & Lifestyle Health',
        title: 'Senior Consultant Physician • DNB',
        qualifications: 'MBBS, MD, DNB (Internal Medicine)',
        experienceYears: 13,
        avgConsultationTimeMin: 12.5,
        totalConsultationsDone: 24,
        consultationFee: 85.0,
        copayFee: 20.0,
        status: 'ON_DUTY',
        rating: 4.8,
        reviewCount: 750,
        bio: 'Comprehensive preventive health check-ups, hypertension, diabetes control, and geriatric wellness at Manipal Hospital Salem.'
      }
    ];

    // 4. Patients Table (The 7 Requested Patients)
    this.patients = [
      {
        id: 'pat-ajith',
        userId: uPatientAjith.id,
        mrn: 'MRN-SLM-1001',
        age: 52,
        gender: 'Male',
        bloodGroup: 'O+',
        allergies: 'None recorded',
        emergencyContact: 'Family (+91 98421 11002)',
        insuranceProvider: 'Star Health Premier',
        insurancePolicyNo: 'SH-88294'
      },
      {
        id: 'pat-vijay',
        userId: uPatientVijay.id,
        mrn: 'MRN-SLM-1002',
        age: 49,
        gender: 'Male',
        bloodGroup: 'A+',
        allergies: 'Penicillin (Anaphylaxis Risk)',
        emergencyContact: 'Family (+91 98422 22003)',
        insuranceProvider: 'HDFC ERGO Health',
        insurancePolicyNo: 'HE-448102'
      },
      {
        id: 'pat-dhanush',
        userId: uPatientDhanush.id,
        mrn: 'MRN-SLM-1003',
        age: 41,
        gender: 'Male',
        bloodGroup: 'B+',
        allergies: 'Sulfa Drugs',
        emergencyContact: 'Contact (+91 98423 33004)',
        insuranceProvider: 'Care Health Advantage',
        insurancePolicyNo: 'CH-710293'
      },
      {
        id: 'pat-vikram',
        userId: uPatientVikram.id,
        mrn: 'MRN-SLM-1004',
        age: 57,
        gender: 'Male',
        bloodGroup: 'AB+',
        allergies: 'None',
        emergencyContact: 'Support (+91 98424 44005)',
        insuranceProvider: 'ICICI Lombard Health',
        insurancePolicyNo: 'IL-551029'
      },
      {
        id: 'pat-thrisha',
        userId: uPatientThrisha.id,
        mrn: 'MRN-SLM-1005',
        age: 41,
        gender: 'Female',
        bloodGroup: 'O+',
        allergies: 'Aspirin Sensitivity',
        emergencyContact: 'Kin (+91 98425 55006)',
        insuranceProvider: 'Bajaj Allianz Health',
        insurancePolicyNo: 'BA-993821'
      },
      {
        id: 'pat-mamitha',
        userId: uPatientMamitha.id,
        mrn: 'MRN-SLM-1006',
        age: 23,
        gender: 'Female',
        bloodGroup: 'B+',
        allergies: 'Pollen / Dust',
        emergencyContact: 'Guardian (+91 98426 66007)',
        insuranceProvider: 'Niva Bupa ReAssure',
        insurancePolicyNo: 'NB-112948'
      },
      {
        id: 'pat-nayanthara',
        userId: uPatientNayanthara.id,
        mrn: 'MRN-SLM-1007',
        age: 39,
        gender: 'Female',
        bloodGroup: 'A+',
        allergies: 'None',
        emergencyContact: 'Family (+91 98427 77008)',
        insuranceProvider: 'Tata AIG Medicare',
        insurancePolicyNo: 'TA-449102'
      },
      {
        id: 'pat-jonathan',
        userId: uPatientCurrentEnv.id,
        mrn: 'MRN-SLM-1001',
        age: 52,
        gender: 'Male',
        bloodGroup: 'O+',
        allergies: 'None recorded',
        emergencyContact: 'Family (+91 98421 11002)',
        insuranceProvider: 'Star Health Premier',
        insurancePolicyNo: 'SH-88294'
      }
    ];

    // 5. Receptionist Table
    this.receptionists = [
      {
        id: 'rec-clara',
        userId: uReceptionist.id,
        deskNumber: 'Desk 1 - West Lobby Reception'
      }
    ];

    // 6. Doctor Availabilities
    const days = [1, 2, 3, 4, 5]; // Mon - Fri
    this.doctors.forEach((doc) => {
      days.forEach((d) => {
        this.availabilities.push({
          id: `avail-${doc.id}-${d}`,
          doctorId: doc.id,
          dayOfWeek: d,
          startTime: '08:30',
          endTime: '16:30',
          slotDurationMin: 25,
          isAvailable: true
        });
      });
    });

    // 7. Today's Date String
    const today = new Date().toISOString().split('T')[0];

    // 8. Cardiology Queue (Dr. Sarah Jenkins - Room 3B - Manipal Hospital, Salem)
    const cardioQueue: Queue = {
      id: 'queue-doc-sarah-today',
      doctorId: 'doc-sarah',
      departmentId: 'dept-cardio',
      hospitalId: 'hosp-manipal-salem',
      hospitalName: 'Manipal Hospital, Salem',
      hospitalAddress: 'Dalmia Board, Salem-Bangalore Highway, Salem, Tamil Nadu 636012',
      location: 'Salem, Tamil Nadu',
      date: today,
      currentServingToken: 'A-024',
      isActive: true,
      entries: []
    };

    // Realistic Queue Entries with the 7 Patients:
    // 1. Ajith , 2. Vijay , 3. Dhanush , 4. Vikram , 5. Thrisha , 6. Mamitha , 7. Nayanthara
    const qEntries: QueueEntry[] = [
      {
        id: 'qe-21',
        queueId: cardioQueue.id,
        patientId: 'pat-ajith', // 1. Ajith
        tokenNumber: 'A-021',
        position: 1,
        status: 'COMPLETED',
        triageCategory: 'General',
        checkInTime: '09:00 AM',
        callTime: '09:05 AM',
        startTime: '09:05 AM',
        endTime: '09:18 AM',
        waitDurationMin: 5,
        roomAssignment: 'Room 3B',
        hospitalName: 'Manipal Hospital, Salem',
        location: 'Salem, Tamil Nadu',
        chiefComplaint: 'Post-CABG Stent Clearance'
      },
      {
        id: 'qe-22',
        queueId: cardioQueue.id,
        patientId: 'pat-vijay', // 2. Vijay
        tokenNumber: 'A-022',
        position: 2,
        status: 'COMPLETED',
        triageCategory: 'General',
        checkInTime: '09:12 AM',
        callTime: '09:19 AM',
        startTime: '09:19 AM',
        endTime: '09:32 AM',
        waitDurationMin: 7,
        roomAssignment: 'Room 3B',
        hospitalName: 'Manipal Hospital, Salem',
        location: 'Salem, Tamil Nadu',
        chiefComplaint: 'Echocardiogram Baseline Check'
      },
      {
        id: 'qe-23',
        queueId: cardioQueue.id,
        patientId: 'pat-dhanush', // 3. Dhanush
        tokenNumber: 'A-023',
        position: 3,
        status: 'SKIPPED',
        triageCategory: 'General',
        checkInTime: '09:30 AM',
        callTime: '09:35 AM',
        waitDurationMin: 25,
        roomAssignment: 'Waiting Bay A',
        hospitalName: 'Manipal Hospital, Salem',
        location: 'Salem, Tamil Nadu',
        gracePeriodEnds: new Date(Date.now() + 4 * 60 * 1000 + 18 * 1000).toISOString(),
        notes: 'Absent at Call - Patient in Pharmacy. Checked back in at Kiosk 2.',
        chiefComplaint: 'Lipid Titration Review'
      },
      {
        id: 'qe-24',
        queueId: cardioQueue.id,
        patientId: 'pat-vikram', // 4. Vikram
        tokenNumber: 'A-024',
        position: 4,
        status: 'IN_PROGRESS',
        triageCategory: 'General',
        checkInTime: '09:55 AM',
        callTime: '10:35 AM',
        startTime: '10:35 AM',
        waitDurationMin: 40,
        roomAssignment: 'Room 3B',
        hospitalName: 'Manipal Hospital, Salem',
        location: 'Salem, Tamil Nadu',
        chiefComplaint: 'Routine post-stent follow-up & medication review. Mild intermittent exertional fatigue on stair climbing. Denies chest pain or shortness of breath.'
      },
      {
        id: 'qe-25',
        queueId: cardioQueue.id,
        patientId: 'pat-thrisha', // 5. Thrisha
        tokenNumber: 'A-025',
        position: 5,
        status: 'WAITING',
        triageCategory: 'Fast-Track',
        checkInTime: '10:04 AM',
        waitDurationMin: 38,
        roomAssignment: 'Lobby Door 3',
        hospitalName: 'Manipal Hospital, Salem',
        location: 'Salem, Tamil Nadu',
        chiefComplaint: 'Chest tightness, pre-op ECG read'
      },
      {
        id: 'qe-26',
        queueId: cardioQueue.id,
        patientId: 'pat-mamitha', // 6. Mamitha
        tokenNumber: 'A-026',
        position: 6,
        status: 'WAITING',
        triageCategory: 'General',
        checkInTime: '10:12 AM',
        waitDurationMin: 30,
        roomAssignment: 'Waiting Bay A',
        hospitalName: 'Manipal Hospital, Salem',
        location: 'Salem, Tamil Nadu',
        chiefComplaint: 'Blood Pressure check and refill'
      },
      {
        id: 'qe-27',
        queueId: cardioQueue.id,
        patientId: 'pat-nayanthara', // 7. Nayanthara
        tokenNumber: 'A-027',
        position: 7,
        status: 'WAITING',
        triageCategory: 'General',
        checkInTime: '10:15 AM',
        waitDurationMin: 27,
        roomAssignment: 'Pathology Lab',
        hospitalName: 'Manipal Hospital, Salem',
        location: 'Salem, Tamil Nadu',
        notes: 'Lab Sample Pending - Delayed 10m',
        chiefComplaint: 'Post-Stress Test Discussion'
      },
      {
        id: 'qe-31',
        queueId: cardioQueue.id,
        patientId: 'pat-ajith', // 1. Ajith (Target Token A-031)
        tokenNumber: 'A-031',
        position: 8,
        status: 'WAITING',
        triageCategory: 'Follow-up',
        checkInTime: '10:28 AM',
        waitDurationMin: 14,
        roomAssignment: 'Room 3B',
        hospitalName: 'Manipal Hospital, Salem',
        location: 'Salem, Tamil Nadu',
        chiefComplaint: 'Echocardiogram Review & Arrhythmia Follow-up'
      },
      {
        id: 'qe-32',
        queueId: cardioQueue.id,
        patientId: 'pat-vijay', // 2. Vijay
        tokenNumber: 'A-032',
        position: 9,
        status: 'WAITING',
        triageCategory: 'General',
        checkInTime: '10:33 AM',
        waitDurationMin: 9,
        roomAssignment: 'Waiting Bay B',
        hospitalName: 'Manipal Hospital, Salem',
        location: 'Salem, Tamil Nadu',
        chiefComplaint: 'Initial Consultation'
      }
    ];

    cardioQueue.entries = qEntries;
    this.queues.push(cardioQueue);
    this.queueEntries.push(...qEntries);

    // 9. Appointments
    this.appointments = [
      {
        id: 'apt-001',
        patientId: 'pat-ajith',
        doctorId: 'doc-sarah',
        departmentId: 'dept-cardio',
        hospitalId: 'hosp-manipal-salem',
        hospitalName: 'Manipal Hospital, Salem',
        hospitalAddress: 'Dalmia Board, Salem-Bangalore Highway, Salem, Tamil Nadu 636012',
        location: 'Salem, Tamil Nadu',
        date: today,
        startTime: '09:00',
        endTime: '09:25',
        status: 'COMPLETED',
        tokenNumber: 'A-021',
        reason: 'Post-Stent Routine Follow-up',
        mode: 'IN_PERSON',
        createdAt: new Date().toISOString()
      },
      {
        id: 'apt-002',
        patientId: 'pat-ajith',
        doctorId: 'doc-sarah',
        departmentId: 'dept-cardio',
        hospitalId: 'hosp-manipal-salem',
        hospitalName: 'Manipal Hospital, Salem',
        hospitalAddress: 'Dalmia Board, Salem-Bangalore Highway, Salem, Tamil Nadu 636012',
        location: 'Salem, Tamil Nadu',
        date: today,
        startTime: '11:45',
        endTime: '12:10',
        status: 'WAITING',
        tokenNumber: 'A-031',
        reason: 'Arrhythmia Follow-up & ECG Review',
        mode: 'IN_PERSON',
        createdAt: new Date().toISOString()
      },
      {
        id: 'apt-003',
        patientId: 'pat-thrisha',
        doctorId: 'doc-sarah',
        departmentId: 'dept-cardio',
        hospitalId: 'hosp-manipal-salem',
        hospitalName: 'Manipal Hospital, Salem',
        hospitalAddress: 'Dalmia Board, Salem-Bangalore Highway, Salem, Tamil Nadu 636012',
        location: 'Salem, Tamil Nadu',
        date: today,
        startTime: '10:30',
        endTime: '10:55',
        status: 'WAITING',
        tokenNumber: 'A-025',
        reason: 'Pre-Op ECG Read & Holter Evaluation',
        mode: 'IN_PERSON',
        createdAt: new Date().toISOString()
      },
      {
        id: 'apt-004',
        patientId: 'pat-mamitha',
        doctorId: 'doc-sarah',
        departmentId: 'dept-cardio',
        hospitalId: 'hosp-manipal-salem',
        hospitalName: 'Manipal Hospital, Salem',
        hospitalAddress: 'Dalmia Board, Salem-Bangalore Highway, Salem, Tamil Nadu 636012',
        location: 'Salem, Tamil Nadu',
        date: today,
        startTime: '10:45',
        endTime: '11:10',
        status: 'WAITING',
        tokenNumber: 'A-026',
        reason: 'Routine Hypertension Refill',
        mode: 'IN_PERSON',
        createdAt: new Date().toISOString()
      }
    ];

    // 10. Initial Active Consultation for A-024 (Vikram)
    this.consultations.push({
      id: 'cons-024',
      appointmentId: 'apt-001',
      doctorId: 'doc-sarah',
      patientId: 'pat-vikram',
      chiefComplaint: 'Routine post-stent follow-up & medication review. Mild intermittent exertional fatigue on stair climbing. Denies chest pain or shortness of breath.',
      bloodPressure: '132/84',
      pulseBpm: 76,
      assessmentNotes: 'Patient appears well-perfused and comfortable. Heart sounds: S1/S2 present, no audible murmurs or gallops. Lungs clear to auscultation bilaterally. EKG demonstrates stable baseline without ischemic dynamic shifts.',
      plan: '1. Continue Dual Antiplatelet Therapy (DAPT) - Clopidogrel 75mg QD + ASA 81mg QD.\n2. Atorvastatin maintained at 40mg nocte.\n3. Order Repeat Lipid Panel in 8 weeks.',
      prescriptions: [
        'Clopidogrel 75mg Oral Tablet - 1 tab daily (30 days)',
        'Atorvastatin 40mg Oral Tablet - 1 tab at bedtime (90 days)'
      ],
      labOrders: [
        'Repeat Lipid Panel with Reflex LDL',
        'Serum Creatinine & eGFR'
      ],
      durationMinutes: 11.4,
      createdAt: new Date().toISOString()
    });

    // 11. Notifications
    this.notifications.push(
      {
        id: 'notif-1',
        userId: uPatientAjith.id,
        title: 'Queue Position Update: Token A-031',
        message: 'You are #8 in line for Dr. Sarah Jenkins. Estimated wait time is approximately 35 minutes.',
        type: 'QUEUE_ALERT',
        isRead: false,
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      },
      {
        id: 'notif-2',
        userId: uPatientAjith.id,
        title: 'Appointment Confirmed',
        message: 'Your Cardiology appointment with Dr. Sarah Jenkins (Room 3B) is checked in.',
        type: 'APPOINTMENT',
        isRead: true,
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: 'notif-3',
        userId: uPatientCurrentEnv.id,
        title: 'Queue Position Update: Token A-031',
        message: 'You are in line for Dr. Sarah Jenkins. Estimated wait time is approximately 35 minutes.',
        type: 'QUEUE_ALERT',
        isRead: false,
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      }
    );
  }

  // Helper Methods & Relational Aggregations
  getHospitalById(id: string): Hospital | undefined {
    return this.hospitals.find((h) => h.id === id);
  }

  getAllHospitals(location?: string): Hospital[] {
    if (location && location !== 'all') {
      const q = location.toLowerCase();
      return this.hospitals.filter((h) => h.location.toLowerCase().includes(q) || h.city.toLowerCase().includes(q));
    }
    return this.hospitals;
  }

  getUserById(id: string) {
    if (id === 'user-pat-jonathan') {
      return this.users.find((u) => u.id === 'user-pat-ajith') || this.users.find((u) => u.email === 'deepandeepan52594@gmail.com');
    }
    if (id === 'user-pat-robert') return this.users.find((u) => u.id === 'user-pat-vikram');
    if (id === 'user-pat-maria') return this.users.find((u) => u.id === 'user-pat-thrisha');
    if (id === 'user-pat-david') return this.users.find((u) => u.id === 'user-pat-dhanush');
    return this.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string) {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  getDoctorById(id: string): Doctor | undefined {
    const doc = this.doctors.find((d) => d.id === id || d.userId === id);
    if (!doc) return undefined;
    const user = this.users.find((u) => u.id === doc.userId);
    const department = this.departments.find((dep) => dep.id === doc.departmentId);
    const hospital = doc.hospitalId ? this.getHospitalById(doc.hospitalId) : undefined;
    return { ...doc, user, department, hospital };
  }

  getAllDoctors(): Doctor[] {
    return this.doctors.map((d) => ({
      ...d,
      user: this.users.find((u) => u.id === d.userId),
      department: this.departments.find((dep) => dep.id === d.departmentId),
      hospital: d.hospitalId ? this.getHospitalById(d.hospitalId) : undefined
    }));
  }

  getPatientById(id: string): Patient | undefined {
    if (id === 'pat-jonathan' || id === 'user-pat-jonathan') return this.getPatientById('pat-ajith');
    if (id === 'pat-robert' || id === 'user-pat-robert') return this.getPatientById('pat-vikram');
    if (id === 'pat-maria' || id === 'user-pat-maria') return this.getPatientById('pat-thrisha');
    if (id === 'pat-david' || id === 'user-pat-david') return this.getPatientById('pat-dhanush');
    const p = this.patients.find((pat) => pat.id === id || pat.userId === id);
    if (!p) return undefined;
    const user = this.users.find((u) => u.id === p.userId);
    return { ...p, user };
  }

  getAllPatients(): Patient[] {
    return this.patients.map((p) => ({
      ...p,
      user: this.users.find((u) => u.id === p.userId)
    }));
  }

  getQueueByDoctorId(doctorId: string, date?: string): Queue | undefined {
    const d = date || new Date().toISOString().split('T')[0];
    let queue = this.queues.find((q) => q.doctorId === doctorId && q.date === d);
    if (!queue) {
      // Auto create queue for doctor if not exists
      const doc = this.doctors.find((doc) => doc.id === doctorId);
      if (!doc) return undefined;
      queue = {
        id: `queue-${doctorId}-${d}`,
        doctorId,
        departmentId: doc.departmentId,
        hospitalId: doc.hospitalId,
        hospitalName: doc.hospitalName,
        hospitalAddress: doc.hospitalAddress,
        location: doc.location,
        date: d,
        isActive: true,
        entries: []
      };
      this.queues.push(queue);
    }

    const doctor = this.getDoctorById(doctorId);
    const department = this.departments.find((dep) => dep.id === queue!.departmentId);
    const hospital = doctor?.hospital || (queue.hospitalId ? this.getHospitalById(queue.hospitalId) : undefined);

    // populate entries
    const populatedEntries: QueueEntry[] = queue.entries.map((entry) => {
      const patient = this.getPatientById(entry.patientId);
      const appointment = this.appointments.find((apt) => apt.id === entry.appointmentId);
      return {
        ...entry,
        hospitalName: entry.hospitalName || queue?.hospitalName,
        location: entry.location || queue?.location,
        patient,
        appointment
      };
    });

    return {
      ...queue,
      hospitalName: queue.hospitalName || doctor?.hospitalName,
      location: queue.location || doctor?.location,
      hospital,
      doctor,
      department,
      entries: populatedEntries
    };
  }

  calculateEstimatedWaitTime(doctorId: string, tokenNumber: string): { patientsAhead: number; avgConsultationTimeMin: number; estimatedWaitMinutes: number } {
    const queue = this.getQueueByDoctorId(doctorId);
    const doc = this.doctors.find((d) => d.id === doctorId);
    const avgTime = doc ? doc.avgConsultationTimeMin : 12;

    if (!queue) {
      return { patientsAhead: 0, avgConsultationTimeMin: avgTime, estimatedWaitMinutes: 0 };
    }

    const targetIndex = queue.entries.findIndex((e) => e.tokenNumber === tokenNumber);
    if (targetIndex === -1) {
      // If not found, place at end of waiting
      const waitingCount = queue.entries.filter((e) => e.status === 'WAITING' || e.status === 'CALLED').length;
      return {
        patientsAhead: waitingCount,
        avgConsultationTimeMin: avgTime,
        estimatedWaitMinutes: Math.round(waitingCount * avgTime)
      };
    }

    // Count waiting/in-progress patients ahead of this index
    const ahead = queue.entries.slice(0, targetIndex).filter((e) => e.status === 'WAITING' || e.status === 'CALLED' || e.status === 'IN_PROGRESS').length;

    return {
      patientsAhead: ahead,
      avgConsultationTimeMin: avgTime,
      estimatedWaitMinutes: Math.round(ahead * avgTime)
    };
  }
}

export const db = new DatabaseStore();
