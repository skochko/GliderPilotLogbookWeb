import { resetAutomationState } from '@/composables/useAutomation'
import { resetDashboardStatusState } from '@/composables/useDashboardStatus'
import { resetFlightsState } from '@/composables/useFlights'
import { resetLogbookState as resetLogbookStatus } from '@/composables/useLogbook'
import { resetProfileState } from '@/composables/useProfile'
import { resetSettingsState } from '@/composables/useSettings'
import { resetStatisticsState } from '@/composables/useStatistics'
import { resetSummaryState } from '@/composables/useSummary'

/** Clear cached logbook data after disconnect or before switching spreadsheets. */
export function resetLogbookState(): void {
  resetFlightsState()
  resetSettingsState()
  resetStatisticsState()
  resetDashboardStatusState()
  resetSummaryState()
  resetProfileState()
  resetLogbookStatus()
  resetAutomationState()
}
