// Mergesort — top-down recursive. Stable. Requires O(n) auxiliary space.
// Avg / Worst: O(n log n).
export function* merge(arr, lo = 0, hi = arr.length - 1) {
  if (lo >= hi) return;
  const mid = (lo + hi) >> 1;
  yield* merge(arr, lo, mid);
  yield* merge(arr, mid + 1, hi);
  yield* mergeStep(arr, lo, mid, hi);
  if (lo === 0 && hi === arr.length - 1) {
    for (let i = 0; i < arr.length; i++) yield { type: 'mark', index: i, kind: 'sorted' };
    yield { type: 'done' };
  }
}

function* mergeStep(arr, lo, mid, hi) {
  const tmp = arr.slice(lo, hi + 1);
  const leftLen = mid - lo + 1;
  let i = 0, j = leftLen, k = lo;

  while (i < leftLen && j < tmp.length) {
    yield { type: 'compare', indices: [lo + i, lo + j] };
    if (tmp[i] <= tmp[j]) {
      arr[k] = tmp[i++];
    } else {
      arr[k] = tmp[j++];
    }
    yield { type: 'set', index: k, value: arr[k] };
    k++;
  }
  while (i < leftLen)    { arr[k] = tmp[i++]; yield { type: 'set', index: k, value: arr[k] }; k++; }
  while (j < tmp.length) { arr[k] = tmp[j++]; yield { type: 'set', index: k, value: arr[k] }; k++; }
}
