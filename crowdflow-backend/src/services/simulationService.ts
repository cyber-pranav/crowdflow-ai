// ============================================================
// SIMULATION SERVICE — Crowd simulator for live demo
// ============================================================
// Spawns virtual users with realistic movement behaviors.
// Supports event triggers: halftime rush, exit surge, emergency.
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import { stadiumGraph, ZoneType, DensityLevel } from '../models/stadiumGraph';
import { crowdDensityEngine } from './crowdDensityEngine';
import { predictiveEngine } from './predictiveEngine';
import { queueOptimizer } from './queueOptimizer';
import { logger } from '../utils/logger';

export type UserBehavior = 'spectator' | 'foodseeker' | 'wanderer' | 'exiter' | 'emergency';

interface SimulatedUser {
  id: string;
  currentZone: string;
  targetZone: string | null;
  behavior: UserBehavior;
  speed: number;          // 0-1, movement probability per tick
  ticksAtZone: number;    // How many ticks spent at current zone
  maxTicksAtZone: number; // How long to stay before moving
}

export interface SimulationState {
  isRunning: boolean;
  userCount: number;
  tickCount: number;
  eventPhase: string;
  usersByZone: Record<string, number>;
  behaviors: Record<UserBehavior, number>;
}

export class SimulationService {
  private users: Map<string, SimulatedUser> = new Map();
  private isRunning = false;
  private tickInterval: NodeJS.Timeout | null = null;
  private tickCount = 0;
  private onTick: ((state: SimulationState) => void) | null = null;

  get running(): boolean { return this.isRunning; }

  /**
   * Start the crowd simulation
   */
  start(userCount: number, intervalMs: number, onTick?: (state: SimulationState) => void): void {
    if (this.isRunning) {
      logger.warn('Simulation already running');
      return;
    }

    this.onTick = onTick || null;
    this.spawnUsers(userCount);
    this.isRunning = true;
    this.tickCount = 0;

    this.tickInterval = setInterval(() => {
      this.tick();
    }, intervalMs);

    logger.success(`Simulation started with ${userCount} users, tick every ${intervalMs}ms`);
  }

  /**
   * Stop the simulation
   */
  stop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    this.isRunning = false;
    this.users.clear();

    // Reset all zone occupancies
    const zones = stadiumGraph.getAllZones();
    for (const zone of zones) {
      stadiumGraph.updateZoneOccupancy(zone.id, 0);
    }

