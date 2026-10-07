/**
 * EvacNet — Original Map Edition
 * Real-World OpenStreetMap Routing, Dynamic Roadblock Detours, and Glowing LED Guidance
 */

// --- Pre-configured City Landmarks on Real Streets (Metropolitan Sector) ---
const INITIAL_LANDMARKS = [
  { id: 0, name: "City Hall Plaza", type: "commercial", lat: 40.7128, lng: -74.0060, icon: "🏛️" },
  { id: 1, name: "Lincoln High School", type: "school", lat: 40.7230, lng: -74.0080, icon: "🏫" },
  { id: 2, name: "West Elementary Academy", type: "school", lat: 40.7290, lng: -74.0160, icon: "🎒" },
  { id: 3, name: "Metro General Hospital & Trauma", type: "hospital", lat: 40.7340, lng: -73.9920, icon: "🏥" },
  { id: 4, name: "Central Fire & Rescue Station 14", type: "fire", lat: 40.7190, lng: -73.9980, icon: "🚒" },
  { id: 5, name: "East District Firehouse", type: "fire", lat: 40.7150, lng: -73.9850, icon: "🚒" },
  { id: 6, name: "North Shore Safe Haven [Shelter 1]", type: "shelter", lat: 40.7420, lng: -74.0020, icon: "🛡️" },
  { id: 7, name: "Riverfront Park Relief Center [Shelter 2]", type: "shelter", lat: 40.7280, lng: -73.9740, icon: "🛡️" },
  { id: 8, name: "South Harbor Evacuation Dock [Shelter 3]", type: "shelter", lat: 40.7020, lng: -74.0130, icon: "🛡️" }
];

// --- Application State ---
let map;
let landmarks = [...INITIAL_LANDMARKS];
let landmarkMarkers = {};
let startLocation = { lat: 40.7230, lng: -74.0080, name: "Lincoln High School" };
let targetLocation = { lat: 40.7420, lng: -74.0020, name: "North Shore Safe Haven" };
let targetMode = "nearest_shelter";

let activeRoutePolyline = null;
let blockedRoutePolyline = null;
let ledMarkers = [];
let roadBlocks = []; // Array of { id, lat, lng, radius, hazardType, marker, circle }

let currentHazardType = "fire";
let clickMode = "navigate"; // 'navigate' or 'block'
let showLedAnimation = true;
let ledSpeedMultiplier = 3;
let ledColorClass = "";
let animIntervalId = null;

// --- DOM Ready Entry Point ---
document.addEventListener("DOMContentLoaded", () => {
  initOriginalMap();
  initUI();
  computeRealStreetRoute();
});

// --- Initialize Original OpenStreetMap ---
function initOriginalMap() {
  // 1. Base Map Layers
  const osmStandard = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  const esriSatellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  });

  const cartoDark = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 19,
    subdomains: "abcd",
    attribution: '&copy; CartoDB'
  });

  // 2. Initialize Leaflet Map with Original OpenStreetMap as Default
  map = L.map("map", {
    center: [40.7240, -73.9980],
    zoom: 14,
    layers: [osmStandard] // Default layer is Original OpenStreetMap!
  });

  // Layer control switcher
  const baseMaps = {
    "🗺️ Original OpenStreetMap": osmStandard,
    "🛰️ Satellite Imagery": esriSatellite,
    "🏙️ High-Tech Dark Mode": cartoDark
  };
  L.control.layers(baseMaps, null, { position: "topright" }).addTo(map);

  // Map Click Listener for Placing Roadblocks or Custom Waypoints
  map.on("click", onMapClick);

  // Render Landmarks
  renderLandmarkMarkers();
}

