import { computed, readonly, ref } from 'vue'
import * as logbookApi from '@/api/logbook'
import { isApiError } from '@/api/errors'
import type { LogbookStatus } from '@/types'
import type {
  LogbookCreateRequest,
  LogbookCreateResponse,
  LogbookCreationJob,
} from '@/types/logbookCreate'

const status = ref<LogbookStatus | null>(null)
const creationJob = ref<LogbookCreationJob | null>(null)
const loading = ref(false)
const initialized = ref(false)
const mutating = ref(false)
const error = ref<string | null>(null)
const templateEngine = computed(() => status.value?.template_engine || null)
const CREATION_JOB_KEY = 'glider-pilot-logbook-creation-job'
let creationGeneration = 0

function saveCreationJobId(jobId: string): void {
  sessionStorage.setItem(CREATION_JOB_KEY, jobId)
}

function clearCreationJobId(): void {
  sessionStorage.removeItem(CREATION_JOB_KEY)
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

export function resetLogbookState(): void {
  status.value = null
  loading.value = false
  initialized.value = false
  mutating.value = false
  error.value = null
  creationJob.value = null
  creationGeneration += 1
  clearCreationJobId()
}

export function useLogbook() {
  async function fetchStatus(): Promise<LogbookStatus | null> {
    loading.value = true
    error.value = null
    try {
      status.value = await logbookApi.getLogbookStatus()
      return status.value
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to load logbook status'
      status.value = null
      return null
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  async function connect(payload: { spreadsheet_id: string }): Promise<boolean> {
    mutating.value = true
    error.value = null
    try {
      status.value = await logbookApi.connectLogbook(payload)
      return true
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to connect logbook'
      return false
    } finally {
      mutating.value = false
    }
  }

  async function applyWizard(payload: LogbookCreateRequest): Promise<LogbookCreateResponse | null> {
    mutating.value = true
    error.value = null
    try {
      const response = await logbookApi.applyLogbookWizard(payload)
      status.value = response
      return response
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to save logbook details'
      return null
    } finally {
      mutating.value = false
    }
  }

  async function create(payload: LogbookCreateRequest): Promise<LogbookCreateResponse | null> {
    const generation = ++creationGeneration
    mutating.value = true
    error.value = null
    try {
      const job = await logbookApi.createLogbook(payload)
      creationJob.value = job
      saveCreationJobId(job.job_id)
      return await waitForCreation(job, generation)
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to create logbook'
      return null
    } finally {
      mutating.value = false
    }
  }

  async function waitForCreation(
    initialJob: LogbookCreationJob,
    generation: number,
  ): Promise<LogbookCreateResponse | null> {
    let job = initialJob
    while (generation === creationGeneration) {
      creationJob.value = job
      if (job.status === 'succeeded' && job.result) {
        status.value = job.result
        clearCreationJobId()
        return job.result
      }
      if (job.status === 'failed') {
        clearCreationJobId()
        error.value = job.error || 'Failed to create logbook'
        return null
      }
      await delay(1000)
      job = await logbookApi.getLogbookCreationStatus(job.job_id)
    }
    return null
  }

  async function resumeCreate(): Promise<LogbookCreateResponse | null> {
    const jobId = sessionStorage.getItem(CREATION_JOB_KEY)
    if (!jobId) return null

    const generation = ++creationGeneration
    mutating.value = true
    error.value = null
    try {
      const job = await logbookApi.getLogbookCreationStatus(jobId)
      creationJob.value = job
      return await waitForCreation(job, generation)
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to check logbook creation'
      return null
    } finally {
      mutating.value = false
    }
  }

  function stopCreatePolling(): void {
    creationGeneration += 1
  }

  async function disconnect(): Promise<boolean> {
    mutating.value = true
    error.value = null
    try {
      await logbookApi.disconnectLogbook()
      status.value = { connected: false, spreadsheet_id: '', title: '', sheets: [] }
      return true
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Failed to disconnect logbook'
      return false
    } finally {
      mutating.value = false
    }
  }

  return {
    status: readonly(status),
    templateEngine: readonly(templateEngine),
    creationJob: readonly(creationJob),
    loading: readonly(loading),
    initialized: readonly(initialized),
    mutating: readonly(mutating),
    error: readonly(error),
    fetchStatus,
    connect,
    applyWizard,
    create,
    resumeCreate,
    stopCreatePolling,
    disconnect,
  }
}
