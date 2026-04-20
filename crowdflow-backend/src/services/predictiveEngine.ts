// ============================================================
// PREDICTIVE ENGINE — Congestion forecasting
// ============================================================
// Tracks movement velocity vectors, identifies time-based patterns
// (halftime rush, exit surge), and predicts future congestion.
// ============================================================

import { stadiumGraph, DensityLevel, ZoneType } from '../models/stadiumGraph';
import { logger } from '../utils/logger';

export interface PredictionAlert {
  id: string;
  zoneId: string;
  zoneName: string;
  predictedDensity: DensityLevel;
  currentDensity: DensityLevel;
  timeUntilMinutes: number;
  confidence: number;          // 0-1
  reason: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: number;
  expiresAt: number;
}

export interface ExitPrediction {
  gateId: string;
  gateName: string;
  currentWaitMinutes: number;
  predictedWaitMinutes: number;
  optimalDepartureMinutes: number;
  recommendation: string;
}

interface MovementVector {
  userId: string;
  fromZone: string;
  toZone: string;
  timestamp: number;
}

interface ZoneSnapshot {
  zoneId: string;
  occupancy: number;
  timestamp: number;
}

export class PredictiveEngine {
  private movementVectors: MovementVector[] = [];
  private zoneSnapshots: Map<string, ZoneSnapshot[]> = new Map();
  private activeAlerts: Map<string, PredictionAlert> = new Map();
  private alertIdCounter = 0;
  private eventPhase: 'pre-event' | 'first-half' | 'halftime' | 'second-half' | 'post-event' = 'first-half';

  /**
   * Record a user movement between zones
   */
  recordMovement(userId: string, fromZone: string, toZone: string): void {
    this.movementVectors.push({
      userId, fromZone, toZone, timestamp: Date.now(),
    });

    // Keep last 5 minutes of movement data
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    this.movementVectors = this.movementVectors.filter(v => v.timestamp > fiveMinAgo);
  }

  /**
   * Take a snapshot of current zone states for trend analysis
   */
  takeSnapshot(): void {
    const zones = stadiumGraph.getAllZones();
    const now = Date.now();

    for (const zone of zones) {
      const snapshots = this.zoneSnapshots.get(zone.id) || [];
      snapshots.push({ zoneId: zone.id, occupancy: zone.currentOccupancy, timestamp: now });

      // Keep last 10 minutes of snapshots
      const tenMinAgo = now - 10 * 60 * 1000;
      const filtered = snapshots.filter(s => s.timestamp > tenMinAgo);
      this.zoneSnapshots.set(zone.id, filtered);
    }
  }

  /**
   * Set the current event phase (impacts predictions)
   */
  setEventPhase(phase: typeof this.eventPhase): void {
    this.eventPhase = phase;
    logger.info(`Event phase changed to: ${phase}`);
  }

  /**
   * Run all prediction algorithms and return alerts
   */
  generatePredictions(): PredictionAlert[] {
    this.takeSnapshot();
    const newAlerts: PredictionAlert[] = [];

    // 1. Velocity-based congestion prediction
    newAlerts.push(...this.predictFromMovementVectors());

    // 2. Time-based pattern predictions
    newAlerts.push(...this.predictFromEventPhase());

    // 3. Trend-based predictions (rising occupancy)
    newAlerts.push(...this.predictFromTrends());

    // Store active alerts
    for (const alert of newAlerts) {
      this.activeAlerts.set(alert.id, alert);
    }

    // Clean expired alerts
    const now = Date.now();
    for (const [id, alert] of this.activeAlerts) {
      if (alert.expiresAt < now) {
        this.activeAlerts.delete(id);
      }
    }

    return Array.from(this.activeAlerts.values());
  }

  /**
   * Predict congestion from movement vectors
   * Logic: If N users are moving toward Zone A, predict congestion
   */
  private predictFromMovementVectors(): PredictionAlert[] {
    const alerts: PredictionAlert[] = [];
    const twoMinAgo = Date.now() - 2 * 60 * 1000;
    const recentMovements = this.movementVectors.filter(v => v.timestamp > twoMinAgo);

    // Count incoming movements per zone
    const incomingCounts = new Map<string, number>();
    for (const mv of recentMovements) {
      incomingCounts.set(mv.toZone, (incomingCounts.get(mv.toZone) || 0) + 1);
    }

    for (const [zoneId, incomingCount] of incomingCounts) {
      const zone = stadiumGraph.getZone(zoneId);
      if (!zone) continue;

      const projectedOccupancy = zone.currentOccupancy + incomingCount;
      const projectedRatio = projectedOccupancy / zone.capacity;

      if (projectedRatio > 0.6 && zone.densityLevel !== DensityLevel.HIGH && zone.densityLevel !== DensityLevel.CRITICAL) {
        const predictedDensity = projectedRatio > 0.85 ? DensityLevel.CRITICAL : DensityLevel.HIGH;
        const confidence = Math.min(0.95, 0.5 + (incomingCount / 50) * 0.45);

        alerts.push(this.createAlert(
          zoneId, zone.name,
          predictedDensity, zone.densityLevel,
          Math.max(2, Math.round(8 - (incomingCount / 20) * 5)),
          confidence,
          `${incomingCount} users moving toward this zone in the last 2 minutes`,
          predictedDensity === DensityLevel.CRITICAL ? 'critical' : 'warning'
        ));
      }
    }

    return alerts;
  }

