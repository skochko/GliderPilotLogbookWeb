import type { FlightMediaItem } from '@/types'

const MEDIA_TAG_PATTERN = /\[(video|image|audio|file|igc):([^\]]+)\]/g

type FlightWithMedia = {
  media?: readonly FlightMediaItem[] | null
  remarks?: string | null
}

export type MediaListIcon = 'video' | 'image' | 'generic'

export function stripMediaTags(remarks: string | null | undefined): string {
  return (remarks ?? '')
    .replace(MEDIA_TAG_PATTERN, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function hasUserRemarks(remarks: string | null | undefined): boolean {
  return Boolean(stripMediaTags(remarks))
}

export function userRemarksText(remarks: string | null | undefined): string {
  return stripMediaTags(remarks)
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

export function igcAttachments(flight: FlightWithMedia): FlightMediaItem[] {
  return flight.media?.filter((item) => item.type === 'igc') ?? []
}

export function nonIgcMediaAttachments(flight: FlightWithMedia): FlightMediaItem[] {
  return flight.media?.filter((item) => item.type !== 'igc') ?? []
}

export function mediaListIcon(flight: FlightWithMedia): MediaListIcon | null {
  const items = nonIgcMediaAttachments(flight)
  if (items.length === 0) {
    return null
  }

  const types = new Set(items.map((item) => item.type))
  if (types.size === 1 && types.has('video')) {
    return 'video'
  }
  if (types.size === 1 && types.has('image')) {
    return 'image'
  }
  return 'generic'
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
