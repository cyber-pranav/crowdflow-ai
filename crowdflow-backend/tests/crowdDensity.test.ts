import { CrowdDensityEngine } from '../src/services/crowdDensityEngine';
import { stadiumGraph, DensityLevel } from '../src/models/stadiumGraph';

describe('CrowdDensityEngine — Heatmap Brain', () => {
  const engine = new CrowdDensityEngine();

  beforeEach(() => {
    const zones = stadiumGraph.getAllZones();
    zones.forEach(z => stadiumGraph.updateZoneOccupancy(z.id, 0));
  });

  test('generates heatmap data', () => {
    const heatmap = engine.generateHeatmapData();
    expect(heatmap.zones.length).toBeGreaterThan(0);
    expect(heatmap).toHaveProperty('totalUsers');
    expect(heatmap).toHaveProperty('overallDensity');
    expect(heatmap).toHaveProperty('timestamp');
  });

  test('processes user locations into zone densities', () => {
    const locations = new Map<string, string>();
    for (let i = 0; i < 100; i++) {
      locations.set(`user-${i}`, 'stand-north');
    }

    const heatmap = engine.processLocationUpdates(locations);
    const northStand = heatmap.zones.find(z => z.zoneId === 'stand-north');

    expect(northStand).toBeDefined();
    expect(northStand!.currentOccupancy).toBe(100);
    expect(northStand!.occupancyPercent).toBe(2); // 100/5000
  });

  test('classifies density levels correctly', () => {
    // LOW: < 30%
    stadiumGraph.updateZoneOccupancy('stand-north', 1000); // 20%
    let zone = stadiumGraph.getZone('stand-north')!;
    expect(zone.densityLevel).toBe(DensityLevel.LOW);

    // MEDIUM: 30-60%
    stadiumGraph.updateZoneOccupancy('stand-north', 2000); // 40%
    zone = stadiumGraph.getZone('stand-north')!;
    expect(zone.densityLevel).toBe(DensityLevel.MEDIUM);

    // HIGH: 60-85%
    stadiumGraph.updateZoneOccupancy('stand-north', 3500); // 70%
    zone = stadiumGraph.getZone('stand-north')!;
    expect(zone.densityLevel).toBe(DensityLevel.HIGH);

    // CRITICAL: > 85%
    stadiumGraph.updateZoneOccupancy('stand-north', 4500); // 90%
    zone = stadiumGraph.getZone('stand-north')!;
    expect(zone.densityLevel).toBe(DensityLevel.CRITICAL);
  });

  test('detects hotspots', () => {
    stadiumGraph.updateZoneOccupancy('food-north', 600); // 75% of 800
    const hotspots = engine.getHotspots();
    expect(hotspots.some(h => h.zoneId === 'food-north')).toBe(true);
  });

  test('zone density returns null for invalid zone', () => {
    const result = engine.getZoneDensity('nonexistent-zone');
    expect(result).toBeNull();
  });
});