// --- Render Landmark Markers ---
function renderLandmarkMarkers() {
  // Clear existing
  Object.values(landmarkMarkers).forEach(m => map.removeLayer(m));
  landmarkMarkers = {};

  landmarks.forEach(node => {
    const isShelter = node.type === "shelter";
    const isHospital = node.type === "hospital";
    const isSchool = node.type === "school";
    const isFire = node.type === "fire";

    const typeClass = isShelter ? "marker-shelter" :
                      isHospital ? "marker-hospital" :
                      isSchool ? "marker-school" :
                      isFire ? "marker-fire" : "marker-residential";

    const customIcon = L.divIcon({
      className: `custom-city-marker ${typeClass}`,
      html: `<div class="marker-inner">${node.icon}</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const marker = L.marker([node.lat, node.lng], { icon: customIcon }).addTo(map);

    const popupHtml = `
      <div style="text-align: center;">
        <h4 style="margin-bottom:4px;">${node.icon} ${node.name}</h4>
        <span style="font-size:0.75rem; color:#94a3b8; text-transform:uppercase;">${node.type}</span>
        <button class="popup-btn" onclick="setOriginFromLandmark(${node.id})">🚩 Set as Evacuation Start</button>
        ${!isShelter ? `<button class="popup-btn" onclick="setDestinationFromLandmark(${node.id})">🎯 Set as Target</button>` : ''}
      </div>
    `;
    marker.bindPopup(popupHtml);
    landmarkMarkers[node.id] = marker;
  });
}

window.setOriginFromLandmark = function(id) {
  const lm = landmarks.find(l => l.id === id);
  if (!lm) return;
  startLocation = { lat: lm.lat, lng: lm.lng, name: lm.name };
  document.getElementById("startNodeSelect").value = id;
  computeRealStreetRoute();
  map.closePopup();
};

window.setDestinationFromLandmark = function(id) {
  const lm = landmarks.find(l => l.id === id);
  if (!lm) return;
  targetMode = "custom_target";
  targetLocation = { lat: lm.lat, lng: lm.lng, name: lm.name };
  document.getElementById("targetModeSelect").value = "custom_target";
  document.getElementById("customTargetWrapper").style.display = "block";
  document.getElementById("targetNodeSelect").value = id;
  computeRealStreetRoute();
  map.closePopup();
};

// --- Map Click Handler ---
function onMapClick(e) {
  const { lat, lng } = e.latlng;

  if (clickMode === "block") {
    // Place a Roadblock / Hazard on the clicked location
    addRoadBlock(lat, lng, currentHazardType);
  } else if (clickMode === "pick_start") {
    startLocation = { lat, lng, name: `Custom Point (${lat.toFixed(4)}, ${lng.toFixed(4)})` };
    setClickMode("navigate");
    showToast("Origin Set", `Evacuation start point placed on map.`);
    computeRealStreetRoute();
  }
}

// --- Add Roadblock Hazard with Detour Detection ---
function addRoadBlock(lat, lng, hazardType) {
  const id = Date.now();
  const radius = 120; // 120 meters blockage zone

  const hazardIconStr = hazardType === "fire" ? "🔥" :
                        hazardType === "flood" ? "🌊" :
                        hazardType === "debris" ? "🪨" : "⛔";

  const hazardIcon = L.divIcon({
    className: "hazard-map-marker",
    html: `<div>${hazardIconStr}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });

  const marker = L.marker([lat, lng], { icon: hazardIcon }).addTo(map);
  const circle = L.circle([lat, lng], {
    radius: radius,
    color: "#ff3366",
    fillColor: "#ff3366",
    fillOpacity: 0.25,
    weight: 2,
    dashArray: "6, 6"
  }).addTo(map);

  marker.bindTooltip(`Blocked: ${hazardType.toUpperCase()} (Click to clear)`);
  marker.on("click", (e) => {
    L.DomEvent.stopPropagation(e);
    removeRoadBlock(id);
  });

  roadBlocks.push({ id, lat, lng, radius, hazardType, marker, circle });

  showToast("Road Blocked!", `⚠️ ${hazardType.toUpperCase()} roadblock placed. Dynamically rerouting on real roads!`);
  updateRoadblockListUI();
  computeRealStreetRoute();
}

function removeRoadBlock(id) {
  const index = roadBlocks.findIndex(b => b.id === id);
  if (index !== -1) {
    const rb = roadBlocks[index];
    map.removeLayer(rb.marker);
    map.removeLayer(rb.circle);
    roadBlocks.splice(index, 1);

    showToast("Roadblock Cleared", "Road opened. Updating evacuation route.");
    updateRoadblockListUI();
    computeRealStreetRoute();
  }
}

function clearAllRoadBlocks() {
  roadBlocks.forEach(rb => {
    map.removeLayer(rb.marker);
    map.removeLayer(rb.circle);
  });
  roadBlocks = [];
  updateRoadblockListUI();
  computeRealStreetRoute();
  showToast("All Clear", "All roadblocks cleared from city grid.");
}

function updateRoadblockListUI() {
  const container = document.getElementById("blockedRoadsList");
  const countBadge = document.getElementById("activeBlockCount");
  const headerCount = document.getElementById("headerBlockedCount");

  countBadge.textContent = roadBlocks.length;
  headerCount.textContent = roadBlocks.length;

  if (roadBlocks.length === 0) {
    container.innerHTML = `<div class="empty-state">No roadblocks. All roads open.</div>`;
    return;
  }

  container.innerHTML = "";
  roadBlocks.forEach(rb => {
    const icon = rb.hazardType === "fire" ? "🔥" : rb.hazardType === "flood" ? "🌊" : "🪨";
    const div = document.createElement("div");
    div.className = "blocked-item-row";
    div.innerHTML = `
      <span>${icon} Block at (${rb.lat.toFixed(3)}, ${rb.lng.toFixed(3)})</span>
      <button class="btn-unblock-small" onclick="removeRoadBlock(${rb.id})">✖</button>
    `;
    container.appendChild(div);
  });
}
window.removeRoadBlock = removeRoadBlock;

// --- Real-World Street Routing via OSRM Engine ---
async function computeRealStreetRoute() {
  // 1. Determine target coordinates
  let destination = targetLocation;

  if (targetMode === "nearest_shelter") {
    // Evaluate all shelters and choose the closest one by straight line first
    const shelters = landmarks.filter(l => l.type === "shelter");
    let bestShelter = shelters[0];
    let minD = Infinity;

    shelters.forEach(s => {
      const d = Math.hypot(s.lat - startLocation.lat, s.lng - startLocation.lng);
      if (d < minD) {
        minD = d;
        bestShelter = s;
      }
    });
    destination = { lat: bestShelter.lat, lng: bestShelter.lng, name: bestShelter.name };
  } else if (targetMode === "nearest_hospital") {
    const hospitals = landmarks.filter(l => l.type === "hospital");
    if (hospitals.length > 0) {
      destination = { lat: hospitals[0].lat, lng: hospitals[0].lng, name: hospitals[0].name };
    }
  }

  // 2. Query Open Source Routing Machine (OSRM) on Real OpenStreetMap roads
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLocation.lng},${startLocation.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true&alternatives=true`;
    
    const response = await fetch(osrmUrl);
    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      handleNoRouteFound();
      return;
    }

    // 3. Dynamic Obstacle Avoidance Filter
    // Find the best route among candidates that does not intersect any active roadBlocks
    let chosenRoute = null;
    let fallbackRoute = data.routes[0];

    for (const r of data.routes) {
      const coords = r.geometry.coordinates; // [lng, lat]
      const intersectsHazard = checkIfRouteIntersectsHazards(coords);
      if (!intersectsHazard) {
        chosenRoute = r;
        break;
      }
    }

    // 4. If all standard OSRM routes are blocked, compute an evasion waypoint detour!
    if (!chosenRoute && roadBlocks.length > 0) {
      chosenRoute = await computeDetourAroundHazards(startLocation, destination, fallbackRoute);
    } else if (!chosenRoute) {
      chosenRoute = fallbackRoute;
    }

    // 5. Render the calculated route and glowing LED trail
    if (chosenRoute) {
      renderRouteOnMap(chosenRoute, destination.name);
    } else {
      handleNoRouteFound();
    }
  } catch (err) {
    console.warn("OSRM online fetch error, falling back to local routing:", err);
    renderFallbackDirectRoute(startLocation, destination);
  }
}

// --- Check if Route intersects with any active Roadblock circles ---
function checkIfRouteIntersectsHazards(coords) {
  for (const rb of roadBlocks) {
    for (const pt of coords) {
      const lat = pt[1];
      const lng = pt[0];
      const distMeters = getDistanceMeters(lat, lng, rb.lat, rb.lng);
      if (distMeters < rb.radius) {
        return true; // Intersects!
      }
    }
  }
  return false;
}

// --- Compute Detour Waypoint around Hazards ---
async function computeDetourAroundHazards(start, dest, blockedRoute) {
  // Find which roadblock was hit
  const firstBlock = roadBlocks[0];
  if (!firstBlock) return null;

  // Compute an evasion waypoint perpendicular to the block
  const offsetLat = 0.007; // ~700 meters lateral detour
  const offsetLng = 0.007;

  const detourCandidates = [
    { lat: firstBlock.lat + offsetLat, lng: firstBlock.lng + offsetLng },
    { lat: firstBlock.lat - offsetLat, lng: firstBlock.lng - offsetLng },
    { lat: firstBlock.lat + offsetLat, lng: firstBlock.lng - offsetLng },
    { lat: firstBlock.lat - offsetLat, lng: firstBlock.lng + offsetLng }
  ];

  for (const wp of detourCandidates) {
    try {
      const detourUrl = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${wp.lng},${wp.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson&steps=true`;
      const res = await fetch(detourUrl);
      const dData = await res.json();
      if (dData.routes && dData.routes.length > 0) {
        const candidateRoute = dData.routes[0];
        if (!checkIfRouteIntersectsHazards(candidateRoute.geometry.coordinates)) {
          showToast("DYNAMIC DETOUR FOUND", "⚡ Successfully rerouted through clear streets around roadblock!");
          return candidateRoute;
        }
      }
    } catch (e) {
      // Continue to next candidate
    }
  }
  return null;
}

