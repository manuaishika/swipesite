/**
 * Pulls an arXiv identifier out of whatever someone pastes: an abs/pdf/html URL, "arXiv:2401.05566v3",
 * or a bare id, new style (2401.05566) or old style (hep-th/9901001). Version suffixes are dropped.
 */
export function parseArxivId(input: string): string | null {
  const s = input.trim()
  const m =
    s.match(/(?:arxiv\.org\/(?:abs|pdf|html)\/|arxiv:\s*)?(\d{4}\.\d{4,5})(?:v\d+)?(?:\.pdf)?/i) ??
    s.match(/(?:arxiv\.org\/(?:abs|pdf)\/|arxiv:\s*)?([a-z-]+(?:\.[A-Z]{2})?\/\d{7})(?:v\d+)?/i)
  return m ? m[1] : null
}
