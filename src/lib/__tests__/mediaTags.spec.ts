import { describe, expect, it } from 'vitest'
import {
  firstIgcAttachment,
  hasIgcAttachment,
  hasMediaAttachments,
  hasOtherMediaAttachments,
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
  })
})
