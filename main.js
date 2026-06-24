import { bfs }      from './src/algorithms/pathfinding/bfs.js';
import { dfs }      from './src/algorithms/pathfinding/dfs.js';
import { dijkstra } from './src/algorithms/pathfinding/dijkstra.js';
import { astar }    from './src/algorithms/pathfinding/astar.js';

import { bubble }   from './src/algorithms/sorting/bubble.js';
import { quick }    from './src/algorithms/sorting/quick.js';
import { merge }    from './src/algorithms/sorting/merge.js';

// ── Registries ──────────────────────────────────────────────────────────────
const PATH_ALGOS = {
  bfs:      { fn: bfs,      label: 'BFS',      big_o: 'O(V + E)',         optimal: true,  heuristic: false, note: 'Explores level by level. Optimal on unweighted grids.' },
  dfs:      { fn: dfs,      label: 'DFS',      big_o: 'O(V + E)',         optimal: false, heuristic: false, note: 'Dives deep before backtracking. Often non-optimal.' },
  dijkstra: { fn: dijkstra, label: 'Dijkstra', big_o: 'O((V + E) log V)', optimal: true,  heuristic: false, note: 'Generalizes BFS to weighted graphs via a min-heap.' },
  astar:    { fn: astar,    label: 'A*',       big_o: 'O((V + E) log V)', optimal: true,  heuristic: true,  note: 'Dijkstra + Manhattan heuristic. Explores way less area.' },
};

const SORT_ALGOS = {
  bubble: { fn: bubble, label: 'Bubble Sort', big_o: 'O(n²)',      best: 'O(n)',       stable: true,  inPlace: true,  note: 'Adjacent swaps. Educational, very slow at scale.' },
  quick:  { fn: quick,  label: 'Quicksort',   big_o: 'O(n log n)', best: 'O(n log n)', stable: false, inPlace: true,  note: 'Divide & conquer around a pivot. Worst-case O(n²).' },
  merge:  { fn: merge,  label: 'Mergesort',   big_o: 'O(n log n)', best: 'O(n log n)', stable: true,  inPlace: false, note: 'Divide & conquer. Predictable but needs O(n) extra space.' },
};

// ── Pathfinding grid ────────────────────────────────────────────────────────
const COLS = 40;
const ROWS = 24;

let grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
let start = [2, ROWS >> 1];
let goal  = [COLS - 3, ROWS >> 1];

// ── Sorting state ───────────────────────────────────────────────────────────
let sortArr = [];
let sortHighlights = new Map();   // index -> 'compare' | 'swap' | 'set'
let sortSorted = new Set();
let sortPivot = -1;
let sortStats = { compares: 0, swaps: 0, ms: 0 };
let sortGen = null;
let sortRunning = false;
let sortT0 = 0;

// ── Sides (used in pathfinding) ─────────────────────────────────────────────
const sides = [
  { id: 'a', canvas: document.getElementById('canvas-a'), ctx: null, cell: 0, algoKey: 'astar', visited: new Set(), path: [], gen: null, t0: 0, running: false, stats: { visited: 0, pathLength: 0, ms: 0 } },
  { id: 'b', canvas: document.getElementById('canvas-b'), ctx: null, cell: 0, algoKey: 'bfs',   visited: new Set(), path: [], gen: null, t0: 0, running: false, stats: { visited: 0, pathLength: 0, ms: 0 } },
];
for (const s of sides) s.ctx = s.canvas.getContext('2d');

let mode = 'single'; // 'single' | 'race' | 'sorting'

function isVisibleSide(side) {
  if (mode === 'sorting') return side.id === 'a';
  return mode === 'race' || side.id === 'a';
}
function activeSides() { return sides.filter(isVisibleSide); }

// ── DOM refs ────────────────────────────────────────────────────────────────
const $algoA   = document.getElementById('algo-a');
const $algoB   = document.getElementById('algo-b');
const $algoSrt = document.getElementById('algo-sort');
const $size    = document.getElementById('size');
const $speed   = document.getElementById('speed');
const $run     = document.getElementById('run');
const $reset   = document.getElementById('reset');
const $clear   = document.getElementById('clear-walls');
const $shuffle = document.getElementById('shuffle');
const $algoLbl = document.getElementById('algo-a-label');
const $labelA  = document.getElementById('label-a');
const $labelB  = document.getElementById('label-b');

