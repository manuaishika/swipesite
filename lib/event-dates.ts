// Parses the human-written dates on the conferences page ("Dec 6-12, 2026", "Feb 22-Mar 2, 2027",
// "Sep 28, 2026 (Oct 5, 2026)") so past events and closed deadlines can be told apart automatically.

const MONTHS: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 }

const monthIndex = (m: string) => MONTHS[m.slice(0, 3).toLowerCase()]

/** Last day of an event range, e.g. "Feb 22-Mar 2, 2027" -> 2 Mar 2027. */
export function eventEnd(when: string): Date | null {
  const year = when.match(/(\d{4})\s*$/)?.[1]
  if (!year) return null
  const parts = Array.from(when.matchAll(/([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2})(?:\s*[-–]\s*(\d{1,2})\b)?/g))
  const last = parts[parts.length - 1]
  if (!last) {
    // month only ("Mar 2027"): treat as the whole month
    const m = when.match(/^([A-Za-z]{3})[a-z]*\s+\d{4}$/)
    if (!m || monthIndex(m[1]) === undefined) return null
    return new Date(Number(year), monthIndex(m[1]) + 1, 0, 23, 59)
  }
  if (monthIndex(last[1]) === undefined) return null
  return new Date(Number(year), monthIndex(last[1]), Number(last[3] ?? last[2]), 23, 59)
}

/** First day of an event range. */
export function eventStart(when: string): Date | null {
  const year = when.match(/(\d{4})\s*$/)?.[1]
  const first = when.match(/([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2})/)
  if (year && !first) {
    const m = when.match(/^([A-Za-z]{3})[a-z]*\s+\d{4}$/)
    return m && monthIndex(m[1]) !== undefined ? new Date(Number(year), monthIndex(m[1]), 1) : null
  }
  if (!year || !first || monthIndex(first[1]) === undefined) return null
  const end = eventEnd(when)
  const start = new Date(Number(year), monthIndex(first[1]), Number(first[2]))
  // ranges that cross New Year ("Dec 28-Jan 3, 2027") start in the previous year
  if (end && start > end) start.setFullYear(start.getFullYear() - 1)
  return start
}

/** The first full date in a deadline string ("Sep 28, 2026 (Oct 5, 2026)" -> 28 Sep 2026); null for vague ones. */
export function firstDeadline(deadline: string): Date | null {
  const m = deadline.match(/([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),\s*(\d{4})/)
  if (!m || monthIndex(m[1]) === undefined) return null
  return new Date(Number(m[3]), monthIndex(m[1]), Number(m[2]), 23, 59)
}

/** "NeurIPS 2026" -> "NeurIPS"; "NeurIPS Workshops 2026" -> "NeurIPS Workshops". */
export function seriesName(name: string): string {
  return name.replace(/\s+(19|20)\d{2}\s*$/, '').trim()
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// Series held every two years (the rest are yearly).
const BIENNIAL = new Set(['ECCV', 'ICCV'])

type Dated = { name: string; when: string }

/**
 * What comes after a past event: the next edition if it's already in the list, otherwise an
 * estimate (most of these recur yearly, in the same month).
 */
export function nextEdition<T extends Dated>(past: T, all: T[]): { known: T } | { expected: string } | null {
  const series = seriesName(past.name)
  const end = eventEnd(past.when)
  if (!end) return null
  const later = all
    .filter((c) => c !== past && seriesName(c.name) === series)
    .map((c) => ({ c, start: eventStart(c.when) }))
    .filter((x) => x.start && x.start > end)
    .sort((a, b) => a.start!.getTime() - b.start!.getTime())[0]
  if (later) return { known: later.c }
  const start = eventStart(past.when) ?? end
  const every = BIENNIAL.has(series) ? 2 : 1
  return { expected: `${MONTH_NAMES[start.getMonth()]} ${start.getFullYear() + every}` }
}
