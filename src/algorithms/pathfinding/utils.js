// Shared helpers for grid pathfinding.

export const key = ([x, y]) => `${x},${y}`;

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function* neighbors(grid, [x, y]) {
  for (const [dx, dy] of DIRS) {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= grid[0].length || ny >= grid.length) continue;
    if (grid[ny][nx] === 1) continue;
    yield [nx, ny];
  }
}

export const manhattan = ([ax, ay], [bx, by]) => Math.abs(ax - bx) + Math.abs(ay - by);

// Reconstructs path from end to start using a parent map keyed by `${x},${y}`.
export function reconstruct(parent, endKey) {
  const path = [];
  let cur = endKey;
  while (cur) {
    const [x, y] = cur.split(',').map(Number);
    path.push([x, y]);
    cur = parent.get(cur);
  }
  return path.reverse();
}

// Binary min-heap. Items are [priority, value].
export class MinHeap {
  constructor() { this.h = []; }
  get size() { return this.h.length; }

  push(item) {
    this.h.push(item);
    this.#up(this.h.length - 1);
  }

  pop() {
    if (!this.h.length) return undefined;
    const top = this.h[0];
    const last = this.h.pop();
    if (this.h.length) { this.h[0] = last; this.#down(0); }
    return top;
  }

  #up(i) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.h[p][0] <= this.h[i][0]) break;
      [this.h[p], this.h[i]] = [this.h[i], this.h[p]];
      i = p;
    }
  }

  #down(i) {
    const n = this.h.length;
    for (;;) {
      const l = i * 2 + 1, r = l + 1;
      let s = i;
      if (l < n && this.h[l][0] < this.h[s][0]) s = l;
      if (r < n && this.h[r][0] < this.h[s][0]) s = r;
      if (s === i) break;
      [this.h[s], this.h[i]] = [this.h[i], this.h[s]];
      i = s;
    }
  }
}
