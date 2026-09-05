function median(values: readonly number[]): number {
  const middle = Math.floor(values.length / 2)
  return values.length % 2 ? values[middle]! : (values[middle - 1]! + values[middle]!) / 2
}

export function calculateTerrainAltitudeCorrection(
  altitudes: readonly number[],
  groundHeights: readonly number[],
): number {
  if (!altitudes.length || altitudes.length !== groundHeights.length) return 0

  const sampleSize = Math.min(30, Math.max(1, Math.floor(altitudes.length / 2)))
  const indexes = new Set<number>()
  for (let index = 0; index < sampleSize; index += 1) {
    indexes.add(index)
    indexes.add(altitudes.length - 1 - index)
  }
  const endpointCorrections = [...indexes]
    .map((index) => groundHeights[index]! - altitudes[index]!)
    .filter(Number.isFinite)
    .sort((a, b) => a - b)
  if (!endpointCorrections.length) return 0

  let correction = median(endpointCorrections)
  const clearances = altitudes
    .map((altitude, index) => altitude + correction - groundHeights[index]!)
    .filter(Number.isFinite)
    .sort((a, b) => a - b)

  // Ignore at most the lowest 1% of terrain samples as possible spikes. If the
  // rest intersects the ground, lift the complete track with a small clearance.
  const percentileIndex = Math.min(clearances.length - 1, Math.ceil(clearances.length * 0.01))
  const lowerPercentile = clearances[percentileIndex] ?? 0
  if (lowerPercentile < -1) correction += 3 - lowerPercentile

  return correction
}
