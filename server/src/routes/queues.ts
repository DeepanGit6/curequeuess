import { Router, Request, Response } from 'express';
import { db } from '../services/db.js';
import { QueueService } from '../services/queueService.js';
import { broadcastQueueUpdate, broadcastTokenChime } from '../socket/index.js';

const router = Router();

// GET active queue for doctor
router.get('/:doctorId', (req: Request, res: Response) => {
  const { doctorId } = req.params;
  const { date } = req.query;

  const queue = db.getQueueByDoctorId(doctorId, date as string);
  if (!queue) {
    return res.status(404).json({ error: 'Queue not found for doctor' });
  }

  // Calculate live dynamic metrics
  const waitingEntries = queue.entries.filter((e) => e.status === 'WAITING' || e.status === 'CALLED');
  const avgDuration = queue.doctor?.avgConsultationTimeMin || 11.4;
  const estTotalWaitMin = Math.round(waitingEntries.length * avgDuration);

  return res.json({
    ...queue,
    metrics: {
      totalInQueue: queue.entries.length,
      waitingCount: waitingEntries.length,
      completedCount: queue.entries.filter((e) => e.status === 'COMPLETED').length,
      skippedCount: queue.entries.filter((e) => e.status === 'SKIPPED').length,
      avgConsultationTimeMin: avgDuration,
      estimatedWaitTimeMinutes: estTotalWaitMin,
      currentServingToken: queue.currentServingToken || queue.entries.find((e) => e.status === 'IN_PROGRESS')?.tokenNumber || null
    }
  });
});

// Calculate wait time for a specific token
router.get('/:doctorId/estimate/:tokenNumber', (req: Request, res: Response) => {
  const { doctorId, tokenNumber } = req.params;
  const estimate = db.calculateEstimatedWaitTime(doctorId, tokenNumber);
  return res.json(estimate);
});

// Call Next Patient
router.post('/:doctorId/next', (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    const result = QueueService.callNext(doctorId);

    // Broadcast through Socket.IO
    broadcastQueueUpdate(doctorId, result.queue);
    if (result.calledEntry) {
      broadcastTokenChime(
        result.calledEntry.tokenNumber,
        result.queue.doctor?.roomNumber || 'Room 3B',
        result.calledEntry.patient?.user?.name || 'Next Patient'
      );
    }

    return res.json({
      success: true,
      message: result.calledEntry
        ? `Now calling Token ${result.calledEntry.tokenNumber}`
        : 'All patients in queue have been attended.',
      queue: result.queue,
      calledEntry: result.calledEntry,
      completedEntry: result.completedEntry
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Complete Consultation with clinical notes
router.post('/:doctorId/complete', (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    const { notes, chiefComplaint, bloodPressure, pulseBpm, plan, prescriptions, labOrders } = req.body;

    const result = QueueService.completeConsultation(doctorId, {
      notes,
      chiefComplaint,
      bloodPressure,
      pulseBpm,
      plan,
      prescriptions,
      labOrders
    });

    broadcastQueueUpdate(doctorId, result.queue);

    return res.json({
      success: true,
      message: 'Consultation concluded and archived to patient Electronic Health Record.',
      consultation: result.consultation,
      queue: result.queue
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Skip Patient (with Grace Period)
router.post('/entry/:id/skip', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { graceMinutes = 15 } = req.body;

    const updated = QueueService.skipPatient(id, Number(graceMinutes));
    const entry = db.queueEntries.find((e) => e.id === id);
    if (entry) {
      const queue = db.queues.find((q) => q.id === entry.queueId);
      if (queue) {
        broadcastQueueUpdate(queue.doctorId, db.getQueueByDoctorId(queue.doctorId));
      }
    }

    return res.json({ success: true, entry: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Restore Skipped Patient
router.post('/entry/:id/restore', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = QueueService.restoreGracePatient(id);
    const entry = db.queueEntries.find((e) => e.id === id);
    if (entry) {
      const queue = db.queues.find((q) => q.id === entry.queueId);
      if (queue) {
        broadcastQueueUpdate(queue.doctorId, db.getQueueByDoctorId(queue.doctorId));
      }
    }

    return res.json({ success: true, entry: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Delay Token by 2 positions
router.post('/:doctorId/delay', (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    const { tokenNumber, slotsBack = 2 } = req.body;

    const updatedQueue = QueueService.delayToken(doctorId, tokenNumber, Number(slotsBack));
    broadcastQueueUpdate(doctorId, db.getQueueByDoctorId(doctorId));

    return res.json({ success: true, queue: updatedQueue });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Issue Walk-In Token
router.post('/:doctorId/walkin', (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    const { patientName, phone, mrn, triageCategory, chiefComplaint } = req.body;

    if (!patientName) {
      return res.status(400).json({ error: 'Patient name is required for walk-in token issuance.' });
    }

    const result = QueueService.issueWalkInToken({
      doctorId,
      patientName,
      phone,
      mrn,
      triageCategory,
      chiefComplaint
    });

    broadcastQueueUpdate(doctorId, result.queue);

    return res.status(201).json({
      success: true,
      message: `Token ${result.newEntry.tokenNumber} issued to ${patientName}.`,
      tokenNumber: result.newEntry.tokenNumber,
      entry: result.newEntry,
      queue: result.queue
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
