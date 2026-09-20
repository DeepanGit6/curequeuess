import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { QueueService } from '../services/queueService.js';
import { db } from '../services/db.js';

let ioInstance: SocketIOServer | null = null;

export function initSocketIO(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE']
    }
  });

  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join doctor queue room
    socket.on('join:queue', (doctorId: string) => {
      socket.join(`queue:${doctorId}`);
      console.log(`[Socket.IO] ${socket.id} joined room queue:${doctorId}`);

      // Send initial queue state immediately
      const queue = db.getQueueByDoctorId(doctorId);
      if (queue) {
        socket.emit('queue:updated', queue);
      }
    });

    // Join patient user room for personal notifications
    socket.on('join:user', (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`[Socket.IO] ${socket.id} joined user:${userId}`);
    });

    // Leave queue room
    socket.on('leave:queue', (doctorId: string) => {
      socket.leave(`queue:${doctorId}`);
    });

    // Real-time Call Next Patient event from doctor console
    socket.on('queue:callNext', ({ doctorId }: { doctorId: string }) => {
      try {
        const result = QueueService.callNext(doctorId);
        io.to(`queue:${doctorId}`).emit('queue:updated', result.queue);
        io.emit('telemetry:updated', { doctorId, status: result.doctorStats });

        if (result.calledEntry) {
          io.to(`queue:${doctorId}`).emit('token:called', {
            tokenNumber: result.calledEntry.tokenNumber,
            room: result.queue.doctor?.roomNumber || 'Room 3B',
            patientName: result.calledEntry.patient?.user?.name || 'Next Patient'
          });
        }
      } catch (err: any) {
        socket.emit('error', { message: err.message });
      }
    });

    // Real-time Token Delay
    socket.on('queue:delayToken', ({ doctorId, tokenNumber }: { doctorId: string; tokenNumber: string }) => {
      try {
        const updatedQueue = QueueService.delayToken(doctorId, tokenNumber, 2);
        io.to(`queue:${doctorId}`).emit('queue:updated', updatedQueue);
      } catch (err: any) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

export function broadcastQueueUpdate(doctorId: string, queueData: any) {
  if (ioInstance) {
    ioInstance.to(`queue:${doctorId}`).emit('queue:updated', queueData);
    ioInstance.emit('global:queueSync', { doctorId, timestamp: new Date().toISOString() });
  }
}

export function broadcastTokenChime(tokenNumber: string, room: string, patientName: string) {
  if (ioInstance) {
    ioInstance.emit('token:chime', { tokenNumber, room, patientName, timestamp: new Date().toISOString() });
  }
}
