import type { LogbookCreateFormState } from '@/types/logbookCreate'

const WIZARD_STATE_KEY = 'gpl-create-logbook-wizard'
const PENDING_SUBMIT_KEY = 'gpl-create-logbook-pending-submit'

export interface CreateLogbookWizardState {
  step: number
  form: LogbookCreateFormState
  skippedLicense: boolean
  skippedTotals: boolean
  skippedMedical: boolean
  skippedClubAutomation: boolean
  selectedOrganizationId: number | null
  manualConfirmed: boolean
}

interface LegacyCreateLogbookWizardState extends CreateLogbookWizardState {
  createMode?: 'manual' | 'automatic' | null
}

export function saveCreateLogbookWizardState(state: CreateLogbookWizardState, pendingSubmit = false): void {
  sessionStorage.setItem(WIZARD_STATE_KEY, JSON.stringify(state))
  if (pendingSubmit) {
    sessionStorage.setItem(PENDING_SUBMIT_KEY, '1')
  } else {
    sessionStorage.removeItem(PENDING_SUBMIT_KEY)
  }
}

export function loadCreateLogbookWizardState(): CreateLogbookWizardState | null {
  const raw = sessionStorage.getItem(WIZARD_STATE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as LegacyCreateLogbookWizardState
    if ('createMode' in parsed) {
      if (parsed.step > 1) {
        parsed.step -= 1
      }
      delete parsed.createMode
    }
    return parsed
  } catch {
    sessionStorage.removeItem(WIZARD_STATE_KEY)
    return null
  }
}

export function hasActiveCreateLogbookWizard(): boolean {
  return sessionStorage.getItem(WIZARD_STATE_KEY) !== null
}

export function consumeCreateLogbookPendingSubmit(): boolean {
  const pending = sessionStorage.getItem(PENDING_SUBMIT_KEY) === '1'
  sessionStorage.removeItem(PENDING_SUBMIT_KEY)
  return pending
}

export function clearCreateLogbookWizardState(): void {
  sessionStorage.removeItem(WIZARD_STATE_KEY)
  sessionStorage.removeItem(PENDING_SUBMIT_KEY)
}
