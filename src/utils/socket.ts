import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    // In dev or prod, connect to current host:port
    socket = io({
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('[Client Socket] Connected with ID:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Client Socket] Connection error:', err.message);
    });
  }

  return socket;
}

export function joinQueueRoom(doctorId: string) {
  const s = getSocket();
  s.emit('join:queue', doctorId);
}

export function leaveQueueRoom(doctorId: string) {
  const s = getSocket();
  s.emit('leave:queue', doctorId);
}

export function joinUserRoom(userId: string) {
  const s = getSocket();
  s.emit('join:user', userId);
}
