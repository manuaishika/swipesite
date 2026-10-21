// Peer review on a paper: every post in a paper's thread has a kind, and reviews carry a verdict.

export const POST_KINDS = [
  {
    id: 'review',
    label: 'Review',
    hint: 'Your take on the paper: what it claims, what holds up, what does not.',
    badge: 'bg-primary text-white',
  },
  {
    id: 'question',
    label: 'Question',
    hint: 'Something unclear or missing that you want others to weigh in on.',
    badge: 'bg-sky-100 text-sky-800',
  },
  {
    id: 'discussion',
    label: 'Discussion',
    hint: 'Ideas, connections to other work, follow-ups, open-ended thoughts.',
    badge: 'bg-gray-100 text-gray-700',
  },
] as const

export type PostKind = (typeof POST_KINDS)[number]['id']

export const VERDICTS = [
  { id: 'promising', label: 'Promising', badge: 'bg-emerald-100 text-emerald-800', bar: 'bg-emerald-500' },
  { id: 'mixed', label: 'Mixed', badge: 'bg-amber-100 text-amber-800', bar: 'bg-amber-400' },
  { id: 'skeptical', label: 'Skeptical', badge: 'bg-rose-100 text-rose-800', bar: 'bg-rose-500' },
] as const

export type Verdict = (typeof VERDICTS)[number]['id']

export const REVIEW_TEMPLATE = `**Main claim:** 

**What supports it:** 

**What's missing or weak:** 

**What would change my mind:** `

export const MAX_POST_CHARS = 10000

export function isPostKind(v: unknown): v is PostKind {
  return POST_KINDS.some((k) => k.id === v)
}

export function isVerdict(v: unknown): v is Verdict {
  return VERDICTS.some((k) => k.id === v)
}

export function kindMeta(kind: string) {
  return POST_KINDS.find((k) => k.id === kind) ?? POST_KINDS[2]
}

export function verdictMeta(v: string | null | undefined) {
  return VERDICTS.find((k) => k.id === v) ?? null
}

export function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}
