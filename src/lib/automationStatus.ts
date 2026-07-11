import type { AutomationRequestStatus } from '@/api/automation'

const STATUS_LABELS: Record<AutomationRequestStatus, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
}

const STATUS_STYLES: Record<AutomationRequestStatus, string> = {
  pending: 'bg-amber-50 text-amber-900 ring-amber-200',
  in_progress: 'bg-sky-50 text-sky-900 ring-sky-200',
  approved: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  rejected: 'bg-red-50 text-red-900 ring-red-200',
  completed: 'bg-slate-100 text-slate-800 ring-slate-200',
}

export function automationStatusLabel(status: AutomationRequestStatus): string {
  return STATUS_LABELS[status] ?? status
}

export function automationStatusStyles(status: AutomationRequestStatus): string {
  return STATUS_STYLES[status] ?? STATUS_STYLES.pending
}