// ── Sizing via ResizeObserver (fixes mode-switch resize bug) ────────────────
function syncCanvasSize(side) {
  const dpr = window.devicePixelRatio || 1;
  const rect = side.canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  const w = Math.round(rect.width * dpr);
  const h = Math.round(rect.height * dpr);
  if (side.canvas.width !== w)  side.canvas.width  = w;
  if (side.canvas.height !== h) side.canvas.height = h;
  side.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  side.cell = Math.floor(Math.min(rect.width / COLS, rect.height / ROWS));
  return true;
}

const ro = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const side = sides.find(s => s.canvas === entry.target);
    if (!side) continue;
    if (!isVisibleSide(side)) continue;
    syncCanvasSize(side);
  }
  drawAll();
});
for (const s of sides) ro.observe(s.canvas);

// ── Pathfinding render ──────────────────────────────────────────────────────
function drawGrid(side) {
  const { ctx, canvas, cell } = side;
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  const offX = (rect.width  - COLS * cell) / 2;
  const offY = (rect.height - ROWS * cell) / 2;
  const pathSet = new Set(side.path.map(([x, y]) => `${x},${y}`));

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const k = `${x},${y}`;
      const px = offX + x * cell, py = offY + y * cell;

      if (grid[y][x] === 1)           ctx.fillStyle = '#1E3A52';
      else if (pathSet.has(k))        ctx.fillStyle = '#FBCFE8';
      else if (side.visited.has(k))   ctx.fillStyle = side.id === 'a' ? '#BAE6FD' : '#DDD6FE';
      else                            ctx.fillStyle = 'rgba(255,255,255,0.55)';

      ctx.fillRect(px + 1, py + 1, cell - 2, cell - 2);
    }
  }

  drawDot(side, offX, offY, start, '#22C55E');
  drawDot(side, offX, offY, goal,  '#0EA5E9');
}

function drawDot(side, offX, offY, [x, y], color) {
  const { ctx, cell } = side;
  const cx = offX + x * cell + cell / 2;
  const cy = offY + y * cell + cell / 2;
  const grad = ctx.createRadialGradient(cx - cell * 0.15, cy - cell * 0.15, 1, cx, cy, cell / 2);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.4, color);
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, cell / 3, 0, Math.PI * 2);
  ctx.fill();
}

// ── Sorting render (bar chart) ──────────────────────────────────────────────
function drawBars(side) {
  const { ctx, canvas } = side;
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  const n = sortArr.length;
  if (!n) return;

  const padX = 12, padY = 16;
  const usableW = rect.width - padX * 2;
  const usableH = rect.height - padY * 2;
  const barW = usableW / n;
  const maxVal = n; // values range 1..n

  for (let i = 0; i < n; i++) {
    const h = (sortArr[i] / maxVal) * usableH;
    const x = padX + i * barW;
    const y = rect.height - padY - h;

    let color;
    if (i === sortPivot)                 color = '#F472B6'; // pink — pivot
    else if (sortHighlights.get(i) === 'swap')    color = '#FBBF24'; // amber — just swapped
    else if (sortHighlights.get(i) === 'compare') color = '#FB7185'; // rose — being compared
    else if (sortHighlights.get(i) === 'set')     color = '#A78BFA'; // violet — overwritten (merge)
    else if (sortSorted.has(i))          color = '#86EFAC'; // green — finalized
    else                                 color = '#7DD3FC'; // sky default

    // Glassy gradient on the bar
    const grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.15, color);
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;
    ctx.fillRect(x + 0.5, y, Math.max(barW - 1, 1), h);
  }
}

// ── Dispatcher ──────────────────────────────────────────────────────────────
function drawAll() {
  if (mode === 'sorting') {
    drawBars(sides[0]);
  } else {
    for (const s of activeSides()) drawGrid(s);
  }
}

// ── Pathfinding interactions ────────────────────────────────────────────────
let painting = null; // 'wall' | 'erase'

function cellAt(side, ev) {
  const rect = side.canvas.getBoundingClientRect();
  const offX = (rect.width  - COLS * side.cell) / 2;
  const offY = (rect.height - ROWS * side.cell) / 2;
  const x = Math.floor((ev.clientX - rect.left - offX) / side.cell);
  const y = Math.floor((ev.clientY - rect.top  - offY) / side.cell);
  return (x >= 0 && y >= 0 && x < COLS && y < ROWS) ? [x, y] : null;
}

function isAnyRunning() {
  return sides.some(s => s.running) || sortRunning;
}

