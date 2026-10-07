/**
 * EvacNet — Map Edition
 * Optimal Emergency Evacuation Route Planning Using Graph Algorithms
 * Powered by Leaflet.js and Real-Time Dynamic Graph Pathfinding
 */

// --- Miniature City Geo-Graph Definition (Metropolitan District) ---
// Realistic coordinates centered around an urban river & street grid
const CITY_NODES = [
  { id: 0, name: "City Hall Plaza", type: "commercial", lat: 40.7128, lng: -74.0060, icon: "🏛️" },
  { id: 1, name: "Lincoln High School", type: "school", lat: 40.7230, lng: -74.0080, icon: "🏫" },
  { id: 2, name: "West Elementary Academy", type: "school", lat: 40.7290, lng: -74.0160, icon: "🎒" },
  { id: 3, name: "Metro General Hospital & Trauma", type: "hospital", lat: 40.7340, lng: -73.9920, icon: "🏥" },
  { id: 4, name: "Central Fire Station 14", type: "fire", lat: 40.7190, lng: -73.9980, icon: "🚒" },
  { id: 5, name: "East District Firehouse", type: "fire", lat: 40.7150, lng: -73.9850, icon: "🚒" },
  { id: 6, name: "North Shore Safe Haven [Shelter 1]", type: "shelter", lat: 40.7420, lng: -74.0020, icon: "🛡️" },
  { id: 7, name: "Riverfront Park Relief Center [Shelter 2]", type: "shelter", lat: 40.7280, lng: -73.9740, icon: "🛡️" },
  { id: 8, name: "South Harbor Evacuation Dock [Shelter 3]", type: "shelter", lat: 40.7020, lng: -74.0130, icon: "🛡️" },
  { id: 9, name: "West Village Residential Ward", type: "residential", lat: 40.7350, lng: -74.0100, icon: "🏘️" },
  { id: 10, name: "Lower East Residential Ward", type: "residential", lat: 40.7180, lng: -73.9800, icon: "🏘️" },
  { id: 11, name: "Tribeca West Junction", type: "junction", lat: 40.7185, lng: -74.0120, icon: "🚏" },
  { id: 12, name: "Greenwich Midtown Junction", type: "junction", lat: 40.7260, lng: -73.9990, icon: "🚏" },
  { id: 13, name: "Union Square Metro Hub", type: "commercial", lat: 40.7360, lng: -73.9900, icon: "🏢" },
  { id: 14, name: "Broadway South Junction", type: "junction", lat: 40.7080, lng: -74.0110, icon: "🚏" },
  { id: 15, name: "Financial District Transit Hub", type: "commercial", lat: 40.7070, lng: -74.0040, icon: "🏢" }
];

// Road Corridors connecting nodes (Graph Edges)
const CITY_ROADS = [
  { id: 0, u: 1, v: 11, name: "Greenwich Street West" },
  { id: 1, u: 11, v: 2, name: "Hudson River Greenway North" },
  { id: 2, u: 2, v: 9, name: "Washington Street Parkway" },
  { id: 3, u: 9, v: 6, name: "North Shore Coastal Expressway" },
  { id: 4, u: 1, v: 12, name: "Houston Street Arterial" },
  { id: 5, u: 11, v: 0, name: "Chambers Street Boulevard" },
  { id: 6, u: 0, v: 4, name: "Centre Street Flyover" },
  { id: 7, u: 4, v: 12, name: "Broadway Central Avenue" },
  { id: 8, u: 12, v: 13, name: "5th Avenue North Corridor" },
  { id: 9, u: 13, v: 6, name: "Park Avenue North Exit" },
  { id: 10, u: 13, v: 3, name: "14th Street Medical Mile" },
  { id: 11, u: 12, v: 3, name: "University Place Connector" },
  { id: 12, u: 4, v: 10, name: "Delancey Street East" },
  { id: 13, u: 10, v: 5, name: "Grand Street Corridor" },
  { id: 14, u: 10, v: 7, name: "FDR Drive North to Relief Park" },
  { id: 15, u: 3, v: 7, name: "East River Esplanade South" },
  { id: 16, u: 0, v: 15, name: "Fulton Transit Corridor" },
  { id: 17, u: 15, v: 14, name: "Wall Street Commercial Way" },
  { id: 18, u: 14, v: 8, name: "Battery Place to Evac Dock" },
  { id: 19, u: 11, v: 14, name: "West Street Southway" },
  { id: 20, u: 15, v: 5, name: "Water Street East" },
  { id: 21, u: 1, v: 4, name: "Spring Street Crossway" },
  { id: 22, u: 9, v: 12, name: "Bleeker Street Eastlink" },
  { id: 23, u: 5, v: 8, name: "South Harbor Perimeter Road" }
];

