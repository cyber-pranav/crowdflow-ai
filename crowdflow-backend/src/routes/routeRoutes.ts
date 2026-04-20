import { Router, Request, Response } from 'express';
import { smartRouter } from '../services/smartRouter';

export const routeRoutes = Router();

// GET /api/route/find?from=zone-id&to=zone-id — Find routes
routeRoutes.get('/find', (req: Request, res: Response) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: 'Missing required params: from, to' });
  }

  const result = smartRouter.findRoutes(from as string, to as string);

  if (result.routes.length === 0) {
    return res.status(404).json({ error: 'No route found between the specified zones' });
  }

  res.json(result);
});

// GET /api/route/emergency?from=zone-id — Emergency exit route
routeRoutes.get('/emergency', (req: Request, res: Response) => {
  const { from } = req.query;

  if (!from) {
    return res.status(400).json({ error: 'Missing required param: from' });
  }

  const result = smartRouter.findEmergencyRoute(from as string);
  res.json(result);
});
