export type FlightMediaType = 'video' | 'image' | 'audio' | 'file' | 'igc' | 'youtube'

export interface FlightMediaItem {
  type: FlightMediaType
  filename: string
  label: string
  drive_file_id?: string
  drive_url?: string
  /** YouTube only: watch URL, privacy-enhanced embed URL, video id and start offset. */
  url?: string
  embed_url?: string
  video_id?: string
  start_seconds?: number | null
}

export interface FlightMediaFolder {
  folder_id: string
  folder_url: string
  folder_name: string
}

export interface FlightMediaUploadResponse {
  flight: {
    id: string
    remarks: string
    media?: FlightMediaItem[]
  }
  media: FlightMediaItem[]
  attachment: FlightMediaItem
}

export interface FlightMediaDeleteResponse {
  flight: {
    id: string
    remarks: string
    media?: FlightMediaItem[]
  }
  media: FlightMediaItem[]
  deleted: FlightMediaItem
}

export const FLIGHT_MEDIA_MAX_FILES = 5
/** One YouTube video per flight; it does not count towards FLIGHT_MEDIA_MAX_FILES. */
export const FLIGHT_MEDIA_MAX_YOUTUBE = 1
export const FLIGHT_MEDIA_MAX_UPLOAD_BYTES = 200 * 1024 * 1024