// --- Render Route and Animated LEDs on Map ---
function renderRouteOnMap(route, targetName) {
  const coords = route.geometry.coordinates.map(pt => [pt[1], pt[0]]); // [lat, lng]

  // Remove previous polyline
  if (activeRoutePolyline) map.removeLayer(activeRoutePolyline);
  if (blockedRoutePolyline) map.removeLayer(blockedRoutePolyline);

  // If hazards are present, draw previous blocked path in subtle red
  const hasObstacles = roadBlocks.length > 0;

  // Draw Primary Optimal Route Polyline
  activeRoutePolyline = L.polyline(coords, {
    color: "#00ff88",
    weight: 7,
    opacity: 0.95,
    lineCap: "round",
    lineJoin: "round"
  }).addTo(map);

  activeRoutePolyline.bringToFront();

  // Render Glowing LED Runway Dots along the real polyline
  renderGlowingLedsAlongPolyline(coords);

  // Update HUD Metrics
  const distanceMeters = Math.round(route.distance);
  const timeMinutes = (route.duration / 60).toFixed(1);

  document.getElementById("headerRouteStatus").textContent = `Route Safe ➔ ${targetName}`;
  document.getElementById("headerRouteStatus").className = "stat-val status-safe";
  document.getElementById("headerDistance").textContent = `${distanceMeters} m`;
  document.getElementById("headerTime").textContent = `${timeMinutes} min`;

  // Update Turn-by-Turn Directions
  renderTurnByTurnDirections(route, targetName);
}

