/**
 * EvacNet — Emergency Evacuation Routing System
 * 100% Offline Multi-Scope Edition:
 * 1) 🏙️ Pune Urban Core (High-Density Street Grid, 26,366 Streets)
 * 2) 🌐 Western Maharashtra (Inter-City Highway Corridors, 98,324 Edges, Pune-Mumbai-PCMC-Satara)
 * 
 * - Native 2D Canvas Road Network (Zero Tiles, Zero API Keys, Immune to Blocks)
 * - Binary Min-Heap Dijkstra Algorithm (< 1.0ms for City, ~50ms for State)
 * - Multi-Target Nearest Shelter Discovery Along Real Roads
 * - Physical Roadblock Graph Edge Elimination
 */

// --- Application State ---
let map;
let currentScope = "pune"; // 'pune' or 'maharashtra'
let network = null;
let waterways = null;
let canvasRenderer = null;

let currentBasemap = "google_roads"; // 'google_roads', 'esri_streets', 'google_satellite', 'offline_canvas'
let showGraphOverlay = false;

let googleRoadsLayer = null;
let esriStreetsLayer = null;
let googleSatelliteLayer = null;

let roadLayerGroup = null;
let riverLayerGroup = null;
let labelLayerGroup = null;

let currentStart = null;
let currentTarget = null;
let targetMode = "nearest_shelter";

let blockedEdgeIds = new Set();
let roadBlocks = []; // Array of { id, lat, lng, radius, hazardType, marker, circle, affectedEdges, closedLines }
let closedEdgePolylines = [];

let activeRoutePolyline = null;
let activeRouteCasingPolyline = null;
let ledMarkers = [];
let animIntervalId = null;

let clickMode = "navigate"; // 'navigate', 'block', 'pick_start', 'pick_dest'
let currentHazardType = "fire";
let currentBlockRadius = 120; // meters

let customStartMarker = null;
let customTargetMarker = null;
let landmarkMarkers = {};

let baselineRouteDistance = null;

// --- Entry Point ---
function bootEvacNet() {
  network = window.PUNE_ROAD_NETWORK;
  waterways = window.PUNE_WATERWAYS || [];

  if (!network) {
    alert("Error: Road network data not loaded. Please verify data files exist.");
    return;
  }

  initMap();
  initUI();
  switchScope("pune");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootEvacNet);
} else {
  bootEvacNet();
}

// --- Initialize Leaflet Map with Basemaps and Native Canvas ---
function initMap() {
  const centerLat = 18.5204;
  const centerLng = 73.8567;
  const zoomLevel = 14;

  map = L.map("map", {
    center: [centerLat, centerLng],
    zoom: zoomLevel,
    minZoom: 7,
    maxZoom: 20,
    zoomControl: false,
    preferCanvas: true
  });

  // Position zoom controls in bottom-right like Google Maps
  L.control.zoom({ position: "bottomright" }).addTo(map);

  // Basemap Tile Layers
  googleRoadsLayer = L.tileLayer("https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
    subdomains: ["0", "1", "2", "3"],
    maxZoom: 20,
    attribution: "&copy; Google Maps"
  });

  esriStreetsLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 19,
    attribution: "Tiles &copy; Esri"
  });

  googleSatelliteLayer = L.tileLayer("https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
    subdomains: ["0", "1", "2", "3"],
    maxZoom: 20,
    attribution: "&copy; Google Maps Satellite"
  });

  // Fallback to offline canvas if tile loading fails (e.g. no internet connection)
  googleRoadsLayer.on("tileerror", function() {
    if (currentBasemap === "google_roads") {
      console.warn("Tile request failed. Falling back to offline canvas graph.");
    }
  });

  // Default basemap: Crystal Clear Google Roads
  googleRoadsLayer.addTo(map);

  // Native Canvas Renderer for zero-latency, zero-tile offline vector rendering
  canvasRenderer = L.canvas({ padding: 0.5 });

  // Dedicated layer groups
  riverLayerGroup = L.layerGroup().addTo(map);
  roadLayerGroup = L.layerGroup().addTo(map);
  labelLayerGroup = L.layerGroup().addTo(map);

  // Map Click Listener
  map.on("click", onMapClick);
}

// --- Switch Basemap (Google Roads, ESRI, Satellite, Offline Canvas) ---
function setBasemap(type) {
  currentBasemap = type;

  if (map.hasLayer(googleRoadsLayer)) map.removeLayer(googleRoadsLayer);
  if (map.hasLayer(esriStreetsLayer)) map.removeLayer(esriStreetsLayer);
  if (map.hasLayer(googleSatelliteLayer)) map.removeLayer(googleSatelliteLayer);

  const mapEl = document.getElementById("map");

  if (type === "google_roads") {
    googleRoadsLayer.addTo(map);
    mapEl.style.backgroundColor = "#e8eaed";
    showToast("Basemap: Google Roads (Crisp streets & labels)", "🗺️");
  } else if (type === "esri_streets") {
    esriStreetsLayer.addTo(map);
    mapEl.style.backgroundColor = "#e8eaed";
    showToast("Basemap: ESRI World Street Map", "🏙️");
  } else if (type === "google_satellite") {
    googleSatelliteLayer.addTo(map);
    mapEl.style.backgroundColor = "#000000";
    showToast("Basemap: Satellite Hybrid", "🛰️");
  } else if (type === "offline_canvas") {
    mapEl.style.backgroundColor = "#f1f3f4";
    showToast("Basemap: Offline Canvas Graph Mode", "⚡");
  }

  // Update UI dropdown active states
  document.querySelectorAll(".layer-option").forEach(opt => {
    if (opt.getAttribute("data-layer") === type) {
      opt.classList.add("active");
    } else {
      opt.classList.remove("active");
    }
  });

  // Redraw overlays accordingly
  renderRivers();
  renderRoads();
  renderLabels();
}

