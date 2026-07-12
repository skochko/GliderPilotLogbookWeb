export type IgcMetadata = {
  date?: string
  pilot?: string
  copilot?: string
  gliderType?: string
  gliderId?: string
  competitionClass?: string
  loggerId?: string
}

export type IgcPoint = {
  lat: number
  lng: number
  time: string
  validFix: boolean
  pressureAltitudeM: number | null
  gnssAltitudeM: number | null
  varioMs: number | null
}

export type IgcTrack = {
  points: IgcPoint[]
  metadata: IgcMetadata
}

export type IgcAltitudeStats = {
  min: number
  max: number
}

function parseCoord(raw: string, hemisphere: string, isLat: boolean): number | null {
  const degLen = isLat ? 2 : 3
  if (raw.length < degLen + 5) {
    return null
  }

  const degrees = Number(raw.slice(0, degLen))
  const minutes = Number(raw.slice(degLen, degLen + 2))
  const thousandths = Number(raw.slice(degLen + 2, degLen + 5))
  if (!Number.isFinite(degrees) || !Number.isFinite(minutes) || !Number.isFinite(thousandths)) {
    return null
  }

  let value = degrees + (minutes + thousandths / 1000) / 60
  if (hemisphere === 'S' || hemisphere === 'W') {
    value = -value
  }
  return value
}

function parseAltitudeField(raw: string | undefined): number | null {
  if (!raw || raw.trim().length === 0) {
    return null
  }
  const value = Number(raw.trim())
  return Number.isFinite(value) ? value : null
}

function parseBRecord(line: string): IgcPoint | null {
  if (!line.startsWith('B') || line.length < 25) {
    return null
  }

  const time = line.slice(1, 7)
  const latRaw = line.slice(7, 14)
  const latHem = line.charAt(14)
  const lonRaw = line.slice(15, 23)
  const lonHem = line.charAt(23)

  const lat = parseCoord(latRaw, latHem, true)
  const lng = parseCoord(lonRaw, lonHem, false)
  if (lat === null || lng === null) {
    return null
  }

  const fixFlag = line.length > 24 ? line.charAt(24).toUpperCase() : 'A'
  const pressureAltitudeM = line.length >= 30 ? parseAltitudeField(line.slice(25, 30)) : null
  const gnssAltitudeM = line.length >= 35 ? parseAltitudeField(line.slice(30, 35)) : null

  return {
    lat,
    lng,
    time,
    validFix: fixFlag !== 'V',
    pressureAltitudeM,
    gnssAltitudeM,
    varioMs: null,
  }
}

function formatIgcDate(raw: string): string | undefined {
  if (raw.length !== 6) {
    return undefined
  }
  const day = Number(raw.slice(0, 2))
  const month = Number(raw.slice(2, 4))
  const year = 2000 + Number(raw.slice(4, 6))
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return undefined
  }
  const date = new Date(Date.UTC(year, month - 1, day))
  if (Number.isNaN(date.getTime())) {
    return undefined
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const
  return `${day} ${months[month - 1]} ${year}`
}

function hRecordValue(line: string): string {
  const colonIdx = line.indexOf(':')
  if (colonIdx >= 0) {
    return line.slice(colonIdx + 1).trim()
  }
  return line.slice(5).trim()
}

function parseHRecord(line: string): Partial<IgcMetadata> {
  const trimmed = line.trim()
  if (!trimmed.startsWith('H')) {
    return {}
  }

  if (trimmed.startsWith('HFDTE') && trimmed.length >= 11) {
    const date = formatIgcDate(trimmed.slice(5, 11))
    return date ? { date } : {}
  }

  const upper = trimmed.toUpperCase()
  const value = hRecordValue(trimmed)

  if (upper.includes('PLTPILOT') || upper.startsWith('HFPLT')) {
    return value ? { pilot: value } : {}
  }
  if (upper.includes('COPILOT') || upper.startsWith('HFCOP')) {
    return value ? { copilot: value } : {}
  }
  if (upper.includes('GLIDERTYPE') || upper.startsWith('HFGTY')) {
    return value ? { gliderType: value } : {}
  }
  if (upper.includes('GLIDERID') || upper.startsWith('HFGID')) {
    return value ? { gliderId: value } : {}
  }
  if (upper.includes('COMPETITIONCLASS') || upper.startsWith('HFCCL')) {
    return value ? { competitionClass: value } : {}
  }
  if (upper.includes('LOGGER') || upper.startsWith('HFLOGGER') || upper.startsWith('HFRFW')) {
    return value ? { loggerId: value } : {}
  }

  return {}
}

function timeToSeconds(time: string): number {
  const hours = Number(time.slice(0, 2))
  const minutes = Number(time.slice(2, 4))
  const seconds = Number(time.slice(4, 6))
  return hours * 3600 + minutes * 60 + seconds
}

