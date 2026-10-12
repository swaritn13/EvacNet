/**
 * EvacNet — High-Performance Dijkstra Routing Engine
 * Built specifically for Pune, Maharashtra Offline Road Network
 * 
 * Features:
 * - Binary Min-Heap Priority Queue (O((V + E) log V))
 * - Multi-target nearest shelter selection by actual network distance
 * - Dynamic edge removal for true roadblock detours
 * - Precise geodesic distance and segment-to-point spatial indexing
 */

class BinaryMinHeap {
  constructor() {
    this.heap = [];
  }

  push(node, dist) {
    this.heap.push({ node, dist });
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) return null;
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this._sinkDown(0);
    }
    return top;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  _bubbleUp(index) {
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (this.heap[index].dist < this.heap[parent].dist) {
        [this.heap[index], this.heap[parent]] = [this.heap[parent], this.heap[index]];
        index = parent;
      } else {
        break;
      }
    }
  }

  _sinkDown(index) {
    const len = this.heap.length;
    while (true) {
      let left = (index << 1) + 1;
      let right = left + 1;
      let smallest = index;

      if (left < len && this.heap[left].dist < this.heap[smallest].dist) {
        smallest = left;
      }
      if (right < len && this.heap[right].dist < this.heap[smallest].dist) {
        smallest = right;
      }
      if (smallest !== index) {
        [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
        index = smallest;
      } else {
        break;
      }
    }
  }
}

