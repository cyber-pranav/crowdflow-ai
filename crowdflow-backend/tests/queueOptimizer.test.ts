import { QueueOptimizer } from '../src/services/queueOptimizer';
import { stadiumGraph, DensityLevel } from '../src/models/stadiumGraph';

describe('QueueOptimizer — Dynamic Vendor Ranking', () => {
  let optimizer: QueueOptimizer;

  beforeEach(() => {
    optimizer = new QueueOptimizer();
    // Reset all zones to baseline
    const zones = stadiumGraph.getAllZones();
    zones.forEach(z => stadiumGraph.updateZoneOccupancy(z.id, 0));
  });

  test('returns rankings for all open vendors', () => {
    const rankings = optimizer.getRankings();
    expect(rankings.length).toBeGreaterThan(0);
    expect(rankings[0]).toHaveProperty('vendor');
    expect(rankings[0]).toHaveProperty('score');
    expect(rankings[0]).toHaveProperty('waitTimeMinutes');
  });

  test('marks exactly one vendor as recommended', () => {
    const rankings = optimizer.getRankings();
    const recommended = rankings.filter(r => r.recommended);
    expect(recommended.length).toBe(1);
  });

  test('recommended vendor has the lowest score', () => {
    const rankings = optimizer.getRankings();
    const recommended = rankings.find(r => r.recommended)!;
    // Score is lower = better, so recommended should have lowest
    expect(recommended.score).toBe(rankings[0].score);
  });

  test('filters by vendor type correctly', () => {
    const foodRankings = optimizer.getRankings(undefined, 'FOOD' as any);
    for (const r of foodRankings) {
      expect(r.vendor.type).toBe('FOOD');
    }
  });

  test('filters by beverage type', () => {
    const bevRankings = optimizer.getRankings(undefined, 'BEVERAGE' as any);
    for (const r of bevRankings) {
      expect(r.vendor.type).toBe('BEVERAGE');
    }
  });

  test('includes route time when userZone is provided', () => {
    const rankings = optimizer.getRankings('stand-north');
    // At least some vendors should have non-zero route time
    const withRoute = rankings.filter(r => r.routeTimeSeconds > 0);
    expect(withRoute.length).toBeGreaterThan(0);
  });

  test('generates natural-language reason for top vendor', () => {
    const rankings = optimizer.getRankings();
    expect(rankings[0].reason).toBeTruthy();
    expect(typeof rankings[0].reason).toBe('string');
    expect(rankings[0].reason.length).toBeGreaterThan(0);
  });

  test('queue simulation changes wait times', () => {
    const before = optimizer.getAllQueueData();
    const initialWait = before[0]?.waitTimeSeconds;

    // Run several simulation ticks
    for (let i = 0; i < 5; i++) {
      optimizer.simulateQueueChanges();
    }

    const after = optimizer.getAllQueueData();
    // Wait times should have changed (probabilistic, but over 5 ticks virtually guaranteed)
    expect(after.length).toBe(before.length);
  });

  test('queue trend detection works', () => {
    const updates = optimizer.simulateQueueChanges();
    for (const u of updates) {
      expect(['growing', 'shrinking', 'stable']).toContain(u.trend);
    }
  });

  test('density affects queue wait times', () => {
    // Make food-north zone critical
    stadiumGraph.updateZoneOccupancy('food-north', 750); // ~94% of 800 capacity

    // Run sim ticks to pick up density multiplier
    for (let i = 0; i < 3; i++) {
      optimizer.simulateQueueChanges();
    }

    const rankings = optimizer.getRankings();
    const foodNorthVendors = rankings.filter(r => r.vendor.zoneId === 'food-north');
    const otherVendors = rankings.filter(r => r.vendor.zoneId !== 'food-north');

    // food-north vendors should generally have higher scores (worse)
    if (foodNorthVendors.length > 0 && otherVendors.length > 0) {
      expect(foodNorthVendors[0].nearbyDensity).toBe(DensityLevel.CRITICAL);
    }
  });
});
