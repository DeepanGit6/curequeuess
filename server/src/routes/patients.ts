import { Router, Request, Response } from 'express';
import { db } from '../services/db.js';

const router = Router();

// GET all patients
router.get('/', (req: Request, res: Response) => {
  const { search } = req.query;
  let list = db.getAllPatients();

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(
      (p) =>
        p.user?.name.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        p.user?.phone?.includes(q)
    );
  }

  return res.json(list);
});

// GET patient by ID with full chart
router.get('/:id', (req: Request, res: Response) => {
  const patient = db.getPatientById(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  // Get appointments
  const appointments = db.appointments
    .filter((a) => a.patientId === patient.id)
    .map((a) => ({
      ...a,
      doctor: db.getDoctorById(a.doctorId),
      department: db.departments.find((d) => d.id === a.departmentId)
    }));

  // Get consultations
  const consultations = db.consultations
    .filter((c) => c.patientId === patient.id)
    .map((c) => ({
      ...c,
      doctor: db.getDoctorById(c.doctorId)
    }));

  // Get active queue token if any
  const activeEntries = db.queueEntries.filter(
    (e) => e.patientId === patient.id && (e.status === 'WAITING' || e.status === 'IN_PROGRESS' || e.status === 'SKIPPED')
  );

  return res.json({
    ...patient,
    appointments,
    consultations,
    activeQueueEntries: activeEntries
  });
});

export default router;
