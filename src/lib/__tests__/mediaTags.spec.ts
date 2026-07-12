import { describe, expect, it } from 'vitest'
import {
  firstIgcAttachment,
  hasIgcAttachment,
  hasMediaAttachments,
  hasOtherMediaAttachments,
  hasUserRemarks,
  igcAttachments,
  mediaListIcon,
  stripMediaTags,
  userRemarksText,
} from '@/lib/mediaTags'

describe('mediaTags', () => {
  it('detects media from flight.media array', () => {
    expect(hasMediaAttachments({ media: [{ type: 'video', filename: 'a.mp4', label: 'a.mp4' }] })).toBe(true)
    expect(hasMediaAttachments({ media: [] })).toBe(false)
  })

  it('detects IGC separately from other media', () => {
    const flight = {
      media: [
        { type: 'igc', filename: 'track.igc', label: 'track.igc' },
        { type: 'video', filename: 'a.mp4', label: 'a.mp4' },
      ],
    } as const

    expect(hasIgcAttachment(flight)).toBe(true)
    expect(hasOtherMediaAttachments(flight)).toBe(true)
    expect(firstIgcAttachment(flight)).toEqual(flight.media[0])
    expect(igcAttachments(flight)).toHaveLength(1)
  })

  it('strips media tags from remarks', () => {
    expect(stripMediaTags('[video:clip.mp4] Nice flight')).toBe('Nice flight')
    expect(hasUserRemarks('[video:clip.mp4]')).toBe(false)
    expect(hasUserRemarks('[video:clip.mp4] Instructor sign-off')).toBe(true)
    expect(userRemarksText('[igc:track.igc] Thermal day')).toBe('Thermal day')
  })

  it('picks media list icon by attachment types', () => {
    expect(mediaListIcon({ media: [{ type: 'video', filename: 'a.mp4', label: 'a.mp4' }] })).toBe('video')
    expect(mediaListIcon({ media: [{ type: 'image', filename: 'a.jpg', label: 'a.jpg' }] })).toBe('image')
    expect(
      mediaListIcon({
        media: [
          { type: 'video', filename: 'a.mp4', label: 'a.mp4' },
          { type: 'audio', filename: 'a.mp3', label: 'a.mp3' },
        ],
      }),
    ).toBe('generic')
    expect(
      mediaListIcon({
        media: [
          { type: 'igc', filename: 'a.igc', label: 'a.igc' },
          { type: 'video', filename: 'a.mp4', label: 'a.mp4' },
        ],
      }),
    ).toBe('video')
  })
})
