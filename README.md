# Smart Escape — Interactive Evacuation Route Simulator

> A fully offline, single-file browser application that finds the lowest-cost evacuation route through a building, with real-time hazard editing, bilingual UI, and an accessible, modern design.

---

## 👤 Author

| Field | Value |
|---|---|
| **Full Name** | Md Tarek Rahman |
| **Registration Number** | 242-15-882 |

---

## 🔗 Live Demo

[https://mtarek47.github.io/Smart-Escape/](https://mtarek47.github.io/Smart-Escape/)

---

## 🚀 Running Instructions

### Option A — Open directly (no build step)

```bash
# Just open index.html in Chrome (latest):
open "index.html"
# or double-click the file in Finder / Explorer
```

### Option B — Serve locally (avoids any browser file-origin quirks)

```bash
# Python 3
python3 -m http.server 8080
# then visit http://localhost:8080
```

> **No npm install, no build tool, no backend required.**  
> Works fully offline after the page is loaded.

---

## ✨ Implemented Features

### Mandatory Features

| # | Feature | Notes |
|---|---|---|
| 1 | **Import & Map** | Load any valid `building.json` locally; all nodes and edges rendered at supplied coordinates with readable labels and corridor costs |
| 2 | **Select Start** | Click any unblocked room or junction; lowest-cost route to accessible exit highlighted immediately |
| 3 | **Change Conditions** | Block/unblock rooms, junctions, corridors; close/reopen exits — each state visually distinct |
| 4 | **Instant Update** | Route recalculates on every state change; Reset restores `initial_state` from the file |
| 5 | **Failure Cases** | Exact strings "No route available" / "Starting location blocked" (bilingual) |
| 6 | **Two Languages** | English ↔ Bangla toggle for all labels, buttons, statuses, errors, instructions; Noto Sans Bengali font fallback |
| 7 | **Subtle Animations** | Node pulse on select/toggle, animated dashed route stroke; all disabled under `prefers-reduced-motion` |

### Routing Rules

- Cost = sum of edge costs (never Euclidean distance)
- Blocked nodes, their incident edges, blocked edges, and closed exits are excluded
- Closed exits are never usable as intermediate nodes either
- Minimum cost exit; ties broken by lexicographically smallest exit ID
- Among equal-cost paths to that exit: lexicographically smallest node-ID sequence

### Design Improvements

- Modern Inter-based typography with proper rem units
- CSS custom properties (light + dark) with `color-scheme` for UA chrome
- Persistent dark/light/system theme toggle stored in `localStorage`
- Distinct visual states: room (blue circle), junction (grey circle), exit (green square), blocked (red), closed exit (red square), blocked corridor (red dashed), selected start (dark ring + glow), active route (orange animated dash)
- Result panel: large cost number, exit badge, colour-coded route path chips
- Stats row showing node/edge counts
- Keyboard-accessible: all nodes are `role="button" tabindex="0"`, Enter/Space activate; file-import label is keyboard-accessible; visible focus rings throughout
- ARIA: `role="alert"` on error, `aria-live="polite"` on result/tip/stats, `aria-pressed` on mode buttons, `aria-label` on icon buttons
- Responsive: two-column desktop, single-column mobile

---

## 🎁 Bonus Features

- **Persistent theme toggle** (light / dark / system) saved to `localStorage`
- **Hazard cursor** (`crosshair`) while in Change Hazards mode for clear affordance
- **Building stats row** (node count, edge count) in the map header

---

## ⚠️ Known Issues / Limitations

- None that impact core functionality. The app is fully self-contained with no external runtime dependencies.
- No PWA/service-worker caching — the initial static HTML fetch requires network, but once loaded runs 100% offline.

---

## 🤖 AI Tools Used

| Tool | Purpose |
|---|---|
| **Antigravity (Google DeepMind)** | Primary coding assistant — designed, implemented, and tested the entire application |

---

## 💬 Most Useful Prompt

```
You are improving an existing single-file web app called "Smart Escape"
(Interactive Evacuation Route Simulator). The current file is index.html
in this project. It already works. Your job is to make it visually more
polished and more robust, WITHOUT adding anything outside the requirements
below and WITHOUT breaking existing behavior.
[...full prompt as submitted...]
```

---

## 📁 Repository Structure

```
Smart Escape/
├── index.html          # Single-file app (HTML + CSS + JS)
├── building.json       # Sample building for testing
├── README.md
├── LICENSE
├── .gitignore
└── screenshots/
    ├── baseline_route.png      # R1 → E1 cost 7
    └── rerouted_C2_blocked.png # R1 → E2 cost 11 (C2 blocked)
```
