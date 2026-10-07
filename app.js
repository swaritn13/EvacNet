/**
 * EvacNet — Global Edition
 * Dynamic Emergency Evacuation Route Planning Anywhere in the World
 * Real-World OpenStreetMap Routing, Dynamic Roadblock Detours, and Glowing LED Guidance
 */

// --- Global City Presets ---
const CITY_PRESETS = {
  pune: {
    name: "Pune, Maharashtra 🇮🇳",
    lat: 18.5204,
    lng: 73.8567,
    zoom: 14,
    landmarks: [
      { name: "Shivajinagar High School", type: "school", icon: "🏫", dLat: 0.010, dLng: -0.005 },
      { name: "COEP Tech University", type: "school", icon: "🎒", dLat: 0.008, dLng: 0.008 },
      { name: "Sassoon General Hospital & Trauma", type: "hospital", icon: "🏥", dLat: 0.003, dLng: 0.015 },
      { name: "Central Fire Brigade Headquarters", type: "fire", icon: "🚒", dLat: -0.008, dLng: 0.002 },
      { name: "East Pune Relief Firehouse", type: "fire", icon: "🚒", dLat: 0.012, dLng: 0.022 },
      { name: "Mutha Riverfront Safe Shelter [North]", type: "shelter", icon: "🛡️", dLat: 0.022, dLng: -0.008 },
      { name: "Nehru Stadium Relief Center [South]", type: "shelter", icon: "🛡️", dLat: -0.018, dLng: 0.005 },
      { name: "Koregaon Park Safe Haven [East]", type: "shelter", icon: "🛡️", dLat: 0.015, dLng: 0.035 }
    ]
  },
  mumbai: {
    name: "Mumbai, Maharashtra 🇮🇳",
    lat: 18.9388,
    lng: 72.8354,
    zoom: 14,
    landmarks: [
      { name: "St. Xavier's High School", type: "school", icon: "🏫", dLat: 0.005, dLng: -0.003 },
      { name: "KEM Hospital & Trauma Center", type: "hospital", icon: "🏥", dLat: 0.015, dLng: 0.008 },
      { name: "Fort Fire & Rescue Station", type: "fire", icon: "🚒", dLat: -0.005, dLng: 0.002 },
      { name: "Marine Drive Coastal Safe Haven [Shelter 1]", type: "shelter", icon: "🛡️", dLat: -0.012, dLng: -0.010 },
      { name: "Oval Maidan Emergency Shelter [Shelter 2]", type: "shelter", icon: "🛡️", dLat: 0.018, dLng: -0.004 }
    ]
  },
  delhi: {
    name: "New Delhi 🇮🇳",
    lat: 28.6139,
    lng: 77.2090,
    zoom: 14,
    landmarks: [
      { name: "Central Delhi Senior School", type: "school", icon: "🏫", dLat: 0.008, dLng: -0.006 },
      { name: "AIIMS Apex Trauma Center", type: "hospital", icon: "🏥", dLat: -0.025, dLng: 0.002 },
      { name: "Connaught Place Fire Unit", type: "fire", icon: "🚒", dLat: 0.018, dLng: 0.005 },
      { name: "India Gate Relief Safe Zone [Shelter 1]", type: "shelter", icon: "🛡️", dLat: 0.002, dLng: 0.015 },
      { name: "Lodhi Garden Emergency Shelter [Shelter 2]", type: "shelter", icon: "🛡️", dLat: -0.016, dLng: 0.008 }
    ]
  },
  bengaluru: {
    name: "Bengaluru, Karnataka 🇮🇳",
    lat: 12.9716,
    lng: 77.5946,
    zoom: 14,
    landmarks: [
      { name: "Bishop Cotton High School", type: "school", icon: "🏫", dLat: -0.005, dLng: 0.008 },
      { name: "Victoria Hospital & Emergency Care", type: "hospital", icon: "🏥", dLat: -0.012, dLng: -0.015 },
      { name: "Cubbon Park Relief Shelter [Shelter 1]", type: "shelter", icon: "🛡️", dLat: 0.010, dLng: 0.005 },
      { name: "Kanteerava Stadium Safe Zone [Shelter 2]", type: "shelter", icon: "🛡️", dLat: -0.004, dLng: -0.006 }
    ]
  },
  london: {
    name: "London, UK 🇬🇧",
    lat: 51.5074,
    lng: -0.1278,
    zoom: 14,
    landmarks: [
      { name: "Westminster Academy", type: "school", icon: "🏫", dLat: -0.006, dLng: -0.008 },
      { name: "St Thomas' Hospital Trauma Center", type: "hospital", icon: "🏥", dLat: -0.008, dLng: 0.008 },
      { name: "Hyde Park Emergency Shelter [Shelter 1]", type: "shelter", icon: "🛡️", dLat: 0.005, dLng: -0.035 },
      { name: "Southbank Relief Center [Shelter 2]", type: "shelter", icon: "🛡️", dLat: -0.002, dLng: 0.015 }
    ]
  },
  tokyo: {
    name: "Tokyo, Japan 🇯🇵",
    lat: 35.6762,
    lng: 139.6503,
    zoom: 14,
    landmarks: [
      { name: "Shinjuku High School", type: "school", icon: "🏫", dLat: 0.010, dLng: 0.020 },
      { name: "Tokyo Medical University Hospital", type: "hospital", icon: "🏥", dLat: 0.018, dLng: 0.015 },
      { name: "Yoyogi Park Disaster Safe Zone [Shelter 1]", type: "shelter", icon: "🛡️", dLat: -0.008, dLng: 0.025 }
    ]
  },
  nyc: {
    name: "New York City, USA 🇺🇸",
    lat: 40.7240,
    lng: -73.9980,
    zoom: 14,
    landmarks: [
      { name: "Lincoln High School", type: "school", icon: "🏫", dLat: -0.001, dLng: -0.010 },
      { name: "Metro General Hospital", type: "hospital", icon: "🏥", dLat: 0.010, dLng: 0.006 },
      { name: "Central Fire Station 14", type: "fire", icon: "🚒", dLat: -0.005, dLng: 0.000 },
      { name: "North Shore Safe Haven [Shelter 1]", type: "shelter", icon: "🛡️", dLat: 0.018, dLng: -0.004 },
      { name: "Riverfront Park Relief Center [Shelter 2]", type: "shelter", icon: "🛡️", dLat: 0.004, dLng: 0.024 }
    ]
  }
};

