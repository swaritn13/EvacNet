# 🚨 EvacNet: Real-World OpenStreetMap Emergency Evacuation Routing

> **A real-world interactive evacuation route planner built with the Original OpenStreetMap, OSRM real street routing engine, dynamic roadblock detours, and glowing LED path guidance.**

---

## 🌟 Key Features

1. **Original OpenStreetMap Connected**:
   - Uses the official, standard **OpenStreetMap** tile layer with real street names, building footprints, parks, and rivers.
   - Includes a layer switcher for **🗺️ Original OpenStreetMap**, **🛰️ Satellite Imagery (Esri)**, and **🏙️ Dark Mode (CartoDB)**.
   - Built-in **City Search** powered by OpenStreetMap Nominatim: search any city or address worldwide!
2. **Real Street Routing Engine (OSRM)**:
   - Routes trace actual curved streets, turns, and highway corridors instead of artificial straight lines.
   - Gives exact turn-by-turn directions with real street names and accurate meter distances.
3. **Interactive Roadblock Placement & Dynamic Rerouting**:
   - Switch to **"🚧 Click Map to Block Road"** and click anywhere on the map or along the route to drop a hazard (🔥 Fire, 🌊 Flood, 🪨 Debris, ⛔ Police Barricade).
   - If a roadblock intersects the evacuation route, the algorithm **instantly calculates a detour on real clear streets**, bypassing the obstacle.
4. **Animated Glowing LED Guidance Trail**:
   - Sequential pulsing glowing green LED dots travel along the calculated route like an emergency exit runway light trail.
5. **Zero Hardware Required**:
   - Pure client-side web application. Open `index.html` in any web browser and it runs instantly.

---

## 🚀 How to Run

1. Open [`index.html`](file:///C:/Users/ASUS/Desktop/coding/EvacNet/index.html) in your browser.
2. The map opens directly on the **Original OpenStreetMap** view with pinned landmarks (Schools, Hospitals, Shelters, Fire Stations).
3. Click **"🚧 Click Map to Block Road"** on the left sidebar.
4. Click on the green route to drop a roadblock (Fire / Flood / Debris).
5. Watch the algorithm dynamically divert traffic around the roadblock to the nearest safe shelter!
