import { Router, Request, Response } from 'express';
import { db } from '../services/db.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { userId } = req.query;
  let list = db.notifications;

  if (userId) {
    const user = db.users.find((u) => u.id === userId);
    const patient = db.patients.find((p) => p.userId === userId || p.id === userId);
    list = list.filter(
      (n) =>
        n.userId === userId ||
        (patient && n.userId === patient.id) ||
        (user && user.role === 'PATIENT' && (n.userId === 'user-pat-jonathan' || n.type === 'APPOINTMENT_CONFIRMED'))
    );
  }

  return res.json(list);
});

router.patch('/:id/read', (req: Request, res: Response) => {
  const notif = db.notifications.find((n) => n.id === req.params.id);
  if (notif) {
    notif.isRead = true;
  }
  return res.json({ success: true, notif });
});

router.post('/mark-all-read', (req: Request, res: Response) => {
  const { userId } = req.body;
  db.notifications.forEach((n) => {
    if (!userId || n.userId === userId) {
      n.isRead = true;
    }
  });
  return res.json({ success: true });
});

export default router;