// --- Application State ---
let map;
let currentCityKey = "pune"; // Default city is Pune, India!
let landmarks = [];
let landmarkMarkers = {};

let startLocation = null;
let targetLocation = null;
let targetMode = "nearest_shelter";

let activeRoutePolyline = null;
let ledMarkers = [];
let roadBlocks = []; // Array of { id, lat, lng, radius, hazardType, marker, circle }

let currentHazardType = "fire";
let clickMode = "navigate"; // 'navigate', 'block', 'pick_start', 'pick_dest'
let showLedAnimation = true;
let ledSpeedMultiplier = 3;
let ledColorClass = "";
let animIntervalId = null;

// Custom clicked markers
let customStartMarker = null;
let customTargetMarker = null;

// --- DOM Ready Entry Point ---
document.addEventListener("DOMContentLoaded", () => {
  initOriginalMap();
  initUI();
  loadCityPreset("pune"); // Default to Pune!
});

// --- Initialize Original OpenStreetMap ---
function initOriginalMap() {
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

  // Default to Pune, Maharashtra
  map = L.map("map", {
    center: [18.5204, 73.8567],
    zoom: 14,
    layers: [osmStandard] // Original OpenStreetMap default!
  });

  // Layer control switcher
  const baseMaps = {
    "🗺️ Original OpenStreetMap": osmStandard,
    "🛰️ Satellite Imagery": esriSatellite,
    "🏙️ High-Tech Dark Mode": cartoDark
  };
  L.control.layers(baseMaps, null, { position: "topright" }).addTo(map);

  // Map Click Listener
  map.on("click", onMapClick);
}

