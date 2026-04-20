// ============================================================
// FIRESTORE SYNC — Persistent crowd data layer
// ============================================================
// Writes real-time crowd snapshots, prediction alerts, and queue
// data to Firebase Firestore for persistence and analytics.
// Gracefully falls back to in-memory when Firebase is unavailable.
// ============================================================

import { firebaseDb } from '../config/firebase';
import { logger } from '../utils/logger';
import type { HeatmapData } from './crowdDensityEngine';
import type { PredictionAlert } from './predictiveEngine';
import type { QueueUpdate } from './queueOptimizer';

/** Batch size limit before flushing buffered writes */
const WRITE_BUFFER_SIZE = 5;

interface TickSnapshot {
  heatmap: HeatmapData;
  alerts: PredictionAlert[];
  queues: QueueUpdate[];
  timestamp: number;
}

export class FirestoreSync {
  private writeBuffer: TickSnapshot[] = [];
  private isAvailable: boolean;
  private writeCount = 0;

  constructor() {
    this.isAvailable = !!firebaseDb;
    if (this.isAvailable) {
      logger.success('FirestoreSync: Connected to Firestore — crowd data will persist');
    } else {
      logger.info('FirestoreSync: Firestore unavailable — operating in ephemeral mode');
    }
  }

  /**
   * Record a simulation tick snapshot for persistence.
   * Buffers writes and flushes in batches for efficiency.
   */
  async writeTick(heatmap: HeatmapData, alerts: PredictionAlert[], queues: QueueUpdate[]): Promise<void> {
    const snapshot: TickSnapshot = { heatmap, alerts, queues, timestamp: Date.now() };
    this.writeBuffer.push(snapshot);

    if (this.writeBuffer.length >= WRITE_BUFFER_SIZE) {
      await this.flush();
    }
  }

  /**
   * Flush buffered snapshots to Firestore using batch writes.
   * Each batch atomically writes up to WRITE_BUFFER_SIZE documents.
   */
  async flush(): Promise<void> {
    if (!this.isAvailable || !firebaseDb || this.writeBuffer.length === 0) {
      this.writeBuffer = [];
      return;
    }

    try {
      const batch = firebaseDb.batch();
      const collectionRef = firebaseDb.collection('crowd_snapshots');

      for (const snapshot of this.writeBuffer) {
        const docRef = collectionRef.doc(`tick-${snapshot.timestamp}`);
        batch.set(docRef, {
          totalUsers: snapshot.heatmap.totalUsers,
          overallDensity: snapshot.heatmap.overallDensity,
          hotspots: snapshot.heatmap.hotspots,
          zoneCount: snapshot.heatmap.zones.length,
          alertCount: snapshot.alerts.length,
          criticalAlerts: snapshot.alerts.filter(a => a.severity === 'critical').length,
          queueAvgWait: snapshot.queues.length > 0
            ? Math.round(snapshot.queues.reduce((sum, q) => sum + q.waitTimeSeconds, 0) / snapshot.queues.length)
            : 0,
          timestamp: snapshot.timestamp,
          createdAt: new Date(snapshot.timestamp).toISOString(),
        });
      }

      // Write latest prediction alerts to a dedicated collection
      const latestSnapshot = this.writeBuffer[this.writeBuffer.length - 1];
      if (latestSnapshot.alerts.length > 0) {
        const alertsRef = firebaseDb.collection('prediction_alerts');
        for (const alert of latestSnapshot.alerts.slice(0, 10)) {
          const alertDoc = alertsRef.doc(alert.id);
          batch.set(alertDoc, {
            zoneId: alert.zoneId,
            zoneName: alert.zoneName,
            severity: alert.severity,
            predictedDensity: alert.predictedDensity,
            confidence: alert.confidence,
            timeUntilMinutes: alert.timeUntilMinutes,
            reason: alert.reason,
            timestamp: alert.timestamp,
            expiresAt: alert.expiresAt,
          });
        }
      }

      await batch.commit();
      this.writeCount += this.writeBuffer.length;
      logger.debug(`FirestoreSync: Flushed ${this.writeBuffer.length} snapshots (total: ${this.writeCount})`);
    } catch (error) {
      logger.warn('FirestoreSync: Batch write failed, data preserved in-memory', error);
    } finally {
      this.writeBuffer = [];
    }
  }

  /**
   * Load the most recent crowd state from Firestore on startup.
   * Returns null if no previous state exists.
   */
  async loadLatestSnapshot(): Promise<TickSnapshot | null> {
    if (!this.isAvailable || !firebaseDb) return null;

    try {
      const snapshot = await firebaseDb
        .collection('crowd_snapshots')
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

      if (snapshot.empty) {
        logger.info('FirestoreSync: No previous snapshots found');
        return null;
      }

      const data = snapshot.docs[0].data();
      logger.info(`FirestoreSync: Loaded snapshot from ${data.createdAt}`);
      return data as TickSnapshot;
    } catch (error) {
      logger.warn('FirestoreSync: Failed to load previous state', error);
      return null;
    }
  }

  /** Get sync statistics */
  getStats(): { isAvailable: boolean; writeCount: number; bufferSize: number } {
    return {
      isAvailable: this.isAvailable,
      writeCount: this.writeCount,
      bufferSize: this.writeBuffer.length,
    };
  }
}

export const firestoreSync = new FirestoreSync();