// --- Render Animated Glowing LEDs along Polyline ---
function renderGlowingLedsAlongPolyline(latlngs) {
  // Clear old LED markers
  ledMarkers.forEach(m => map.removeLayer(m));
  ledMarkers = [];

  if (!showLedAnimation || latlngs.length < 2) return;

  // Sample points evenly along the polyline path
  const sampleStep = Math.max(1, Math.floor(latlngs.length / 28)); // ~28 glowing LEDs along route
  for (let i = 0; i < latlngs.length; i += sampleStep) {
    const pt = latlngs[i];
    const ledIcon = L.divIcon({
      className: `led-pulse-dot ${ledColorClass}`,
      iconSize: [10, 10],
      iconAnchor: [5, 5]
    });

    const marker = L.marker(pt, { icon: ledIcon, interactive: false }).addTo(map);
    ledMarkers.push(marker);
  }

  startLedPulseAnimation();
}

function startLedPulseAnimation() {
  if (animIntervalId) clearInterval(animIntervalId);
  if (ledMarkers.length === 0) return;

  let headIndex = 0;
  const interval = Math.max(50, 350 / ledSpeedMultiplier);

  animIntervalId = setInterval(() => {
    ledMarkers.forEach((m, idx) => {
      const el = m.getElement();
      if (!el) return;

      const diff = (idx - headIndex + ledMarkers.length) % ledMarkers.length;
      if (diff < 4) {
        el.style.transform = "scale(1.7)";
        el.style.backgroundColor = "#ffffff";
        el.style.boxShadow = "0 0 16px #00ff88, 0 0 30px #00ff88";
      } else {
        el.style.transform = "scale(1.0)";
        el.style.backgroundColor = ledColorClass === "led-cyan" ? "#00f2fe" :
                                   ledColorClass === "led-amber" ? "#ffaa00" : "#00ff88";
        el.style.boxShadow = "0 0 8px #00ff88";
      }
    });
    headIndex = (headIndex + 1) % ledMarkers.length;
  }, interval);
}

