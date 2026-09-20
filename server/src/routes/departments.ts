import { Router, Request, Response } from 'express';
import { db } from '../services/db.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const result = db.departments.map((dept) => {
    const doctors = db.doctors.filter((d) => d.departmentId === dept.id);
    let totalWaiting = 0;
    doctors.forEach((doc) => {
      const q = db.getQueueByDoctorId(doc.id);
      if (q) {
        totalWaiting += q.entries.filter((e) => e.status === 'WAITING' || e.status === 'CALLED').length;
      }
    });

    return {
      ...dept,
      doctorsCount: doctors.length,
      activeQueueCount: totalWaiting,
      leadDoctor: doctors[0] ? db.getDoctorById(doctors[0].id)?.user?.name : 'Staff Physician'
    };
  });

  return res.json(result);
});

export default router;
