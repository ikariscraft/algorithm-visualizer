# ✦ Algorithm Visualizer

> **Pathfinding & sorting algorithms, animated in real time.**  
> No frameworks. No backend. Pure `<canvas>`, vanilla JS, and an obsession with smooth animation.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Netlify-blueviolet?style=flat-square)](https://extraordinary-paletas-3dc94a.netlify.app/)
[![Stack](https://img.shields.io/badge/Stack-HTML%20%2F%20CSS%20%2F%20JS-orange?style=flat-square)](#stack)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)

---

## What it does

A browser-based playground with two modes:

| Mode | What you see |
|---|---|
| **Pathfinding** | A grid where you paint walls, set start/goal, and watch algorithms explore cell by cell before tracing the shortest path |
| **Sorting** | A bar chart where comparisons light up blue and swaps light up pink — with optional audio feedback |
| **Race** | Two algorithms run side by side on the same grid so you can see exactly where their strategies diverge |

---

## Algorithms

### Pathfinding

| Algorithm | Optimal? | Heuristic? | Notes |
|---|---|---|---|
| **BFS** | Yes (unweighted) | No | Guarantees shortest path by exploring level by level |
| **DFS** | No | No | Goes deep fast — often finds *a* path, rarely the best one |
| **Dijkstra** | Yes | No | BFS generalized to weighted graphs via a min-heap |
| **A\*** | Yes (admissible h) | Manhattan distance | Dijkstra + heuristic = fewer cells explored, same guarantee |

### Sorting

| Algorithm | Average | Worst | Stable | In-place |
|---|---|---|---|---|
| **Bubble** | O(n²) | O(n²) | Yes | Yes |
| **Merge** | O(n log n) | O(n log n) | Yes | No — O(n) aux space |
| **Quick** | O(n log n) | O(n²) | No | Yes |

---

## Architecture: algorithms as generators

The core design decision: **every algorithm is a JavaScript generator** that yields discrete steps. The renderer consumes those steps on a `requestAnimationFrame` loop — completely decoupled from the algorithm logic.

```js
// src/algorithms/pathfinding/bfs.js
export function* bfs(grid, start, goal) {
  const queue = [start];
  const seen = new Set();

  while (queue.length) {
    const node = queue.shift();
    yield { type: 'visit', node };

    if (eq(node, goal)) { yield { type: 'found', node }; return; }

    for (const n of neighbors(grid, node)) {
      if (seen.has(key(n))) continue;
      seen.add(key(n));
      queue.push(n);
    }
  }
}
```

The animation loop calls `generator.next()` N times per frame — where N is the speed slider value. This means:

- **Speed control** requires zero changes inside any algorithm.
- **Step-through mode** is just N = 1.
- **Race mode** runs two independent generators on the same tick — they're structurally isolated.

---

## Stack

| Layer | Tech | Why |
|---|---|---|
| Rendering | HTML5 Canvas | Direct pixel control, no DOM overhead per cell |
| Animation | `requestAnimationFrame` | Synced to display refresh, no dropped frames |
| Sound | Web Audio API | Frequency mapped to bar height — zero dependencies |
| Language | Vanilla ES6+ | Generators, modules, destructuring — no transpilation needed |
| Deploy | Static HTML | Works on GitHub Pages, no build step |

---

## Project structure

```
algorithm-visualizer/
├── index.html          # Single-page app shell, mode switching via data attributes
├── styles.css          # Layout + theming
├── main.js             # Animation loop, state machine, renderer
└── src/
    └── algorithms/
        ├── pathfinding/
        │   ├── bfs.js
        │   ├── dfs.js
        │   ├── dijkstra.js
        │   ├── astar.js
        │   └── utils.js    # Shared: neighbors(), key(), eq()
        └── sorting/
            ├── bubble.js
            ├── merge.js
            └── quick.js
```

---

## Run locally

```bash
# any static file server works
python -m http.server 5500
# open http://localhost:5500
```

No npm, no build step, no dependencies.

---

Part of [tamarizmich.github.io](https://tamarizmich.github.io) — Aneth Michelle Tamariz Moreno.
