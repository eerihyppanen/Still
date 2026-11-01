export function moveToIndex(
  ids: readonly string[],
  id: string,
  index: number,
): string[] {
  if (!ids.includes(id) || !Number.isFinite(index)) return [...ids];
  const result = ids.filter((value) => value !== id);
  result.splice(Math.max(0, Math.min(result.length, Math.round(index))), 0, id);
  return result;
}

/** Project insertion slots from actual row heights, without changing the source layout. */
export function dragLayout(
  ids: readonly string[],
  heights: Readonly<Record<string, number>>,
  id: string,
  dy: number,
  gap = 12,
): {
  ids: string[];
  offsets: Record<string, number>;
  dragOffset: number;
  index: number;
} | null {
  if (
    !ids.includes(id) ||
    !Number.isFinite(dy) ||
    ids.some(
      (key) => !Number.isFinite(heights[key]) || (heights[key] ?? 0) <= 0,
    )
  )
    return null;
  const tops: Record<string, number> = {};
  let total = 0;
  for (const key of ids) {
    tops[key] = total;
    total += heights[key]! + gap;
  }
  total -= gap;
  const top = Math.max(0, Math.min(total - heights[id]!, tops[id]! + dy));
  const others = ids.filter((key) => key !== id);
  let slot = 0,
    closest = Infinity,
    index = 0;
  for (let i = 0; i <= others.length; i++) {
    const distance = Math.abs(top - slot);
    if (distance < closest) {
      closest = distance;
      index = i;
    }
    if (i < others.length) slot += heights[others[i]!]! + gap;
  }
  const projected = moveToIndex(ids, id, index);
  const offsets: Record<string, number> = {};
  let y = 0;
  for (const key of projected) {
    offsets[key] = y - tops[key]!;
    y += heights[key]! + gap;
  }
  return { ids: projected, offsets, dragOffset: top - tops[id]!, index };
}

/** Pixels for one animation frame; stalls cannot jump an entire screen. */
export function edgeScroll(
  pointer: number,
  top: number,
  bottom: number,
  elapsed: number,
): number {
  const edge = Math.min(48, (bottom - top) / 4);
  if (edge <= 0) return 0;
  const direction =
    pointer < top + edge
      ? -Math.min(1, Math.max(0, (top + edge - pointer) / edge))
      : Math.min(1, Math.max(0, (pointer - (bottom - edge)) / edge));
  return direction * 0.5 * Math.max(0, Math.min(elapsed, 32));
}
