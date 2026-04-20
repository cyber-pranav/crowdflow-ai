import { Router, Request, Response } from 'express';
import { queueOptimizer } from '../services/queueOptimizer';
import { VendorType } from '../models/vendor';

export const queueRoutes = Router();

// GET /api/queue/rankings?userZone=zone-id&type=FOOD — Vendor rankings
queueRoutes.get('/rankings', (req: Request, res: Response) => {
  const userZone = req.query.userZone as string | undefined;
  const type = req.query.type as VendorType | undefined;

  const rankings = queueOptimizer.getRankings(userZone, type);
  res.json({
    rankings,
    timestamp: Date.now(),
    count: rankings.length,
  });
});

// GET /api/queue/all — All queue data
queueRoutes.get('/all', (_req: Request, res: Response) => {
  res.json({
    queues: queueOptimizer.getAllQueueData(),
    timestamp: Date.now(),
  });
});
