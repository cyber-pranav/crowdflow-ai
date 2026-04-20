// ============================================================
// Stadium Graph Model — The stadium represented as a weighted graph
// ============================================================

export enum ZoneType {
  STAND = 'STAND',
  CONCOURSE = 'CONCOURSE',
  GATE = 'GATE',
  FOOD_COURT = 'FOOD_COURT',
  RESTROOM = 'RESTROOM',
  EXIT = 'EXIT',
  EMERGENCY_EXIT = 'EMERGENCY_EXIT',
  VIP_LOUNGE = 'VIP_LOUNGE',
  MEDICAL = 'MEDICAL',
}

export enum DensityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface Position {
  x: number;
  y: number;
}

export interface ZoneNode {
  id: string;
  name: string;
  type: ZoneType;
  capacity: number;
  currentOccupancy: number;
  position: Position;
  densityLevel: DensityLevel;
  isEmergencyRoute: boolean;
}

export interface GraphEdge {
  from: string;
  to: string;
  baseWeight: number;      // Base traversal time in seconds
  currentWeight: number;   // Adjusted by crowd density
  distance: number;        // Physical distance in meters
  isEmergencyPath: boolean;
}

export interface StadiumGraphData {
  zones: Map<string, ZoneNode>;
  edges: GraphEdge[];
  adjacencyList: Map<string, { nodeId: string; edge: GraphEdge }[]>;
}

// ============================================================
// Stadium Layout Definition — ~20 interconnected zones
// ============================================================

const STADIUM_ZONES: ZoneNode[] = [
  // Main Stands
  { id: 'stand-north', name: 'North Stand', type: ZoneType.STAND, capacity: 5000, currentOccupancy: 0, position: { x: 400, y: 80 }, densityLevel: DensityLevel.LOW, isEmergencyRoute: false },
  { id: 'stand-south', name: 'South Stand', type: ZoneType.STAND, capacity: 5000, currentOccupancy: 0, position: { x: 400, y: 520 }, densityLevel: DensityLevel.LOW, isEmergencyRoute: false },
  { id: 'stand-east', name: 'East Stand', type: ZoneType.STAND, capacity: 4000, currentOccupancy: 0, position: { x: 650, y: 300 }, densityLevel: DensityLevel.LOW, isEmergencyRoute: false },
  { id: 'stand-west', name: 'West Stand', type: ZoneType.STAND, capacity: 4000, currentOccupancy: 0, position: { x: 150, y: 300 }, densityLevel: DensityLevel.LOW, isEmergencyRoute: false },

  // Concourses
  { id: 'concourse-north', name: 'North Concourse', type: ZoneType.CONCOURSE, capacity: 2000, currentOccupancy: 0, position: { x: 400, y: 150 }, densityLevel: DensityLevel.LOW, isEmergencyRoute: true },
  { id: 'concourse-south', name: 'South Concourse', type: ZoneType.CONCOURSE, capacity: 2000, currentOccupancy: 0, position: { x: 400, y: 450 }, densityLevel: DensityLevel.LOW, isEmergencyRoute: true },
  { id: 'concourse-east', name: 'East Concourse', type: ZoneType.CONCOURSE, capacity: 1500, currentOccupancy: 0, position: { x: 580, y: 300 }, densityLevel: DensityLevel.LOW, isEmergencyRoute: true },
  { id: 'concourse-west', name: 'West Concourse', type: ZoneType.CONCOURSE, capacity: 1500, currentOccupancy: 0, position: { x: 220, y: 300 }, densityLevel: DensityLevel.LOW, isEmergencyRoute: true },

  // Food Courts
  { id: 'food-north', name: 'North Food Court', type: ZoneType.FOOD_COURT, capacity: 800, currentOccupancy: 0, position: { x: 300, y: 130 }, densityLevel: DensityLevel.LOW, isEmergencyRoute: false },
  { id: 'food-south', name: 'South Food Court', type: ZoneType.FOOD_COURT, capacity: 800, currentOccupancy: 0, position: { x: 500, y: 470 }, densityLevel: DensityLevel.LOW, isEmergencyRoute: false },
  { id: 'food-east', name: 'East Food Court', type: ZoneType.FOOD_COURT, capacity: 600, currentOccupancy: 0, position: { x: 620, y: 220 }, densityLevel: DensityLevel.LOW, isEmergencyRoute: false },

  // Restrooms
  { id: 'restroom-nw', name: 'NW Restrooms', type: ZoneType.RESTROOM, capacity: 200, currentOccupancy: 0, position: { x: 250, y: 160 }, densityLevel: DensityLevel.LOW, isEmergencyRoute: false },
  { id: 'restroom-se', name: 'SE Restrooms', type: ZoneType.RESTROOM, capacity: 200, currentOccupancy: 0, position: { x: 560, y: 440 }, densityLevel: DensityLevel.LOW, isEmergencyRoute: false },

  // Gates / Exits
  { id: 'gate-a', name: 'Gate A (North)', type: ZoneType.GATE, capacity: 1000, currentOccupancy: 0, position: { x: 400, y: 30 }, densityLevel: DensityLevel.LOW, isEmergencyRoute: true },
  { id: 'gate-b', name: 'Gate B (East)', type: ZoneType.GATE, capacity: 1000, currentOccupancy: 0, position: { x: 720, y: 300 }, densityLevel: DensityLevel.LOW, isEmergencyRoute: true },
  { id: 'gate-c', name: 'Gate C (South)', type: ZoneType.GATE, capacity: 1000, currentOccupancy: 0, position: { x: 400, y: 570 }, densityLevel: DensityLevel.LOW, isEmergencyRoute: true },
  { id: 'gate-d', name: 'Gate D (West)', type: ZoneType.GATE, capacity: 1000, currentOccupancy: 0, position: { x: 80, y: 300 }, densityLevel: DensityLevel.LOW, isEmergencyRoute: true },

  // Emergency Exits
  { id: 'emergency-ne', name: 'NE Emergency Exit', type: ZoneType.EMERGENCY_EXIT, capacity: 500, currentOccupancy: 0, position: { x: 650, y: 100 }, densityLevel: DensityLevel.LOW, isEmergencyRoute: true },
  { id: 'emergency-sw', name: 'SW Emergency Exit', type: ZoneType.EMERGENCY_EXIT, capacity: 500, currentOccupancy: 0, position: { x: 150, y: 500 }, densityLevel: DensityLevel.LOW, isEmergencyRoute: true },

  // Special
  { id: 'vip-west', name: 'VIP Lounge', type: ZoneType.VIP_LOUNGE, capacity: 300, currentOccupancy: 0, position: { x: 140, y: 220 }, densityLevel: DensityLevel.LOW, isEmergencyRoute: false },
  { id: 'medical', name: 'Medical Center', type: ZoneType.MEDICAL, capacity: 100, currentOccupancy: 0, position: { x: 650, y: 400 }, densityLevel: DensityLevel.LOW, isEmergencyRoute: false },
];

