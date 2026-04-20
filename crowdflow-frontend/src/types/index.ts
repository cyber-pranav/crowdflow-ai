// ============================================================
// CrowdFlow AI — TypeScript type definitions
// ============================================================

export enum DensityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

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
  hotspots: string[];
}

export interface PredictionAlert {
  id: string;
  zoneId: string;
  zoneName: string;
  predictedDensity: DensityLevel;
  currentDensity: DensityLevel;
  timeUntilMinutes: number;
  confidence: number;
  reason: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: number;
  expiresAt: number;
}

export interface RouteStep {
  zoneId: string;
  zoneName: string;
  densityLevel: DensityLevel;
  estimatedTimeSeconds: number;
  position: { x: number; y: number };
}

export interface Route {
  id: string;
  path: RouteStep[];
  totalTimeSeconds: number;
  totalDistanceMeters: number;
  averageDensity: string;
  congestionLevel: 'clear' | 'moderate' | 'heavy';
  label: string;
  recommended: boolean;
}

export interface RoutingResult {
  routes: Route[];
  fromZone: string;
  toZone: string;
  timestamp: number;
}

export interface QueueUpdate {
  vendorId: string;
  vendorName: string;
  waitTimeSeconds: number;
  queueLength: number;
  trend: 'growing' | 'shrinking' | 'stable';
}

export interface VendorRanking {
  vendor: {
    id: string;
    name: string;
    zoneId: string;
    type: string;
    estimatedWaitTime: number;
    queueLength: number;
    rating: number;
    isOpen: boolean;
    menuHighlights: string[];
  };
  score: number;
  waitTimeMinutes: number;
  distanceFromUser: number;
  nearbyDensity: DensityLevel;
  recommended: boolean;
  reason: string;
  routeTimeSeconds: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AssistantResponse {
  message: string;
  contextUsed: string[];
  suggestions: string[];
}

export interface SimulationState {
  isRunning: boolean;
  userCount: number;
  tickCount: number;
  eventPhase: string;
  usersByZone: Record<string, number>;
  behaviors: Record<string, number>;
}
