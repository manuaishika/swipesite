// Tags people can put on a paper they save for later.
export const SUGGESTED_TAGS = ['Read later', 'Methods', 'Related work', 'Background', 'To discuss'] as const
export const DEFAULT_TAG = 'Read later'
export const MAX_TAGS = 8
export const MAX_TAG_LENGTH = 30

/** Trims, de-duplicates (case-insensitive) and caps a list of tags; returns null if the input isn't a string array. */
export function cleanTags(input: unknown): string[] | null {
  if (input === undefined) return [DEFAULT_TAG]
  if (!Array.isArray(input) || input.some((t) => typeof t !== 'string')) return null
  const out: string[] = []
  for (const raw of input as string[]) {
    const t = raw.trim().replace(/\s+/g, ' ').slice(0, MAX_TAG_LENGTH)
    if (t && !out.some((o) => o.toLowerCase() === t.toLowerCase())) out.push(t)
  }
  return out.slice(0, MAX_TAGS)
}
