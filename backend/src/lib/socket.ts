import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { corsAllowList } from '../config/cors.config.js';
import { verifyToken } from '../modules/auth/token.js';
import { logger } from './logger.js';

let io: Server | undefined;

/** Socket.IO for live dashboard updates. Clients authenticate with the same JWT as the API. */
export function initSocket(server: HttpServer) {
  io = new Server(server, { cors: { origin: corsAllowList, credentials: true } });
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (token && verifyToken(token)) return next();
    next(new Error('Unauthorized'));
  });
  io.on('connection', (socket) => logger.debug({ id: socket.id }, 'socket connected'));
  return io;
}

export function emitSocket(event: string, payload: unknown) {
  io?.emit(event, payload);
}
