/** Truncate text for table previews; appends an ellipsis when shortened. */
export function truncateText(text: string, maxLength: number): string {
  const trimmed = text.trim()
  if (trimmed.length <= maxLength) {
    return trimmed
  }
  return `${trimmed.slice(0, maxLength).trimEnd()}…`
}

export function hasRemarks(text: string | null | undefined): boolean {
  return Boolean(text?.trim())
}
