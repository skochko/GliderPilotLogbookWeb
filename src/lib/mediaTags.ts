import type { FlightMediaItem } from '@/types'

type FlightWithMedia = {
  media?: readonly FlightMediaItem[] | null
  remarks?: string | null
}

export function hasMediaAttachments(flight: FlightWithMedia): boolean {
  return (flight.media?.length ?? 0) > 0
}

export function hasIgcAttachment(flight: FlightWithMedia): boolean {
  return flight.media?.some((item) => item.type === 'igc') ?? false
}

export function hasOtherMediaAttachments(flight: FlightWithMedia): boolean {
  return flight.media?.some((item) => item.type !== 'igc') ?? false
}

export function firstIgcAttachment(flight: FlightWithMedia): FlightMediaItem | null {
  return flight.media?.find((item) => item.type === 'igc') ?? null
}

export function mediaTypeLabel(type: FlightMediaItem['type']): string {
  switch (type) {
    case 'video':
      return 'Video'
    case 'image':
      return 'Image'
    case 'audio':
      return 'Audio'
    case 'igc':
      return 'IGC'
    default:
      return 'File'
  }
}
