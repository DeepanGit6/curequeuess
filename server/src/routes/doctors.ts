import { Router, Request, Response } from 'express';
import { db } from '../services/db.js';
import { broadcastQueueUpdate } from '../socket/index.js';

const router = Router();

// GET all doctors with department info & queue metrics
router.get('/', (req: Request, res: Response) => {
  const { departmentId, search, hospitalId, location } = req.query;

  let docs = db.getAllDoctors();

  if (departmentId && departmentId !== 'all') {
    docs = docs.filter((d) => d.departmentId === departmentId);
  }

  if (hospitalId && hospitalId !== 'all') {
    docs = docs.filter((d) => d.hospitalId === hospitalId);
  }

  if (location && location !== 'all' && typeof location === 'string') {
    const loc = location.toLowerCase();
    docs = docs.filter(
      (d) =>
        d.location?.toLowerCase().includes(loc) ||
        d.hospital?.city?.toLowerCase().includes(loc) ||
        d.hospital?.location?.toLowerCase().includes(loc)
    );
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    docs = docs.filter(
      (d) =>
        d.user?.name.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q) ||
        d.department?.name.toLowerCase().includes(q) ||
        d.hospitalName?.toLowerCase().includes(q) ||
        d.location?.toLowerCase().includes(q)
    );
  }

  // Attach live queue wait count to each doctor
  const result = docs.map((d) => {
    const queue = db.getQueueByDoctorId(d.id);
    const waitingCount = queue ? queue.entries.filter((e) => e.status === 'WAITING' || e.status === 'CALLED').length : 0;
    const currentServing = queue ? queue.entries.find((e) => e.status === 'IN_PROGRESS')?.tokenNumber : null;

    return {
      ...d,
      waitingCount,
      currentServingToken: currentServing,
      estimatedWaitTime: Math.round(waitingCount * d.avgConsultationTimeMin)
    };
  });

  return res.json(result);
});

// GET doctor by ID
router.get('/:id', (req: Request, res: Response) => {
  const doc = db.getDoctorById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Doctor not found' });
  }

  const queue = db.getQueueByDoctorId(doc.id);
  const waitingCount = queue ? queue.entries.filter((e) => e.status === 'WAITING' || e.status === 'CALLED').length : 0;
  const currentServing = queue ? queue.entries.find((e) => e.status === 'IN_PROGRESS')?.tokenNumber : null;

  return res.json({
    ...doc,
    waitingCount,
    currentServingToken: currentServing,
    estimatedWaitTime: Math.round(waitingCount * doc.avgConsultationTimeMin)
  });
});

// GET doctor availability & available slots for a given date
router.get('/:id/availability', (req: Request, res: Response) => {
  const { id } = req.params;
  const { date } = req.query;
  const targetDate = (date as string) || new Date().toISOString().split('T')[0];

  const doc = db.getDoctorById(id);
  if (!doc) {
    return res.status(404).json({ error: 'Doctor not found' });
  }

  // Generate standard slots: morning, afternoon, evening follow-ups
  const allSlots = [
    { time: '09:00 AM', period: 'morning', raw: '09:00' },
    { time: '09:30 AM', period: 'morning', raw: '09:30' },
    { time: '10:00 AM', period: 'morning', raw: '10:00' },
    { time: '11:15 AM', period: 'morning', raw: '11:15' },
    { time: '01:30 PM', period: 'afternoon', raw: '13:30' },
    { time: '02:15 PM', period: 'afternoon', raw: '14:15' },
    { time: '03:00 PM', period: 'afternoon', raw: '15:00' },
    { time: '04:00 PM', period: 'afternoon', raw: '16:00' },
    { time: '05:15 PM', period: 'evening', raw: '17:15' },
    { time: '05:45 PM', period: 'evening', raw: '17:45' }
  ];

  // Check which slots are already booked for this doctor on targetDate
  const bookedTimes = db.appointments
    .filter((a) => a.doctorId === id && a.date === targetDate && a.status !== 'CANCELLED')
    .map((a) => a.startTime);

  const slots = allSlots.map((s) => ({
    ...s,
    isAvailable: !bookedTimes.includes(s.time) && !bookedTimes.includes(s.raw) && s.time !== '11:15 AM' // 11:15 is held/busy
  }));

  return res.json({
    doctorId: id,
    date: targetDate,
    shift: '08:00 - 16:30',
    slots
  });
});

// Update Doctor Status (ON_DUTY, ON_BREAK, OFF_DUTY)
router.patch('/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const doc = db.doctors.find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Doctor not found' });

  if (!['ON_DUTY', 'ON_BREAK', 'OFF_DUTY'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  doc.status = status;
  broadcastQueueUpdate(doc.id, db.getQueueByDoctorId(doc.id));

  return res.json(doc);
});

export default router;
