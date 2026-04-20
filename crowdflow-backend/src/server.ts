import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/environment';
import { crowdRoutes } from './routes/crowdRoutes';
import { routeRoutes } from './routes/routeRoutes';
import { queueRoutes } from './routes/queueRoutes';
import { assistantRoutes } from './routes/assistantRoutes';
import { simulationRoutes } from './routes/simulationRoutes';
import { setupSocketHandlers } from './websocket/socketHandler';
import { simulationService } from './services/simulationService';
import { logger } from './utils/logger';

const app = express();
const httpServer = createServer(app);

// Socket.IO setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// ===================
// Middleware
// ===================
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ===================
// Routes
// ===================
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'CrowdFlow AI Backend',
    version: '1.0.0',
    uptime: process.uptime(),
    simulation: simulationService.running ? 'active' : 'stopped',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/crowd', crowdRoutes);
app.use('/api/route', routeRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/simulation', simulationRoutes);

// ===================
// WebSocket
// ===================
setupSocketHandlers(io);

// ===================
// Start Server
// ===================
httpServer.listen(config.port, () => {
  logger.success(`CrowdFlow AI Backend running on http://localhost:${config.port}`);
  logger.info(`WebSocket server ready`);
  logger.info(`API docs: http://localhost:${config.port}/api/health`);

  // Auto-start simulation
  {
    logger.info(`Starting simulation with ${config.simulation.userCount} users...`);
    simulationService.start(
      config.simulation.userCount,
      config.simulation.tickInterval,
      (state) => {
        // Broadcast state to all connected clients
        io.emit('simulation:tick', state);
        io.emit('density:update', require('./services/crowdDensityEngine').crowdDensityEngine.generateHeatmapData());

        if (state.tickCount % 5 === 0) {
          io.emit('prediction:alert', require('./services/predictiveEngine').predictiveEngine.getActiveAlerts());
          io.emit('queue:update', require('./services/queueOptimizer').queueOptimizer.getAllQueueData());
        }
      }
    );
  }
});

export { app, io };