// --- Global Application State ---
let map;
let nodeMarkers = {};
let roadPolylines = {};
let routePolyline = null;
let ledMarkers = [];
let hazardMarkers = {};

let startNodeId = 1; // Default origin: Lincoln High School
let targetMode = "nearest_shelter";
let customTargetId = 6;
let currentAlgorithm = "dijkstra";
let currentHazardType = "fire";
let showLedAnimation = true;
let showRoadLabels = true;
let ledSpeedMultiplier = 3;

// Active route edge list
let activeRouteEdges = [];
let animIntervalId = null;

// --- Distance Calculation (Haversine Formula) ---
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Compute road length for each edge
CITY_ROADS.forEach(road => {
  const u = CITY_NODES.find(n => n.id === road.u);
  const v = CITY_NODES.find(n => n.id === road.v);
  road.distance = getDistanceMeters(u.lat, u.lng, v.lat, v.lng);
  road.isBlocked = false;
  road.hazardType = null;
});

// --- Initialize Application on DOM Ready ---
document.addEventListener("DOMContentLoaded", () => {
  initMap();
  initUI();
  calculateAndRenderRoute();
});

// --- Map Initialization with Leaflet ---
function initMap() {
  // Center map around city center
  map = L.map("map", {
    zoomControl: false,
    attributionControl: false
  }).setView([40.7220, -73.9980], 14);

  // Position zoom controls at top-left
  L.control.zoom({ position: "topleft" }).addTo(map);

  // High-contrast Dark Tiles for high-tech HUD look
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    subdomains: "abcd",
    maxZoom: 19
  }).addTo(map);

  // Render Base Road Network
  renderRoadNetwork();

  // Render City Landmarks & Intersections
  renderCityLandmarks();
}

// --- Render Roads as Interactive Polylines ---
function renderRoadNetwork() {
  CITY_ROADS.forEach(road => {
    const u = CITY_NODES.find(n => n.id === road.u);
    const v = CITY_NODES.find(n => n.id === road.v);
    const latlngs = [[u.lat, u.lng], [v.lat, v.lng]];

    // Interactive clickable road polyline
    const polyline = L.polyline(latlngs, {
      color: "#273656",
      weight: 6,
      opacity: 0.8,
      lineCap: "round",
      className: "road-line"
    }).addTo(map);

    // Hover & Click events
    polyline.on("mouseover", () => {
      if (!road.isBlocked) {
        polyline.setStyle({ color: "#38bdf8", weight: 9 });
      }
    });

    polyline.on("mouseout", () => {
      if (!road.isBlocked) {
        const isRoute = activeRouteEdges.includes(road.id);
        polyline.setStyle({
          color: isRoute ? "#00ff88" : "#273656",
          weight: isRoute ? 8 : 6
        });
      }
    });

    polyline.on("click", () => {
      toggleRoadBlock(road.id);
    });

    // Tooltip
    polyline.bindTooltip(
      `<strong>${road.name}</strong><br>Distance: ${road.distance}m<br><em>Click to block/unblock</em>`,
      { sticky: true, className: "road-tooltip" }
    );

    roadPolylines[road.id] = polyline;
  });
}

