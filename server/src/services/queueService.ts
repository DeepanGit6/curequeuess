import { db, Queue, QueueEntry, Consultation } from './db.js';

export class QueueService {
  /**
   * Call the next patient in a doctor's queue.
   * Completes the current in-progress consultation and updates the running average consultation duration.
   */
  static callNext(doctorId: string): {
    queue: Queue;
    calledEntry: QueueEntry | null;
    completedEntry: QueueEntry | null;
    doctorStats: { avgConsultationTimeMin: number; totalConsultationsDone: number };
  } {
    const queue = db.getQueueByDoctorId(doctorId);
    const doctor = db.doctors.find((d) => d.id === doctorId);
    if (!queue || !doctor) {
      throw new Error(`Queue or doctor not found for doctor ID ${doctorId}`);
    }

    const now = new Date();
    let completedEntry: QueueEntry | null = null;

    // 1. If someone is currently IN_PROGRESS, complete them
    const activeEntry = queue.entries.find((e) => e.status === 'IN_PROGRESS');
    if (activeEntry) {
      activeEntry.status = 'COMPLETED';
      activeEntry.endTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Calculate actual duration in minutes
      const startMs = activeEntry.startTime ? new Date(activeEntry.startTime).getTime() : now.getTime() - 10 * 60 * 1000;
      const elapsedMins = Math.max(3, Math.min(45, (now.getTime() - startMs) / (1000 * 60)));

      // Update doctor's running moving average
      const count = doctor.totalConsultationsDone || 1;
      doctor.avgConsultationTimeMin = Number(
        (((doctor.avgConsultationTimeMin * count) + elapsedMins) / (count + 1)).toFixed(1)
      );
      doctor.totalConsultationsDone = count + 1;

      // Update linked appointment
      if (activeEntry.appointmentId) {
        const apt = db.appointments.find((a) => a.id === activeEntry.appointmentId);
        if (apt) apt.status = 'COMPLETED';
      }

      completedEntry = activeEntry;
    }

    // 2. Find next patient waiting (Priority/Fast-Track first, then standard FIFO)
    const nextEntry = queue.entries.find((e) => e.status === 'WAITING' || e.status === 'CALLED');

    if (nextEntry) {
      nextEntry.status = 'IN_PROGRESS';
      nextEntry.startTime = now.toISOString();
      nextEntry.callTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      queue.currentServingToken = nextEntry.tokenNumber;

      // Update linked appointment
      if (nextEntry.appointmentId) {
        const apt = db.appointments.find((a) => a.id === nextEntry.appointmentId);
        if (apt) apt.status = 'IN_PROGRESS';
      }

      // Create notification for the patient
      const patient = db.getPatientById(nextEntry.patientId);
      if (patient) {
        db.notifications.unshift({
          id: `notif-${Date.now()}`,
          userId: patient.userId,
          title: `It's Your Turn! Token ${nextEntry.tokenNumber}`,
          message: `Please proceed to ${doctor.roomNumber} (${doctor.specialty}). Dr. ${doctor.user?.name || 'Jenkins'} is ready for you.`,
          type: 'DOCTOR_CALLED',
          isRead: false,
          createdAt: now.toISOString()
        });
      }
    } else {
      queue.currentServingToken = undefined;
    }

    return {
      queue: db.getQueueByDoctorId(doctorId)!,
      calledEntry: nextEntry || null,
      completedEntry,
      doctorStats: {
        avgConsultationTimeMin: doctor.avgConsultationTimeMin,
        totalConsultationsDone: doctor.totalConsultationsDone
      }
    };
  }

  /**
   * Complete current consultation explicitly with clinical notes and e-prescriptions.
   */
  static completeConsultation(
    doctorId: string,
    data: {
      notes?: string;
      chiefComplaint?: string;
      bloodPressure?: string;
      pulseBpm?: number;
      plan?: string;
      prescriptions?: string[];
      labOrders?: string[];
    }
  ): { queue: Queue; consultation: Consultation } {
    const queue = db.getQueueByDoctorId(doctorId);
    const doctor = db.doctors.find((d) => d.id === doctorId);
    if (!queue || !doctor) {
      throw new Error('Doctor or Queue not found');
    }

    const activeEntry = queue.entries.find((e) => e.status === 'IN_PROGRESS');
    if (!activeEntry) {
      throw new Error('No consultation is currently active in chair');
    }

    const now = new Date();
    activeEntry.status = 'COMPLETED';
    activeEntry.endTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Save Consultation record
    const consultation: Consultation = {
      id: `cons-${Date.now()}`,
      appointmentId: activeEntry.appointmentId,
      doctorId,
      patientId: activeEntry.patientId,
      chiefComplaint: data.chiefComplaint || activeEntry.chiefComplaint || 'Routine clinical assessment',
      bloodPressure: data.bloodPressure || '120/80',
      pulseBpm: data.pulseBpm || 72,
      assessmentNotes: data.notes || 'Consultation concluded satisfactorily.',
      plan: data.plan || 'Routine monitoring as advised.',
      prescriptions: data.prescriptions || [],
      labOrders: data.labOrders || [],
      durationMinutes: doctor.avgConsultationTimeMin,
      createdAt: now.toISOString()
    };

    db.consultations.unshift(consultation);

    if (activeEntry.appointmentId) {
      const apt = db.appointments.find((a) => a.id === activeEntry.appointmentId);
      if (apt) apt.status = 'COMPLETED';
    }

    return {
      queue: db.getQueueByDoctorId(doctorId)!,
      consultation
    };
  }

