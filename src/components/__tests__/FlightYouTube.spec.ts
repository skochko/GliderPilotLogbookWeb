import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FlightMediaSection from '@/components/FlightMediaSection.vue'
import FlightRowActions from '@/components/FlightRowActions.vue'
import type { Flight, FlightMediaItem } from '@/types'

const mediaApi = vi.hoisted(() => ({
  addFlightYouTubeLink: vi.fn(),
  attachFlightMediaFromDrive: vi.fn(),
  deleteFlightMedia: vi.fn(),
  getFlightMediaFolder: vi.fn(),
  uploadFlightMedia: vi.fn(),
  fetchFlightMediaBlob: vi.fn(),
  flightMediaContentUrl: vi.fn(),
}))
vi.mock('@/api/flightMedia', () => mediaApi)
vi.mock('@/composables/useGooglePicker', () => ({
  useGooglePicker: () => ({ pickDriveFile: vi.fn() }),
}))

const video: FlightMediaItem = {
  type: 'youtube',
  filename: 'Ridge run',
  label: 'Ridge run',
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  embed_url: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
  video_id: 'dQw4w9WgXcQ',
  start_seconds: null,
}
const files: FlightMediaItem[] = Array.from({ length: 5 }, (_, index) => ({
  type: 'image',
  filename: `${index}.jpg`,
  label: `${index}.jpg`,
}))

function mountSection(media: FlightMediaItem[]) {
  return mount(FlightMediaSection, {
    props: { flightId: 'flight-1', media },
    global: { stubs: { IgcMapDialog: true, FlightImageViewerDialog: true } },
    attachTo: document.body,
  })
}

describe('flight YouTube link', () => {
  beforeEach(() => vi.clearAllMocks())

  it('adds a video even when the five file slots are used', async () => {
    const updated = { id: 'flight-1', remarks: '', media: [...files, video] }
    mediaApi.addFlightYouTubeLink.mockResolvedValue({
      flight: updated,
      media: [],
      attachment: video,
    })
    const wrapper = mountSection(files)

    expect(wrapper.text()).toContain('5/5')
    await wrapper.get('[data-action="add-youtube"]').trigger('click')
    await wrapper.get('#youtube-url').setValue(' https://youtu.be/dQw4w9WgXcQ ')
    await wrapper.get('[data-testid="youtube-form"]').trigger('submit')
    await flushPromises()

    expect(mediaApi.addFlightYouTubeLink).toHaveBeenCalledWith(
      'flight-1',
      'https://youtu.be/dQw4w9WgXcQ',
    )
    expect(wrapper.emitted('updated')).toEqual([[updated]])
    wrapper.unmount()
  })

  it('shows the server error under the link field', async () => {
    mediaApi.addFlightYouTubeLink.mockRejectedValue(
      Object.assign(new Error('Only YouTube links are supported.'), {
        name: 'ApiError',
        code: 'VALIDATION_ERROR',
        status: 400,
      }),
    )
    const wrapper = mountSection([])

    await wrapper.get('[data-action="add-youtube"]').trigger('click')
    await wrapper.get('#youtube-url').setValue('https://vimeo.com/1')
    await wrapper.get('[data-testid="youtube-form"]').trigger('submit')
    await flushPromises()

    expect(wrapper.get('#youtube-url-error').text()).not.toBe('')
    wrapper.unmount()
  })

  it('hides the add button once the flight has a video and offers Watch', () => {
    const wrapper = mountSection([video])

    expect(wrapper.find('[data-action="add-youtube"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('0/5')
    expect(wrapper.get('a[href^="https://www.youtube.com/watch"]').text()).toContain('Watch')
    wrapper.unmount()
  })

  it('lets the flight Save attach a link that was typed but not added', async () => {
    const updated = { id: 'flight-1', remarks: '', media: [video] }
    mediaApi.addFlightYouTubeLink.mockResolvedValue({
      flight: updated,
      media: [],
      attachment: video,
    })
    const wrapper = mountSection([])
    const section = wrapper.vm as unknown as { submitPendingYoutube: () => Promise<boolean> }

    expect(await section.submitPendingYoutube()).toBe(true)
    expect(mediaApi.addFlightYouTubeLink).not.toHaveBeenCalled()

    await wrapper.get('[data-action="add-youtube"]').trigger('click')
    await wrapper.get('#youtube-url').setValue('https://youtu.be/dQw4w9WgXcQ')
    expect(await section.submitPendingYoutube()).toBe(true)

    expect(mediaApi.addFlightYouTubeLink).toHaveBeenCalledWith(
      'flight-1',
      'https://youtu.be/dQw4w9WgXcQ',
    )
    expect(wrapper.emitted('updated')).toEqual([[updated]])
    wrapper.unmount()
  })

  it('reports a failed pending link so the flight Save can stop', async () => {
    mediaApi.addFlightYouTubeLink.mockRejectedValue(new Error('network'))
    const wrapper = mountSection([])
    const section = wrapper.vm as unknown as { submitPendingYoutube: () => Promise<boolean> }

    await wrapper.get('[data-action="add-youtube"]').trigger('click')
    await wrapper.get('#youtube-url').setValue('https://youtu.be/dQw4w9WgXcQ')

    expect(await section.submitPendingYoutube()).toBe(false)
    await flushPromises()
    expect(wrapper.get('#youtube-url-error').text()).toBe('Could not add the video.')
    wrapper.unmount()
  })

  it('shows a play icon in the flight row that opens the video', async () => {
    const flight = { id: 'f', remarks: '', media: [video] } as unknown as Flight
    const wrapper = mount(FlightRowActions, { props: { flight } })

    await wrapper.get('[data-action="open-youtube"]').trigger('click')

    expect(wrapper.emitted('openYoutube')).toHaveLength(1)
    expect(wrapper.find('[aria-label="View media"]').exists()).toBe(false)
  })
})
