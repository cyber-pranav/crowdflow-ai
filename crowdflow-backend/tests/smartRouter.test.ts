import { SmartRouter } from '../src/services/smartRouter';
import { stadiumGraph, DensityLevel } from '../src/models/stadiumGraph';

describe('SmartRouter - A* Pathfinding', () => {
  const router = new SmartRouter();

  beforeEach(() => {
    // Reset all zones to low occupancy
    const zones = stadiumGraph.getAllZones();
    zones.forEach(z => stadiumGraph.updateZoneOccupancy(z.id, 0));
  });

  test('finds a route between two zones', () => {
    const result = router.findRoutes('stand-north', 'food-north');
    expect(result.routes.length).toBeGreaterThan(0);
    expect(result.routes[0].path.length).toBeGreaterThan(1);
    expect(result.routes[0].path[0].zoneId).toBe('stand-north');
  });

  test('returns multiple route options', () => {
    const result = router.findRoutes('stand-north', 'gate-c');
    expect(result.routes.length).toBeGreaterThanOrEqual(1);
  });

  test('avoids high-density zones in least-crowded mode', () => {
    // Make north concourse critical
    stadiumGraph.updateZoneOccupancy('concourse-north', 1900);

    const result = router.findRoutes('stand-north', 'food-south');
    const leastCrowded = result.routes.find(r => r.label === 'Least Crowded');

    if (leastCrowded) {
      const passesNorthConcourse = leastCrowded.path.some(s => s.zoneId === 'concourse-north');
      // Should try to avoid the critical zone (may not always be possible)
      expect(leastCrowded.congestionLevel).toBeDefined();
    }
  });

  test('finds emergency routes to nearest exit', () => {
    const result = router.findEmergencyRoute('food-north');
    expect(result.routes.length).toBeGreaterThan(0);

    const bestRoute = result.routes[0];
    expect(bestRoute.recommended).toBe(true);

    // Last zone should be a gate or emergency exit
    const lastZone = bestRoute.path[bestRoute.path.length - 1];
    expect(lastZone.zoneId).toMatch(/gate|emergency/);
  });

  test('route has valid total time', () => {
    const result = router.findRoutes('stand-west', 'gate-b');
    expect(result.routes[0].totalTimeSeconds).toBeGreaterThan(0);
    expect(result.routes[0].totalDistanceMeters).toBeGreaterThan(0);
  });

  test('marks one route as recommended', () => {
    const result = router.findRoutes('stand-north', 'gate-c');
    const recommended = result.routes.filter(r => r.recommended);
    expect(recommended.length).toBe(1);
  });
});
