// ============================================================
// QUEUE OPTIMIZATION SYSTEM — Dynamic vendor ranking
// ============================================================
// Tracks wait times per vendor, ranks by composite score
// (wait time + distance + nearby crowd density), and provides
// real-time recommendations.
// ============================================================

import { STADIUM_VENDORS, Vendor, VendorType } from '../models/vendor';
import { stadiumGraph, DensityLevel } from '../models/stadiumGraph';
import { smartRouter } from './smartRouter';
import { logger } from '../utils/logger';

export interface VendorRanking {
  vendor: Vendor;
  score: number;                  // Lower is better
  waitTimeMinutes: number;
  distanceFromUser: number;       // meters (0 if user zone unknown)
  nearbyDensity: DensityLevel;
  recommended: boolean;
  reason: string;
  routeTimeSeconds: number;
}

export interface QueueUpdate {
  vendorId: string;
  vendorName: string;
  waitTimeSeconds: number;
  queueLength: number;
  trend: 'growing' | 'shrinking' | 'stable';
}

// Track queue history for trend analysis
const queueHistory: Map<string, number[]> = new Map();

export class QueueOptimizer {
  private vendors: Vendor[];

  constructor() {
    this.vendors = [...STADIUM_VENDORS];
  }

  /**
   * Update a vendor's queue status
   */
  updateQueue(vendorId: string, waitTimeSeconds: number, queueLength: number): void {
    const vendor = this.vendors.find(v => v.id === vendorId);
    if (!vendor) return;

    vendor.estimatedWaitTime = waitTimeSeconds;
    vendor.queueLength = queueLength;

    // Track history
    const history = queueHistory.get(vendorId) || [];
    history.push(queueLength);
    if (history.length > 10) history.shift();
    queueHistory.set(vendorId, history);
  }

  /**
   * Simulate queue fluctuations (for demo mode)
   */
  simulateQueueChanges(): QueueUpdate[] {
    const updates: QueueUpdate[] = [];

    for (const vendor of this.vendors) {
      if (!vendor.isOpen) continue;

      // Check zone density — higher density = longer queues
      const zone = stadiumGraph.getZone(vendor.zoneId);
      const densityMultiplier = zone ? stadiumGraph.getDensityMultiplier(zone.densityLevel) : 1;

      // Random fluctuation ±20% + density influence
      const fluctuation = 0.8 + Math.random() * 0.4;
      const baseWait = vendor.estimatedWaitTime * fluctuation * (0.5 + densityMultiplier * 0.3);
      vendor.estimatedWaitTime = Math.max(15, Math.round(baseWait));
      vendor.queueLength = Math.max(0, Math.round(vendor.estimatedWaitTime / 25));

      // Track history
      const history = queueHistory.get(vendor.id) || [];
      history.push(vendor.queueLength);
      if (history.length > 10) history.shift();
      queueHistory.set(vendor.id, history);

      updates.push({
        vendorId: vendor.id,
        vendorName: vendor.name,
        waitTimeSeconds: vendor.estimatedWaitTime,
        queueLength: vendor.queueLength,
        trend: this.getQueueTrend(vendor.id),
      });
    }

    return updates;
  }

  /**
   * Get ranked vendor recommendations
   * @param userZoneId - User's current zone (for distance calculation)
   * @param vendorType - Filter by type (optional)
   */
  getRankings(userZoneId?: string, vendorType?: VendorType): VendorRanking[] {
    let filteredVendors = this.vendors.filter(v => v.isOpen);
    if (vendorType) {
      filteredVendors = filteredVendors.filter(v => v.type === vendorType);
    }

    const rankings: VendorRanking[] = filteredVendors.map(vendor => {
      const zone = stadiumGraph.getZone(vendor.zoneId);
      const nearbyDensity = zone?.densityLevel || DensityLevel.LOW;

      // Calculate distance/route time if user zone is known
      let distanceFromUser = 0;
      let routeTimeSeconds = 0;
      if (userZoneId && userZoneId !== vendor.zoneId) {
        const route = smartRouter.findRoutes(userZoneId, vendor.zoneId);
        if (route.routes.length > 0) {
          distanceFromUser = route.routes[0].totalDistanceMeters;
          routeTimeSeconds = route.routes[0].totalTimeSeconds;
        }
      }

      // Composite score (lower is better)
      const waitScore = vendor.estimatedWaitTime / 60;   // Convert to minutes
      const distScore = routeTimeSeconds / 60;             // Minutes to walk
      const densityScore = stadiumGraph.getDensityMultiplier(nearbyDensity);

      const score = waitScore * 0.5 + distScore * 0.3 + densityScore * 0.2;

      const waitTimeMinutes = Math.round(vendor.estimatedWaitTime / 60 * 10) / 10;

      return {
        vendor,
        score: Math.round(score * 100) / 100,
        waitTimeMinutes,
        distanceFromUser,
        nearbyDensity,
        recommended: false,
        reason: '',
        routeTimeSeconds,
      };
    });

    // Sort by score (lower is better)
    rankings.sort((a, b) => a.score - b.score);

    // Mark top pick as recommended
    if (rankings.length > 0) {
      rankings[0].recommended = true;
      rankings[0].reason = this.generateReason(rankings[0]);
    }

    // Generate reasons for top 3
    for (let i = 0; i < Math.min(3, rankings.length); i++) {
      rankings[i].reason = this.generateReason(rankings[i]);
    }

    return rankings;
  }

  /**
   * Get all queue updates for real-time display
   */
  getAllQueueData(): QueueUpdate[] {
    return this.vendors.filter(v => v.isOpen).map(vendor => ({
      vendorId: vendor.id,
      vendorName: vendor.name,
      waitTimeSeconds: vendor.estimatedWaitTime,
      queueLength: vendor.queueLength,
      trend: this.getQueueTrend(vendor.id),
    }));
  }

  private getQueueTrend(vendorId: string): 'growing' | 'shrinking' | 'stable' {
    const history = queueHistory.get(vendorId);
    if (!history || history.length < 3) return 'stable';

    const recent = history.slice(-3);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const older = history.slice(0, -3);
    if (older.length === 0) return 'stable';
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    if (avg > olderAvg * 1.15) return 'growing';
    if (avg < olderAvg * 0.85) return 'shrinking';
    return 'stable';
  }

  private generateReason(ranking: VendorRanking): string {
    const parts: string[] = [];

    if (ranking.waitTimeMinutes <= 2) {
      parts.push('Very short wait');
    } else if (ranking.waitTimeMinutes <= 5) {
      parts.push(`${ranking.waitTimeMinutes} min wait`);
    } else {
      parts.push(`${ranking.waitTimeMinutes} min wait`);
    }

    if (ranking.nearbyDensity === DensityLevel.LOW) {
      parts.push('low crowd area');
    }

    if (ranking.routeTimeSeconds > 0 && ranking.routeTimeSeconds < 60) {
      parts.push('nearby');
    }

    if (ranking.vendor.rating >= 4.5) {
      parts.push(`★ ${ranking.vendor.rating} rated`);
    }

    return parts.join(' · ');
  }
}

export const queueOptimizer = new QueueOptimizer();
