import { readonly, ref } from 'vue'
import { updateProfile } from '@/api/profile'
import {
  buildStatisticsPreferences,
  canLoadStatistics,
  defaultStatisticsPeriod,
  isValidStatisticsPeriod,
  readStatisticsPeriodFromPreferences,
  resolveStatisticsPreset,
  type StatisticsPeriod,
  type StatisticsPresetId,
} from '@/lib/statisticsPeriod'

const period = ref<StatisticsPeriod>(defaultStatisticsPeriod())
const preset = ref<StatisticsPresetId>('this_month')
const initialized = ref(false)

let saveTimer: ReturnType<typeof setTimeout> | null = null

function clearSaveTimer(): void {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
}

async function persistPeriod(): Promise<void> {
  if (!canLoadStatistics(preset.value, period.value)) {
    return
  }
  await updateProfile({
    preferences: buildStatisticsPreferences(period.value, preset.value) as Record<string, unknown>,
  })
}

function schedulePersist(): void {
  clearSaveTimer()
  saveTimer = setTimeout(() => {
    void persistPeriod()
  }, 500)
}

export function resetStatisticsPeriodState(): void {
  clearSaveTimer()
  period.value = defaultStatisticsPeriod()
  preset.value = 'this_month'
  initialized.value = false
}

export function useStatisticsPeriod() {
  function initializeFromPreferences(preferences: Record<string, unknown> | undefined): void {
    const saved = readStatisticsPeriodFromPreferences(preferences)
    period.value = saved.period
    preset.value = saved.preset
    initialized.value = true
  }

  function applyPreset(nextPreset: StatisticsPresetId): void {
    preset.value = nextPreset
    if (nextPreset === 'custom') {
      if (!isValidStatisticsPeriod(period.value)) {
        period.value = defaultStatisticsPeriod()
      }
      schedulePersist()
      return
    }
    period.value = resolveStatisticsPreset(nextPreset)
    schedulePersist()
  }

  function setPeriod(nextPeriod: StatisticsPeriod): void {
    period.value = nextPeriod
    preset.value = 'custom'
    if (isValidStatisticsPeriod(nextPeriod)) {
      schedulePersist()
    }
  }

  function setFrom(value: string): void {
    setPeriod({ ...period.value, from: value })
  }

  function setTo(value: string): void {
    setPeriod({ ...period.value, to: value })
  }

  return {
    period: readonly(period),
    preset: readonly(preset),
    initialized: readonly(initialized),
    initializeFromPreferences,
    applyPreset,
    setFrom,
    setTo,
    persistPeriod,
  }
}
