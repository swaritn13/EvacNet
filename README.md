# 🚨 EvacNet: Optimal Emergency Evacuation Route Planning Using Graph Algorithms (Map Edition)

> **A real-time, interactive web application using dynamic graph algorithms (Dijkstra's Algorithm & A\* Search) and OpenStreetMap / Leaflet to route urban evacuations with virtual glowing LED path guidance.**

---

## 🌟 What This System Does

1. **Real City Map (Leaflet.js + OpenStreetMap)**:
   - Loads a responsive, high-contrast dark urban map.
   - Pinned with key municipal landmarks:
     - 🏥 **Metro Hospitals & Trauma Centers**
     - 🏫 **High Schools & Elementary Schools**
     - 🚒 **Fire Stations & Rescue Units**
     - 🛡️ **Designated Emergency Safe Shelters & Relief Centers**
     - 🏘️ **Residential Districts & Commercial Plazas**
2. **Interactive Road Blocking**:
   - **Click any road directly on the map** to physically block it!
   - Choose your hazard type: 🔥 **Fire**, 🌊 **Flood**, 🪨 **Fallen Debris**, or ⛔ **Police Barricade**.
   - The road immediately converts into a flashing red hazard zone.
3. **Dynamic Graph Rerouting**:
   - The graph algorithm (**Dijkstra's Algorithm** / **A\* Search**) reacts in sub-millisecond time.
   - Automatically recomputes the optimal escape route to the nearest safe shelter.
4. **Animated Virtual LED Guidance Trail**:
   - Renders a chain of **glowing green LED dots** directly on the map along the calculated route.
   - LED dots pulse and travel sequentially in the direction of the safe shelter, simulating emergency exit runway lighting.
5. **Zero Hardware Required**:
   - Pure client-side web application. Open [`index.html`](file:///C:/Users/ASUS/EvacNet/index.html) in any web browser and it runs instantly with no installation, no server, and no ESP32.

---

## 🗂️ Project Files

```
EvacNet/
├── index.html       # Main application page with map viewport and command HUD
├── style.css        # Command-center styling, custom marker badges, and glowing LED animations
├── app.js           # Leaflet map setup, graph algorithms, road blocking, and turn-by-turn directions
└── README.md        # Documentation and walkthrough
```

---

## 🚀 How to Run

1. Open [`index.html`](file:///C:/Users/ASUS/EvacNet/index.html) in **Google Chrome**, **Microsoft Edge**, **Firefox**, or **Brave**.
2. **Select Origin**: Choose where the evacuation starts (e.g. *Lincoln High School* or *West Elementary Academy*).
3. **Select Objective**:
   - Nearest Emergency Safe Shelter (automatically evaluates all shelters and finds the closest open one).
   - Nearest Medical Hospital.
   - Specific landmark.
4. **Block a Road**: Click on any street on the map to place a roadblock (fire, flood, debris).
5. Watch the glowing green LED trail dynamically divert around the blockage to safety!
