import { Router, Request, Response } from 'express';
import { smartRouter } from '../services/smartRouter';
import { isValidZoneId } from '../utils/validators';

export const routeRoutes = Router();

// GET /api/route/find?from=zone-id&to=zone-id — Find routes
routeRoutes.get('/find', (req: Request, res: Response) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: 'Missing required params: from, to' });
  }

  if (!isValidZoneId(from)) {
    return res.status(400).json({ error: `Invalid zone: '${from}'. Use /api/crowd/stadium for valid zone IDs.` });
  }

  if (!isValidZoneId(to)) {
    return res.status(400).json({ error: `Invalid zone: '${to}'. Use /api/crowd/stadium for valid zone IDs.` });
  }

  const result = smartRouter.findRoutes(from, to);

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

  if (!isValidZoneId(from)) {
    return res.status(400).json({ error: `Invalid zone: '${from}'. Use /api/crowd/stadium for valid zone IDs.` });
  }

  const result = smartRouter.findEmergencyRoute(from);
  res.json(result);
});
