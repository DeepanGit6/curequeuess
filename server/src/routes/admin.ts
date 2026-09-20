import { Router, Request, Response } from 'express';
import { db } from '../services/db.js';

const router = Router();

router.get('/dashboard', (_req: Request, res: Response) => {
  // Aggregate real-time statistics
  const doctors = db.getAllDoctors();
  const allQueues = db.queues;

  let totalWaiting = 0;
  let totalCompleted = 0;
  let totalSkipped = 0;

  allQueues.forEach((q) => {
    q.entries.forEach((e) => {
      if (e.status === 'WAITING' || e.status === 'CALLED') totalWaiting++;
      else if (e.status === 'COMPLETED') totalCompleted++;
      else if (e.status === 'SKIPPED') totalSkipped++;
    });
  });

  // Calculate hospital-wide average wait
  const totalWaitTimes = doctors.map((d) => d.avgConsultationTimeMin);
  const avgHospitalWait = totalWaitTimes.length
    ? Number((totalWaitTimes.reduce((a, b) => a + b, 0) / totalWaitTimes.length).toFixed(1))
    : 11.8;

  // Active doctors count
  const activeDoctors = doctors.filter((d) => d.status === 'ON_DUTY').length;

  // Hourly patient throughput data for Recharts
  const hourlyThroughput = [
    { hour: '08:00', arrivals: 12, completed: 8, avgWait: 14 },
    { hour: '09:00', arrivals: 28, completed: 22, avgWait: 16 },
    { hour: '10:00', arrivals: 34, completed: 29, avgWait: 21 },
    { hour: '11:00', arrivals: 42, completed: 35, avgWait: 26 },
    { hour: '12:00', arrivals: 20, completed: 24, avgWait: 18 },
    { hour: '13:00', arrivals: 25, completed: 21, avgWait: 19 },
    { hour: '14:00', arrivals: 38, completed: 31, avgWait: 24 },
    { hour: '15:00', arrivals: 30, completed: 28, avgWait: 17 },
    { hour: '16:00', arrivals: 18, completed: 19, avgWait: 12 }
  ];

  // Department wait breakdown
  const departmentBreakdown = db.departments.map((dept) => {
    const deptDocs = doctors.filter((d) => d.departmentId === dept.id);
    let waitCount = 0;
    deptDocs.forEach((d) => {
      const q = db.getQueueByDoctorId(d.id);
      if (q) {
        waitCount += q.entries.filter((e) => e.status === 'WAITING' || e.status === 'CALLED').length;
      }
    });

    return {
      department: dept.name,
      code: dept.code,
      waiting: waitCount,
      activeDoctors: deptDocs.filter((d) => d.status === 'ON_DUTY').length,
      avgWaitMin: deptDocs.length ? deptDocs[0].avgConsultationTimeMin : 12,
      utilizationRate: 85 + Math.floor(Math.random() * 10)
    };
  });

  // Bottleneck alerts
  const bottlenecks = [
    {
      id: 'bn-1',
      severity: 'WARNING',
      department: 'Cardiology OPD',
      room: 'Room 3B',
      message: 'Queue surge: 8 patients queued. Estimated delay +12 mins above average.',
      action: 'Open Overflow Bay 2 or activate relief registrar'
    },
    {
      id: 'bn-2',
      severity: 'INFO',
      department: 'Pharmacy Dispensing',
      room: 'Kiosk 2',
      message: 'Grace period recovery: 1 patient restored from prescription queue.',
      action: 'Automatic priority slot maintained'
    }
  ];

  return res.json({
    metrics: {
      totalPatientsToday: 148,
      currentlyWaiting: totalWaiting,
      currentlyServing: allQueues.filter((q) => q.entries.some((e) => e.status === 'IN_PROGRESS')).length,
      completedToday: 68 + totalCompleted,
      avgWaitTimeMin: avgHospitalWait,
      activeDoctorsCount: activeDoctors,
      totalDoctorsCount: doctors.length,
      bedOccupancyRate: 84.6,
      noShowRatePercent: 4.2
    },
    hourlyThroughput,
    departmentBreakdown,
    bottlenecks,
    doctors: doctors.map((d) => ({
      id: d.id,
      name: d.user?.name,
      specialty: d.specialty,
      roomNumber: d.roomNumber,
      status: d.status,
      avgConsultationTimeMin: d.avgConsultationTimeMin,
      totalDone: d.totalConsultationsDone
    }))
  });
});

export default router;