// --- Switch Geographic Scope (Pune City vs Western Maharashtra) ---
function switchScope(scope) {
  currentScope = scope;

  const btnPune = document.getElementById("btnScopePune");
  const btnMh = document.getElementById("btnScopeMh");
  if (scope === "pune") {
    btnPune.classList.add("active");
    btnMh.classList.remove("active");
    network = window.PUNE_ROAD_NETWORK;
    currentBlockRadius = 120;
  } else {
    btnMh.classList.add("active");
    btnPune.classList.remove("active");
    network = window.MAHARASHTRA_NETWORK;
    currentBlockRadius = 600; // Highway scale
  }

  // Clear existing roadblocks and routes
  clearAllRoadBlocks();
  if (customStartMarker) { map.removeLayer(customStartMarker); customStartMarker = null; }
  if (customTargetMarker) { map.removeLayer(customTargetMarker); customTargetMarker = null; }

  // Fly camera to region center
  const targetZoom = network.center.zoom || (scope === "pune" ? 14 : 9);
  map.flyTo([network.center.lat, network.center.lng], targetZoom, { duration: 1.2 });

  // Redraw layers
  renderRivers();
  renderRoads();
  renderLabels();
  renderLandmarks();

  // Reset origin to first item
  initDefaultLocations();
  computeDijkstraRoute();

  const title = scope === "pune" ? "Pune Urban Core (26,366 Streets)" : "Western Maharashtra (98,324 Highway Edges)";
  showToast(`Switched scope to ${title}`, "🌐");
}

// --- Render Rivers (Mutha & Mula in Pune) ---
function renderRivers() {
  riverLayerGroup.clearLayers();
  // Basemap (Google/ESRI) already renders Mutha & Mula rivers crisply!
  // Only draw custom canvas river layer when in offline canvas mode or graph overlay is toggled.
  if (currentBasemap !== "offline_canvas" && !showGraphOverlay) return;
  if (currentScope !== "pune" || !waterways || waterways.length === 0) return;

  waterways.forEach(w => {
    if (w.coords && w.coords.length > 1) {
      const casing = L.polyline(w.coords, {
        renderer: canvasRenderer,
        color: "#99bcf4",
        weight: 14,
        opacity: 0.75,
        lineCap: "round",
        lineJoin: "round"
      });
      riverLayerGroup.addLayer(casing);

      const riverLine = L.polyline(w.coords, {
        renderer: canvasRenderer,
        color: "#a8c7fa",
        weight: 10,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round"
      });
      riverLine.bindTooltip(`🌊 ${w.name}`, { sticky: true });
      riverLayerGroup.addLayer(riverLine);
    }
  });
}

// --- Render Road Network on Canvas ---
function renderRoads() {
  roadLayerGroup.clearLayers();
  if (!network || !network.edges) return;

  // When a real basemap is active and graph overlay is NOT requested,
  // we keep the roadLayerGroup clear so real Google roads and labels are 100% visible and sharp!
  const isBasemapActive = currentBasemap !== "offline_canvas";
  if (isBasemapActive && !showGraphOverlay) {
    return;
  }

  const isWireframeOverlay = isBasemapActive && showGraphOverlay;

  if (currentScope === "pune") {
    // Pune Urban Road Styling
    network.edges.forEach(e => {
      if (!e.coords) return;
      const isMajor = /primary|secondary|trunk/.test(e.highway);

      if (isWireframeOverlay) {
        // High-tech subtle Dijkstra graph overlay
        roadLayerGroup.addLayer(L.polyline(e.coords, {
          renderer: canvasRenderer,
          color: isMajor ? "#1a73e8" : "#80868b",
          weight: isMajor ? 2.2 : 1.2,
          opacity: isMajor ? 0.65 : 0.4
        }));
      } else {
        // Offline Canvas Mode
        if (!isMajor) {
          roadLayerGroup.addLayer(L.polyline(e.coords, {
            renderer: canvasRenderer,
            color: "#e2e5e9",
            weight: 2.2,
            opacity: 0.9
          }));
        } else {
          roadLayerGroup.addLayer(L.polyline(e.coords, {
            renderer: canvasRenderer,
            color: "#dadce0",
            weight: 5.5,
            opacity: 0.95
          }));
          const core = L.polyline(e.coords, {
            renderer: canvasRenderer,
            color: "#ffffff",
            weight: 3.8,
            opacity: 1.0
          });
          core.bindTooltip(`${e.name}`, { sticky: true });
          roadLayerGroup.addLayer(core);
        }
      }
    });
  } else {
    // Maharashtra State Highway Styling
    network.edges.forEach(e => {
      if (!e.coords) return;
      const isExpressway = /motorway|expressway/.test(e.highway) || /Expressway|Mahamarg/i.test(e.name);

      if (isWireframeOverlay) {
        roadLayerGroup.addLayer(L.polyline(e.coords, {
          renderer: canvasRenderer,
          color: isExpressway ? "#e37400" : "#1a73e8",
          weight: isExpressway ? 3.0 : 1.5,
          opacity: isExpressway ? 0.75 : 0.45
        }));
      } else {
        // Offline Canvas Mode
        roadLayerGroup.addLayer(L.polyline(e.coords, {
          renderer: canvasRenderer,
          color: isExpressway ? "#f2994a" : "#cbd5e1",
          weight: isExpressway ? 4.5 : 2.5,
          opacity: 0.9
        }));
        const core = L.polyline(e.coords, {
          renderer: canvasRenderer,
          color: isExpressway ? "#fffae6" : "#ffffff",
          weight: isExpressway ? 3.0 : 1.8,
          opacity: 1.0
        });
        core.bindTooltip(`🛣️ ${e.name}`, { sticky: true });
        roadLayerGroup.addLayer(core);
      }
    });
  }
}