function attachCanvas(side) {
  side.canvas.addEventListener('mousedown', (e) => {
    if (mode === 'sorting' || isAnyRunning()) return;
    const c = cellAt(side, e); if (!c) return;
    const [cx, cy] = c;

    if (e.shiftKey) { start = c; clearTrails(); drawAll(); return; }
    if (e.altKey)   { goal  = c; clearTrails(); drawAll(); return; }
    if ((cx === start[0] && cy === start[1]) || (cx === goal[0] && cy === goal[1])) return;

    painting = grid[cy][cx] === 1 ? 'erase' : 'wall';
    grid[cy][cx] = painting === 'wall' ? 1 : 0;
    drawAll();
  });

  side.canvas.addEventListener('mousemove', (e) => {
    if (!painting || mode === 'sorting') return;
    const c = cellAt(side, e); if (!c) return;
    const [cx, cy] = c;
    if ((cx === start[0] && cy === start[1]) || (cx === goal[0] && cy === goal[1])) return;
    grid[cy][cx] = painting === 'wall' ? 1 : 0;
    drawAll();
  });
}

for (const s of sides) attachCanvas(s);
window.addEventListener('mouseup', () => { painting = null; });

// ── Mode toggle ─────────────────────────────────────────────────────────────
document.querySelectorAll('.mode').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.disabled || btn.classList.contains('is-active')) return;
    const newMode = btn.dataset.mode;
    if (!['single', 'race', 'sorting'].includes(newMode)) return;

    document.querySelectorAll('.mode').forEach(b => b.classList.toggle('is-active', b === btn));
    document.body.dataset.mode = newMode;
    mode = newMode;

    $algoLbl.textContent = mode === 'race' ? 'algorithm A (left)' : 'algorithm';
    stopAll();
    clearTrails();
    if (mode === 'sorting' && sortArr.length === 0) shuffleArr();
    renderLabels();
    // ResizeObserver will resync canvas dimensions when the layout settles;
    // also force a draw now so the new view is shown immediately.
    drawAll();
  });
});

// ── Labels / info / stats ───────────────────────────────────────────────────
function renderLabels() {
  $labelA.textContent = mode === 'sorting'
    ? SORT_ALGOS[$algoSrt.value].label
    : PATH_ALGOS[sides[0].algoKey].label;
  $labelB.textContent = PATH_ALGOS[sides[1].algoKey].label;

  // Path info card (single-mode)
  const a = PATH_ALGOS[sides[0].algoKey];
  document.getElementById('info-name').textContent      = a.label;
  document.getElementById('info-bigo').textContent      = a.big_o;
  document.getElementById('info-optimal').textContent   = a.optimal   ? '✓ yes' : '✗ no';
  document.getElementById('info-heuristic').textContent = a.heuristic ? '✓ yes' : '— none';
  document.getElementById('info-note').textContent      = a.note;

  // Sort info card
  const s = SORT_ALGOS[$algoSrt.value];
  document.getElementById('sort-info-name').textContent    = s.label;
  document.getElementById('sort-info-bigo').textContent    = s.big_o;
  document.getElementById('sort-info-best').textContent    = s.best;
  document.getElementById('sort-info-stable').textContent  = s.stable  ? '✓ yes' : '✗ no';
  document.getElementById('sort-info-inplace').textContent = s.inPlace ? '✓ yes' : '✗ no';
  document.getElementById('sort-info-note').textContent    = s.note;
}

function renderStats() {
  document.getElementById('stat-a-visited').textContent = sides[0].stats.visited;
  document.getElementById('stat-a-path').textContent    = sides[0].stats.pathLength || '—';
  document.getElementById('stat-a-ms').textContent      = sides[0].stats.ms ? `${sides[0].stats.ms.toFixed(1)}ms` : '—';
  for (const s of sides) {
    document.getElementById(`race-${s.id}-visited`).textContent = s.stats.visited;
    document.getElementById(`race-${s.id}-path`).textContent    = s.stats.pathLength || '—';
    document.getElementById(`race-${s.id}-ms`).textContent      = s.stats.ms ? `${s.stats.ms.toFixed(1)}ms` : '—';
  }
  document.getElementById('stat-sort-comps').textContent = sortStats.compares;
  document.getElementById('stat-sort-swaps').textContent = sortStats.swaps;
  document.getElementById('stat-sort-ms').textContent    = sortStats.ms ? `${sortStats.ms.toFixed(1)}ms` : '—';
}

$algoA.addEventListener('change', () => {
  sides[0].algoKey = $algoA.value;
  stopAll(); clearTrails(); renderLabels(); drawAll();
});
$algoB.addEventListener('change', () => {
  sides[1].algoKey = $algoB.value;
  stopAll(); clearTrails(); renderLabels(); drawAll();
});
$algoSrt.addEventListener('change', () => {
  stopAll();
  resetSortHighlights();
  renderLabels();
  drawAll();
});
$size.addEventListener('input', () => {
  stopAll();
  shuffleArr();
  drawAll();
});

