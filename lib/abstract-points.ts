/**
 * Key points of an abstract, picked *verbatim* from the abstract itself (no generated text):
 * the sentence that sets up the problem, the one that says what the authors did, and the one
 * that states the result. Each is labelled so a reader can skim the card in a few seconds.
 */

export type KeyPoint = { label: 'Problem' | 'Approach' | 'Finding'; text: string }

export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    // split after . ! ? when followed by a capital letter / digit; avoids "e.g. the", "et al. 2"
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter((s, i, all) => s.length > 20 && all.indexOf(s) === i)
}

const APPROACH = /\b(we|this (paper|work|study)|here,? we)\b.{0,40}\b(propose|introduce|present|develop|design|build|study|investigate|analy[sz]e|train|use|apply|formulate|describe)\b/i
const FINDING =
  /\b(we (show|find|demonstrate|observe|prove|report)|results? (show|indicate|suggest|demonstrate)|(outperform|surpass|improve|achiev|reduc|increas)\w*|state[- ]of[- ]the[- ]art|significant(ly)?|(our|these) (results|findings|experiments))\b/i

export function keyPoints(abstract: string, max = 3): KeyPoint[] {
  const sentences = splitSentences(abstract)
  if (sentences.length === 0) return []
  if (sentences.length <= 2) return sentences.map((text, i) => ({ label: i === 0 ? 'Problem' : 'Finding', text }))

  const used = new Set<number>()
  const pick = (re: RegExp, fromEnd = false) => {
    const order = sentences.map((_, i) => i)
    if (fromEnd) order.reverse()
    const i = order.find((k) => !used.has(k) && re.test(sentences[k]))
    if (i === undefined) return null
    used.add(i)
    return sentences[i]
  }

  const points: KeyPoint[] = []
  used.add(0)
  const approach = pick(APPROACH)
  const finding = pick(FINDING, true) ?? (sentences.length > 2 && !used.has(sentences.length - 1) ? (used.add(sentences.length - 1), sentences[sentences.length - 1]) : null)
  points.push({ label: 'Problem', text: sentences[0] })
  if (approach) points.push({ label: 'Approach', text: approach })
  if (finding) points.push({ label: 'Finding', text: finding })
  return points.slice(0, max)
}

/** Keywords worth showing: drops arXiv category codes that the importer sometimes stores as keywords. */
export function displayKeywords(keywords: string[], max = 6): string[] {
  return keywords.filter((k) => !/^[a-z-]+(\.[a-z-]+)?$/i.test(k) || !(k.includes('.') || k.includes('-ph'))).slice(0, max)
}
