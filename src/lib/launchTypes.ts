export type LaunchTypeOption = {
  label: string
  code: string
}

export const LAUNCH_TYPES: readonly LaunchTypeOption[] = [
  { label: 'Winch', code: 'W' },
  { label: 'Aerotow', code: 'A' },
  { label: 'Auto Tow', code: 'M' },
  { label: 'Motor Glider', code: 'MG' },
  { label: 'Self Launcher', code: 'SL' },
]

const CODES = new Set(LAUNCH_TYPES.map((item) => item.code))
const LABEL_TO_CODE = new Map(LAUNCH_TYPES.map((item) => [item.label, item.code]))
const CODE_TO_LABEL = new Map(LAUNCH_TYPES.map((item) => [item.code, item.label]))

export type LaunchTypeSelectOption = {
  value: string
  label: string
}

export function isKnownLaunchTypeCode(value: string): boolean {
  return CODES.has(value.trim())
}

/** Map stored logbook value (code or legacy label) to the canonical code. */
export function normalizeLaunchTypeCode(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim()
  if (!trimmed) {
    return ''
  }
  if (CODES.has(trimmed)) {
    return trimmed
  }
  return LABEL_TO_CODE.get(trimmed) ?? trimmed
}

export function launchTypeSelectLabel(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }
  const code = normalizeLaunchTypeCode(trimmed)
  const label = CODE_TO_LABEL.get(code)
  if (label) {
    return `${label} (${code})`
  }
  return trimmed
}

export function launchTypeSelectOptions(currentValue?: string): LaunchTypeSelectOption[] {
  const options: LaunchTypeSelectOption[] = LAUNCH_TYPES.map((item) => ({
    value: item.code,
    label: `${item.label} (${item.code})`,
  }))

  const normalized = normalizeLaunchTypeCode(currentValue)
  if (normalized && !isKnownLaunchTypeCode(normalized)) {
    options.unshift({ value: normalized, label: normalized })
  }

  return options
}