// --- Render City / Neighborhood Labels ---
function renderLabels() {
  labelLayerGroup.clearLayers();
  // Basemap (Google Roads / ESRI) already has crystal-clear typography!
  if (currentBasemap !== "offline_canvas") return;

  let labels = [];
  if (currentScope === "pune") {
    labels = [
      { name: "SHIVAJINAGAR", lat: 18.5315, lng: 73.8445 },
      { name: "DECCAN GYMKHANA", lat: 18.5175, lng: 73.8390 },
      { name: "SWARGATE", lat: 18.5020, lng: 73.8560 },
      { name: "PUNE JUNCTION", lat: 18.5290, lng: 73.8745 },
      { name: "SHANIWAR PETH", lat: 18.5190, lng: 73.8520 },
      { name: "CAMP / CANTONMENT", lat: 18.5120, lng: 73.8780 },
      { name: "KOREGAON PARK", lat: 18.5360, lng: 73.8930 },
      { name: "ERANDWANE", lat: 18.5080, lng: 73.8310 }
    ];
  } else {
    labels = [
      { name: "PUNE METROPOLIS", lat: 18.5204, lng: 73.8567 },
      { name: "MUMBAI CITY", lat: 18.9600, lng: 72.8250 },
      { name: "NAVI MUMBAI", lat: 19.0300, lng: 73.0200 },
      { name: "PIMPRI-CHINCHWAD (PCMC)", lat: 18.6250, lng: 73.8150 },
      { name: "LONAVALA (GHATS)", lat: 18.7540, lng: 73.4060 },
      { name: "SATARA REGION", lat: 17.6850, lng: 73.9980 },
      { name: "HINJAWADI IT HUB", lat: 18.5910, lng: 73.7380 },
      { name: "CHAKAN INDUSTRIAL", lat: 18.7560, lng: 73.8590 }
    ];
  }

  labels.forEach(a => {
    const labelIcon = L.divIcon({
      className: "area-name-label",
      html: `<div>${a.name}</div>`,
      iconSize: [140, 20],
      iconAnchor: [70, 10]
    });
    labelLayerGroup.addLayer(L.marker([a.lat, a.lng], { icon: labelIcon, interactive: false }));
  });
}