// Edge definitions: [from, to, baseWeight(seconds), distance(meters), isEmergencyPath]
const STADIUM_EDGES: [string, string, number, number, boolean][] = [
  // North Stand connections
  ['stand-north', 'concourse-north', 30, 50, false],
  ['concourse-north', 'gate-a', 45, 80, true],
  ['concourse-north', 'food-north', 20, 30, false],
  ['concourse-north', 'restroom-nw', 25, 40, false],
  ['concourse-north', 'concourse-east', 60, 100, true],
  ['concourse-north', 'concourse-west', 60, 100, true],

  // South Stand connections
  ['stand-south', 'concourse-south', 30, 50, false],
  ['concourse-south', 'gate-c', 45, 80, true],
  ['concourse-south', 'food-south', 20, 30, false],
  ['concourse-south', 'restroom-se', 25, 40, false],
  ['concourse-south', 'concourse-east', 60, 100, true],
  ['concourse-south', 'concourse-west', 60, 100, true],

  // East Stand connections
  ['stand-east', 'concourse-east', 30, 50, false],
  ['concourse-east', 'gate-b', 45, 80, true],
  ['concourse-east', 'food-east', 20, 30, false],
  ['concourse-east', 'restroom-se', 35, 55, false],
  ['concourse-east', 'emergency-ne', 40, 65, true],
  ['concourse-east', 'medical', 25, 40, false],

  // West Stand connections
  ['stand-west', 'concourse-west', 30, 50, false],
  ['concourse-west', 'gate-d', 45, 80, true],
  ['concourse-west', 'restroom-nw', 30, 45, false],
  ['concourse-west', 'vip-west', 20, 30, false],
  ['concourse-west', 'emergency-sw', 40, 65, true],

  // Cross connections
  ['food-north', 'restroom-nw', 15, 20, false],
  ['food-south', 'restroom-se', 15, 20, false],
  ['emergency-ne', 'food-east', 30, 50, false],
  ['emergency-sw', 'concourse-south', 50, 85, true],
  ['gate-a', 'emergency-ne', 70, 120, true],
  ['gate-c', 'emergency-sw', 70, 120, true],
  ['medical', 'concourse-south', 35, 55, false],
  ['vip-west', 'concourse-north', 45, 70, false],
];

