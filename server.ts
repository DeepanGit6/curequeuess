import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

import authRoutes from './server/src/routes/auth.js';
import doctorsRoutes from './server/src/routes/doctors.js';
import appointmentsRoutes from './server/src/routes/appointments.js';
import queuesRoutes from './server/src/routes/queues.js';
import departmentsRoutes from './server/src/routes/departments.js';
import patientsRoutes from './server/src/routes/patients.js';
import consultationsRoutes from './server/src/routes/consultations.js';
import adminRoutes from './server/src/routes/admin.js';
import notificationsRoutes from './server/src/routes/notifications.js';
import hospitalsRoutes from './server/src/routes/hospitals.js';
import { initSocketIO } from './server/src/socket/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = http.createServer(app);

  // Initialize Socket.IO on the same HTTP server
  initSocketIO(httpServer);

  // Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Health Check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      system: 'CuraQueue Clinical OS API',
      timestamp: new Date().toISOString()
    });
  });

  // REST API Endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/doctors', doctorsRoutes);
  app.use('/api/appointments', appointmentsRoutes);
  app.use('/api/queues', queuesRoutes);
  app.use('/api/departments', departmentsRoutes);
  app.use('/api/patients', patientsRoutes);
  app.use('/api/consultations', consultationsRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/hospitals', hospitalsRoutes);

  // Serve Frontend via Vite Middleware in Dev, or static in Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[CuraQueue Server] Running on http://0.0.0.0:${PORT} with Socket.IO enabled`);
  });
}

startServer().catch((err) => {
  console.error('[CuraQueue Server] Startup failure:', err);
});
