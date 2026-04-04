import { io } from 'socket.io-client';
import { tokenStorage } from './apiClient';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(`${SOCKET_URL}/chat`, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      auth: { token: tokenStorage.getAccess() },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
    });

    socket.on('connect',        () => console.log('🔌 Chat socket connected'));
    socket.on('disconnect',     () => console.log('🔌 Chat socket disconnected'));
    socket.on('connect_error',  e  => console.warn('Socket error:', e.message));
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  s.auth = { token: tokenStorage.getAccess() };
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}

export function emitSocket(event, data) {
  const s = getSocket();
  if (s.connected) s.emit(event, data);
}