// --- Render Turn-by-Turn Directions ---
function renderTurnByTurnDirections(route, targetName) {
  const container = document.getElementById("turnByTurnList");
  container.innerHTML = "";

  // Start step
  const startDiv = document.createElement("div");
  startDiv.className = "step-item";
  startDiv.style.borderLeftColor = "#ff0055";
  startDiv.innerHTML = `
    <span class="step-road">🚩 Depart: ${startLocation.name}</span>
    <span class="step-meta">Follow illuminated green LED street trail</span>
  `;
  container.appendChild(startDiv);

  // Steps from OSRM legs
  if (route.legs && route.legs[0] && route.legs[0].steps) {
    const steps = route.legs[0].steps;
    steps.forEach((s, idx) => {
      if (s.name) {
        const div = document.createElement("div");
        div.className = "step-item";
        div.innerHTML = `
          <span class="step-road">Step ${idx + 1}: ${s.maneuver.type} onto ${s.name}</span>
          <span class="step-meta">${Math.round(s.distance)} meters &bull; (${Math.round(s.duration)}s)</span>
        `;
        container.appendChild(div);
      }
    });
  }

  // Arrival step
  const destDiv = document.createElement("div");
  destDiv.className = "step-item";
  destDiv.style.borderLeftColor = "#00f2fe";
  destDiv.innerHTML = `
    <span class="step-road">🏁 Safe Arrival: ${targetName}</span>
    <span class="step-meta">Shelter perimeter reached. Emergency relief ready.</span>
  `;
  container.appendChild(destDiv);
}

function handleNoRouteFound() {
  document.getElementById("headerRouteStatus").textContent = "NO PASSABLE ROUTE (TRAPPED)";
  document.getElementById("headerRouteStatus").className = "stat-val stat-alert";
  document.getElementById("headerDistance").textContent = "--";
  document.getElementById("headerTime").textContent = "--";

  if (activeRoutePolyline) map.removeLayer(activeRoutePolyline);
  ledMarkers.forEach(m => map.removeLayer(m));
  ledMarkers = [];

  document.getElementById("turnByTurnList").innerHTML = `
    <div class="empty-state" style="color:#ff6b81;">
      ⚠️ All known street routes are blocked by active hazards! Clear a blockage or pick a different shelter.
    </div>
  `;
  showToast("NO PATH FOUND", "⚠️ Evacuation origin is trapped by surrounding roadblocks!", 5000);
}

// --- UI Binding & Helpers ---
function initUI() {
  const startSelect = document.getElementById("startNodeSelect");
  const targetSelect = document.getElementById("targetNodeSelect");
  const targetModeSelect = document.getElementById("targetModeSelect");
  const customTargetWrapper = document.getElementById("customTargetWrapper");
  const btnRecalc = document.getElementById("btnRecalculate");
  const btnDisaster = document.getElementById("btnDisasterScenario");
  const btnClear = document.getElementById("btnClearBlockades");
  const btnPickStart = document.getElementById("btnPickStartOnMap");
  const searchInput = document.getElementById("citySearchInput");
  const btnSearch = document.getElementById("btnSearchCity");

  // Populate Dropdowns
  landmarks.forEach(n => {
    const opt1 = document.createElement("option");
    opt1.value = n.id;
    opt1.textContent = `${n.icon} ${n.name}`;
    if (n.name === startLocation.name) opt1.selected = true;
    startSelect.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = n.id;
    opt2.textContent = `${n.icon} ${n.name}`;
    if (n.name === targetLocation.name) opt2.selected = true;
    targetSelect.appendChild(opt2);
  });

  startSelect.addEventListener("change", (e) => {
    const lm = landmarks.find(l => l.id === parseInt(e.target.value));
    if (lm) {
      startLocation = { lat: lm.lat, lng: lm.lng, name: lm.name };
      computeRealStreetRoute();
    }
  });

  targetModeSelect.addEventListener("change", (e) => {
    targetMode = e.target.value;
    customTargetWrapper.style.display = targetMode === "custom_target" ? "block" : "none";
    computeRealStreetRoute();
  });

  targetSelect.addEventListener("change", (e) => {
    const lm = landmarks.find(l => l.id === parseInt(e.target.value));
    if (lm) {
      targetLocation = { lat: lm.lat, lng: lm.lng, name: lm.name };
      computeRealStreetRoute();
    }
  });

  btnRecalc.addEventListener("click", computeRealStreetRoute);
  btnClear.addEventListener("click", clearAllRoadBlocks);
  btnDisaster.addEventListener("click", triggerDisasterScenario);

  btnPickStart.addEventListener("click", () => {
    setClickMode("pick_start");
    showToast("Pick Start Point", "Click anywhere on the map to set the evacuation origin.");
  });

  // Click Mode Toggles
  document.getElementById("modeNavigate").addEventListener("click", () => setClickMode("navigate"));
  document.getElementById("modeBlockRoad").addEventListener("click", () => setClickMode("block"));

  // Hazard Type selection
  document.querySelectorAll(".hazard-type-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".hazard-type-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      currentHazardType = chip.dataset.hazard;
    });
  });

  // LED Settings
  document.getElementById("toggleLedAnimation").addEventListener("change", (e) => {
    showLedAnimation = e.target.checked;
    computeRealStreetRoute();
  });

  document.getElementById("ledSpeedRange").addEventListener("input", (e) => {
    ledSpeedMultiplier = parseInt(e.target.value);
    startLedPulseAnimation();
  });

  document.getElementById("ledColorTheme").addEventListener("change", (e) => {
    const val = e.target.value;
    ledColorClass = val === "cyan" ? "led-cyan" : val === "amber" ? "led-amber" : "";
    startLedPulseAnimation();
  });

  // City Search Bar
  btnSearch.addEventListener("click", executeCitySearch);
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") executeCitySearch();
  });
}

