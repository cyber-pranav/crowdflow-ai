// ============================================================
// SMART ROUTING SYSTEM — A* Pathfinding with crowd-aware weights
// ============================================================
// Uses A* algorithm with Euclidean distance heuristic.
// Edge costs are dynamically adjusted by crowd density multipliers.
// Returns top 3 routes: fastest, least crowded, and balanced.
// ============================================================

import { stadiumGraph, ZoneType, DensityLevel, ZoneNode, GraphEdge } from '../models/stadiumGraph';
import { logger } from '../utils/logger';

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
  label: string;           // "Fastest", "Least Crowded", "Balanced"
  recommended: boolean;
}

export interface RoutingResult {
  routes: Route[];
  fromZone: string;
  toZone: string;
  timestamp: number;
}

// Binary min-heap priority queue — O(log n) enqueue/dequeue
class PriorityQueue<T> {
  private heap: { element: T; priority: number }[] = [];

  enqueue(element: T, priority: number): void {
    this.heap.push({ element, priority });
    this.bubbleUp(this.heap.length - 1);
  }

  dequeue(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return top.element;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent].priority <= this.heap[i].priority) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  private sinkDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.heap[left].priority < this.heap[smallest].priority) smallest = left;
      if (right < n && this.heap[right].priority < this.heap[smallest].priority) smallest = right;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }
}

export class SmartRouter {
  private routeCounter = 0;

  /**
   * Heuristic function: Euclidean distance between two zones
   */
  private heuristic(a: ZoneNode, b: ZoneNode): number {
    const dx = a.position.x - b.position.x;
    const dy = a.position.y - b.position.y;
    return Math.sqrt(dx * dx + dy * dy) * 0.3; // Scale factor
  }

  /**
   * A* pathfinding algorithm
   * @param weightMode - How to weight edges:
   *   'fastest' = use currentWeight (density-adjusted)
   *   'leastCrowded' = heavily penalize crowded zones
   *   'balanced' = mix of time and crowd avoidance
   */
  private astar(
    fromId: string,
    toId: string,
    weightMode: 'fastest' | 'leastCrowded' | 'balanced',
    emergencyMode: boolean = false
  ): { path: string[]; cost: number } | null {
    const startNode = stadiumGraph.getZone(fromId);
    const endNode = stadiumGraph.getZone(toId);
    if (!startNode || !endNode) return null;

    const openSet = new PriorityQueue<string>();
    const cameFrom = new Map<string, string>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();

    gScore.set(fromId, 0);
    fScore.set(fromId, this.heuristic(startNode, endNode));
    openSet.enqueue(fromId, fScore.get(fromId)!);

    while (!openSet.isEmpty()) {
      const current = openSet.dequeue()!;

      if (current === toId) {
        // Reconstruct path
        const path: string[] = [current];
        let node = current;
        while (cameFrom.has(node)) {
          node = cameFrom.get(node)!;
          path.unshift(node);
        }
        return { path, cost: gScore.get(toId)! };
      }

      const neighbors = stadiumGraph.getNeighbors(current);
      for (const { nodeId, edge } of neighbors) {
        // In emergency mode, prefer emergency paths
        if (emergencyMode && !edge.isEmergencyPath) continue;

        const edgeCost = this.getEdgeCost(edge, nodeId, weightMode);
        const tentativeG = (gScore.get(current) ?? Infinity) + edgeCost;

        if (tentativeG < (gScore.get(nodeId) ?? Infinity)) {
          cameFrom.set(nodeId, current);
          gScore.set(nodeId, tentativeG);

          const neighbor = stadiumGraph.getZone(nodeId)!;
          fScore.set(nodeId, tentativeG + this.heuristic(neighbor, endNode));
          openSet.enqueue(nodeId, fScore.get(nodeId)!);
        }
      }
    }

    return null; // No path found
  }

  /**
   * Calculate edge cost based on weight mode
   */
  private getEdgeCost(edge: GraphEdge, toNodeId: string, mode: 'fastest' | 'leastCrowded' | 'balanced'): number {
    const destZone = stadiumGraph.getZone(toNodeId);
    if (!destZone) return edge.currentWeight;

    const densityPenalty = stadiumGraph.getDensityMultiplier(destZone.densityLevel);

    switch (mode) {
      case 'fastest':
        return edge.currentWeight;

      case 'leastCrowded':
        return edge.baseWeight * (densityPenalty * densityPenalty); // Quadratic penalty

      case 'balanced':
        return edge.currentWeight * (1 + densityPenalty * 0.5);
    }
  }

