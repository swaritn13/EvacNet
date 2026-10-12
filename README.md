# 🧭 EvacNet: Emergency Evacuation & Dijkstra Routing Engine

[![Live Deployment](https://img.shields.io/badge/Live%20Demo-evacnet.vercel.app-0070F3?style=for-the-badge&logo=vercel&logoColor=white)](https://evacnet.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-swaritn13%2FEvacNet-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/swaritn13/EvacNet)
[![Report](https://img.shields.io/badge/Project%20Report-PDF%20Format-FF0000?style=for-the-badge&logo=adobeacrobatreader&logoColor=white)](EvacNet_Project_Report.pdf)
[![Status](https://img.shields.io/badge/Status-Active%20%26%20Deployed-brightgreen?style=for-the-badge)](#)

> **Autonomous, high-performance emergency evacuation routing system. Zero external routing APIs, zero API keys, crystal-clear Google Maps styling, dual urban/regional scopes, and 100% offline capability.**

---

## 🌐 Live Deployed Application
The application is live and accessible online at:  
👉 **[https://evacnet.vercel.app/](https://evacnet.vercel.app/)**

---

## 🌟 Key Features

### 1. ⚡ Native Dijkstra Routing Engine (`dijkstra.js`)
* **Binary Min-Heap Priority Queue:** Custom heap implementation delivering asymptotic performance of $\mathcal{O}((|V| + |E|) \log |V|)$.
* **Sub-Millisecond Query Times:** Computes optimal paths across the Pune urban core in **< 1.0 ms**.
* **True Multi-Target Shelter Discovery:** Dynamically locates the nearest safe shelter or emergency trauma center based on actual road graph distance, entirely avoiding the straight-line "as-the-crow-flies" fallacy.

### 2. 🚧 Dynamic Roadblock Graph Edge Elimination
* Switch to **"🚧 Click Map to Block"** and drop hazard barricades (🔥 Fire, 🌊 Flood, 🪨 Landslide/Debris, ⛔ Police Barricade) anywhere on the map.
* **Physical Graph Severing:** Intersecting street segments are dynamically pruned from the active adjacency list with $\mathcal{O}(1)$ lookup.
* **Instant Detour Recalculation:** The routing engine immediately recalculates the shortest unblocked detour and computes the distance/time difference (+km / +min).

### 3. 🗺️ Dual Geographic Operational Scopes
* **🏙️ Pune Urban Core:**
  * **17,480 Nodes & 26,366 Real Street Edges** (Shivajinagar, Swargate, Deccan, Camp, Koregaon Park, Kothrud).
  * Evaluates complex inner-city street networks, alleys, and bridges across the Mutha and Mula rivers.
* **🌐 Western Maharashtra Regional Network:**
  * **71,905 Nodes & 98,324 Highway Edges** spanning Pune, PCMC, Lonavala, Khandala Ghat, Navi Mumbai, Mumbai, and Satara.
  * Inter-city route computation (124.5 km traversal) in **~50 ms**.

### 4. 🎨 Google Maps-Style Interface & Basemap Switcher
* **🗺️ Google Roads (Default):** Official, crisp street tiles with landmarks, parks, and real road labels (*FC Road, JM Road, Karve Road, Mumbai-Pune Expressway*). **Zero API keys needed!**
* **🏙️ ESRI World Street Map:** Clean vector road cartography with terrain shading.
* **🛰️ Satellite Hybrid:** High-resolution aerial imagery combined with street overlays.
* **⚡ 100% Offline Canvas Mode:** Local HTML5 vector canvas rendering real road geometries and river polylines even during total internet blackouts.

---

## 📁 Repository Structure

```
evacnet/
├── index.html                 # Main UI Dashboard & Leaflet Viewport
├── style.css                  # Google Maps inspired clean layout styles
├── app.js                     # Application controller & state coordinator
├── dijkstra.js                # Binary Min-Heap Dijkstra routing algorithm
├── pune_network.js            # Pune graph dataset (17,480 nodes, 26,366 edges)
├── maharashtra_network.js     # Maharashtra highway graph (71,905 nodes, 98,324 edges)
├── pune_waterways.js          # Mutha & Mula river polylines
├── lib/
│   ├── leaflet.js             # Leaflet mapping engine
│   ├── leaflet.css            # Leaflet styling
│   ├── marker-icon.png
│   └── marker-shadow.png
├── data/                      # Raw OpenStreetMap Overpass source datasets
├── PROJECT_REPORT.md          # Comprehensive academic project report
└── EvacNet_Project_Report.pdf # Formal printable project report in PDF format
```

---

## 🚀 How to Run Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/swaritn13/EvacNet.git
   ```
2. Navigate into the project folder:
   ```bash
   cd EvacNet
   ```
3. Open `index.html` in any web browser (Chrome, Edge, Firefox, Brave, Safari):
   ```bash
   start index.html
   ```
   *No Node.js, Python, server, or database installation required! Runs 100% in the client browser.*

---

## 📄 Formal Project Report
* **PDF Report:** [**`EvacNet_Project_Report.pdf`**](EvacNet_Project_Report.pdf)
* **Markdown Report:** [**`PROJECT_REPORT.md`**](PROJECT_REPORT.md)

---

## 👨‍💻 Author
* **Developer:** Swarit Naikade
* **Domain:** Design and Analysis of Algorithms (DAA), Graph Theory, GIS
* **Live Deployment:** [https://evacnet.vercel.app/](https://evacnet.vercel.app/)
* **Repository:** [https://github.com/swaritn13/EvacNet](https://github.com/swaritn13/EvacNet)