function setClickMode(mode) {
  clickMode = mode;
  const navBtn = document.getElementById("modeNavigate");
  const blockBtn = document.getElementById("modeBlockRoad");
  const notice = document.getElementById("mapModeNotice");

  navBtn.classList.remove("active");
  blockBtn.classList.remove("active");

  if (mode === "navigate") {
    navBtn.classList.add("active");
    map.getContainer().style.cursor = "";
    notice.innerHTML = `💡 Click <strong>"🚧 Click Map to Block Road"</strong>, then click along the green route to see the algorithm find a new detour!`;
  } else if (mode === "block") {
    blockBtn.classList.add("active");
    map.getContainer().style.cursor = "crosshair";
    notice.innerHTML = `🚧 <strong>ROADBLOCK MODE ACTIVE:</strong> Click anywhere on the map to place a ${currentHazardType.toUpperCase()} roadblock!`;
  } else if (mode === "pick_start") {
    map.getContainer().style.cursor = "pointer";
    notice.innerHTML = `🎯 <strong>ORIGIN PICKER:</strong> Click anywhere on the map to place the start point!`;
  }
}

// --- City Search via Nominatim OpenStreetMap ---
async function executeCitySearch() {
  const query = document.getElementById("citySearchInput").value.trim();
  if (!query) return;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data && data.length > 0) {
      const first = data[0];
      const lat = parseFloat(first.lat);
      const lng = parseFloat(first.lon);

      map.flyTo([lat, lng], 14, { duration: 1.5 });

      // Relocate default start & destination to the searched city
      startLocation = { lat: lat - 0.006, lng: lng - 0.006, name: `${query} Sector A` };
      targetLocation = { lat: lat + 0.008, lng: lng + 0.008, name: `${query} Emergency Safe Shelter` };

      // Add temporary shelter marker
      const shelterIcon = L.divIcon({
        className: "custom-city-marker marker-shelter",
        html: `<div class="marker-inner">🛡️</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });
      L.marker([targetLocation.lat, targetLocation.lng], { icon: shelterIcon }).addTo(map)
        .bindPopup(`<b>🛡️ ${targetLocation.name}</b>`).openPopup();

      showToast("Location Found", `Moved map to ${first.display_name.split(",")[0]}. Computing local evacuation route!`);
      clearAllRoadBlocks();
      computeRealStreetRoute();
    } else {
      showToast("Not Found", "Could not find location. Please check city name.");
    }
  } catch (err) {
    showToast("Search Error", "Unable to connect to location search.");
  }
}

// --- Trigger Urban Disaster Scenario ---
function triggerDisasterScenario() {
  clearAllRoadBlocks();

  // Drop two roadblocks along the mid-path
  const midLat = (startLocation.lat + targetLocation.lat) / 2;
  const midLng = (startLocation.lng + targetLocation.lng) / 2;

  addRoadBlock(midLat, midLng, "fire");
  addRoadBlock(midLat + 0.004, midLng - 0.003, "flood");

  showToast("MAJOR URBAN DISASTER", "🚨 Multiple flash hazards reported! Recalculating perimeter escape routes!");
}

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

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
