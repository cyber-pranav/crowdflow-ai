import { SimulationService } from '../src/services/simulationService';
import { stadiumGraph, DensityLevel, ZoneType } from '../src/models/stadiumGraph';

describe('SimulationService — Crowd Behavior Scenarios', () => {
  let sim: SimulationService;

  beforeEach(() => {
    sim = new SimulationService();
    const zones = stadiumGraph.getAllZones();
    zones.forEach(z => stadiumGraph.updateZoneOccupancy(z.id, 0));
  });

  afterEach(() => {
    sim.stop();
  });

  test('starts simulation with correct user count', () => {
    sim.start(100, 10000); // slow tick so it doesn't auto-fire
    const state = sim.getState();
    expect(state.isRunning).toBe(true);
    expect(state.userCount).toBe(100);
  });

  test('spawns users primarily in stands and concourses', () => {
    sim.start(200, 10000);
    const state = sim.getState();

    // Most users should be in stands (70%) or concourses (30%)
    const standZones = stadiumGraph.getZonesByType(ZoneType.STAND);
    const concourseZones = stadiumGraph.getZonesByType(ZoneType.CONCOURSE);
    const validZoneIds = [...standZones, ...concourseZones].map(z => z.id);

    let validUsers = 0;
    for (const [zoneId, count] of Object.entries(state.usersByZone)) {
      if (validZoneIds.includes(zoneId)) {
        validUsers += count;
      }
    }

    // All spawned users should be in stands or concourses
    expect(validUsers).toBe(200);
  });

  test('users have correct behavior distribution', () => {
    sim.start(500, 10000);
    const state = sim.getState();

    // ~85% spectators, ~15% wanderers at spawn
    expect(state.behaviors.spectator).toBeGreaterThan(state.behaviors.wanderer);
    expect(state.behaviors.spectator + state.behaviors.wanderer).toBe(500);
    expect(state.behaviors.foodseeker).toBe(0);
    expect(state.behaviors.exiter).toBe(0);
    expect(state.behaviors.emergency).toBe(0);
  });

  test('halftime converts spectators to food seekers', () => {
    sim.start(200, 10000);
    sim.triggerEvent('halftime');

    const state = sim.getState();
    // Some users should now be food seekers (~40% of spectators)
    expect(state.behaviors.foodseeker).toBeGreaterThan(0);
  });

  test('endgame converts users to exiters', () => {
    sim.start(200, 10000);
    sim.triggerEvent('endgame');

    const state = sim.getState();
    // ~70% should be exiters
    expect(state.behaviors.exiter).toBeGreaterThan(0);
    expect(state.behaviors.exiter).toBeGreaterThan(state.behaviors.spectator);
  });

  test('emergency makes all users evacuate', () => {
    sim.start(100, 10000);
    sim.triggerEvent('emergency');

    const state = sim.getState();
    expect(state.behaviors.emergency).toBe(100);
    expect(state.behaviors.spectator).toBe(0);
    expect(state.behaviors.wanderer).toBe(0);
  });

  test('reset restores all users to spectators', () => {
    sim.start(100, 10000);
    sim.triggerEvent('halftime');
    sim.triggerEvent('reset');

    const state = sim.getState();
    expect(state.behaviors.spectator).toBe(100);
    expect(state.behaviors.foodseeker).toBe(0);
    expect(state.behaviors.exiter).toBe(0);
  });

  test('stop clears all users and resets zones', () => {
    sim.start(100, 10000);
    sim.stop();

    const state = sim.getState();
    expect(state.isRunning).toBe(false);
    expect(state.userCount).toBe(0);

    // All zones should be empty
    const zones = stadiumGraph.getAllZones();
    for (const zone of zones) {
      expect(zone.currentOccupancy).toBe(0);
    }
  });

  test('prevents double-start', () => {
    sim.start(100, 10000);
    sim.start(200, 10000); // Should be ignored

    const state = sim.getState();
    expect(state.userCount).toBe(100); // Original count preserved
  });
});
