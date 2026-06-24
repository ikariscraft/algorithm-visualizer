// Breadth-First Search on a 4-neighbor grid.
// Optimal for unweighted graphs. Time: O(V + E). Space: O(V).
import { key, neighbors, reconstruct } from './utils.js';

export function* bfs(grid, start, goal) {
  const queue = [start];
  const seen = new Set([key(start)]);
  const parent = new Map();

  while (queue.length) {
    const node = queue.shift();
    yield { type: 'visit', node };

    if (node[0] === goal[0] && node[1] === goal[1]) {
      yield { type: 'found', node };
      yield { type: 'path', nodes: reconstruct(parent, key(node)) };
      return;
    }

    for (const n of neighbors(grid, node)) {
      const k = key(n);
      if (seen.has(k)) continue;
      seen.add(k);
      parent.set(k, key(node));
      queue.push(n);
    }
  }
}
