// A* search on a 4-neighbor grid using Manhattan distance as the heuristic.
// Manhattan is admissible for 4-connected uniform-cost grids, so A* is optimal.
// Visually: explores far less area than Dijkstra/BFS to find the same path.
// Time: O((V + E) log V) but with a much smaller effective frontier.
import { key, neighbors, reconstruct, manhattan, MinHeap } from './utils.js';

export function* astar(grid, start, goal) {
  const g = new Map([[key(start), 0]]);
  const parent = new Map();
  const pq = new MinHeap();
  pq.push([manhattan(start, goal), start]);
  const settled = new Set();

  while (pq.size) {
    const [, node] = pq.pop();
    const k = key(node);
    if (settled.has(k)) continue;
    settled.add(k);

    yield { type: 'visit', node };

    if (node[0] === goal[0] && node[1] === goal[1]) {
      yield { type: 'found', node };
      yield { type: 'path', nodes: reconstruct(parent, k) };
      return;
    }

    const cost = g.get(k);
    for (const n of neighbors(grid, node)) {
      const nk = key(n);
      if (settled.has(nk)) continue;
      const tentative = cost + 1;
      if (tentative < (g.get(nk) ?? Infinity)) {
        g.set(nk, tentative);
        parent.set(nk, k);
        pq.push([tentative + manhattan(n, goal), n]);
      }
    }
  }
}
