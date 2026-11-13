import type { QualificationStatus } from '@/types/instructorOversight'

export const QUALIFICATION_STATUS_LABELS: Record<QualificationStatus, string> = {
  lapsed: 'Lapsed',
  unknown: 'Data incomplete',
  expiring: 'Expiring soon',
  valid: 'Current',
}
