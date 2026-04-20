// ============================================================
// CROWD DENSITY ENGINE — The heatmap brain
// ============================================================
// Aggregates user positions into zone buckets, calculates density,
// classifies zones, and updates graph edge weights in real-time.
// ============================================================

import { stadiumGraph, DensityLevel, ZoneNode } from '../models/stadiumGraph';
import { logger } from '../utils/logger';

export interface ZoneDensityData {
  zoneId: string;
  zoneName: string;
  currentOccupancy: number;
  capacity: number;
  occupancyPercent: number;
  densityLevel: DensityLevel;
  color: string;
  trend: 'rising' | 'falling' | 'stable';
}

export interface HeatmapData {
  zones: ZoneDensityData[];
  totalUsers: number;
  totalCapacity: number;
  overallDensity: number;
  timestamp: number;
  hotspots: string[];     // Zone IDs with HIGH or CRITICAL density
}

// Track historical occupancy for trend analysis
const occupancyHistory: Map<string, number[]> = new Map();
const HISTORY_LENGTH = 10;

export class CrowdDensityEngine {
  /**
   * Process incoming user location data and update zone densities
   */
  processLocationUpdates(userLocations: Map<string, string>): HeatmapData {
    // Aggregate users into zone buckets
    const zoneCounts = new Map<string, number>();

    for (const [_, zoneId] of userLocations) {
      zoneCounts.set(zoneId, (zoneCounts.get(zoneId) || 0) + 1);
    }

    // Update each zone in the stadium graph
    const allZones = stadiumGraph.getAllZones();
    for (const zone of allZones) {
      const count = zoneCounts.get(zone.id) || 0;
      stadiumGraph.updateZoneOccupancy(zone.id, count);

      // Track history for trend analysis
      const history = occupancyHistory.get(zone.id) || [];
      history.push(count);
      if (history.length > HISTORY_LENGTH) history.shift();
      occupancyHistory.set(zone.id, history);
    }

    return this.generateHeatmapData();
  }

  /**
   * Generate heatmap data from current stadium state
   */
  generateHeatmapData(): HeatmapData {
    const allZones = stadiumGraph.getAllZones();
    const zones: ZoneDensityData[] = allZones.map(zone => ({
      zoneId: zone.id,
      zoneName: zone.name,
      currentOccupancy: zone.currentOccupancy,
      capacity: zone.capacity,
      occupancyPercent: Math.round((zone.currentOccupancy / zone.capacity) * 100),
      densityLevel: zone.densityLevel,
      color: stadiumGraph.getDensityColor(zone.densityLevel),
      trend: this.calculateTrend(zone.id),
    }));

    const totalUsers = zones.reduce((sum, z) => sum + z.currentOccupancy, 0);
    const totalCapacity = zones.reduce((sum, z) => sum + z.capacity, 0);

    const hotspots = zones
      .filter(z => z.densityLevel === DensityLevel.HIGH || z.densityLevel === DensityLevel.CRITICAL)
      .map(z => z.zoneId);

    return {
      zones,
      totalUsers,
      totalCapacity,
      overallDensity: Math.round((totalUsers / totalCapacity) * 100),
      timestamp: Date.now(),
      hotspots,
    };
  }

  /**
   * Calculate the trend direction for a zone
   */
  private calculateTrend(zoneId: string): 'rising' | 'falling' | 'stable' {
    const history = occupancyHistory.get(zoneId);
    if (!history || history.length < 3) return 'stable';

    const recent = history.slice(-3);
    const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
    const older = history.slice(0, -3);
    if (older.length === 0) return 'stable';
    const avgOlder = older.reduce((a, b) => a + b, 0) / older.length;

    const diff = avgRecent - avgOlder;
    const threshold = avgOlder * 0.1; // 10% change threshold

    if (diff > threshold) return 'rising';
    if (diff < -threshold) return 'falling';
    return 'stable';
  }

  /**
   * Get density data for a specific zone
   */
  getZoneDensity(zoneId: string): ZoneDensityData | null {
    const zone = stadiumGraph.getZone(zoneId);
    if (!zone) return null;

    return {
      zoneId: zone.id,
      zoneName: zone.name,
      currentOccupancy: zone.currentOccupancy,
      capacity: zone.capacity,
      occupancyPercent: Math.round((zone.currentOccupancy / zone.capacity) * 100),
      densityLevel: zone.densityLevel,
      color: stadiumGraph.getDensityColor(zone.densityLevel),
      trend: this.calculateTrend(zone.id),
    };
  }

  /**
   * Get current hotspots (HIGH or CRITICAL zones)
   */
  getHotspots(): ZoneDensityData[] {
    return stadiumGraph.getAllZones()
      .filter(z => z.densityLevel === DensityLevel.HIGH || z.densityLevel === DensityLevel.CRITICAL)
      .map(z => this.getZoneDensity(z.id)!);
  }

  /**
   * Entry/exit scan processing
   */
  processGateScan(gateId: string, direction: 'entry' | 'exit', count: number): void {
    const gate = stadiumGraph.getZone(gateId);
    if (!gate) return;

    const delta = direction === 'entry' ? count : -count;
    stadiumGraph.updateZoneOccupancy(gateId, gate.currentOccupancy + delta);
    logger.debug(`Gate scan: ${gateId} ${direction} ${count} users`);
  }
}

export const crowdDensityEngine = new CrowdDensityEngine();
