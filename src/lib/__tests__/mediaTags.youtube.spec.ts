import { describe, expect, it } from 'vitest'
import {
  fileAttachments,
  hasOtherMediaAttachments,
  mediaListIcon,
  stripMediaTags,
  youtubeAttachment,
} from '@/lib/mediaTags'
import type { FlightMediaItem } from '@/types'

const video: FlightMediaItem = {
  type: 'youtube',
  filename: 'Ridge run',
  label: 'Ridge run',
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  embed_url: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
  video_id: 'dQw4w9WgXcQ',
  start_seconds: null,
}
const image: FlightMediaItem = { type: 'image', filename: 'a.jpg', label: 'a.jpg' }

describe('mediaTags YouTube', () => {
  it('keeps the YouTube video apart from file attachments', () => {
    expect(youtubeAttachment({ media: [image, video] })).toEqual(video)
    expect(fileAttachments([image, video])).toEqual([image])
    expect(mediaListIcon({ media: [video] })).toBeNull()
    expect(mediaListIcon({ media: [image, video] })).toBe('image')
    expect(hasOtherMediaAttachments({ media: [video] })).toBe(false)
  })

  it('ignores a YouTube item without an embed URL', () => {
    expect(youtubeAttachment({ media: [{ ...video, embed_url: undefined }] })).toBeNull()
  })

  it('strips the YouTube block from remarks', () => {
    expect(stripMediaTags('Nice day\n\n[Images: a.jpg]\n[YouTube: Ridge run]')).toBe('Nice day')
  })
})
