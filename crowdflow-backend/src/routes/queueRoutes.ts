import { Router, Request, Response } from 'express';
import { queueOptimizer } from '../services/queueOptimizer';
import { VendorType } from '../models/vendor';
import { isValidZoneId, isValidVendorType } from '../utils/validators';

export const queueRoutes = Router();

// GET /api/queue/rankings?userZone=zone-id&type=FOOD — Vendor rankings
queueRoutes.get('/rankings', (req: Request, res: Response) => {
  const { userZone, type } = req.query;

  // Validate optional userZone
  if (userZone && !isValidZoneId(userZone)) {
    return res.status(400).json({ error: `Invalid userZone: '${userZone}'` });
  }

  // Validate optional vendor type
  if (type && !isValidVendorType(type)) {
    return res.status(400).json({
      error: `Invalid type: '${type}'. Valid types: ${Object.values(VendorType).join(', ')}`,
    });
  }

  const rankings = queueOptimizer.getRankings(
    userZone as string | undefined,
    type as VendorType | undefined,
  );

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
