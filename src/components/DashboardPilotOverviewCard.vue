<script setup lang="ts">
import { computed } from 'vue'
import { formatDisplayDate, formatRemainingDays } from '@/lib/dates'
import type { DashboardMedical, DashboardStatusEnum, Flight } from '@/types'

const props = defineProps<{
  pilotName: string
  pilotPrivilege: string
  lastFlight: Flight | null
  medical: DashboardMedical | null
}>()

const statusDotStyles: Record<DashboardStatusEnum, string> = {
  current: 'bg-emerald-500',
  expiring_soon: 'bg-amber-500',
  expired: 'bg-red-500',
  unknown: 'bg-slate-400',
}

const daysSinceLastFlight = computed(() => {
  if (!props.lastFlight?.date) {
    return null
  }
  const flightDate = new Date(`${props.lastFlight.date}T00:00:00`)
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.max(0, Math.floor((todayStart.getTime() - flightDate.getTime()) / 86400000))
})

function statusLabel(status: DashboardStatusEnum): string {
  if (status === 'current') return 'Current'
  if (status === 'expiring_soon') return 'Expiring soon'
  if (status === 'expired') return 'Not current'
  return 'Unknown'
}
</script>

<template>
  <article class="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm md:px-5 md:py-4">
    <p class="text-xl font-semibold leading-tight text-slate-900">{{ pilotName || 'Pilot' }}</p>
    <p v-if="pilotPrivilege" class="mt-0.5 text-sm text-slate-500">{{ pilotPrivilege }}</p>

    <div class="mt-3 space-y-2 border-t border-slate-200 pt-3">
      <div class="flex items-baseline gap-3">
        <p class="w-24 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500">Last flight</p>
        <p class="min-w-0 text-sm font-medium text-slate-900">
          {{ lastFlight ? formatDisplayDate(lastFlight.date) : '—' }}
          <span class="font-normal text-slate-500">
            ·
            {{
              daysSinceLastFlight === null
                ? 'No flights recorded'
                : daysSinceLastFlight === 0
                  ? 'Today'
                  : `${daysSinceLastFlight} days ago`
            }}
          </span>
        </p>
      </div>

      <div class="flex items-baseline gap-3">
        <p class="w-24 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500">Medical</p>
        <div v-if="medical" class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-700">
          <span
            class="inline-block h-2.5 w-2.5 rounded-full"
            :class="statusDotStyles[medical.status]"
            :title="statusLabel(medical.status)"
            role="img"
            :aria-label="statusLabel(medical.status)"
          />
          <span v-if="medical.type">{{ medical.type }}</span>
          <span>{{ medical.status_text }}</span>
          <span class="text-slate-500">{{ formatRemainingDays(medical.remaining_days) }}</span>
        </div>
        <p v-else class="text-sm text-slate-500">No medical entry</p>
      </div>
    </div>
  </article>
</template>
