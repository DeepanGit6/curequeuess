import { Router, Request, Response } from 'express';
import { db, Consultation } from '../services/db.js';

const router = Router();

// GET consultations
router.get('/', (req: Request, res: Response) => {
  const { doctorId, patientId } = req.query;

  let list = db.consultations.map((c) => {
    const doctor = db.getDoctorById(c.doctorId);
    const patient = db.getPatientById(c.patientId);
    return {
      ...c,
      doctor,
      patient
    };
  });

  if (doctorId) list = list.filter((c) => c.doctorId === doctorId);
  if (patientId) list = list.filter((c) => c.patientId === patientId);

  return res.json(list);
});

// GET single consultation
router.get('/:id', (req: Request, res: Response) => {
  const c = db.consultations.find((item) => item.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Consultation record not found' });

  const doctor = db.getDoctorById(c.doctorId);
  const patient = db.getPatientById(c.patientId);

  return res.json({
    ...c,
    doctor,
    patient
  });
});

// POST new consultation
router.post('/', (req: Request, res: Response) => {
  const { doctorId, patientId, chiefComplaint, bloodPressure, pulseBpm, assessmentNotes, plan, prescriptions, labOrders, durationMinutes } = req.body;

  if (!doctorId || !patientId) {
    return res.status(400).json({ error: 'doctorId and patientId are required.' });
  }

  const newRecord: Consultation = {
    id: `cons-${Date.now()}`,
    doctorId,
    patientId,
    chiefComplaint: chiefComplaint || 'Clinical evaluation',
    bloodPressure: bloodPressure || '120/80',
    pulseBpm: pulseBpm ? Number(pulseBpm) : 72,
    assessmentNotes: assessmentNotes || 'Evaluation completed.',
    plan: plan || 'Follow instructions.',
    prescriptions: Array.isArray(prescriptions) ? prescriptions : [],
    labOrders: Array.isArray(labOrders) ? labOrders : [],
    durationMinutes: durationMinutes ? Number(durationMinutes) : 12.0,
    createdAt: new Date().toISOString()
  };

  db.consultations.unshift(newRecord);

  return res.status(201).json(newRecord);
});

export default router;
