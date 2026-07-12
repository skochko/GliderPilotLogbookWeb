import { resetAutomationState } from '@/composables/useAutomation'
import { resetDashboardStatusState } from '@/composables/useDashboardStatus'
import { resetDisplaySettingsState } from '@/composables/useDisplaySettings'
import { resetFlightsState } from '@/composables/useFlights'
import { resetLogbookState as resetLogbookStatus } from '@/composables/useLogbook'
import { resetProfileState } from '@/composables/useProfile'
import { resetSettingsState } from '@/composables/useSettings'
import { resetStatisticsState } from '@/composables/useStatistics'

/** Clear cached logbook data after disconnect or before switching spreadsheets. */
export function resetLogbookState(): void {
  resetFlightsState()
  resetDisplaySettingsState()
  resetSettingsState()
  resetStatisticsState()
  resetDashboardStatusState()
  resetProfileState()
  resetLogbookStatus()
  resetAutomationState()
}
