export type MeasurementUnits = 'metric' | 'imperial'

const METRES_TO_FEET = 3.280839895
const KILOMETRES_TO_MILES = 0.621371192
const METRES_PER_SECOND_TO_KNOTS = 1.943844492

export function measurementUnitsFromPreferences(
  preferences: Record<string, unknown> | null | undefined,
): MeasurementUnits {
  return preferences?.measurement_units === 'imperial' ? 'imperial' : 'metric'
}

export function formatAltitudeValue(
  altitudeM: number | null | undefined,
  units: MeasurementUnits,
): string {
  if (altitudeM === null || altitudeM === undefined || !Number.isFinite(altitudeM)) return '—'
  return units === 'imperial'
    ? `${Math.round(altitudeM * METRES_TO_FEET).toLocaleString()} ft`
    : `${Math.round(altitudeM).toLocaleString()} m`
}

export function formatVarioValue(
  varioMs: number | null | undefined,
  units: MeasurementUnits,
): string {
  if (varioMs === null || varioMs === undefined || !Number.isFinite(varioMs)) return '—'
  const value = units === 'imperial' ? varioMs * METRES_PER_SECOND_TO_KNOTS : varioMs
  const sign = value > 0 ? '+' : ''
  return units === 'imperial' ? `${sign}${value.toFixed(1)} kt` : `${sign}${value.toFixed(1)} m/s`
}

export function formatDistanceValue(kilometres: number, units: MeasurementUnits): string {
  const value = units === 'imperial' ? kilometres * KILOMETRES_TO_MILES : kilometres
  const unit = units === 'imperial' ? 'mi' : 'km'
  return `${Math.round(value).toLocaleString()} ${unit}`
}

export function altitudeScaleValue(altitudeM: number, units: MeasurementUnits): number {
  return units === 'imperial' ? altitudeM * METRES_TO_FEET : altitudeM
}
