export type FlightMediaType = 'video' | 'image' | 'audio' | 'file' | 'igc'

export interface FlightMediaItem {
  type: FlightMediaType
  filename: string
  label: string
  drive_file_id?: string
  drive_url?: string
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

export const FLIGHT_MEDIA_MAX_FILES = 5
export const FLIGHT_MEDIA_MAX_UPLOAD_BYTES = 200 * 1024 * 1024