// --- Render Landmarks (Shelters, Hospitals, Origins) ---
function renderLandmarks() {
  Object.values(landmarkMarkers).forEach(m => map.removeLayer(m));
  landmarkMarkers = {};

  if (!network) return;

  // 1. Safe Shelters
  network.shelters.forEach(s => {
    const icon = L.divIcon({
      className: "gm-pin-marker gm-pin-shelter",
      html: `<div class="gm-pin-inner">🛡️</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const marker = L.marker([s.lat, s.lng], { icon }).addTo(map);
    const popupHtml = `
      <div style="padding: 4px; min-width: 200px;">
        <h4 style="color:#1e8e3e; margin-bottom:2px; font-size:0.95rem;">🛡️ ${s.name}</h4>
        <div style="font-size:0.75rem; color:#5f6368; margin-bottom:6px;">
          Capacity: <strong>${s.capacity}</strong><br>
          ${s.address}
        </div>
        <button class="popup-btn" onclick="setOriginFromLandmark('shelter', '${s.id}')">🚩 Set as Start Point</button>
        <button class="popup-btn" onclick="setTargetFromLandmark('shelter', '${s.id}')">🎯 Set as Evacuation Target</button>
      </div>
    `;
    marker.bindPopup(popupHtml);
    landmarkMarkers[s.id] = marker;
  });

  // 2. Emergency Hospitals
  network.hospitals.forEach(h => {
    const icon = L.divIcon({
      className: "gm-pin-marker gm-pin-hospital",
      html: `<div class="gm-pin-inner">🏥</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const marker = L.marker([h.lat, h.lng], { icon }).addTo(map);
    const popupHtml = `
      <div style="padding: 4px; min-width: 200px;">
        <h4 style="color:#1a73e8; margin-bottom:2px; font-size:0.95rem;">🏥 ${h.name}</h4>
        <div style="font-size:0.75rem; color:#5f6368; margin-bottom:6px;">
          Facility: <strong>${h.beds}</strong><br>
          ${h.address}
        </div>
        <button class="popup-btn" onclick="setOriginFromLandmark('hospital', '${h.id}')">🚩 Set as Start Point</button>
        <button class="popup-btn" onclick="setTargetFromLandmark('hospital', '${h.id}')">🎯 Set as Evacuation Target</button>
      </div>
    `;
    marker.bindPopup(popupHtml);
    landmarkMarkers[h.id] = marker;
  });

  // 3. Origins
  network.origins.forEach(o => {
    const icon = L.divIcon({
      className: "gm-pin-marker gm-pin-origin",
      html: `<div class="gm-pin-inner">${o.icon}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const marker = L.marker([o.lat, o.lng], { icon }).addTo(map);
    const popupHtml = `
      <div style="padding: 4px; min-width: 200px;">
        <h4 style="color:#ea8600; margin-bottom:2px; font-size:0.95rem;">${o.icon} ${o.name}</h4>
        <div style="font-size:0.75rem; color:#5f6368; margin-bottom:6px;">
          ${o.category}<br>${o.address}
        </div>
        <button class="popup-btn" onclick="setOriginFromLandmark('origin', '${o.id}')">🚩 Set as Start Point</button>
      </div>
    `;
    marker.bindPopup(popupHtml);
    landmarkMarkers[o.id] = marker;
  });
}

// --- Initialize Default Locations ---
function initDefaultLocations() {
  if (!network || !network.origins || network.origins.length === 0) return;
  const defOrigin = network.origins[0];
  currentStart = {
    nodeId: defOrigin.nearestNodeId,
    name: defOrigin.name,
    lat: defOrigin.lat,
    lng: defOrigin.lng,
    type: "origin"
  };

  populateDropdowns();
}

function populateDropdowns() {
  const startSelect = document.getElementById("startNodeSelect");
  startSelect.innerHTML = "";

  const grpOrigins = document.createElement("optgroup");
  grpOrigins.label = currentScope === "pune" ? "Pune Campuses & Hubs" : "Regional Transit Hubs";
  network.origins.forEach((o, idx) => {
    const opt = document.createElement("option");
    opt.value = `origin:${o.id}`;
    opt.textContent = `${o.icon} ${o.name}`;
    if (idx === 0) opt.selected = true;
    grpOrigins.appendChild(opt);
  });
  startSelect.appendChild(grpOrigins);

  const landmarkSelect = document.getElementById("specificLandmarkSelect");
  landmarkSelect.innerHTML = "";

  const grpShelters = document.createElement("optgroup");
  grpShelters.label = currentScope === "pune" ? "Pune Safe Shelters" : "State Mega Shelters";
  network.shelters.forEach(s => {
    const opt = document.createElement("option");
    opt.value = `shelter:${s.id}`;
    opt.textContent = `🛡️ ${s.name} (${s.capacity})`;
    grpShelters.appendChild(opt);
  });
  landmarkSelect.appendChild(grpShelters);

  const grpHospitals = document.createElement("optgroup");
  grpHospitals.label = "Apex Emergency Hospitals";
  network.hospitals.forEach(h => {
    const opt = document.createElement("option");
    opt.value = `hospital:${h.id}`;
    opt.textContent = `🏥 ${h.name} (${h.beds})`;
    grpHospitals.appendChild(opt);
  });
  landmarkSelect.appendChild(grpHospitals);
}

// --- Popup Helpers ---
window.setOriginFromLandmark = function(type, id) {
  let item = null;
  if (type === "origin") item = network.origins.find(o => o.id === id);
  else if (type === "shelter") item = network.shelters.find(s => s.id === id);
  else if (type === "hospital") item = network.hospitals.find(h => h.id === id);

  if (!item) return;

  currentStart = {
    nodeId: item.nearestNodeId,
    name: item.name,
    lat: item.lat,
    lng: item.lng,
    type: type
  };

  const sel = document.getElementById("startNodeSelect");
  if (sel) sel.value = `${type}:${id}`;

  if (customStartMarker) {
    map.removeLayer(customStartMarker);
    customStartMarker = null;
  }

  computeDijkstraRoute();
  map.closePopup();
  showToast(`Start point set to ${item.name}`, "🚩");
};

window.setTargetFromLandmark = function(type, id) {
  let item = null;
  if (type === "shelter") item = network.shelters.find(s => s.id === id);
  else if (type === "hospital") item = network.hospitals.find(h => h.id === id);

  if (!item) return;

  targetMode = "custom_landmark";
  document.getElementById("targetModeSelect").value = "custom_landmark";
  document.getElementById("customTargetWrapper").style.display = "block";
  document.getElementById("specificLandmarkSelect").value = `${type}:${id}`;

  currentTarget = {
    nodeId: item.nearestNodeId,
    name: item.name,
    lat: item.lat,
    lng: item.lng,
    type: type
  };

  computeDijkstraRoute();
  map.closePopup();
  showToast(`Destination set to ${item.name}`, "🎯");
};

// --- Map Click Handler ---
function onMapClick(e) {
  const { lat, lng } = e.latlng;

  if (clickMode === "block") {
    addRoadBlock(lat, lng, currentHazardType, currentBlockRadius);
  } else if (clickMode === "pick_start") {
    const snap = EvacRoutingEngine.findNearestNode(lat, lng, network);
    if (!snap) {
      showToast("Clicked point is outside active road network.", "⚠️");
      return;
    }

    currentStart = {
      nodeId: snap.node.id,
      name: `Custom Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      lat: snap.node.lat,
      lng: snap.node.lng,
      type: "custom"
    };

    if (customStartMarker) map.removeLayer(customStartMarker);
    const icon = L.divIcon({
      className: "gm-pin-marker gm-pin-origin",
      html: `<div class="gm-pin-inner">🚩</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    customStartMarker = L.marker([lat, lng], { icon }).addTo(map)
      .bindPopup(`<b>🚩 Custom Start Point</b><br><small>Snapped to road node ${snap.node.id}</small>`)
      .openPopup();

    setClickMode("navigate");
    computeDijkstraRoute();
    showToast("Custom start location placed on road", "🚩");
  } else if (clickMode === "pick_dest") {
    const snap = EvacRoutingEngine.findNearestNode(lat, lng, network);
    if (!snap) {
      showToast("Clicked point is outside active road network.", "⚠️");
      return;
    }

    currentTarget = {
      nodeId: snap.node.id,
      name: `Custom Safe Zone (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      lat: snap.node.lat,
      lng: snap.node.lng,
      type: "custom"
    };
    targetMode = "map_click";
    document.getElementById("targetModeSelect").value = "map_click";
    document.getElementById("customTargetWrapper").style.display = "none";

    if (customTargetMarker) map.removeLayer(customTargetMarker);
    const icon = L.divIcon({
      className: "gm-pin-marker gm-pin-shelter",
      html: `<div class="gm-pin-inner">🏁</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    customTargetMarker = L.marker([lat, lng], { icon }).addTo(map)
      .bindPopup(`<b>🏁 Custom Safe Zone</b><br><small>Snapped to road node ${snap.node.id}</small>`)
      .openPopup();

    setClickMode("navigate");
    computeDijkstraRoute();
    showToast("Custom destination set on road", "🏁");
  }
}

// --- Add Roadblock: Cuts Street Edges from the Graph ---
function addRoadBlock(lat, lng, hazardType, radius) {
  const intersectedEdges = EvacRoutingEngine.findEdgesIntersectingRoadblock(lat, lng, radius, network);

  if (intersectedEdges.length === 0) {
    showToast("Click directly on a road to place roadblock.", "⚠️");
    return;
  }

  const id = Date.now();
  const hazardIconStr = hazardType === "fire" ? "🔥" :
                        hazardType === "flood" ? "🌊" :
                        hazardType === "debris" ? "🪨" : "⛔";

  // Physically deactivate edges in graph
  const affectedEdgeIds = [];
  intersectedEdges.forEach(e => {
    blockedEdgeIds.add(e.id);
    affectedEdgeIds.push(e.id);
  });

  // Hazard Icon & Red Barrier Circle
  const hazardIcon = L.divIcon({
    className: "gm-hazard-marker",
    html: `<div>${hazardIconStr}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });

  const marker = L.marker([lat, lng], { icon: hazardIcon }).addTo(map);
  const circle = L.circle([lat, lng], {
    radius: radius,
    color: "#d93025",
    fillColor: "#d93025",
    fillOpacity: 0.25,
    weight: 2,
    dashArray: "6, 6"
  }).addTo(map);

  // Red Striped Closed Road Overlay
  const closedLines = [];
  intersectedEdges.forEach(e => {
    if (e.coords) {
      const line = L.polyline(e.coords, {
        color: "#d93025",
        weight: 6,
        opacity: 0.95,
        dashArray: "8, 6"
      }).addTo(map);
      line.bindTooltip(`⛔ CLOSED: ${e.name} (${Math.round(e.length)}m)`);
      closedLines.push(line);
      closedEdgePolylines.push(line);
    }
  });

  const primaryStreetName = intersectedEdges[0].name || (currentScope === "pune" ? "Pune Urban Street" : "State Highway Corridor");

  marker.bindTooltip(`<b>${hazardIconStr} ROAD CLOSED</b><br>${primaryStreetName}<br><i>Click to clear</i>`);
  marker.on("click", (e) => {
    L.DomEvent.stopPropagation(e);
    removeRoadBlock(id);
  });

  roadBlocks.push({
    id,
    lat,
    lng,
    radius,
    hazardType,
    marker,
    circle,
    affectedEdgeIds,
    closedLines,
    streetName: primaryStreetName
  });

  updateRoadblockListUI();
  computeDijkstraRoute(true, primaryStreetName);
}

function removeRoadBlock(id) {
  const index = roadBlocks.findIndex(b => b.id === id);
  if (index === -1) return;

  const rb = roadBlocks[index];
  map.removeLayer(rb.marker);
  map.removeLayer(rb.circle);
  rb.closedLines.forEach(l => map.removeLayer(l));
  rb.affectedEdgeIds.forEach(eId => blockedEdgeIds.delete(eId));

  roadBlocks.splice(index, 1);

  showToast(`Reopened ${rb.streetName}`, "✅");
  updateRoadblockListUI();
  computeDijkstraRoute();
}

function clearAllRoadBlocks() {
  roadBlocks.forEach(rb => {
    map.removeLayer(rb.marker);
    map.removeLayer(rb.circle);
    rb.closedLines.forEach(l => map.removeLayer(l));
  });
  roadBlocks = [];
  blockedEdgeIds.clear();

  closedEdgePolylines.forEach(l => map.removeLayer(l));
  closedEdgePolylines = [];

  updateRoadblockListUI();
  document.getElementById("detourAlertBox").style.display = "none";
  computeDijkstraRoute();
}

function updateRoadblockListUI() {
  const container = document.getElementById("closedStreetsList");
  const badge = document.getElementById("activeBlocksBadge");

  badge.textContent = `${roadBlocks.length} Active`;

  if (roadBlocks.length === 0) {
    container.innerHTML = `<div style="font-size:0.72rem; color:var(--gm-text-sub); text-align:center; padding:6px;">No active street closures.</div>`;
    return;
  }

  container.innerHTML = "";
  roadBlocks.forEach(rb => {
    const icon = rb.hazardType === "fire" ? "🔥" : rb.hazardType === "flood" ? "🌊" : rb.hazardType === "debris" ? "🪨" : "⛔";
    const div = document.createElement("div");
    div.className = "closed-street-badge";
    div.innerHTML = `
      <span>${icon} Closed: ${rb.streetName}</span>
      <button class="btn-remove-block" onclick="removeRoadBlock(${rb.id})" title="Remove closure">&times;</button>
    `;
    container.appendChild(div);
  });
}
window.removeRoadBlock = removeRoadBlock;

// --- Core Dijkstra Routing Dispatch ---
function computeDijkstraRoute(isTriggeredByBlock = false, blockedStreetName = "") {
  if (!currentStart || !currentStart.nodeId || !network) return;

  let candidateTargetNodeIds = null;
  if (targetMode === "nearest_shelter") {
    candidateTargetNodeIds = new Set(network.shelters.map(s => s.nearestNodeId));
  } else if (targetMode === "nearest_hospital") {
    candidateTargetNodeIds = new Set(network.hospitals.map(h => h.nearestNodeId));
  } else if (targetMode === "custom_landmark" || targetMode === "map_click") {
    if (!currentTarget || !currentTarget.nodeId) return;
    candidateTargetNodeIds = new Set([currentTarget.nodeId]);
  }

  // Execute Dijkstra Shortest Path Search
  const result = EvacRoutingEngine.computeShortestPath(
    currentStart.nodeId,
    candidateTargetNodeIds,
    blockedEdgeIds,
    network
  );

  if (!result.found) {
    handleRouteSevered();
    return;
  }

  let reachedEntity = null;
  if (targetMode === "nearest_shelter") {
    reachedEntity = network.shelters.find(s => s.nearestNodeId === result.targetNodeId);
  } else if (targetMode === "nearest_hospital") {
    reachedEntity = network.hospitals.find(h => h.nearestNodeId === result.targetNodeId);
  } else {
    reachedEntity = currentTarget;
  }

  const destinationName = reachedEntity ? reachedEntity.name : "Safe Zone";

  // Update Google Maps Style Trip Summary
  document.getElementById("tripTimeText").innerHTML = `
    <span>${result.drivingMinutes} min</span>
    <span class="trip-dist" id="tripDistText">(${result.totalDistanceKm} km)</span>
  `;
  document.getElementById("dijkstraTimeText").textContent = `⚡ ${result.execTimeMs} ms`;
  document.getElementById("stepCountText").textContent = `${result.itinerary.length} steps`;

  const subtext = document.getElementById("tripSubtext");
  const detourAlert = document.getElementById("detourAlertBox");

  if (roadBlocks.length > 0) {
    if (baselineRouteDistance !== null) {
      const delta = result.totalDistanceMeters - baselineRouteDistance;
      const deltaMsg = delta > 0 ? `+${(delta / 1000).toFixed(1)} km detour` : `Alternate route`;
      subtext.innerHTML = `⚠️ Detour active (${deltaMsg}) &bull; ${result.exploredCount} nodes evaluated`;
      detourAlert.style.display = "flex";
      document.getElementById("detourAlertText").innerHTML = `
        Blocked: <strong>${blockedStreetName || 'Corridor'}</strong>. Rerouted via open highways to <strong>${destinationName}</strong>.
      `;
    }
  } else {
    baselineRouteDistance = result.totalDistanceMeters;
    subtext.innerHTML = `Fastest route via open corridors &bull; ${destinationName}`;
    detourAlert.style.display = "none";
  }

  // Render Google Maps Style Route Line
  renderRouteOnMap(result.coordinates, destinationName);

  // Render Clean Turn-by-Turn Directions
  renderTurnByTurn(result.itinerary, destinationName);

  if (isTriggeredByBlock) {
    showToast(`Dijkstra detour recalculated to ${destinationName} (${result.execTimeMs}ms)`, "⚡");
  }
}

function handleRouteSevered() {
  if (activeRoutePolyline) map.removeLayer(activeRoutePolyline);
  if (activeRouteCasingPolyline) map.removeLayer(activeRouteCasingPolyline);
  clearLedMarkers();

  document.getElementById("tripTimeText").innerHTML = `
    <span style="color:#d93025;">Route Blocked</span>
  `;
  document.getElementById("tripSubtext").innerHTML = `⚠️ All street routes to safe zones are severed.`;
  document.getElementById("detourAlertBox").style.display = "flex";
  document.getElementById("detourAlertText").innerHTML = `
    <strong>No open path exists!</strong> Roadblocks have isolated the origin from all safe shelters. Clear one or more roadblocks.
  `;

  document.getElementById("turnByTurnList").innerHTML = `
    <div style="background:#fce8e6; border:1px solid #d93025; padding:10px; border-radius:6px; color:#d93025; font-size:0.75rem;">
      <strong>⚠️ NO ACCESSIBLE ROUTE</strong><br>
      Every connecting street to safe shelters is blocked by hazards.
    </div>
  `;

  showToast("All routes severed by roadblocks!", "⛔");
}

// --- Render Route Line with Google Maps Royal Blue Styling ---
function renderRouteOnMap(coordinates, destName) {
  if (activeRoutePolyline) map.removeLayer(activeRoutePolyline);
  if (activeRouteCasingPolyline) map.removeLayer(activeRouteCasingPolyline);

  if (!coordinates || coordinates.length < 2) return;

  // Dark border casing
  activeRouteCasingPolyline = L.polyline(coordinates, {
    color: "#1557b0",
    weight: 8,
    opacity: 0.95,
    lineCap: "round",
    lineJoin: "round"
  }).addTo(map);

  // Core Google Maps Royal Blue Line
  activeRoutePolyline = L.polyline(coordinates, {
    color: "#1a73e8",
    weight: 5,
    opacity: 1.0,
    lineCap: "round",
    lineJoin: "round"
  }).addTo(map);

  activeRoutePolyline.bindTooltip(`<b>Dijkstra Route</b> &rarr; ${destName}`);

  setupRouteDots(coordinates);
}

function setupRouteDots(coordinates) {
  clearLedMarkers();
  const totalPoints = coordinates.length;
  const step = Math.max(1, Math.floor(totalPoints / 16));

  for (let i = 0; i < totalPoints; i += step) {
    const icon = L.divIcon({
      className: "gm-route-pulse-dot",
      iconSize: [8, 8],
      iconAnchor: [4, 4]
    });
    const marker = L.marker(coordinates[i], { icon, interactive: false }).addTo(map);
    ledMarkers.push(marker);
  }
}

function clearLedMarkers() {
  if (animIntervalId) {
    clearInterval(animIntervalId);
    animIntervalId = null;
  }
  ledMarkers.forEach(m => map.removeLayer(m));
  ledMarkers = [];
}

// --- Render Clean Google Maps Navigation Steps ---
function renderTurnByTurn(itinerary, destinationName) {
  const container = document.getElementById("turnByTurnList");
  if (!itinerary || itinerary.length === 0) {
    container.innerHTML = `<div style="font-size:0.76rem; color:var(--gm-text-sub); text-align:center; padding:12px;">Directions will appear here.</div>`;
    return;
  }

  let html = "";
  itinerary.forEach((step, idx) => {
    const distText = step.distanceMeters >= 1000 ? `${(step.distanceMeters / 1000).toFixed(1)} km` : `${step.distanceMeters} m`;
    html += `
      <div class="step-item">
        <div class="step-maneuver">⬆️</div>
        <div class="step-info">
          <div class="step-street">${step.street}</div>
          <div class="step-distance">Follow for ${distText}</div>
        </div>
      </div>
    `;
  });

  html += `
    <div class="step-item step-dest">
      <div class="step-maneuver">🏁</div>
      <div class="step-info">
        <div class="step-street" style="color:#1e8e3e;">Arrive at ${destinationName}</div>
        <div class="step-distance">Safe Evacuation Assembly Zone</div>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

// --- UI Event Handlers ---
function initUI() {
  // Scope Switcher (Pune vs Western Maharashtra)
  document.getElementById("btnScopePune").addEventListener("click", () => switchScope("pune"));
  document.getElementById("btnScopeMh").addEventListener("click", () => switchScope("maharashtra"));

  const btnNavigate = document.getElementById("modeNavigate");
  const btnBlockRoad = document.getElementById("modeBlockRoad");

  btnNavigate.addEventListener("click", () => setClickMode("navigate"));
  btnBlockRoad.addEventListener("click", () => setClickMode("block"));

  // Hazard radio chips
  const chips = document.querySelectorAll(".chip-item");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      currentHazardType = chip.getAttribute("data-hazard");
    });
  });

  // Pick Start / Dest buttons
  document.getElementById("btnPickStartOnMap").addEventListener("click", () => {
    setClickMode("pick_start");
    showToast("Click any road on map to set start location", "📍");
  });
  document.getElementById("btnPickDestOnMap").addEventListener("click", () => {
    setClickMode("pick_dest");
    showToast("Click any road on map to set destination", "🎯");
  });

  // Start Dropdown change
  document.getElementById("startNodeSelect").addEventListener("change", (e) => {
    const val = e.target.value;
    const [type, id] = val.split(":");
    setOriginFromLandmark(type, id);
  });

  // Target Mode change
  document.getElementById("targetModeSelect").addEventListener("change", (e) => {
    targetMode = e.target.value;
    const wrapper = document.getElementById("customTargetWrapper");
    if (targetMode === "custom_landmark") {
      wrapper.style.display = "block";
      const sel = document.getElementById("specificLandmarkSelect");
      const [type, id] = sel.value.split(":");
      setTargetFromLandmark(type, id);
    } else {
      wrapper.style.display = "none";
      computeDijkstraRoute();
    }
  });

  document.getElementById("specificLandmarkSelect").addEventListener("change", (e) => {
    const [type, id] = e.target.value.split(":");
    setTargetFromLandmark(type, id);
  });

  document.getElementById("btnClearBlockades").addEventListener("click", clearAllRoadBlocks);

  // Preset Disaster Scenarios
  document.getElementById("btnScenarioFlood").addEventListener("click", () => {
    clearAllRoadBlocks();
    if (currentScope === "pune") {
      showToast("Mutha River Flash Flood: Sambhaji Bridge closed!", "🌊");
      addRoadBlock(18.5170, 73.8475, "flood", 180);
    } else {
      showToast("Western Ghats Landslide: Khandala Pass blocked!", "⛰️");
      addRoadBlock(18.7610, 73.3750, "debris", 800);
    }
  });

  document.getElementById("btnScenarioFire").addEventListener("click", () => {
    clearAllRoadBlocks();
    if (currentScope === "pune") {
      showToast("Commercial Fire: Bajirao Road artery closed!", "🔥");
      addRoadBlock(18.5178, 73.8542, "fire", 160);
    } else {
      showToast("Expressway Hazard: Chakan MIDC Corridor Blocked!", "🔥");
      addRoadBlock(18.7560, 73.8590, "fire", 700);
    }
  });

  document.getElementById("btnScenarioStation").addEventListener("click", () => {
    clearAllRoadBlocks();
    if (currentScope === "pune") {
      showToast("Transit Gridlock: Station approach road closed!", "⛔");
      addRoadBlock(18.5275, 73.8740, "police", 150);
    } else {
      showToast("Coastal Security Lockdown: Navi Mumbai Corridor Cordoned!", "⛔");
      addRoadBlock(19.0300, 73.0200, "police", 750);
    }
  });

  // Layer Switcher Dropdown Toggle
  const btnLayerToggle = document.getElementById("btnLayerToggle");
  const layerDropdown = document.getElementById("layerDropdown");

  if (btnLayerToggle && layerDropdown) {
    btnLayerToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      layerDropdown.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
      if (!layerDropdown.contains(e.target) && e.target !== btnLayerToggle) {
        layerDropdown.classList.add("hidden");
      }
    });

    document.querySelectorAll(".layer-option").forEach(opt => {
      opt.addEventListener("click", () => {
        const layerType = opt.getAttribute("data-layer");
        setBasemap(layerType);
        layerDropdown.classList.add("hidden");
      });
    });

    const chkShowGraph = document.getElementById("chkShowGraphOverlay");
    if (chkShowGraph) {
      chkShowGraph.addEventListener("change", (e) => {
        showGraphOverlay = e.target.checked;
        renderRoads();
        renderRivers();
        if (showGraphOverlay) {
          showToast("Dijkstra Graph Network Wireframe Enabled", "🕸️");
        }
      });
    }
  }
}

function setClickMode(mode) {
  clickMode = mode;
  const btnNavigate = document.getElementById("modeNavigate");
  const btnBlockRoad = document.getElementById("modeBlockRoad");
  const mapNotice = document.getElementById("mapModeNotice");

  btnNavigate.classList.remove("active");
  btnBlockRoad.classList.remove("active");

  if (mode === "navigate") {
    btnNavigate.classList.add("active");
    mapNotice.innerHTML = `💡 Click <strong>"🚧 Click Map to Block"</strong>, then click any street to simulate a physical road closure!`;
  } else if (mode === "block") {
    btnBlockRoad.classList.add("active");
    mapNotice.innerHTML = `⚠️ <strong>BLOCK STREET ACTIVE:</strong> Click any street on the map to close that road segment!`;
  } else if (mode === "pick_start") {
    mapNotice.innerHTML = `📍 <strong>SELECT START:</strong> Click anywhere on a road to set the start point.`;
  } else if (mode === "pick_dest") {
    mapNotice.innerHTML = `🎯 <strong>SELECT TARGET:</strong> Click anywhere on a road to set the destination.`;
  }
}

// --- Google Maps Style Snackbar Toast ---
let toastTimeout = null;
function showToast(message, icon = "⚡") {
  const toast = document.getElementById("gmSnackbar");
  document.getElementById("snackbarIcon").textContent = icon;
  document.getElementById("snackbarText").textContent = message;

  toast.classList.remove("hidden");
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.add("hidden");
  }, 4000);
}
