// Quicksort — Lomuto partition. Recursive via `yield*`.
// Avg: O(n log n). Worst: O(n²) (sorted input + bad pivot). Not stable. In-place.
export function* quick(arr, lo = 0, hi = arr.length - 1) {
  if (lo >= hi) {
    if (lo === hi) yield { type: 'mark', index: lo, kind: 'sorted' };
    if (lo === arr.length - 1 && hi === arr.length - 1) yield { type: 'done' };
    return;
  }

  const pivot = arr[hi];
  yield { type: 'mark', index: hi, kind: 'pivot' };

  let i = lo - 1;
  for (let j = lo; j < hi; j++) {
    yield { type: 'compare', indices: [j, hi] };
    if (arr[j] < pivot) {
      i++;
      if (i !== j) {
        [arr[i], arr[j]] = [arr[j], arr[i]];
        yield { type: 'swap', indices: [i, j] };
      }
    }
  }
  [arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]];
  yield { type: 'swap', indices: [i + 1, hi] };
  yield { type: 'unmark', index: hi, kind: 'pivot' };

  const p = i + 1;
  yield { type: 'mark', index: p, kind: 'sorted' };

  yield* quick(arr, lo, p - 1);
  yield* quick(arr, p + 1, hi);

  if (lo === 0 && hi === arr.length - 1) yield { type: 'done' };
}