export class StadiumGraph {
  private zones: Map<string, ZoneNode>;
  private edges: GraphEdge[];
  private adjacencyList: Map<string, { nodeId: string; edge: GraphEdge }[]>;

  constructor() {
    this.zones = new Map();
    this.edges = [];
    this.adjacencyList = new Map();
    this.initializeGraph();
  }

  private initializeGraph(): void {
    // Initialize zones
    for (const zone of STADIUM_ZONES) {
      this.zones.set(zone.id, { ...zone });
      this.adjacencyList.set(zone.id, []);
    }

    // Initialize edges (bidirectional)
    for (const [from, to, baseWeight, distance, isEmergencyPath] of STADIUM_EDGES) {
      const edge: GraphEdge = {
        from, to, baseWeight, currentWeight: baseWeight, distance, isEmergencyPath,
      };
      const reverseEdge: GraphEdge = {
        from: to, to: from, baseWeight, currentWeight: baseWeight, distance, isEmergencyPath,
      };

      this.edges.push(edge, reverseEdge);
      this.adjacencyList.get(from)?.push({ nodeId: to, edge });
      this.adjacencyList.get(to)?.push({ nodeId: from, edge: reverseEdge });
    }
  }

  getZone(id: string): ZoneNode | undefined {
    return this.zones.get(id);
  }

  getAllZones(): ZoneNode[] {
    return Array.from(this.zones.values());
  }

  getZonesByType(type: ZoneType): ZoneNode[] {
    return this.getAllZones().filter(z => z.type === type);
  }

  getNeighbors(zoneId: string): { nodeId: string; edge: GraphEdge }[] {
    return this.adjacencyList.get(zoneId) || [];
  }

  getAllEdges(): GraphEdge[] {
    return this.edges;
  }

  updateZoneOccupancy(zoneId: string, occupancy: number): void {
    const zone = this.zones.get(zoneId);
    if (!zone) return;

    zone.currentOccupancy = Math.max(0, Math.min(occupancy, zone.capacity));
    zone.densityLevel = this.calculateDensityLevel(zone.currentOccupancy, zone.capacity);
    this.updateEdgeWeights(zoneId);
  }

  private calculateDensityLevel(occupancy: number, capacity: number): DensityLevel {
    const ratio = occupancy / capacity;
    if (ratio < 0.3) return DensityLevel.LOW;
    if (ratio < 0.6) return DensityLevel.MEDIUM;
    if (ratio < 0.85) return DensityLevel.HIGH;
    return DensityLevel.CRITICAL;
  }

  private updateEdgeWeights(zoneId: string): void {
    const zone = this.zones.get(zoneId);
    if (!zone) return;

    const multiplier = this.getDensityMultiplier(zone.densityLevel);

    const neighbors = this.adjacencyList.get(zoneId) || [];
    for (const neighbor of neighbors) {
      neighbor.edge.currentWeight = neighbor.edge.baseWeight * multiplier;
    }
  }

  getDensityMultiplier(level: DensityLevel): number {
    switch (level) {
      case DensityLevel.LOW: return 1.0;
      case DensityLevel.MEDIUM: return 1.5;
      case DensityLevel.HIGH: return 3.0;
      case DensityLevel.CRITICAL: return 10.0;
    }
  }

  getDensityColor(level: DensityLevel): string {
    switch (level) {
      case DensityLevel.LOW: return '#22c55e';
      case DensityLevel.MEDIUM: return '#eab308';
      case DensityLevel.HIGH: return '#f97316';
      case DensityLevel.CRITICAL: return '#ef4444';
    }
  }

  getGraphSnapshot(): StadiumGraphData {
    return {
      zones: new Map(this.zones),
      edges: [...this.edges],
      adjacencyList: new Map(this.adjacencyList),
    };
  }

  getSerializableState() {
    return {
      zones: Array.from(this.zones.entries()).map(([id, zone]) => ({
        ...zone,
        densityColor: this.getDensityColor(zone.densityLevel),
        occupancyPercent: Math.round((zone.currentOccupancy / zone.capacity) * 100),
      })),
      totalOccupancy: Array.from(this.zones.values()).reduce((sum, z) => sum + z.currentOccupancy, 0),
      totalCapacity: Array.from(this.zones.values()).reduce((sum, z) => sum + z.capacity, 0),
    };
  }
}

// Singleton instance
export const stadiumGraph = new StadiumGraph();
