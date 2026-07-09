const PYTHON_TO_STRFTIME: Record<string, string> = {
  '%Y': 'yyyy',
  '%y': 'yy',
  '%m': 'mm',
  '%d': 'dd',
  '%b': 'MMM',
  '%B': 'MMMM',
}

export function formatDate(iso: string, dateFormat: string): string {
  if (!iso) return ''
  const [year, month, day] = iso.split('-')
  if (!year || !month || !day) return iso

  let pattern = dateFormat
  for (const [py, js] of Object.entries(PYTHON_TO_STRFTIME)) {
    pattern = pattern.split(py).join(js)
  }

  const replacements: Record<string, string> = {
    yyyy: year,
    yy: year.slice(-2),
    mm: month,
    dd: day,
  }

  return pattern.replace(/yyyy|yy|mm|dd|MMM|MMMM/g, (token) => {
    if (token === 'MMM') {
      return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleString('en', {
        month: 'short',
      })
    }
    if (token === 'MMMM') {
      return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleString('en', {
        month: 'long',
      })
    }
    return replacements[token] ?? token
  })
}

export function formatDayNumber(iso: string): string {
  if (!iso) return ''
  const day = iso.split('-')[2]
  if (!day) return iso
  return String(Number(day))
}

export function formatMonthYear(iso: string): string {
  if (!iso) return ''
  const [year, month] = iso.split('-')
  if (!year || !month) return iso
  return new Date(Number(year), Number(month) - 1, 1).toLocaleString('en', {
    month: 'long',
    year: 'numeric',
  })
}

export function groupByMonth<T extends { date: string }>(
  items: T[],
): Array<{ key: string; label: string; items: T[] }> {
  const groups: Array<{ key: string; label: string; items: T[] }> = []

  for (const item of items) {
    const key = item.date.slice(0, 7)
    const last = groups[groups.length - 1]
    if (last?.key === key) {
      last.items.push(item)
    } else {
      groups.push({ key, label: formatMonthYear(item.date), items: [item] })
    }
  }

  return groups
}

export function applySheetTheme(zebraColor: string, headerColor: string): void {
  document.documentElement.style.setProperty('--sheet-zebra-color', zebraColor)
  document.documentElement.style.setProperty('--sheet-header-color', headerColor)
}
