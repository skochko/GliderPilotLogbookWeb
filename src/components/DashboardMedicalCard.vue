<script setup lang="ts">
import { computed } from 'vue'
import type { DeepReadonly } from 'vue'
import { formatDisplayDate, formatRemainingDays } from '@/lib/dates'
import type { DashboardMedical, DashboardStatusEnum } from '@/types'

const props = defineProps<{
  medical: DeepReadonly<DashboardMedical>
}>()

const expanded = defineModel<boolean>('expanded', { default: false })

const statusStyles: Record<DashboardStatusEnum, string> = {
  current: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  expiring_soon: 'bg-amber-100 text-amber-900 ring-amber-200',
  expired: 'bg-red-100 text-red-800 ring-red-200',
  unknown: 'bg-slate-100 text-slate-700 ring-slate-200',
}

const statusDotStyles: Record<DashboardStatusEnum, string> = {
  current: 'bg-emerald-500',
  expiring_soon: 'bg-amber-500',
  expired: 'bg-red-500',
  unknown: 'bg-slate-400',
}

const medicalSummary = computed(() => {
  const expiry = formatDisplayDate(props.medical.expiry_date)
  const remaining = formatRemainingDays(props.medical.remaining_days)
  if (expiry === '—' && remaining === '—') {
    return 'No expiry recorded'
  }
  if (expiry === '—') {
    return remaining
  }
  if (remaining === '—') {
    return `Expires ${expiry}`
  }
  return `Expires ${expiry} · ${remaining}`
})

function statusLabel(status: DashboardStatusEnum): string {
  if (status === 'current') return 'Current'
  if (status === 'expiring_soon') return 'Expiring soon'
  if (status === 'expired') return 'Not current'
  return 'Unknown'
}
</script>

<template>
  <article class="rounded-lg border border-slate-200 bg-white shadow-sm">
    <button
      type="button"
      class="flex w-full items-start gap-3 px-4 py-3 text-left md:px-5 md:py-4 md:cursor-default"
      @click="expanded = !expanded"
    >
      <div class="min-w-0 flex-1">
        <h2 class="font-semibold text-slate-900">
          Medical
          <span v-if="medical.type" class="font-normal text-slate-500"> · </span>
          <span v-if="medical.type" class="font-normal text-slate-600">{{ medical.type }}</span>
        </h2>
        <p class="mt-0.5 flex items-center gap-2 text-xs text-slate-500 md:hidden">
          <span
            class="inline-block h-2 w-2 shrink-0 rounded-full"
            :class="statusDotStyles[medical.status]"
            :title="statusLabel(medical.status)"
            role="img"
            :aria-label="statusLabel(medical.status)"
          />
          <span>{{ medicalSummary }}</span>
        </p>
      </div>
      <span
        class="hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset md:inline-flex"
        :class="statusStyles[medical.status]"
      >
        {{ medical.status_text }}
      </span>
    </button>

    <div
      class="border-t border-slate-200 px-4 py-3 md:px-5 md:py-4"
      :class="expanded ? 'block' : 'hidden md:block'"
    >
      <dl class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="hidden md:block">
          <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">Type</dt>
          <dd class="mt-1 text-sm text-slate-900">{{ medical.type || '—' }}</dd>
        </div>
        <div class="hidden md:block">
          <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">Issue date</dt>
          <dd class="mt-1 text-sm text-slate-900">{{ formatDisplayDate(medical.issue_date) }}</dd>
        </div>
        <div class="hidden md:block">
          <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">Expiry date</dt>
          <dd class="mt-1 text-sm text-slate-900">{{ formatDisplayDate(medical.expiry_date) }}</dd>
        </div>
        <div class="hidden md:block">
          <dt class="text-xs font-medium uppercase tracking-wide text-slate-500">Remaining</dt>
          <dd class="mt-1 text-sm text-slate-900">{{ formatRemainingDays(medical.remaining_days) }}</dd>
        </div>
      </dl>

      <div class="space-y-1 md:hidden">
        <p class="text-sm text-slate-700">
          Issue date: {{ formatDisplayDate(medical.issue_date) }}
        </p>
        <p v-if="medical.notes" class="text-sm text-slate-600">{{ medical.notes }}</p>
      </div>
    </div>
  </article>
</template>
