// Dijkstra's algorithm on a 4-neighbor grid with uniform weights.
// Optimal. With uniform costs it explores like BFS, but the priority-queue
// structure generalizes to weighted graphs.
// Time: O((V + E) log V) with a binary heap.
import { key, neighbors, reconstruct, MinHeap } from './utils.js';

export function* dijkstra(grid, start, goal) {
  const dist = new Map([[key(start), 0]]);
  const parent = new Map();
  const pq = new MinHeap();
  pq.push([0, start]);
  const settled = new Set();

  while (pq.size) {
    const [d, node] = pq.pop();
    const k = key(node);
    if (settled.has(k)) continue;
    settled.add(k);

    yield { type: 'visit', node };

    if (node[0] === goal[0] && node[1] === goal[1]) {
      yield { type: 'found', node };
      yield { type: 'path', nodes: reconstruct(parent, k) };
      return;
    }

    for (const n of neighbors(grid, node)) {
      const nk = key(n);
      if (settled.has(nk)) continue;
      const nd = d + 1; // uniform cost
      if (nd < (dist.get(nk) ?? Infinity)) {
        dist.set(nk, nd);
        parent.set(nk, k);
        pq.push([nd, n]);
      }
    }
  }
}
