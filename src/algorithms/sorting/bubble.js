// Bubble Sort — adjacent swaps until the array is sorted.
// Best: O(n) (already sorted, early-exit). Avg / Worst: O(n²). Stable. In-place.
//
// Step shapes:
//   { type: 'compare', indices: [i, j] }
//   { type: 'swap',    indices: [i, j] }
//   { type: 'mark',    index, kind: 'sorted' }
//   { type: 'done' }
export function* bubble(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      yield { type: 'compare', indices: [j, j + 1] };
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        yield { type: 'swap', indices: [j, j + 1] };
        swapped = true;
      }
    }
    yield { type: 'mark', index: n - 1 - i, kind: 'sorted' };
    if (!swapped) {
      // Already sorted — mark the rest and finish early.
      for (let k = 0; k < n - 1 - i; k++) yield { type: 'mark', index: k, kind: 'sorted' };
      break;
    }
  }
  yield { type: 'mark', index: 0, kind: 'sorted' };
  yield { type: 'done' };
}
