import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config, isProduction } from './config/environment';
import { crowdRoutes } from './routes/crowdRoutes';
import { routeRoutes } from './routes/routeRoutes';
import { queueRoutes } from './routes/queueRoutes';
import { assistantRoutes } from './routes/assistantRoutes';
import { simulationRoutes } from './routes/simulationRoutes';
import { setupSocketHandlers } from './websocket/socketHandler';
import { simulationService } from './services/simulationService';
import { firestoreSync } from './services/firestoreSync';
import { logger } from './utils/logger';

const app = express();
const httpServer = createServer(app);

// Allowed origins for CORS — restrict in production
const ALLOWED_ORIGINS = isProduction
  ? [
      'https://crowdflow-frontend.vercel.app',
      /\.vercel\.app$/,
    ]
  : '*';

// Socket.IO setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
  },
});

// ===================
// Middleware
// ===================
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Rate limiting — stricter for mutation endpoints
const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
});
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many write requests, please slow down.' },
});

app.use('/api/crowd', readLimiter);
app.use('/api/route', readLimiter);
app.use('/api/queue', readLimiter);
app.use('/api/simulation', writeLimiter);
app.use('/api/assistant', writeLimiter);

// ===================
// Routes
// ===================
app.get('/api/health', (_req, res) => {
  const firestoreStats = firestoreSync.getStats();
  res.json({
    status: 'ok',
    service: 'CrowdFlow AI Backend',
    version: '1.0.0',
    uptime: process.uptime(),
    simulation: simulationService.running ? 'active' : 'stopped',
    firestore: firestoreStats.isAvailable ? 'connected' : 'ephemeral',
    firestoreWrites: firestoreStats.writeCount,
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
      async (state) => {
        // Broadcast state to all connected clients
        const heatmap = require('./services/crowdDensityEngine').crowdDensityEngine.generateHeatmapData();
        io.emit('simulation:tick', state);
        io.emit('density:update', heatmap);

        if (state.tickCount % 5 === 0) {
          const alerts = require('./services/predictiveEngine').predictiveEngine.getActiveAlerts();
          const queues = require('./services/queueOptimizer').queueOptimizer.getAllQueueData();
          io.emit('prediction:alert', alerts);
          io.emit('queue:update', queues);

          // Persist to Firestore (non-blocking)
          firestoreSync.writeTick(heatmap, alerts, queues).catch(() => {});
        }
      }
    );
  }
});

export { app, io };