// --- Load City Preset or Custom Location ---
function loadCityPreset(cityKey) {
  const preset = CITY_PRESETS[cityKey];
  if (!preset) return;

  currentCityKey = cityKey;
  map.flyTo([preset.lat, preset.lng], preset.zoom, { duration: 1.2 });

  // Generate landmarks for this city
  generateCityLandmarks(preset.lat, preset.lng, preset.name, preset.landmarks);

  clearAllRoadBlocks();
  showToast("City Selected", `Loaded ${preset.name}. Local shelters and hospitals ready!`);
}

// --- Generate City Landmarks ---
function generateCityLandmarks(baseLat, baseLng, cityName, presetLandmarks) {
  // Clear old markers
  Object.values(landmarkMarkers).forEach(m => map.removeLayer(m));
  landmarkMarkers = {};

  landmarks = [];

  if (presetLandmarks && presetLandmarks.length > 0) {
    presetLandmarks.forEach((item, idx) => {
      landmarks.push({
        id: idx,
        name: item.name,
        type: item.type,
        icon: item.icon,
        lat: baseLat + item.dLat,
        lng: baseLng + item.dLng
      });
    });
  } else {
    // Generate generic local landmarks around any searched location
    landmarks = [
      { id: 0, name: `${cityName} High School`, type: "school", icon: "🏫", lat: baseLat - 0.005, lng: baseLng - 0.006 },
      { id: 1, name: `${cityName} Civil Hospital`, type: "hospital", icon: "🏥", lat: baseLat + 0.008, lng: baseLng + 0.006 },
      { id: 2, name: `${cityName} Central Fire Brigade`, type: "fire", icon: "🚒", lat: baseLat - 0.004, lng: baseLng + 0.008 },
      { id: 3, name: `${cityName} North Safe Haven [Shelter 1]`, type: "shelter", icon: "🛡️", lat: baseLat + 0.016, lng: baseLng - 0.004 },
      { id: 4, name: `${cityName} South Stadium Safe Zone [Shelter 2]`, type: "shelter", icon: "🛡️", lat: baseLat - 0.015, lng: baseLng + 0.005 }
    ];
  }

  // Set default start location (First school) and destination (First shelter)
  const defaultSchool = landmarks.find(l => l.type === "school") || landmarks[0];
  const defaultShelter = landmarks.find(l => l.type === "shelter") || landmarks[landmarks.length - 1];

  startLocation = { lat: defaultSchool.lat, lng: defaultSchool.lng, name: defaultSchool.name };
  targetLocation = { lat: defaultShelter.lat, lng: defaultShelter.lng, name: defaultShelter.name };

  renderLandmarkMarkers();
  populateDropdowns();
  computeRealStreetRoute();
}

// --- Populate Dropdown Selectors ---
function populateDropdowns() {
  const startSelect = document.getElementById("startNodeSelect");
  const targetSelect = document.getElementById("targetNodeSelect");

  startSelect.innerHTML = "";
  targetSelect.innerHTML = "";

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

  updateLocationSublabels();
}

function updateLocationSublabels() {
  document.getElementById("startLocationLabel").textContent = `Origin: ${startLocation ? startLocation.name : 'Not set'}`;
  document.getElementById("targetLocationLabel").textContent = `Target: ${targetLocation ? targetLocation.name : 'Nearest Safe Shelter'}`;
}

// --- Render Landmark Markers ---
function renderLandmarkMarkers() {
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
        <button class="popup-btn" onclick="setDestinationFromLandmark(${node.id})">🎯 Set as Evacuation Target</button>
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
  updateLocationSublabels();
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
  updateLocationSublabels();
  computeRealStreetRoute();
  map.closePopup();
};