const EvacRoutingEngine = {
  // Earth radius in meters
  EARTH_RADIUS_METERS: 6371000.0,

  /**
   * Geodesic Haversine distance between two coordinates in meters
   */
  haversineMeters(lat1, lon1, lat2, lon2) {
    const toRad = Math.PI / 180.0;
    const dLat = (lat2 - lat1) * toRad;
    const dLon = (lon2 - lon1) * toRad;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.EARTH_RADIUS_METERS * c;
  },

  /**
   * Minimum distance from a point to a line segment in meters
   */
  distanceToSegmentMeters(pLat, pLng, aLat, aLng, bLat, bLng) {
    // Project coordinates onto a flat local approximation
    const midLat = (aLat + bLat) / 2 * Math.PI / 180;
    const cosLat = Math.cos(midLat);

    const px = (pLng - aLng) * cosLat;
    const py = (pLat - aLat);
    const bx = (bLng - aLng) * cosLat;
    const by = (bLat - aLat);

    const l2 = bx * bx + by * by;
    if (l2 === 0) {
      return this.haversineMeters(pLat, pLng, aLat, aLng);
    }

    let t = (px * bx + py * by) / l2;
    t = Math.max(0, Math.min(1, t));

    const projLat = aLat + t * (bLat - aLat);
    const projLng = aLng + t * (bLng - aLng);
    return this.haversineMeters(pLat, pLng, projLat, projLng);
  },

  /**
   * Find nearest road network node to any clicked latitude/longitude
   */
  findNearestNode(lat, lng, network) {
    if (!network || !network.nodes) return null;
    let minD = Infinity;
    let bestNode = null;

    for (const id in network.nodes) {
      const node = network.nodes[id];
      const d = Math.hypot(node.lat - lat, (node.lng - lng) * 0.95);
      if (d < minD) {
        minD = d;
        bestNode = node;
      }
    }

    if (bestNode) {
      const distM = this.haversineMeters(lat, lng, bestNode.lat, bestNode.lng);
      return { node: bestNode, distanceMeters: distM };
    }
    return null;
  },

  /**
   * Identifies all road network edges that intersect a circular roadblock hazard zone
   */
  findEdgesIntersectingRoadblock(centerLat, centerLng, radiusMeters, network) {
    if (!network || !network.edges) return [];
    const blockedEdges = [];

    // Spatial pre-filter bounding box (~1 deg lat ~ 111,000m)
    const latDelta = (radiusMeters + 50) / 111000.0;
    const lngDelta = (radiusMeters + 50) / (111000.0 * Math.cos(centerLat * Math.PI / 180));

    const minLat = centerLat - latDelta;
    const maxLat = centerLat + latDelta;
    const minLng = centerLng - lngDelta;
    const maxLng = centerLng + lngDelta;

    for (const edge of network.edges) {
      if (!edge.coords || edge.coords.length < 2) continue;
      const [p1, p2] = edge.coords;
      const eMinLat = Math.min(p1[0], p2[0]);
      const eMaxLat = Math.max(p1[0], p2[0]);
      const eMinLng = Math.min(p1[1], p2[1]);
      const eMaxLng = Math.max(p1[1], p2[1]);

      if (eMaxLat < minLat || eMinLat > maxLat || eMaxLng < minLng || eMinLng > maxLng) {
        continue;
      }

      // Exact perpendicular distance check to road segment
      const dist = this.distanceToSegmentMeters(centerLat, centerLng, p1[0], p1[1], p2[0], p2[1]);
      if (dist <= radiusMeters) {
        blockedEdges.push(edge);
      }
    }

    return blockedEdges;
  },

  /**
   * Core Dijkstra Algorithm
   * Supports:
   * - Single target search OR Multi-target nearest shelter discovery
   * - Strict exclusion of blocked edges (dynamic street closure)
   * - Turn-by-turn itinerary extraction
   * 
   * @param {string} startNodeId - Starting node ID
   * @param {Set<string>|string} targetNodeIds - Set of candidate target node IDs or single target ID
   * @param {Set<string>} blockedEdgeIds - Set of closed/blocked edge IDs
   * @param {object} network - PUNE_ROAD_NETWORK object
   * @returns {object} Dijkstra result with distance, coordinates, explored count, and itinerary
   */
  computeShortestPath(startNodeId, targetNodeIds, blockedEdgeIds = new Set(), network) {
    const tStart = performance.now();
    const adj = network.adjacency;
    if (!adj || !adj[startNodeId]) {
      return { found: false, error: "Start node not connected to road network" };
    }

    // Convert single target to Set if needed
    const targetSet = (targetNodeIds instanceof Set) ? targetNodeIds : new Set([targetNodeIds]);

    const dist = new Map();
    const prev = new Map();
    const pq = new BinaryMinHeap();

    dist.set(startNodeId, 0);
    pq.push(startNodeId, 0);

    let reachedTargetId = null;
    let exploredCount = 0;

    while (!pq.isEmpty()) {
      const top = pq.pop();
      const u = top.node;
      const d = top.dist;

      // Skip stale heap entry
      if (d > dist.get(u)) continue;
      exploredCount++;

      // In Dijkstra, the first candidate target popped from the Min-Heap is mathematically
      // guaranteed to have the minimum road network distance!
      if (targetSet.has(u)) {
        reachedTargetId = u;
        break;
      }

      const neighbors = adj[u];
      if (!neighbors) continue;

      for (let i = 0; i < neighbors.length; i++) {
        const edge = neighbors[i];
        // Dynamic roadblock exclusion: street is completely removed from graph traversal!
        if (blockedEdgeIds.has(edge.edgeId)) continue;

        const v = edge.to;
        const newDist = d + edge.weight;
        const currentDist = dist.get(v);

        if (currentDist === undefined || newDist < currentDist) {
          dist.set(v, newDist);
          prev.set(v, {
            from: u,
            edgeId: edge.edgeId,
            weight: edge.weight,
            name: edge.name
          });
          pq.push(v, newDist);
        }
      }
    }

    const tEnd = performance.now();
    const execTimeMs = (tEnd - tStart).toFixed(2);

    if (!reachedTargetId) {
      return {
        found: false,
        exploredCount,
        execTimeMs,
        totalDistanceMeters: Infinity,
        coordinates: [],
        edgeIds: [],
        itinerary: []
      };
    }

    // Reconstruct shortest path by backtracking
    const pathEdgeIds = [];
    const pathNodes = [];
    const itinerarySteps = [];

    let curr = reachedTargetId;
    while (curr && prev.has(curr)) {
      pathNodes.unshift(curr);
      const step = prev.get(curr);
      pathEdgeIds.unshift(step.edgeId);
      curr = step.from;
    }
    pathNodes.unshift(startNodeId);

    // Build dense coordinate sequence following curved street geometry
    const edgeMap = new Map();
    for (let i = 0; i < network.edges.length; i++) {
      edgeMap.set(network.edges[i].id, network.edges[i]);
    }

    const routeCoordinates = [];
    if (network.nodes[startNodeId]) {
      routeCoordinates.push([network.nodes[startNodeId].lat, network.nodes[startNodeId].lng]);
    }

    let currentStreetName = null;
    let currentStreetDist = 0;

    for (let i = 0; i < pathEdgeIds.length; i++) {
      const eId = pathEdgeIds[i];
      const edge = edgeMap.get(eId);
      if (edge && edge.coords) {
        // Ensure proper directional sequence
        const fromNode = pathNodes[i];
        const uNode = network.nodes[edge.u];
        const isForward = (fromNode === edge.u);

        const coords = isForward ? edge.coords : [edge.coords[1], edge.coords[0]];
        for (const pt of coords) {
          const last = routeCoordinates[routeCoordinates.length - 1];
          if (!last || last[0] !== pt[0] || last[1] !== pt[1]) {
            routeCoordinates.push(pt);
          }
        }

        // Aggregate turn-by-turn street instructions
        const stName = edge.name || "Pune Urban Connector";
        if (currentStreetName === null) {
          currentStreetName = stName;
          currentStreetDist = edge.length;
        } else if (currentStreetName === stName) {
          currentStreetDist += edge.length;
        } else {
          itinerarySteps.push({
            street: currentStreetName,
            distanceMeters: Math.round(currentStreetDist)
          });
          currentStreetName = stName;
          currentStreetDist = edge.length;
        }
      }
    }

    if (currentStreetName) {
      itinerarySteps.push({
        street: currentStreetName,
        distanceMeters: Math.round(currentStreetDist)
      });
    }

    const totalDistanceMeters = dist.get(reachedTargetId);

    return {
      found: true,
      targetNodeId: reachedTargetId,
      totalDistanceMeters: Math.round(totalDistanceMeters),
      totalDistanceKm: (totalDistanceMeters / 1000).toFixed(2),
      drivingMinutes: Math.ceil(totalDistanceMeters / (30 * 1000 / 60)), // ~30 km/h urban speed
      walkingMinutes: Math.ceil(totalDistanceMeters / (4.5 * 1000 / 60)), // ~4.5 km/h walk speed
      exploredCount,
      execTimeMs,
      edgeIds: pathEdgeIds,
      coordinates: routeCoordinates,
      itinerary: itinerarySteps
    };
  }
};

if (typeof window !== "undefined") {
  window.EvacRoutingEngine = EvacRoutingEngine;
}