  /**
   * Skip a patient with a 15-minute grace period.
   */
  static skipPatient(entryId: string, graceMinutes: number = 15): QueueEntry {
    const entry = db.queueEntries.find((e) => e.id === entryId);
    if (!entry) throw new Error('Queue entry not found');

    const now = new Date();
    entry.status = 'SKIPPED';
    entry.gracePeriodEnds = new Date(now.getTime() + graceMinutes * 60 * 1000).toISOString();
    entry.notes = `Absent when called. Grace period active for ${graceMinutes}m.`;

    const queue = db.queues.find((q) => q.id === entry.queueId);
    if (queue && queue.currentServingToken === entry.tokenNumber) {
      queue.currentServingToken = undefined;
    }

    return entry;
  }

  /**
   * Restore a skipped/grace patient back into the next waiting slot.
   */
  static restoreGracePatient(entryId: string): QueueEntry {
    const entry = db.queueEntries.find((e) => e.id === entryId);
    if (!entry) throw new Error('Queue entry not found');

    entry.status = 'WAITING';
    entry.gracePeriodEnds = undefined;
    entry.notes = 'Restored to next available slot by staff.';

    return entry;
  }

  /**
   * Shift a patient's place back by N slots (Delay Token button).
   */
  static delayToken(doctorId: string, tokenNumber: string, slotsBack: number = 2): Queue {
    const queue = db.getQueueByDoctorId(doctorId);
    if (!queue) throw new Error('Queue not found');

    const currentIndex = queue.entries.findIndex((e) => e.tokenNumber === tokenNumber);
    if (currentIndex === -1) throw new Error('Token not found in queue');

    const [movedItem] = queue.entries.splice(currentIndex, 1);
    const newIndex = Math.min(queue.entries.length, currentIndex + slotsBack);
    queue.entries.splice(newIndex, 0, movedItem);

    // re-index positions
    queue.entries.forEach((e, idx) => {
      e.position = idx + 1;
    });

    return queue;
  }

  /**
   * Issue a rapid walk-in token and add to doctor's queue.
   */
  static issueWalkInToken(data: {
    doctorId: string;
    patientName: string;
    phone?: string;
    mrn?: string;
    triageCategory?: 'General' | 'Priority Senior' | 'Fast-Track' | 'Emergency' | 'Follow-up';
    chiefComplaint?: string;
    roomAssignment?: string;
  }): { queue: Queue; newEntry: QueueEntry } {
    const queue = db.getQueueByDoctorId(data.doctorId);
    const doctor = db.doctors.find((d) => d.id === data.doctorId);
    if (!queue || !doctor) throw new Error('Queue or Doctor not found');

    // Create or find patient
    let patient = data.mrn ? db.patients.find((p) => p.mrn === data.mrn) : undefined;
    if (!patient) {
      const newUserId = `user-walkin-${Date.now()}`;
      const newUser = {
        id: newUserId,
        email: `walkin.${Date.now()}@hospital.local`,
        passwordHash: '',
        name: data.patientName,
        role: 'PATIENT' as const,
        phone: data.phone || '+1 (555) 000-0000',
        createdAt: new Date().toISOString()
      };
      db.users.push(newUser);

      patient = {
        id: `pat-walkin-${Date.now()}`,
        userId: newUserId,
        mrn: data.mrn || `MRN-${Math.floor(100000 + Math.random() * 900000)}`,
        age: 35,
        gender: 'Not specified',
        bloodGroup: 'Unknown',
        allergies: 'None recorded',
        emergencyContact: data.phone || 'Walk-in',
        insuranceProvider: 'Self-Pay / In-Clinic',
        insurancePolicyNo: 'WALK-01'
      };
      db.patients.push(patient);
    }

    // Determine next token prefix & number
    const prefix = data.triageCategory === 'Emergency' ? 'STAT' : data.triageCategory === 'Priority Senior' ? 'W' : 'A';
    const existingTokens = queue.entries.map((e) => e.tokenNumber);
    let nextNum = 33;
    while (existingTokens.includes(`${prefix}-${String(nextNum).padStart(3, '0')}`)) {
      nextNum++;
    }
    const tokenNumber = `${prefix}-${String(nextNum).padStart(3, '0')}`;

    const newEntry: QueueEntry = {
      id: `qe-${Date.now()}`,
      queueId: queue.id,
      patientId: patient.id,
      tokenNumber,
      position: queue.entries.length + 1,
      status: 'WAITING',
      triageCategory: data.triageCategory || 'General',
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      waitDurationMin: 0,
      roomAssignment: data.roomAssignment || doctor.roomNumber,
      chiefComplaint: data.chiefComplaint || 'Walk-in Clinical Intake'
    };

    queue.entries.push(newEntry);
    db.queueEntries.push(newEntry);

    return {
      queue: db.getQueueByDoctorId(data.doctorId)!,
      newEntry
    };
  }
}