    logger.info('Simulation stopped');
  }

  /**
   * Trigger special events
   */
  triggerEvent(event: 'halftime' | 'endgame' | 'emergency' | 'reset'): void {
    switch (event) {
      case 'halftime':
        logger.info('🔔 HALFTIME triggered — food rush incoming');
        predictiveEngine.setEventPhase('halftime');
        // Convert 40% of spectators to food seekers
        let converted = 0;
        for (const [_, user] of this.users) {
          if (user.behavior === 'spectator' && Math.random() < 0.4) {
            user.behavior = 'foodseeker';
            user.targetZone = this.getRandomZoneOfType(ZoneType.FOOD_COURT);
            user.maxTicksAtZone = 0; // Start moving immediately
            converted++;
          }
        }
        logger.info(`Converted ${converted} users to food seekers`);
        break;

      case 'endgame':
        logger.info('🏁 ENDGAME triggered — exit surge');
        predictiveEngine.setEventPhase('post-event');
        // Convert 70% to exiters
        for (const [_, user] of this.users) {
          if (Math.random() < 0.7) {
            user.behavior = 'exiter';
            user.targetZone = this.getRandomZoneOfType(ZoneType.GATE);
            user.maxTicksAtZone = 0;
          }
        }
        break;

      case 'emergency':
        logger.info('🚨 EMERGENCY triggered — all users evacuating');
        for (const [_, user] of this.users) {
          user.behavior = 'emergency';
          // Find nearest emergency exit or gate
          user.targetZone = this.getNearestExit(user.currentZone);
          user.speed = 0.9; // Everyone moves fast
          user.maxTicksAtZone = 0;
        }
        break;

      case 'reset':
        logger.info('🔄 Resetting simulation to normal');
        predictiveEngine.setEventPhase('first-half');
        for (const [_, user] of this.users) {
          user.behavior = 'spectator';
          user.targetZone = null;
          user.speed = 0.2 + Math.random() * 0.3;
        }
        break;
    }
  }

  /**
   * Get current simulation state
   */
  getState(): SimulationState {
    const usersByZone: Record<string, number> = {};
    const behaviors: Record<UserBehavior, number> = {
      spectator: 0, foodseeker: 0, wanderer: 0, exiter: 0, emergency: 0,
    };

    for (const [_, user] of this.users) {
      usersByZone[user.currentZone] = (usersByZone[user.currentZone] || 0) + 1;
      behaviors[user.behavior]++;
    }

    return {
      isRunning: this.isRunning,
      userCount: this.users.size,
      tickCount: this.tickCount,
      eventPhase: 'active',
      usersByZone,
      behaviors,
    };
  }

  /**
   * Simulation tick — move users, update engines
   */
  private tick(): void {
    this.tickCount++;

    // Move users
    for (const [_, user] of this.users) {
      this.moveUser(user);
    }

    // Build user location map
    const userLocations = new Map<string, string>();
    for (const [id, user] of this.users) {
      userLocations.set(id, user.currentZone);
    }

    // Update crowd density engine
    crowdDensityEngine.processLocationUpdates(userLocations);

    // Run predictions every 5 ticks
    if (this.tickCount % 5 === 0) {
      predictiveEngine.generatePredictions();
    }

    // Update queue simulation every 3 ticks
    if (this.tickCount % 3 === 0) {
      queueOptimizer.simulateQueueChanges();
    }

    // Callback
    if (this.onTick) {
      this.onTick(this.getState());
    }
  }

  /**
   * Move a single user based on their behavior
   */
  private moveUser(user: SimulatedUser): void {
    user.ticksAtZone++;

    // Check if user should stay at current zone
    if (user.ticksAtZone < user.maxTicksAtZone && user.behavior !== 'emergency') {
      return;
    }

    // Check if user should move (probability based on speed)
    if (Math.random() > user.speed) return;

    const neighbors = stadiumGraph.getNeighbors(user.currentZone);
    if (neighbors.length === 0) return;

    const oldZone = user.currentZone;

    switch (user.behavior) {
      case 'spectator':
        // Spectators mostly stay in stands, occasionally wander
        if (Math.random() < 0.05) {
          user.behavior = 'wanderer';
          user.maxTicksAtZone = 0;
        }
        break;

      case 'foodseeker':
        if (user.targetZone) {
          this.moveToward(user, user.targetZone);
          if (user.currentZone === user.targetZone) {
            user.maxTicksAtZone = 5 + Math.floor(Math.random() * 10); // Stay to eat
            user.ticksAtZone = 0;
            user.behavior = 'spectator';
            user.targetZone = this.getRandomZoneOfType(ZoneType.STAND);
          }
        }
        break;

      case 'wanderer':
        // Random walk, avoid critical zones
        const safeNeighbors = neighbors.filter(n => {
          const zone = stadiumGraph.getZone(n.nodeId);
          return zone && zone.densityLevel !== DensityLevel.CRITICAL;
        });
        const options = safeNeighbors.length > 0 ? safeNeighbors : neighbors;
        const chosen = options[Math.floor(Math.random() * options.length)];
        user.currentZone = chosen.nodeId;
        user.ticksAtZone = 0;
        user.maxTicksAtZone = 2 + Math.floor(Math.random() * 5);

        // Wanderers eventually go back to watching
        if (Math.random() < 0.15) {
          user.behavior = 'spectator';
          user.targetZone = this.getRandomZoneOfType(ZoneType.STAND);
        }
        break;

      case 'exiter':
        if (user.targetZone) {
          this.moveToward(user, user.targetZone);
          if (user.currentZone === user.targetZone) {
            // User has exited — remove after next tick
            this.users.delete(user.id);
          }
        }
        break;

      case 'emergency':
        if (user.targetZone) {
          this.moveToward(user, user.targetZone);
          if (user.currentZone === user.targetZone) {
            this.users.delete(user.id);
          }
        }
        break;
    }

    // Record movement for predictive engine
    if (oldZone !== user.currentZone) {
      predictiveEngine.recordMovement(user.id, oldZone, user.currentZone);
    }
  }

  /**
   * Move user one step toward a target zone (greedy best-first)
   */
  private moveToward(user: SimulatedUser, targetId: string): void {
    const neighbors = stadiumGraph.getNeighbors(user.currentZone);
    if (neighbors.length === 0) return;

    const target = stadiumGraph.getZone(targetId);
    if (!target) return;

    // Find neighbor closest to target
    let bestNeighbor = neighbors[0].nodeId;
    let bestDist = Infinity;

    for (const { nodeId } of neighbors) {
      const node = stadiumGraph.getZone(nodeId);
      if (!node) continue;

      const dx = node.position.x - target.position.x;
      const dy = node.position.y - target.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < bestDist) {
        bestDist = dist;
        bestNeighbor = nodeId;
      }
    }

    user.currentZone = bestNeighbor;
    user.ticksAtZone = 0;
  }

  /**
   * Spawn initial users across the stadium
   */
  private spawnUsers(count: number): void {
    this.users.clear();
    const stands = stadiumGraph.getZonesByType(ZoneType.STAND);
    const concourses = stadiumGraph.getZonesByType(ZoneType.CONCOURSE);
    const spawnZones = [...stands, ...concourses];

    for (let i = 0; i < count; i++) {
      // 70% in stands, 30% in concourses
      const zone = Math.random() < 0.7
        ? stands[Math.floor(Math.random() * stands.length)]
        : concourses[Math.floor(Math.random() * concourses.length)];

      const user: SimulatedUser = {
        id: uuidv4(),
        currentZone: zone.id,
        targetZone: null,
        behavior: Math.random() < 0.85 ? 'spectator' : 'wanderer',
        speed: 0.15 + Math.random() * 0.35,
        ticksAtZone: 0,
        maxTicksAtZone: 5 + Math.floor(Math.random() * 20),
      };

      this.users.set(user.id, user);
    }

    // Initial density update
    const locations = new Map<string, string>();
    for (const [id, user] of this.users) {
      locations.set(id, user.currentZone);
    }
    crowdDensityEngine.processLocationUpdates(locations);
  }

  private getRandomZoneOfType(type: ZoneType): string {
    const zones = stadiumGraph.getZonesByType(type);
    return zones[Math.floor(Math.random() * zones.length)]?.id || 'concourse-north';
  }

  private getNearestExit(fromZoneId: string): string {
    const exits = [
      ...stadiumGraph.getZonesByType(ZoneType.GATE),
      ...stadiumGraph.getZonesByType(ZoneType.EMERGENCY_EXIT),
    ];

    const from = stadiumGraph.getZone(fromZoneId);
    if (!from) return exits[0]?.id || 'gate-a';

    let nearest = exits[0];
    let nearestDist = Infinity;

    for (const exit of exits) {
      const dx = from.position.x - exit.position.x;
      const dy = from.position.y - exit.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = exit;
      }
    }

    return nearest.id;
  }
}

export const simulationService = new SimulationService();
