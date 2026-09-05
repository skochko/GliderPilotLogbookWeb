import type { IgcPoint } from '@/lib/igc'

function timeSeconds(time: string): number {
  return Number(time.slice(0, 2)) * 3600 + Number(time.slice(2, 4)) * 60 + Number(time.slice(4, 6))
}

function elapsedSeconds(from: string, to: string): number {
  let value = timeSeconds(to) - timeSeconds(from)
  if (value < 0) value += 86400
  return value
}

export function trailStartIndex(
  points: readonly IgcPoint[],
  rangeStartIndex: number,
  currentIndex: number,
  durationSeconds = 60,
): number {
  const current = points[currentIndex]
  if (!current) return rangeStartIndex
  let index = currentIndex
  while (
    index > rangeStartIndex &&
    elapsedSeconds(points[index - 1]!.time, current.time) <= durationSeconds
  ) {
    index -= 1
  }
  return index
}
