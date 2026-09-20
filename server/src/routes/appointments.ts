import { Router, Request, Response } from 'express';
import { db, Appointment, QueueEntry, Patient, User } from '../services/db.js';
import { broadcastQueueUpdate, getIO } from '../socket/index.js';

const router = Router();

// GET appointments
router.get('/', (req: Request, res: Response) => {
  const { doctorId, patientId, date, status } = req.query;

  let list = db.appointments.map((apt) => {
    const doctor = db.getDoctorById(apt.doctorId);
    const patient = db.getPatientById(apt.patientId);
    const department = db.departments.find((d) => d.id === apt.departmentId);
    const hospital = apt.hospitalId ? db.getHospitalById(apt.hospitalId) : doctor?.hospital;
    return {
      ...apt,
      hospitalName: apt.hospitalName || hospital?.name || doctor?.hospitalName,
      location: apt.location || hospital?.location || doctor?.location,
      hospital,
      doctor,
      patient,
      department
    };
  });

  if (doctorId) list = list.filter((a) => a.doctorId === doctorId);
  if (patientId) list = list.filter((a) => a.patientId === patientId);
  if (date) list = list.filter((a) => a.date === date);
  if (status) list = list.filter((a) => a.status === status);

  return res.json(list);
});

// GET single appointment
router.get('/:id', (req: Request, res: Response) => {
  const apt = db.appointments.find((a) => a.id === req.params.id);
  if (!apt) return res.status(404).json({ error: 'Appointment not found' });

  const doctor = db.getDoctorById(apt.doctorId);
  const patient = db.getPatientById(apt.patientId);
  const department = db.departments.find((d) => d.id === apt.departmentId);
  const hospital = apt.hospitalId ? db.getHospitalById(apt.hospitalId) : doctor?.hospital;

  return res.json({
    ...apt,
    hospitalName: apt.hospitalName || hospital?.name || doctor?.hospitalName,
    location: apt.location || hospital?.location || doctor?.location,
    hospital,
    doctor,
    patient,
    department
  });
});