  /**
   * Predict based on event phase (halftime rushes, exit surges)
   */
  private predictFromEventPhase(): PredictionAlert[] {
    const alerts: PredictionAlert[] = [];

    if (this.eventPhase === 'halftime') {
      // Predict food court surge
      const foodCourts = stadiumGraph.getZonesByType(ZoneType.FOOD_COURT);
      for (const fc of foodCourts) {
        if (fc.densityLevel === DensityLevel.LOW || fc.densityLevel === DensityLevel.MEDIUM) {
          alerts.push(this.createAlert(
            fc.id, fc.name,
            DensityLevel.HIGH, fc.densityLevel,
            3, 0.88,
            'Halftime rush — food courts typically surge during breaks',
            'warning'
          ));
        }
      }

      // Predict restroom surge
      const restrooms = stadiumGraph.getZonesByType(ZoneType.RESTROOM);
      for (const rr of restrooms) {
        if (rr.densityLevel !== DensityLevel.CRITICAL) {
          alerts.push(this.createAlert(
            rr.id, rr.name,
            DensityLevel.HIGH, rr.densityLevel,
            2, 0.92,
            'Halftime rush — restrooms fill quickly during breaks',
            'warning'
          ));
        }
      }
    }

    if (this.eventPhase === 'post-event') {
      // Predict exit surge
      const exits = [
        ...stadiumGraph.getZonesByType(ZoneType.GATE),
        ...stadiumGraph.getZonesByType(ZoneType.EXIT),
      ];
      for (const exit of exits) {
        alerts.push(this.createAlert(
          exit.id, exit.name,
          DensityLevel.CRITICAL, exit.densityLevel,
          5, 0.95,
          'Post-event exit surge — all gates will be heavily congested',
          'critical'
        ));
      }
    }

    return alerts;
  }

  /**
   * Predict based on occupancy trends (rising occupancy patterns)
   */
  private predictFromTrends(): PredictionAlert[] {
    const alerts: PredictionAlert[] = [];

    for (const [zoneId, snapshots] of this.zoneSnapshots) {
      if (snapshots.length < 4) continue;

      const zone = stadiumGraph.getZone(zoneId);
      if (!zone) continue;

      // Calculate rate of change over recent snapshots
      const recent = snapshots.slice(-4);
      const rateOfChange = (recent[recent.length - 1].occupancy - recent[0].occupancy) /
                           ((recent[recent.length - 1].timestamp - recent[0].timestamp) / 60000); // per minute

      if (rateOfChange > 20 && zone.densityLevel !== DensityLevel.CRITICAL) {
        const minutesToHigh = zone.capacity * 0.7 - zone.currentOccupancy;
        const eta = Math.max(1, Math.round(minutesToHigh / rateOfChange));

        if (eta <= 15) {
          alerts.push(this.createAlert(
            zoneId, zone.name,
            DensityLevel.HIGH, zone.densityLevel,
            eta, Math.min(0.85, 0.5 + rateOfChange / 100),
            `Occupancy rising at ${Math.round(rateOfChange)} users/minute`,
            'warning'
          ));
        }
      }
    }

    return alerts;
  }

  /**
   * Generate exit predictions for Predictive Exit Mode
   */
  generateExitPredictions(): ExitPrediction[] {
    const gates = stadiumGraph.getZonesByType(ZoneType.GATE);

    return gates.map(gate => {
      const currentRatio = gate.currentOccupancy / gate.capacity;
      const currentWait = Math.round(currentRatio * 20); // 0-20 min range

      let predictedWait = currentWait;
      let optimalDeparture = 0;

      if (this.eventPhase === 'second-half') {
        predictedWait = Math.round(currentWait * 2.5); // Expect surge
        optimalDeparture = 10; // Leave 10 min before end
      } else if (this.eventPhase === 'post-event') {
        predictedWait = Math.round(currentWait * 3);
        optimalDeparture = -5; // Should have left 5 min ago
      }

      const recommendation = optimalDeparture > 0
        ? `Leave in ${optimalDeparture} minutes to avoid a ${predictedWait}-minute delay`
        : optimalDeparture < 0
          ? `Gate is congested. Consider ${gate.name} alternative routes.`
          : `Good time to exit via ${gate.name}`;

      return {
        gateId: gate.id,
        gateName: gate.name,
        currentWaitMinutes: currentWait,
        predictedWaitMinutes: predictedWait,
        optimalDepartureMinutes: optimalDeparture,
        recommendation,
      };
    });
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): PredictionAlert[] {
    return Array.from(this.activeAlerts.values())
      .sort((a, b) => b.confidence - a.confidence);
  }

  private createAlert(
    zoneId: string, zoneName: string,
    predictedDensity: DensityLevel, currentDensity: DensityLevel,
    timeUntilMinutes: number, confidence: number,
    reason: string, severity: 'info' | 'warning' | 'critical'
  ): PredictionAlert {
    const id = `alert-${++this.alertIdCounter}`;
    return {
      id, zoneId, zoneName,
      predictedDensity, currentDensity,
      timeUntilMinutes,
      confidence: Math.round(confidence * 100) / 100,
      reason, severity,
      timestamp: Date.now(),
      expiresAt: Date.now() + timeUntilMinutes * 60 * 1000 + 2 * 60 * 1000,
    };
  }
}

export const predictiveEngine = new PredictiveEngine();
