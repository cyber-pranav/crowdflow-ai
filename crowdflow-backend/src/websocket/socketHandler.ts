import { Server as SocketIOServer, Socket } from 'socket.io';
import { crowdDensityEngine } from '../services/crowdDensityEngine';
import { predictiveEngine } from '../services/predictiveEngine';
import { queueOptimizer } from '../services/queueOptimizer';
import { logger } from '../utils/logger';

export function setupSocketHandlers(io: SocketIOServer): void {
  io.on('connection', (socket: Socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Send initial state on connection
    socket.emit('density:update', crowdDensityEngine.generateHeatmapData());
    socket.emit('prediction:alert', predictiveEngine.getActiveAlerts());
    socket.emit('queue:update', queueOptimizer.getAllQueueData());

    // Handle user location reports
    socket.on('user:location', (data: { userId: string; zoneId: string }) => {
      // In production, this would update the user's actual location
      logger.debug(`Location update: ${data.userId} → ${data.zoneId}`);
    });

    // Handle route requests via WebSocket
    socket.on('route:request', (data: { from: string; to: string }) => {
      const { smartRouter } = require('../services/smartRouter');
      const result = smartRouter.findRoutes(data.from, data.to);
      socket.emit('route:result', result);
    });

    // Handle emergency route requests
    socket.on('emergency:request', (data: { from: string }) => {
      const { smartRouter } = require('../services/smartRouter');
      const result = smartRouter.findEmergencyRoute(data.from);
      socket.emit('emergency:route', result);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  logger.success('WebSocket handlers initialized');
}
