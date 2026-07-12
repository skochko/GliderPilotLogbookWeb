import type { Statistics } from '@/types'

export type FlyingRow = {
  key: string
  label: string
  hours: number
  count: number
  countLabel: string
  badgeClass?: string
}

export type FlyingTotalsSource = Pick<
  Statistics,
  | 'total_flights'
  | 'total_flight_hours'
  | 'total_pic_hours'
  | 'total_p2_hours'
  | 'total_instructor_hours'
  | 'pic_flights'
  | 'p2_flights'
  | 'instructor_flights'
  | 'solo_flights'
  | 'solo_hours'
>

export function buildFlyingTotalsRows(stats: Readonly<FlyingTotalsSource>): FlyingRow[] {
  const items: FlyingRow[] = [
    {
      key: 'total',
      label: 'Total',
      hours: stats.total_flight_hours,
      count: stats.total_flights,
      countLabel: stats.total_flights === 1 ? 'flight' : 'flights',
    },
    {
      key: 'p1',
      label: 'P1',
      hours: stats.total_pic_hours,
      count: stats.pic_flights,
      countLabel: stats.pic_flights === 1 ? 'flight' : 'flights',
      badgeClass: 'bg-sky-100 text-sky-800 ring-sky-200',
    },
    {
      key: 'p2',
      label: 'P2',
      hours: stats.total_p2_hours,
      count: stats.p2_flights,
      countLabel: stats.p2_flights === 1 ? 'flight' : 'flights',
      badgeClass: 'bg-violet-100 text-violet-800 ring-violet-200',
    },
    {
      key: 'solo',
      label: 'Solo',
      hours: stats.solo_hours,
      count: stats.solo_flights,
      countLabel: stats.solo_flights === 1 ? 'flight' : 'flights',
      badgeClass: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    },
  ]

  if (stats.total_instructor_hours > 0 || stats.instructor_flights > 0) {
    items.push({
      key: 'instructor',
      label: 'Instructor',
      hours: stats.total_instructor_hours,
      count: stats.instructor_flights,
      countLabel: stats.instructor_flights === 1 ? 'flight' : 'flights',
      badgeClass: 'bg-amber-100 text-amber-900 ring-amber-200',
    })
  }

  return items
}

export function flyingSummaryRows(rows: FlyingRow[]): FlyingRow[] {
  return rows.filter((row) => row.key === 'total' || row.key === 'solo')
}

export function flyingBreakdownRows(rows: FlyingRow[]): FlyingRow[] {
  return rows.filter((row) => row.key !== 'total' && row.key !== 'solo')
}

export function rowHoursClass(key: string): string {
  return key === 'total'
    ? 'text-lg font-semibold md:text-xl'
    : 'text-sm font-medium text-slate-800 md:text-base'
}

export function rowCountClass(key: string): string {
  return key === 'total' ? 'text-xs' : 'text-[11px]'
}
