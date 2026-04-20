import { Router, Request, Response } from 'express';
import { simulationService } from '../services/simulationService';
import { predictiveEngine } from '../services/predictiveEngine';

export const simulationRoutes = Router();

// POST /api/simulation/start — Start crowd simulation
simulationRoutes.post('/start', (req: Request, res: Response) => {
  const { userCount = 500, tickInterval = 2000 } = req.body;

  if (simulationService.running) {
    return res.status(400).json({ error: 'Simulation already running' });
  }

  simulationService.start(userCount, tickInterval);
  res.json({ status: 'started', userCount, tickInterval });
});

// POST /api/simulation/stop — Stop simulation
simulationRoutes.post('/stop', (_req: Request, res: Response) => {
  simulationService.stop();
  res.json({ status: 'stopped' });
});

// POST /api/simulation/trigger/:event — Trigger special events
simulationRoutes.post('/trigger/:event', (req: Request, res: Response) => {
  const event = req.params.event as 'halftime' | 'endgame' | 'emergency' | 'reset';
  const validEvents = ['halftime', 'endgame', 'emergency', 'reset'];

  if (!validEvents.includes(event)) {
    return res.status(400).json({ error: `Invalid event. Valid: ${validEvents.join(', ')}` });
  }

  simulationService.triggerEvent(event);
  res.json({ status: 'triggered', event });
});

// GET /api/simulation/state — Current simulation state
simulationRoutes.get('/state', (_req: Request, res: Response) => {
  res.json(simulationService.getState());
});

// GET /api/simulation/predictions — Current predictions
simulationRoutes.get('/predictions', (_req: Request, res: Response) => {
  const alerts = predictiveEngine.getActiveAlerts();
  const exitPredictions = predictiveEngine.generateExitPredictions();
  res.json({ alerts, exitPredictions });
});
