export const OPPORTUNITY_TYPES = [
  { id: 'internship', label: 'Internship' },
  { id: 'phd', label: 'PhD position' },
  { id: 'postdoc', label: 'Postdoc' },
  { id: 'job', label: 'Research job' },
  { id: 'collaboration', label: 'Collaboration' },
  { id: 'other', label: 'Other' },
] as const

export const typeLabel = (id: string) => OPPORTUNITY_TYPES.find((t) => t.id === id)?.label ?? 'Other'

export type OpportunityInput = {
  title: string
  organization: string
  type: string
  url: string
  description: string
  deadline: Date | null
}

/** Validates a posted opportunity; returns the cleaned value or an error message. */
export function validateOpportunity(body: any): { ok: true; value: OpportunityInput } | { ok: false; error: string } {
  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
  const title = str(body?.title, 120)
  const organization = str(body?.organization, 120)
  const description = str(body?.description, 2000)
  const url = str(body?.url, 500)
  const type = OPPORTUNITY_TYPES.some((t) => t.id === body?.type) ? (body.type as string) : 'other'
  if (title.length < 4) return { ok: false, error: 'Add a title' }
  if (organization.length < 2) return { ok: false, error: 'Add the organization' }
  if (description.length < 20) return { ok: false, error: 'Add a short description (20+ characters)' }
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { ok: false, error: 'Add a link to the official posting' }
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return { ok: false, error: 'The link must start with http(s)://' }
  let deadline: Date | null = null
  if (body?.deadline) {
    const d = new Date(`${body.deadline}T23:59:59`)
    if (Number.isNaN(d.getTime())) return { ok: false, error: 'Deadline is not a valid date' }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (d < today) return { ok: false, error: 'The deadline has already passed' }
    deadline = d
  }
  return { ok: true, value: { title, organization, type, url: parsed.toString(), description, deadline } }
}