// --- Render Landmark Nodes ---
function renderCityLandmarks() {
  CITY_NODES.forEach(node => {
    const isShelter = node.type === "shelter";
    const isHospital = node.type === "hospital";
    const isSchool = node.type === "school";
    const isFire = node.type === "fire";

    const typeClass = isShelter ? "marker-shelter" :
                      isHospital ? "marker-hospital" :
                      isSchool ? "marker-school" :
                      isFire ? "marker-fire" : "marker-residential";

    const customIcon = L.divIcon({
      className: `custom-city-marker ${typeClass} ${node.id === startNodeId ? 'marker-origin' : ''}`,
      html: `<div class="marker-inner">${node.icon}</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const marker = L.marker([node.lat, node.lng], { icon: customIcon }).addTo(map);

    // Marker Popup
    const popupHtml = `
      <div style="text-align: center;">
        <h4>${node.icon} ${node.name}</h4>
        <p style="font-size:0.75rem; color:#94a3b8; text-transform:uppercase;">Type: ${node.type}</p>
        <button class="popup-btn" onclick="selectOrigin(${node.id})">Set as Evacuation Origin</button>
        ${!isShelter ? `<button class="popup-btn" onclick="selectDestination(${node.id})">Set as Target</button>` : ''}
      </div>
    `;
    marker.bindPopup(popupHtml);

    nodeMarkers[node.id] = marker;
  });
}

// Global functions for marker popups
window.selectOrigin = function(id) {
  startNodeId = id;
  document.getElementById("startNodeSelect").value = id;
  updateOriginMarkerVisuals();
  calculateAndRenderRoute();
  map.closePopup();
};

window.selectDestination = function(id) {
  targetMode = "custom_target";
  customTargetId = id;
  document.getElementById("targetModeSelect").value = "custom_target";
  document.getElementById("customTargetWrapper").style.display = "block";
  document.getElementById("targetNodeSelect").value = id;
  calculateAndRenderRoute();
  map.closePopup();
};

// --- UI Controls Binding ---
function initUI() {
  const startSelect = document.getElementById("startNodeSelect");
  const targetSelect = document.getElementById("targetNodeSelect");
  const targetModeSelect = document.getElementById("targetModeSelect");
  const customTargetWrapper = document.getElementById("customTargetWrapper");
  const algoSelect = document.getElementById("algorithmSelect");
  const btnRecalc = document.getElementById("btnRecalculate");
  const btnDisaster = document.getElementById("btnDisasterScenario");
  const btnClear = document.getElementById("btnClearBlockades");
  const toggleLed = document.getElementById("toggleLedAnimation");
  const toggleLabels = document.getElementById("toggleRoadLabels");
  const ledSpeed = document.getElementById("ledSpeedRange");

  // Populate Dropdowns
  CITY_NODES.forEach(n => {
    const opt1 = document.createElement("option");
    opt1.value = n.id;
    opt1.textContent = `${n.icon} ${n.name}`;
    if (n.id === startNodeId) opt1.selected = true;
    startSelect.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = n.id;
    opt2.textContent = `${n.icon} ${n.name}`;
    if (n.id === customTargetId) opt2.selected = true;
    targetSelect.appendChild(opt2);
  });

  // Origin change
  startSelect.addEventListener("change", (e) => {
    startNodeId = parseInt(e.target.value);
    updateOriginMarkerVisuals();
    calculateAndRenderRoute();
  });

  // Target mode change
  targetModeSelect.addEventListener("change", (e) => {
    targetMode = e.target.value;
    customTargetWrapper.style.display = targetMode === "custom_target" ? "block" : "none";
    calculateAndRenderRoute();
  });

  // Specific target change
  targetSelect.addEventListener("change", (e) => {
    customTargetId = parseInt(e.target.value);
    calculateAndRenderRoute();
  });

  // Algorithm change
  algoSelect.addEventListener("change", (e) => {
    currentAlgorithm = e.target.value;
    calculateAndRenderRoute();
  });

  // Compute button
  btnRecalc.addEventListener("click", () => {
    calculateAndRenderRoute();
  });

  // Hazard Type radio chips
  document.querySelectorAll(".hazard-type-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".hazard-type-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      currentHazardType = chip.dataset.hazard;
    });
  });

  // Trigger Disaster Scenario button
  btnDisaster.addEventListener("click", triggerDisasterScenario);

  // Clear blockades button
  btnClear.addEventListener("click", clearAllBlockades);

  // Toggles
  toggleLed.addEventListener("change", (e) => {
    showLedAnimation = e.target.checked;
    renderLedGuidanceAlongRoute();
  });

  toggleLabels.addEventListener("change", (e) => {
    showRoadLabels = e.target.checked;
    updateRoadTooltips();
  });

  ledSpeed.addEventListener("input", (e) => {
    ledSpeedMultiplier = parseInt(e.target.value);
    restartLedAnimation();
  });
}

function updateOriginMarkerVisuals() {
  CITY_NODES.forEach(node => {
    const el = nodeMarkers[node.id].getElement();
    if (el) {
      if (node.id === startNodeId) {
        el.classList.add("marker-origin");
      } else {
        el.classList.remove("marker-origin");
      }
    }
  });
}

// --- Dynamic Roadblock Handling ---
function toggleRoadBlock(roadId, explicitHazard = null) {
  const road = CITY_ROADS.find(r => r.id === roadId);
  if (!road) return;

  const polyline = roadPolylines[roadId];
  const u = CITY_NODES.find(n => n.id === road.u);
  const v = CITY_NODES.find(n => n.id === road.v);
  const midLat = (u.lat + v.lat) / 2;
  const midLng = (u.lng + v.lng) / 2;

  road.isBlocked = !road.isBlocked;

  if (road.isBlocked) {
    road.hazardType = explicitHazard || currentHazardType;

    // Visual Roadblock Warning Style
    polyline.setStyle({
      color: "#ef4444",
      weight: 10,
      opacity: 0.95,
      dashArray: "8, 8"
    });

    // Add Hazard Marker Icon on Map
    const hazardIconStr = road.hazardType === "fire" ? "🔥" :
                          road.hazardType === "flood" ? "🌊" :
                          road.hazardType === "debris" ? "🪨" : "⛔";

    const hazardIcon = L.divIcon({
      className: "hazard-map-marker",
      html: `<div>${hazardIconStr}</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    const hMarker = L.marker([midLat, midLng], { icon: hazardIcon }).addTo(map);
    hMarker.bindTooltip(`Blocked: ${road.name} (${road.hazardType.toUpperCase()})`);
    hazardMarkers[roadId] = hMarker;

    showToast(`Road Blocked!`, `⚠️ ${road.name} closed by ${road.hazardType.toUpperCase()}. Dynamic reroute engaged!`);
  } else {
    road.hazardType = null;
    polyline.setStyle({
      color: "#273656",
      weight: 6,
      opacity: 0.8,
      dashArray: null
    });

    if (hazardMarkers[roadId]) {
      map.removeLayer(hazardMarkers[roadId]);
      delete hazardMarkers[roadId];
    }

    showToast(`Road Cleared`, `✅ ${road.name} is now open for transit.`);
  }

  updateBlockedRoadsListUI();
  calculateAndRenderRoute();
}

function updateBlockedRoadsListUI() {
  const container = document.getElementById("blockedRoadsList");
  const blockedRoads = CITY_ROADS.filter(r => r.isBlocked);
  const headerCount = document.getElementById("headerBlockedCount");
  headerCount.textContent = blockedRoads.length;

  if (blockedRoads.length === 0) {
    container.innerHTML = `<div class="empty-state">No roads blocked. All routes open.</div>`;
    return;
  }

  container.innerHTML = "";
  blockedRoads.forEach(r => {
    const row = document.createElement("div");
    row.className = "blocked-item-row";
    row.innerHTML = `
      <span>${r.hazardType === 'fire' ? '🔥' : r.hazardType === 'flood' ? '🌊' : '🪨'} ${r.name}</span>
      <button class="btn-unblock-small" onclick="unblockRoad(${r.id})">✖ Clear</button>
    `;
    container.appendChild(row);
  });
}

window.unblockRoad = function(roadId) {
  toggleRoadBlock(roadId);
};

function clearAllBlockades() {
  CITY_ROADS.forEach(road => {
    if (road.isBlocked) {
      road.isBlocked = false;
      road.hazardType = null;
      roadPolylines[road.id].setStyle({
        color: "#273656",
        weight: 6,
        opacity: 0.8,
        dashArray: null
      });
      if (hazardMarkers[road.id]) {
        map.removeLayer(hazardMarkers[road.id]);
      }
    }
  });
  hazardMarkers = {};
  updateBlockedRoadsListUI();
  calculateAndRenderRoute();
  showToast("All Clear", "All road blockades removed. City grid restored.");
}

function triggerDisasterScenario() {
  const scenarios = [
    { name: "Bridge & River Flood Disaster", roads: [0, 4, 14], hazard: "flood" },
    { name: "Downtown Gas Explosion & Firestorm", roads: [6, 7, 12], hazard: "fire" },
    { name: "Severe Earthquake Road Fractures", roads: [1, 5, 8], hazard: "debris" },
    { name: "Civil Hazard Zone Police Cordon", roads: [10, 11, 21], hazard: "police" }
  ];

  const sc = scenarios[Math.floor(Math.random() * scenarios.length)];
  sc.roads.forEach(id => {
    const road = CITY_ROADS.find(r => r.id === id);
    if (road && !road.isBlocked) {
      toggleRoadBlock(id, sc.hazard);
    }
  });

  showToast("EMERGENCY SCENARIO", `🚨 Scenario triggered: ${sc.name}! Rerouting around hazards.`);
}

// --- Graph Pathfinding Algorithms ---

function buildAdjacencyList() {
  const adj = {};
  CITY_NODES.forEach(n => { adj[n.id] = []; });

  CITY_ROADS.forEach(road => {
    if (!road.isBlocked) {
      let weight = road.distance;
      if (currentAlgorithm === "safest") {
        // Safe-First: Add risk penalty to roads near blocked areas
        const isNearHazard = CITY_ROADS.some(other => other.isBlocked && (other.u === road.u || other.v === road.v));
        if (isNearHazard) weight *= 2.0;
      }

      adj[road.u].push({ neighbor: road.v, weight, roadId: road.id, name: road.name, distance: road.distance });
      adj[road.v].push({ neighbor: road.u, weight, roadId: road.id, name: road.name, distance: road.distance });
    }
  });
  return adj;
}

function runPathfinding(startId, targetIds, useAStar = false) {
  const startTime = performance.now();
  const adj = buildAdjacencyList();
  const dist = {};
  const prev = {};
  const edgeUsed = {};
  const visited = new Set();
  const pq = [];

  CITY_NODES.forEach(n => {
    dist[n.id] = Infinity;
    prev[n.id] = null;
    edgeUsed[n.id] = null;
  });

  dist[startId] = 0;
  const firstTarget = targetIds[0];
  const targetNode = CITY_NODES.find(n => n.id === firstTarget);
  const startNode = CITY_NODES.find(n => n.id === startId);

  let initialH = 0;
  if (useAStar && targetNode && startNode) {
    initialH = getDistanceMeters(startNode.lat, startNode.lng, targetNode.lat, targetNode.lng);
  }

  pq.push({ id: startId, priority: initialH, cost: 0 });
  let targetReached = null;

  while (pq.length > 0) {
    pq.sort((a, b) => a.priority - b.priority);
    const curr = pq.shift();

    if (visited.has(curr.id)) continue;
    visited.add(curr.id);

    if (targetIds.includes(curr.id)) {
      targetReached = curr.id;
      break;
    }

    const neighbors = adj[curr.id] || [];
    for (const { neighbor, weight, roadId } of neighbors) {
      if (visited.has(neighbor)) continue;

      const newCost = dist[curr.id] + weight;
      if (newCost < dist[neighbor]) {
        dist[neighbor] = newCost;
        prev[neighbor] = curr.id;
        edgeUsed[neighbor] = roadId;

        let h = 0;
        if (useAStar && targetNode) {
          const nNode = CITY_NODES.find(n => n.id === neighbor);
          if (nNode) {
            h = getDistanceMeters(nNode.lat, nNode.lng, targetNode.lat, targetNode.lng);
          }
        }

        pq.push({ id: neighbor, priority: newCost + h, cost: newCost });
      }
    }
  }

  const endTime = performance.now();

  // Reconstruct path
  const pathNodes = [];
  const pathRoads = [];
  let totalDistanceMeters = 0;

  if (targetReached !== null) {
    let curr = targetReached;
    while (curr !== null) {
      pathNodes.unshift(curr);
      if (edgeUsed[curr] !== null) {
        pathRoads.unshift(edgeUsed[curr]);
        const rObj = CITY_ROADS.find(r => r.id === edgeUsed[curr]);
        if (rObj) totalDistanceMeters += rObj.distance;
      }
      curr = prev[curr];
    }
  }

  return {
    success: targetReached !== null,
    targetReached,
    pathNodes,
    pathRoads,
    totalDistance: totalDistanceMeters,
    computeTimeMs: (endTime - startTime).toFixed(2),
    nodesVisited: visited.size
  };
}

// --- Main Compute & Render Routine ---
function calculateAndRenderRoute() {
  let targetNodeIds = [];

  if (targetMode === "nearest_shelter") {
    targetNodeIds = CITY_NODES.filter(n => n.type === "shelter").map(n => n.id);
  } else if (targetMode === "nearest_hospital") {
    targetNodeIds = CITY_NODES.filter(n => n.type === "hospital").map(n => n.id);
  } else {
    targetNodeIds = [customTargetId];
  }

  const useAStar = (currentAlgorithm === "astar");
  const result = runPathfinding(startNodeId, targetNodeIds, useAStar);

  activeRouteEdges = result.pathRoads;

  // Update Road Polylines on Map
  CITY_ROADS.forEach(road => {
    const poly = roadPolylines[road.id];
    if (road.isBlocked) {
      poly.setStyle({ color: "#ef4444", weight: 10, dashArray: "8, 8" });
    } else if (activeRouteEdges.includes(road.id)) {
      poly.setStyle({ color: "#00ff88", weight: 9, opacity: 0.95, dashArray: null });
      poly.bringToFront();
    } else {
      poly.setStyle({ color: "#273656", weight: 6, opacity: 0.8, dashArray: null });
    }
  });

  // Render Glowing LED Guidance along the calculated route
  renderLedGuidanceAlongRoute();

  // Update Header & Sidebar Metrics
  updateMetricsUI(result);

  // Update Turn-by-Turn Directions
  updateTurnByTurnUI(result);
}

// --- Animated Glowing LED Trail along Calculated Route ---
function renderLedGuidanceAlongRoute() {
  // Clear existing LED markers
  ledMarkers.forEach(m => map.removeLayer(m));
  ledMarkers = [];

  if (!showLedAnimation || activeRouteEdges.length === 0) return;

  // Extract ordered list of coordinates along the route
  const pathCoordinates = [];
  let currentOrigin = startNodeId;

  activeRouteEdges.forEach(roadId => {
    const road = CITY_ROADS.find(r => r.id === roadId);
    const u = CITY_NODES.find(n => n.id === road.u);
    const v = CITY_NODES.find(n => n.id === road.v);

    if (road.u === currentOrigin) {
      pathCoordinates.push([u.lat, u.lng]);
      pathCoordinates.push([v.lat, v.lng]);
      currentOrigin = road.v;
    } else {
      pathCoordinates.push([v.lat, v.lng]);
      pathCoordinates.push([u.lat, u.lng]);
      currentOrigin = road.u;
    }
  });

  // Interpolate LED dots along each segment
  const ledsPerSegment = 5;
  for (let i = 0; i < pathCoordinates.length - 1; i += 2) {
    const p1 = pathCoordinates[i];
    const p2 = pathCoordinates[i + 1];

    for (let k = 1; k <= ledsPerSegment; k++) {
      const t = k / (ledsPerSegment + 1);
      const lat = p1[0] + (p2[0] - p1[0]) * t;
      const lng = p1[1] + (p2[1] - p1[1]) * t;

      const ledIcon = L.divIcon({
        className: "led-pulse-dot",
        iconSize: [10, 10],
        iconAnchor: [5, 5]
      });

      const ledMarker = L.marker([lat, lng], { icon: ledIcon, interactive: false }).addTo(map);
      ledMarkers.push(ledMarker);
    }
  }

  restartLedAnimation();
}

function restartLedAnimation() {
  if (animIntervalId) clearInterval(animIntervalId);
  if (ledMarkers.length === 0) return;

  let currentLedIndex = 0;
  const intervalMs = Math.max(80, 400 / ledSpeedMultiplier);

  animIntervalId = setInterval(() => {
    ledMarkers.forEach((m, idx) => {
      const el = m.getElement();
      if (!el) return;

      const dist = (idx - currentLedIndex + ledMarkers.length) % ledMarkers.length;
      if (dist < 4) {
        el.style.backgroundColor = "#ffffff";
        el.style.boxShadow = "0 0 16px #00ff88, 0 0 30px #00ff88";
        el.style.transform = "scale(1.6)";
      } else {
        el.style.backgroundColor = "#00ff88";
        el.style.boxShadow = "0 0 8px #00ff88";
        el.style.transform = "scale(1.0)";
      }
    });

    currentLedIndex = (currentLedIndex + 1) % ledMarkers.length;
  }, intervalMs);
}

// --- Metrics & HUD Update ---
function updateMetricsUI(result) {
  const headerStatus = document.getElementById("headerRouteStatus");
  const headerDistance = document.getElementById("headerDistance");
  const headerTime = document.getElementById("headerTime");

  if (result.success) {
    const targetNode = CITY_NODES.find(n => n.id === result.targetReached);
    headerStatus.textContent = `Path Found ➔ ${targetNode ? targetNode.name : 'Target'}`;
    headerStatus.className = "stat-val status-safe";
    headerDistance.textContent = `${result.totalDistance} m`;

    // Evacuation escape time calculated at typical 35 km/h urban speed (~580 m/min)
    const evacMinutes = (result.totalDistance / 550).toFixed(1);
    headerTime.textContent = `${evacMinutes} min`;
  } else {
    headerStatus.textContent = "TRAPPED (NO SAFE PATH)";
    headerStatus.className = "stat-val stat-alert";
    headerDistance.textContent = "Unreachable";
    headerTime.textContent = "--";
    showToast("CRITICAL WARNING", "🚨 All evacuation paths from the origin are completely blocked by hazards!", 5000);
  }
}

// --- Turn-by-Turn Directions ---
function updateTurnByTurnUI(result) {
  const list = document.getElementById("turnByTurnList");

  if (!result.success || result.pathRoads.length === 0) {
    list.innerHTML = `<div class="empty-state">No route available. Check blocked roads.</div>`;
    return;
  }

  list.innerHTML = "";
  const originNode = CITY_NODES.find(n => n.id === startNodeId);
  const targetNode = CITY_NODES.find(n => n.id === result.targetReached);

  // Origin step
  const origDiv = document.createElement("div");
  origDiv.className = "step-item";
  origDiv.style.borderLeftColor = "#ff0055";
  origDiv.innerHTML = `
    <span class="step-road">🚩 Depart: ${originNode.name}</span>
    <span class="step-meta">Begin evacuation via illuminated green LED route</span>
  `;
  list.appendChild(origDiv);

  // Each road step
  result.pathRoads.forEach((rId, idx) => {
    const road = CITY_ROADS.find(r => r.id === rId);
    const div = document.createElement("div");
    div.className = "step-item";
    div.innerHTML = `
      <span class="step-road">Step ${idx + 1}: ${road.name}</span>
      <span class="step-meta">Transit distance: ${road.distance} meters</span>
    `;
    list.appendChild(div);
  });

  // Safe zone Arrival step
  const destDiv = document.createElement("div");
  destDiv.className = "step-item";
  destDiv.style.borderLeftColor = "#00f2fe";
  destDiv.innerHTML = `
    <span class="step-road">🏁 Arrive: ${targetNode.name}</span>
    <span class="step-meta">Safe Sector reached! Medical and relief teams on standby.</span>
  `;
  list.appendChild(destDiv);
}

// --- Dynamic Toast Alert Helper ---
function showToast(title, message, duration = 3500) {
  const toast = document.getElementById("rerouteToast");
  const toastTitle = document.getElementById("toastTitle");
  const toastMsg = document.getElementById("toastMessage");

  toastTitle.textContent = title;
  toastMsg.textContent = message;
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, duration);
}

function updateRoadTooltips() {
  CITY_ROADS.forEach(road => {
    const poly = roadPolylines[road.id];
    if (showRoadLabels) {
      poly.bindTooltip(
        `<strong>${road.name}</strong><br>Distance: ${road.distance}m<br><em>Click to block/unblock</em>`,
        { sticky: true, className: "road-tooltip" }
      );
    } else {
      poly.unbindTooltip();
    }
  });
}
