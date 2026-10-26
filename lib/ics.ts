// Minimal iCalendar export, so a deadline or event can be added to any calendar app.

const pad = (n: number) => String(n).padStart(2, '0')
const day = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
const esc = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')

type Entry = { uid: string; title: string; start: Date; end?: Date; url?: string; note?: string }

/** All-day events. `end` is inclusive (the last day), as people read it. */
export function buildIcs(entries: Entry[]): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ResearchSwipe//Conferences//EN', 'CALSCALE:GREGORIAN']
  for (const e of entries) {
    const last = new Date((e.end ?? e.start).getTime())
    last.setDate(last.getDate() + 1) // DTEND is exclusive for all-day events
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}@researchswipe`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${day(e.start)}`,
      `DTEND;VALUE=DATE:${day(last)}`,
      `SUMMARY:${esc(e.title)}`,
      ...(e.url ? [`URL:${e.url}`] : []),
      ...(e.note ? [`DESCRIPTION:${esc(e.note)}`] : []),
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadIcs(filename: string, ics: string) {
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