// ── Sort helpers ────────────────────────────────────────────────────────────
function shuffleArr() {
  const n = parseInt($size.value, 10);
  sortArr = Array.from({ length: n }, (_, i) => i + 1);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sortArr[i], sortArr[j]] = [sortArr[j], sortArr[i]];
  }
  resetSortHighlights();
}

function resetSortHighlights() {
  sortHighlights = new Map();
  sortSorted = new Set();
  sortPivot = -1;
  sortStats = { compares: 0, swaps: 0, ms: 0 };
  renderStats();
}

// ── Run loops ───────────────────────────────────────────────────────────────
let raf = null;

function clearTrails() {
  for (const s of sides) {
    s.visited.clear();
    s.path = [];
    s.stats = { visited: 0, pathLength: 0, ms: 0 };
  }
  resetSortHighlights();
  renderStats();
}

function startSide(side) {
  side.visited.clear();
  side.path = [];
  side.stats = { visited: 0, pathLength: 0, ms: 0 };
  side.gen = PATH_ALGOS[side.algoKey].fn(grid, start, goal);
  side.t0 = performance.now();
  side.running = true;
}

function stopAll() {
  cancelAnimationFrame(raf);
  for (const s of sides) { s.running = false; s.gen = null; }
  sortRunning = false;
  sortGen = null;
  $run.textContent = '▶ run';
}

function runPath() {
  for (const s of activeSides()) startSide(s);
  $run.textContent = '■ stop';

  const loop = () => {
    const stepsPerFrame = parseInt($speed.value, 10);
    for (const side of activeSides()) {
      if (!side.running) continue;
      for (let i = 0; i < stepsPerFrame; i++) {
        const { value, done } = side.gen.next();
        if (done) {
          side.stats.ms = performance.now() - side.t0;
          side.running = false;
          break;
        }
        if (value.type === 'visit') {
          side.visited.add(`${value.node[0]},${value.node[1]}`);
          side.stats.visited = side.visited.size;
        }
        if (value.type === 'path') {
          side.path = value.nodes;
          side.stats.pathLength = value.nodes.length;
        }
      }
    }
    drawAll();
    renderStats();
    if (activeSides().some(s => s.running)) {
      raf = requestAnimationFrame(loop);
    } else {
      $run.textContent = '▶ run';
    }
  };
  raf = requestAnimationFrame(loop);
}

function runSort() {
  resetSortHighlights();
  sortGen = SORT_ALGOS[$algoSrt.value].fn(sortArr);
  sortT0 = performance.now();
  sortRunning = true;
  $run.textContent = '■ stop';

  const loop = () => {
    const stepsPerFrame = parseInt($speed.value, 10);
    sortHighlights.clear();
    for (let i = 0; i < stepsPerFrame; i++) {
      if (!sortRunning) return;
      const { value, done } = sortGen.next();
      if (done) {
        sortStats.ms = performance.now() - sortT0;
        sortRunning = false;
        $run.textContent = '▶ run';
        drawAll();
        renderStats();
        return;
      }
      if (value.type === 'compare') {
        sortStats.compares++;
        sortHighlights.set(value.indices[0], 'compare');
        sortHighlights.set(value.indices[1], 'compare');
      } else if (value.type === 'swap') {
        sortStats.swaps++;
        sortHighlights.set(value.indices[0], 'swap');
        sortHighlights.set(value.indices[1], 'swap');
      } else if (value.type === 'set') {
        sortHighlights.set(value.index, 'set');
      } else if (value.type === 'mark') {
        if (value.kind === 'sorted') sortSorted.add(value.index);
        if (value.kind === 'pivot')  sortPivot = value.index;
      } else if (value.type === 'unmark') {
        if (value.kind === 'pivot' && sortPivot === value.index) sortPivot = -1;
      }
    }
    drawAll();
    renderStats();
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
}

$run.addEventListener('click', () => {
  if (isAnyRunning()) { stopAll(); return; }
  if (mode === 'sorting') runSort(); else runPath();
});

$reset.addEventListener('click', () => {
  stopAll();
  if (mode === 'sorting') shuffleArr();
  clearTrails();
  drawAll();
});

$clear.addEventListener('click', () => {
  stopAll();
  grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  clearTrails();
  drawAll();
});

$shuffle.addEventListener('click', () => {
  stopAll();
  shuffleArr();
  drawAll();
});

// ── Init ────────────────────────────────────────────────────────────────────
$algoA.value = sides[0].algoKey;
$algoB.value = sides[1].algoKey;
shuffleArr();
renderLabels();
renderStats();
// ResizeObserver will fire once with initial sizes and draw.