  /**
   * Find routes between two zones — returns up to 3 options
   */
  findRoutes(fromZoneId: string, toZoneId: string): RoutingResult {
    const routes: Route[] = [];

    // 1. Fastest route (density-aware but time-optimized)
    const fastest = this.astar(fromZoneId, toZoneId, 'fastest');
    if (fastest) {
      routes.push(this.buildRoute(fastest.path, fastest.cost, 'Fastest Route', 'fastest'));
    }

    // 2. Least crowded route
    const leastCrowded = this.astar(fromZoneId, toZoneId, 'leastCrowded');
    if (leastCrowded && leastCrowded.path.join(',') !== fastest?.path.join(',')) {
      routes.push(this.buildRoute(leastCrowded.path, leastCrowded.cost, 'Least Crowded', 'leastCrowded'));
    }

    // 3. Balanced route
    const balanced = this.astar(fromZoneId, toZoneId, 'balanced');
    if (balanced && balanced.path.join(',') !== fastest?.path.join(',') && balanced.path.join(',') !== leastCrowded?.path.join(',')) {
      routes.push(this.buildRoute(balanced.path, balanced.cost, 'Balanced', 'balanced'));
    }

    // Mark recommended (balanced if available, else fastest)
    if (routes.length > 0) {
      const recIndex = routes.length > 2 ? 2 : 0;
      routes[recIndex].recommended = true;
    }

    return {
      routes,
      fromZone: fromZoneId,
      toZone: toZoneId,
      timestamp: Date.now(),
    };
  }

  /**
   * Emergency routing — find nearest safe exit from current position
   */
  findEmergencyRoute(fromZoneId: string): RoutingResult {
    const exits = [
      ...stadiumGraph.getZonesByType(ZoneType.GATE),
      ...stadiumGraph.getZonesByType(ZoneType.EMERGENCY_EXIT),
    ];

    const exitRoutes: Route[] = [];

    for (const exit of exits) {
      // Try emergency paths first, then fallback to any path
      let result = this.astar(fromZoneId, exit.id, 'fastest', true);
      if (!result) {
        result = this.astar(fromZoneId, exit.id, 'fastest', false);
      }

      if (result) {
        exitRoutes.push(this.buildRoute(
          result.path, result.cost,
          `Emergency → ${exit.name}`, 'fastest'
        ));
      }
    }

    // Sort by total time, mark fastest as recommended
    exitRoutes.sort((a, b) => a.totalTimeSeconds - b.totalTimeSeconds);
    if (exitRoutes.length > 0) {
      exitRoutes[0].recommended = true;
      exitRoutes[0].label = `🚨 Nearest Exit → ${exitRoutes[0].path[exitRoutes[0].path.length - 1].zoneName}`;
    }

    return {
      routes: exitRoutes.slice(0, 3),
      fromZone: fromZoneId,
      toZone: 'nearest-exit',
      timestamp: Date.now(),
    };
  }

  /**
   * Build a Route object from path node IDs
   */
  private buildRoute(pathIds: string[], cost: number, label: string, _mode: string): Route {
    const steps: RouteStep[] = [];
    let totalDistance = 0;
    let totalDensityScore = 0;

    for (let i = 0; i < pathIds.length; i++) {
      const zone = stadiumGraph.getZone(pathIds[i])!;
      const timeToHere = i === 0 ? 0 : this.getTraversalTime(pathIds[i - 1], pathIds[i]);

      steps.push({
        zoneId: zone.id,
        zoneName: zone.name,
        densityLevel: zone.densityLevel,
        estimatedTimeSeconds: timeToHere,
        position: zone.position,
      });

      totalDensityScore += stadiumGraph.getDensityMultiplier(zone.densityLevel);

      if (i > 0) {
        const neighbors = stadiumGraph.getNeighbors(pathIds[i - 1]);
        const edge = neighbors.find(n => n.nodeId === pathIds[i])?.edge;
        if (edge) totalDistance += edge.distance;
      }
    }

    const avgDensity = totalDensityScore / pathIds.length;
    const congestionLevel: 'clear' | 'moderate' | 'heavy' =
      avgDensity < 1.5 ? 'clear' : avgDensity < 3 ? 'moderate' : 'heavy';

    return {
      id: `route-${++this.routeCounter}`,
      path: steps,
      totalTimeSeconds: Math.round(cost),
      totalDistanceMeters: Math.round(totalDistance),
      averageDensity: avgDensity < 1.5 ? 'Low' : avgDensity < 3 ? 'Medium' : 'High',
      congestionLevel,
      label,
      recommended: false,
    };
  }

  /**
   * Get traversal time between two adjacent zones
   */
  private getTraversalTime(fromId: string, toId: string): number {
    const neighbors = stadiumGraph.getNeighbors(fromId);
    const edge = neighbors.find(n => n.nodeId === toId)?.edge;
    return edge?.currentWeight || 0;
  }
}

export const smartRouter = new SmartRouter();
