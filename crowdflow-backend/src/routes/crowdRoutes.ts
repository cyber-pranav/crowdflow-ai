import { Router, Request, Response } from 'express';
import { crowdDensityEngine } from '../services/crowdDensityEngine';
import { stadiumGraph } from '../models/stadiumGraph';

export const crowdRoutes = Router();

// GET /api/crowd/density — Current density map for all zones
crowdRoutes.get('/density', (_req: Request, res: Response) => {
  const heatmap = crowdDensityEngine.generateHeatmapData();
  res.json(heatmap);
});

// GET /api/crowd/heatmap — Heatmap data optimized for visualization
crowdRoutes.get('/heatmap', (_req: Request, res: Response) => {
  const heatmap = crowdDensityEngine.generateHeatmapData();
  res.json({
    zones: heatmap.zones.map(z => ({
      id: z.zoneId,
      name: z.zoneName,
      density: z.densityLevel,
      percent: z.occupancyPercent,
      color: z.color,
      trend: z.trend,
    })),
    hotspots: heatmap.hotspots,
    overall: heatmap.overallDensity,
    timestamp: heatmap.timestamp,
  });
});

// GET /api/crowd/zone/:id — Specific zone density
crowdRoutes.get('/zone/:id', (req: Request, res: Response) => {
  const data = crowdDensityEngine.getZoneDensity(req.params.id);
  if (!data) {
    return res.status(404).json({ error: 'Zone not found' });
  }
  res.json(data);
});

// GET /api/crowd/hotspots — Current high-density zones
crowdRoutes.get('/hotspots', (_req: Request, res: Response) => {
  res.json(crowdDensityEngine.getHotspots());
});

// GET /api/crowd/stadium — Full stadium state
crowdRoutes.get('/stadium', (_req: Request, res: Response) => {
  res.json(stadiumGraph.getSerializableState());
});