// --- Map Click Handler ---
function onMapClick(e) {
  const { lat, lng } = e.latlng;

  if (clickMode === "block") {
    // Add Roadblock on clicked street
    addRoadBlock(lat, lng, currentHazardType);
  } else if (clickMode === "pick_start") {
    // Place custom start point
    startLocation = { lat, lng, name: `Custom Origin (${lat.toFixed(4)}, ${lng.toFixed(4)})` };

    if (customStartMarker) map.removeLayer(customStartMarker);
    const startIcon = L.divIcon({
      className: "custom-city-marker marker-origin",
      html: `<div class="marker-inner">🚩</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
    customStartMarker = L.marker([lat, lng], { icon: startIcon }).addTo(map).bindPopup("<b>🚩 Custom Start Point</b>").openPopup();

    setClickMode("navigate");
    updateLocationSublabels();
    showToast("Origin Set", `Start point placed on map.`);
    computeRealStreetRoute();
  } else if (clickMode === "pick_dest") {
    // Place custom destination point
    targetLocation = { lat, lng, name: `Custom Safe Zone (${lat.toFixed(4)}, ${lng.toFixed(4)})` };
    targetMode = "map_click";
    document.getElementById("targetModeSelect").value = "map_click";

    if (customTargetMarker) map.removeLayer(customTargetMarker);
    const destIcon = L.divIcon({
      className: "custom-city-marker marker-shelter",
      html: `<div class="marker-inner">🏁</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
    customTargetMarker = L.marker([lat, lng], { icon: destIcon }).addTo(map).bindPopup("<b>🏁 Custom Evacuation Destination</b>").openPopup();

    setClickMode("navigate");
    updateLocationSublabels();
    showToast("Destination Set", `Custom destination placed on map!`);
    computeRealStreetRoute();
  }
}

// --- Add Roadblock Hazard ---
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

  marker.bindTooltip(`Blocked: ${hazardType.toUpperCase()} (Click to remove)`);
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

// --- Real-World Street Routing via OSRM ---
async function computeRealStreetRoute() {
  if (!startLocation) return;

  // 1. Determine destination coordinates
  let destination = targetLocation;

  if (targetMode === "nearest_shelter") {
    const shelters = landmarks.filter(l => l.type === "shelter");
    if (shelters.length > 0) {
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
      targetLocation = destination;
    }
  } else if (targetMode === "nearest_hospital") {
    const hospitals = landmarks.filter(l => l.type === "hospital");
    if (hospitals.length > 0) {
      destination = { lat: hospitals[0].lat, lng: hospitals[0].lng, name: hospitals[0].name };
      targetLocation = destination;
    }
  }

  updateLocationSublabels();

  // 2. Query OSRM on Real OpenStreetMap roads
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLocation.lng},${startLocation.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true&alternatives=true`;
    
    const response = await fetch(osrmUrl);
    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      handleNoRouteFound();
      return;
    }

    // 3. Dynamic Obstacle Avoidance Filter
    let chosenRoute = null;
    let fallbackRoute = data.routes[0];

    for (const r of data.routes) {
      const coords = r.geometry.coordinates; // [lng, lat]
      if (!checkIfRouteIntersectsHazards(coords)) {
        chosenRoute = r;
        break;
      }
    }

    // 4. If all routes are blocked, compute an evasion detour
    if (!chosenRoute && roadBlocks.length > 0) {
      chosenRoute = await computeDetourAroundHazards(startLocation, destination, fallbackRoute);
    } else if (!chosenRoute) {
      chosenRoute = fallbackRoute;
    }

    // 5. Render route and LEDs
    if (chosenRoute) {
      renderRouteOnMap(chosenRoute, destination.name);
    } else {
      handleNoRouteFound();
    }
  } catch (err) {
    console.warn("OSRM routing error:", err);
  }
}

function checkIfRouteIntersectsHazards(coords) {
  for (const rb of roadBlocks) {
    for (const pt of coords) {
      const lat = pt[1];
      const lng = pt[0];
      if (getDistanceMeters(lat, lng, rb.lat, rb.lng) < rb.radius) {
        return true;
      }
    }
  }
  return false;
}

async function computeDetourAroundHazards(start, dest, blockedRoute) {
  const firstBlock = roadBlocks[0];
  if (!firstBlock) return null;

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
          showToast("DYNAMIC DETOUR ENGAGED", "⚡ Successfully found clear streets bypassing roadblock!");
          return candidateRoute;
        }
      }
    } catch (e) {}
  }
  return null;
}

// --- Render Route and Animated LEDs ---
function renderRouteOnMap(route, targetName) {
  const coords = route.geometry.coordinates.map(pt => [pt[1], pt[0]]); // [lat, lng]

  if (activeRoutePolyline) map.removeLayer(activeRoutePolyline);

  // Draw Primary Green Evacuation Route
  activeRoutePolyline = L.polyline(coords, {
    color: "#00ff88",
    weight: 7,
    opacity: 0.95,
    lineCap: "round",
    lineJoin: "round"
  }).addTo(map);

  activeRoutePolyline.bringToFront();

  // Render Glowing LED Runway Dots
  renderGlowingLedsAlongPolyline(coords);

  // Update HUD Metrics
  const distanceMeters = Math.round(route.distance);
  const timeMinutes = (route.duration / 60).toFixed(1);

  document.getElementById("headerRouteStatus").textContent = `Route Safe ➔ ${targetName.split("[")[0].trim()}`;
  document.getElementById("headerRouteStatus").className = "stat-val status-safe";
  document.getElementById("headerDistance").textContent = `${distanceMeters} m`;
  document.getElementById("headerTime").textContent = `${timeMinutes} min`;

  // Render Turn-by-Turn Directions
  renderTurnByTurnDirections(route, targetName);
}

// --- Render Glowing LED Trail ---
function renderGlowingLedsAlongPolyline(latlngs) {
  ledMarkers.forEach(m => map.removeLayer(m));
  ledMarkers = [];

  if (!showLedAnimation || latlngs.length < 2) return;

  const sampleStep = Math.max(1, Math.floor(latlngs.length / 28)); // ~28 LEDs along path
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

// --- Turn-by-Turn Directions ---
function renderTurnByTurnDirections(route, targetName) {
  const container = document.getElementById("turnByTurnList");
  container.innerHTML = "";

  const startDiv = document.createElement("div");
  startDiv.className = "step-item";
  startDiv.style.borderLeftColor = "#ff0055";
  startDiv.innerHTML = `
    <span class="step-road">🚩 Depart: ${startLocation.name}</span>
    <span class="step-meta">Follow illuminated green LED street trail</span>
  `;
  container.appendChild(startDiv);

  if (route.legs && route.legs[0] && route.legs[0].steps) {
    const steps = route.legs[0].steps;
    steps.forEach((s, idx) => {
      if (s.name) {
        const div = document.createElement("div");
        div.className = "step-item";
        div.innerHTML = `
          <span class="step-road">Step ${idx + 1}: ${s.maneuver.type} onto ${s.name}</span>
          <span class="step-meta">${Math.round(s.distance)}m &bull; (${Math.round(s.duration)}s)</span>
        `;
        container.appendChild(div);
      }
    });
  }

  const destDiv = document.createElement("div");
  destDiv.className = "step-item";
  destDiv.style.borderLeftColor = "#00f2fe";
  destDiv.innerHTML = `
    <span class="step-road">🏁 Safe Arrival: ${targetName}</span>
    <span class="step-meta">Safe Haven reached! Emergency relief teams active.</span>
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
      ⚠️ All street routes are blocked by roadblocks! Clear a hazard or choose another shelter.
    </div>
  `;
  showToast("NO PATH FOUND", "⚠️ Evacuation origin is trapped by roadblocks!", 5000);
}

// --- UI Binding & Event Listeners ---
function initUI() {
  const citySelect = document.getElementById("cityPresetSelect");
  const startSelect = document.getElementById("startNodeSelect");
  const targetSelect = document.getElementById("targetNodeSelect");
  const targetModeSelect = document.getElementById("targetModeSelect");
  const customTargetWrapper = document.getElementById("customTargetWrapper");
  const btnRecalc = document.getElementById("btnRecalculate");
  const btnDisaster = document.getElementById("btnDisasterScenario");
  const btnClear = document.getElementById("btnClearBlockades");
  const btnPickStart = document.getElementById("btnPickStartOnMap");
  const btnPickDest = document.getElementById("btnPickDestOnMap");
  const searchInput = document.getElementById("citySearchInput");
  const btnSearch = document.getElementById("btnSearchCity");

  // City Preset Selector
  citySelect.addEventListener("change", (e) => {
    const val = e.target.value;
    if (val === "locate_me") {
      detectUserLocation();
    } else {
      loadCityPreset(val);
    }
  });

  // Origin change
  startSelect.addEventListener("change", (e) => {
    const lm = landmarks.find(l => l.id === parseInt(e.target.value));
    if (lm) {
      startLocation = { lat: lm.lat, lng: lm.lng, name: lm.name };
      updateLocationSublabels();
      computeRealStreetRoute();
    }
  });

  // Target Mode change
  targetModeSelect.addEventListener("change", (e) => {
    targetMode = e.target.value;
    customTargetWrapper.style.display = targetMode === "custom_target" ? "block" : "none";
    updateLocationSublabels();
    computeRealStreetRoute();
  });

  // Specific target change
  targetSelect.addEventListener("change", (e) => {
    const lm = landmarks.find(l => l.id === parseInt(e.target.value));
    if (lm) {
      targetLocation = { lat: lm.lat, lng: lm.lng, name: lm.name };
      updateLocationSublabels();
      computeRealStreetRoute();
    }
  });

  btnRecalc.addEventListener("click", computeRealStreetRoute);
  btnClear.addEventListener("click", () => {
    clearAllRoadBlocks();
    showToast("All Clear", "Roadblocks removed. Routes restored.");
  });
  btnDisaster.addEventListener("click", triggerDisasterScenario);

  // Pick on Map buttons
  btnPickStart.addEventListener("click", () => {
    setClickMode("pick_start");
    showToast("Pick Start Point", "Click anywhere on the map to place your evacuation origin.");
  });

  btnPickDest.addEventListener("click", () => {
    setClickMode("pick_dest");
    showToast("Pick Destination", "Click anywhere on the map to place your custom destination safe zone.");
  });

  // Mode Toggles
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
  } else if (mode === "pick_dest") {
    map.getContainer().style.cursor = "pointer";
    notice.innerHTML = `🏁 <strong>DESTINATION PICKER:</strong> Click anywhere on the map to set your custom safe zone!`;
  }
}

// --- GPS User Location Auto-Detect ---
function detectUserLocation() {
  if (!navigator.geolocation) {
    showToast("Geolocation Error", "Browser does not support GPS location.");
    return;
  }

  showToast("Locating You...", "Acquiring your GPS position...");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      map.flyTo([lat, lng], 14, { duration: 1.5 });

      generateCityLandmarks(lat, lng, "Local Sector", null);
      showToast("Location Detected", "Evacuation network created around your current location!");
    },
    (err) => {
      showToast("Location Denied", "Unable to retrieve GPS. Switched to Pune, India.");
      loadCityPreset("pune");
    },
    { timeout: 10000 }
  );
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
      const shortName = first.display_name.split(",")[0];

      map.flyTo([lat, lng], 14, { duration: 1.5 });
      generateCityLandmarks(lat, lng, shortName, null);

      showToast("City Found", `Loaded ${shortName}. Evacuation shelters and routes configured!`);
    } else {
      showToast("Not Found", "Could not locate city. Please try another name.");
    }
  } catch (err) {
    showToast("Search Error", "Unable to connect to location search.");
  }
}

// --- Trigger Urban Disaster Scenario ---
function triggerDisasterScenario() {
  clearAllRoadBlocks();

  const midLat = (startLocation.lat + targetLocation.lat) / 2;
  const midLng = (startLocation.lng + targetLocation.lng) / 2;

  addRoadBlock(midLat, midLng, "fire");
  addRoadBlock(midLat + 0.003, midLng - 0.003, "flood");

  showToast("MAJOR DISASTER TRIGGERED", "🚨 Multi-point urban hazard! Calculating emergency perimeter escape route!");
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