// POST Book Appointment (with double-booking check & queue token generation)
router.post('/', (req: Request, res: Response) => {
  try {
    const {
      patientId,
      doctorId,
      departmentId,
      date,
      startTime,
      reason,
      mode,
      patientName,
      patientPhone,
      patientEmail,
      userId,
      hospitalId,
      hospitalName,
      hospitalAddress,
      location
    } = req.body;

    if (!doctorId || !date || !startTime) {
      return res.status(400).json({ error: 'doctorId, date, and startTime are required.' });
    }

    const doctor = db.getDoctorById(doctorId);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found.' });

    // 1. Prevent Double-Booking: A doctor cannot have two appointments in the same time slot
    const conflict = db.appointments.find(
      (a) => a.doctorId === doctorId && a.date === date && a.startTime === startTime && a.status !== 'CANCELLED'
    );
    if (conflict) {
      return res.status(409).json({
        error: `Doctor ${doctor.user?.name || doctorId} is already booked for ${startTime} on ${date}. Please choose another slot.`
      });
    }

    // Determine hospital metadata
    const finalHospitalId = hospitalId || doctor.hospitalId || 'hosp-manipal-salem';
    const foundHospital = db.getHospitalById(finalHospitalId);
    const finalHospitalName =
      hospitalName || foundHospital?.name || doctor.hospitalName || 'Manipal Hospital, Salem';
    const finalHospitalAddress =
      hospitalAddress || foundHospital?.address || doctor.hospitalAddress || 'Dalmia Board, Salem-Bangalore Highway, Salem, Tamil Nadu 636012';
    const finalLocation =
      location || foundHospital?.location || doctor.location || 'Salem, Tamil Nadu';

    // Determine patient record and ensure patient name & contact details are stored
    let patientRecord: Patient | undefined;
    let patientUser: User | undefined;

    if (patientId) {
      patientRecord = db.patients.find((p) => p.id === patientId || p.userId === patientId);
    }
    if (!patientRecord && userId) {
      patientRecord = db.patients.find((p) => p.userId === userId);
      patientUser = db.users.find((u) => u.id === userId);
    }

    const effectiveName = (patientName && patientName.trim()) || patientUser?.name || 'Deepan';
    const effectivePhone = (patientPhone && patientPhone.trim()) || patientUser?.phone || '+91 98427 12345';
    const effectiveEmail = (patientEmail && patientEmail.trim()) || patientUser?.email || 'deepandeepan52594@gmail.com';

    if (!patientRecord) {
      // Look for user matching this name or email
      let user = db.users.find(
        (u) =>
          u.name.toLowerCase() === effectiveName.toLowerCase() ||
          (effectiveEmail && u.email.toLowerCase() === effectiveEmail.toLowerCase())
      );

      if (!user) {
        // Create user
        user = {
          id: `user-pat-${Date.now()}`,
          name: effectiveName,
          email: effectiveEmail,
          passwordHash: 'hashed',
          role: 'PATIENT',
          phone: effectivePhone,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300',
          createdAt: new Date().toISOString()
        };
        db.users.push(user);
      } else {
        user.name = effectiveName;
        if (effectivePhone) user.phone = effectivePhone;
        if (effectiveEmail) user.email = effectiveEmail;
      }

      patientUser = user;
      patientRecord = db.patients.find((p) => p.userId === user!.id);
      if (!patientRecord) {
        patientRecord = {
          id: `pat-${Date.now()}`,
          userId: user.id,
          mrn: `MRN-${Math.floor(100000 + Math.random() * 900000)}`,
          age: 32,
          gender: 'Male',
          bloodGroup: 'B+',
          allergies: 'None recorded',
          emergencyContact: effectivePhone,
          insuranceProvider: 'Star Health Insurance',
          insurancePolicyNo: 'SH-994021'
        };
        db.patients.push(patientRecord);
      }
    } else {
      patientUser = db.users.find((u) => u.id === patientRecord!.userId);
      if (patientUser) {
        if (patientName?.trim()) patientUser.name = patientName.trim();
        if (patientPhone?.trim()) patientUser.phone = patientPhone.trim();
        if (patientEmail?.trim()) patientUser.email = patientEmail.trim();
      }
    }

    const actualPatientId = patientRecord.id;

    // Generate unique token number
    const queue = db.getQueueByDoctorId(doctorId, date);
    const existingTokens = (queue?.entries || []).map((e) => e.tokenNumber);
    let nextNum = 35;
    while (existingTokens.includes(`A-${String(nextNum).padStart(3, '0')}`)) {
      nextNum++;
    }
    const tokenNumber = `A-${String(nextNum).padStart(3, '0')}`;

    // End time (25 mins slot)
    const [h, m] = startTime.split(' ')[0].split(':').map(Number);
    const isPM = startTime.includes('PM') && h !== 12;
    const hour24 = isPM ? h + 12 : h;
    const endMinutes = hour24 * 60 + m + 25;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    const endTime = `${endH % 12 || 12}:${String(endM).padStart(2, '0')} ${endH >= 12 ? 'PM' : 'AM'}`;

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      patientId: actualPatientId,
      patientName: effectiveName,
      patientPhone: effectivePhone,
      patientEmail: effectiveEmail,
      doctorId,
      departmentId: departmentId || doctor.departmentId,
      hospitalId: finalHospitalId,
      hospitalName: finalHospitalName,
      hospitalAddress: finalHospitalAddress,
      location: finalLocation,
      date,
      startTime,
      endTime,
      status: 'BOOKED',
      tokenNumber,
      reason: reason || 'General Consultation',
      mode: mode || 'IN_PERSON',
      createdAt: new Date().toISOString(),
      patient: {
        ...patientRecord,
        user: patientUser
      }
    };

    db.appointments.push(newApt);

    // If date is today, also inject into the active queue
    const today = new Date().toISOString().split('T')[0];
    if (date === today && queue) {
      const newEntry: QueueEntry = {
        id: `qe-${Date.now()}`,
        queueId: queue.id,
        appointmentId: newApt.id,
        patientId: actualPatientId,
        tokenNumber,
        position: queue.entries.length + 1,
        status: 'WAITING',
        triageCategory: 'General',
        checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        waitDurationMin: 0,
        roomAssignment: doctor.roomNumber,
        hospitalName: finalHospitalName,
        location: finalLocation,
        chiefComplaint: reason || 'Scheduled Consultation',
        patient: {
          ...patientRecord,
          user: patientUser
        }
      };
      queue.entries.push(newEntry);
      db.queueEntries.push(newEntry);
      broadcastQueueUpdate(doctorId, db.getQueueByDoctorId(doctorId));
    }

    // 1. Create Patient In-App Confirmation Notification
    const patientNotification = {
      id: `notif-${Date.now()}`,
      userId: patientUser?.id || patientRecord.userId,
      title: `Appointment Confirmed • Token ${tokenNumber}`,
      message: `Dear ${effectiveName}, your appointment with ${doctor.user?.name || 'the specialist'} at ${finalHospitalName} on ${date} at ${startTime} has been confirmed. Your live queue token is ${tokenNumber}.`,
      type: 'APPOINTMENT_CONFIRMED' as const,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    db.notifications.unshift(patientNotification);

    // 2. Also notify doctor console
    db.notifications.unshift({
      id: `notif-doc-${Date.now()}`,
      userId: doctor.userId,
      title: `New OPD Appointment Booked: ${effectiveName}`,
      message: `${effectiveName} booked slot for ${startTime} on ${date} (${finalHospitalName}). Token: ${tokenNumber}.`,
      type: 'QUEUE_UPDATE' as const,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    // 3. Emit real-time notification over Socket.IO
    const io = getIO();
    if (io) {
      io.to(`user:${patientUser?.id || patientRecord.userId}`).emit('notification:new', patientNotification);
      io.emit('notification:broadcast', patientNotification);
    }

    return res.status(201).json({
      appointment: {
        ...newApt,
        doctor,
        hospital: foundHospital,
        patient: {
          ...patientRecord,
          user: patientUser
        }
      },
      tokenNumber,
      notification: patientNotification,
      message: `Appointment successfully confirmed for ${effectiveName} at ${finalHospitalName} (${finalLocation}). Token ${tokenNumber} allocated.`
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to book appointment' });
  }
});

// PATCH Reschedule or update status
router.patch('/:id', (req: Request, res: Response) => {
  const apt = db.appointments.find((a) => a.id === req.params.id);
  if (!apt) return res.status(404).json({ error: 'Appointment not found' });

  const { date, startTime, status, reason } = req.body;

  // If changing time, verify double-booking
  if (startTime && startTime !== apt.startTime) {
    const conflict = db.appointments.find(
      (a) =>
        a.id !== apt.id &&
        a.doctorId === apt.doctorId &&
        a.date === (date || apt.date) &&
        a.startTime === startTime &&
        a.status !== 'CANCELLED'
    );
    if (conflict) {
      return res.status(409).json({ error: 'This time slot is already booked.' });
    }
    apt.startTime = startTime;
  }

  if (date) apt.date = date;
  if (status) apt.status = status;
  if (reason) apt.reason = reason;

  return res.json(apt);
});

// DELETE Cancel Appointment
router.delete('/:id', (req: Request, res: Response) => {
  const apt = db.appointments.find((a) => a.id === req.params.id);
  if (!apt) return res.status(404).json({ error: 'Appointment not found' });

  apt.status = 'CANCELLED';

  // Also cancel queue entry if present
  const entry = db.queueEntries.find((e) => e.appointmentId === apt.id);
  if (entry) {
    entry.status = 'SKIPPED';
    entry.notes = 'Appointment cancelled by patient or staff.';
    broadcastQueueUpdate(apt.doctorId, db.getQueueByDoctorId(apt.doctorId));
  }

  return res.json({ message: 'Appointment cancelled successfully.' });
});

export default router;
