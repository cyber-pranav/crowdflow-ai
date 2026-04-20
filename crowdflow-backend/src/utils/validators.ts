// ============================================================
// INPUT VALIDATORS — Centralised validation utilities
// ============================================================
// Prevents malformed/malicious inputs from reaching service layer.
// Every route should validate through these helpers.
// ============================================================

import { stadiumGraph } from '../models/stadiumGraph';
import { VendorType } from '../models/vendor';

/** Validate a zone ID exists in the stadium graph */
export function isValidZoneId(zoneId: unknown): zoneId is string {
  if (typeof zoneId !== 'string') return false;
  return !!stadiumGraph.getZone(zoneId);
}

/** Validate simulation user count is within safe bounds */
export function isValidUserCount(count: unknown): count is number {
  const n = typeof count === 'string' ? parseInt(count, 10) : count;
  return typeof n === 'number' && !isNaN(n) && n >= 1 && n <= 5000;
}

/** Validate simulation tick interval is within safe bounds */
export function isValidTickInterval(interval: unknown): interval is number {
  const n = typeof interval === 'string' ? parseInt(interval, 10) : interval;
  return typeof n === 'number' && !isNaN(n) && n >= 500 && n <= 10000;
}

/** Validate vendor type against enum */
export function isValidVendorType(type: unknown): type is VendorType {
  if (typeof type !== 'string') return false;
  return Object.values(VendorType).includes(type as VendorType);
}

/** Validate a simulation event name */
export const VALID_EVENTS = ['halftime', 'endgame', 'emergency', 'reset'] as const;
export type SimulationEvent = typeof VALID_EVENTS[number];

export function isValidSimulationEvent(event: unknown): event is SimulationEvent {
  return typeof event === 'string' && VALID_EVENTS.includes(event as SimulationEvent);
}

/** Sanitise a chat message — trim, enforce length */
export function sanitizeChatMessage(message: unknown): { valid: boolean; sanitized: string; error?: string } {
  if (typeof message !== 'string') {
    return { valid: false, sanitized: '', error: 'Message must be a string' };
  }

  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return { valid: false, sanitized: '', error: 'Message cannot be empty' };
  }
  if (trimmed.length > 500) {
    return { valid: false, sanitized: '', error: 'Message too long (max 500 characters)' };
  }

  return { valid: true, sanitized: trimmed };
}
