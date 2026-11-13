import { apiFetch, apiJson } from './client'
import { parseApiError } from './errors'
import type {
  ClubInstructorOverview,
  ClubReportEmailResult,
  InstructorActivityDetail,
} from '@/types/instructorOversight'

export function getClubInstructorOverview(): Promise<ClubInstructorOverview> {
  return apiJson<ClubInstructorOverview>('/instructor/club-instructors')
}

export function getClubInstructorActivityDetail(
  profileId: number,
): Promise<InstructorActivityDetail> {
  return apiJson<InstructorActivityDetail>(
    `/instructor/club-instructors/${encodeURIComponent(profileId)}/flight-activity`,
  )
}

export async function downloadClubInstructorReport(profileId: number): Promise<Blob> {
  const response = await apiFetch(
    `/instructor/club-instructors/${encodeURIComponent(profileId)}/flight-activity.pdf`,
  )
  if (!response.ok) throw await parseApiError(response)
  return response.blob()
}

export async function downloadClubReport(): Promise<Blob> {
  const response = await apiFetch('/instructor/club-instructors/report.pdf')
  if (!response.ok) throw await parseApiError(response)
  return response.blob()
}

export function emailClubReport(): Promise<ClubReportEmailResult> {
  return apiJson<ClubReportEmailResult>('/instructor/club-instructors/report/email', {
    method: 'POST',
  })
}
