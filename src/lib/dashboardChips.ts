import type { DashboardStatusEnum } from '@/types'

/** Compact launch-method pills on the dashboard legality section. */
export const dashboardChipBaseClass =
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset'

export const dashboardChipStatusDotStyles: Record<DashboardStatusEnum, string> = {
  current: 'bg-emerald-500',
  expiring_soon: 'bg-amber-500',
  expired: 'bg-red-500',
  unknown: 'bg-slate-400',
}

export const dashboardChipStatusStyles: Record<DashboardStatusEnum, string> = {
  current: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  expiring_soon: 'bg-amber-50 text-amber-900 ring-amber-200',
  expired: 'bg-red-50 text-red-800 ring-red-200',
  unknown: 'bg-slate-50 text-slate-600 ring-slate-200',
}

/** Fixed launch-type colours aligned with dashboard legality chips. */
export const launchTypeChipStyles: Record<string, string> = {
  W: dashboardChipStatusStyles.current,
  A: 'bg-sky-50 text-sky-800 ring-sky-200',
  M: 'bg-violet-50 text-violet-800 ring-violet-200',
  MG: dashboardChipStatusStyles.expiring_soon,
  SL: dashboardChipStatusStyles.unknown,
}
