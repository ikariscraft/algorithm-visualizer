// Depth-First Search on a 4-neighbor grid.
// Not optimal (paths can be wildly long), but complete on a finite grid.
// Time: O(V + E). Space: O(V) for the stack + visited set.
import { key, neighbors, reconstruct } from './utils.js';

export function* dfs(grid, start, goal) {
  const stack = [start];
  const seen = new Set([key(start)]);
  const parent = new Map();

  while (stack.length) {
    const node = stack.pop();
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
      stack.push(n);
    }
  }
}
