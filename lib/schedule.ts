export function generateCycleDates(startDate: Date, count: number): Date[] {
  const dates: Date[] = []
  for (let i = 0; i < count; i++) {
    const d = new Date(startDate)
    d.setUTCDate(d.getUTCDate() + i * 14)
    dates.push(d)
  }
  return dates
}

export function getNextCycleDate(fromDate: Date): Date {
  const d = new Date(fromDate)
  d.setUTCDate(d.getUTCDate() + 14)
  return d
}

export function isCycleOpen(cycleDate: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const cd = new Date(cycleDate)
  cd.setHours(0, 0, 0, 0)
  return cd <= today
}