function timeDiffSeconds(fromTime: string, toTime: string): number {
  let diff = timeToSeconds(toTime) - timeToSeconds(fromTime)
  if (diff < 0) {
    diff += 24 * 3600
  }
  return diff
}

function enrichVario(points: IgcPoint[]): void {
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]!
    const current = points[index]!
    const previousAlt = pointAltitude(previous)
    const currentAlt = pointAltitude(current)
    if (previousAlt === null || currentAlt === null) {
      continue
    }

    const deltaSeconds = timeDiffSeconds(previous.time, current.time)
    if (deltaSeconds <= 0) {
      continue
    }

    current.varioMs = (currentAlt - previousAlt) / deltaSeconds
  }
}

export function pointAltitude(point: IgcPoint): number | null {
  return point.gnssAltitudeM ?? point.pressureAltitudeM
}

export function parseIgcTrack(content: string): IgcTrack {
  const points: IgcPoint[] = []
  const metadata: IgcMetadata = {}

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) {
      continue
    }

    if (trimmed.startsWith('B')) {
      const point = parseBRecord(trimmed)
      if (point) {
        points.push(point)
      }
      continue
    }

    if (trimmed.startsWith('H')) {
      Object.assign(metadata, parseHRecord(trimmed))
    }
  }

  enrichVario(points)

  return { points, metadata }
}

export function getAltitudeStats(points: readonly IgcPoint[]): IgcAltitudeStats | null {
  const altitudes = points.map(pointAltitude).filter((value): value is number => value !== null)
  if (altitudes.length === 0) {
    return null
  }

  return {
    min: Math.min(...altitudes),
    max: Math.max(...altitudes),
  }
}

export function formatIgcTime(time: string): string {
  if (time.length !== 6) {
    return time
  }
  return `${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6)}`
}

export function formatVario(varioMs: number | null | undefined): string {
  if (varioMs === null || varioMs === undefined || !Number.isFinite(varioMs)) {
    return '—'
  }
  const sign = varioMs > 0 ? '+' : ''
  return `${sign}${varioMs.toFixed(1)} m/s`
}

export function formatAltitude(altitudeM: number | null | undefined): string {
  if (altitudeM === null || altitudeM === undefined || !Number.isFinite(altitudeM)) {
    return '—'
  }
  return `${Math.round(altitudeM)} m`
}

export function metadataSummary(metadata: IgcMetadata): string {
  return [
    metadata.pilot,
    metadata.gliderType,
    metadata.gliderId,
    metadata.date,
  ]
    .filter(Boolean)
    .join(' · ')
}

export function altitudeColor(altitudeM: number, min: number, max: number): string {
  const range = max - min || 1
  const ratio = Math.max(0, Math.min(1, (altitudeM - min) / range))
  const hue = (1 - ratio) * 240
  return `hsl(${hue}, 75%, 42%)`
}

export type ColoredTrackSegment = {
  latlngs: [number, number][]
  color: string
}

export function buildColoredTrackSegments(
  points: readonly IgcPoint[],
  stats: IgcAltitudeStats,
): ColoredTrackSegment[] {
  if (points.length < 2) {
    return []
  }

  const bucketCount = 16
  const segments: ColoredTrackSegment[] = []
  let currentLatLngs: [number, number][] = [[points[0]!.lat, points[0]!.lng]]
  let currentColor = colorForPoint(points[0]!, stats, bucketCount)

  for (let index = 1; index < points.length; index += 1) {
    const point = points[index]!
    const color = colorForPoint(point, stats, bucketCount)

    if (color !== currentColor && currentLatLngs.length > 0) {
      currentLatLngs.push([point.lat, point.lng])
      segments.push({ latlngs: [...currentLatLngs], color: currentColor })
      currentLatLngs = [[point.lat, point.lng]]
      currentColor = color
      continue
    }

    currentLatLngs.push([point.lat, point.lng])
    currentColor = color
  }

  if (currentLatLngs.length > 1) {
    segments.push({ latlngs: currentLatLngs, color: currentColor })
  }

  return segments
}

function colorForPoint(point: IgcPoint, stats: IgcAltitudeStats, bucketCount: number): string {
  const altitude = pointAltitude(point)
  if (altitude === null) {
    return '#0369a1'
  }

  const ratio = Math.max(0, Math.min(1, (altitude - stats.min) / (stats.max - stats.min || 1)))
  const bucket = Math.min(bucketCount - 1, Math.floor(ratio * bucketCount))
  const bucketAltitude = stats.min + (bucket / (bucketCount - 1)) * (stats.max - stats.min)
  return altitudeColor(bucketAltitude, stats.min, stats.max)
}
