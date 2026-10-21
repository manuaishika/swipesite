/**
 * "Find your niche": turns a user's swipes into research areas they lean towards.
 * Pure functions only (no database), so the swipe page can update the niche live in the browser.
 */

// arXiv category codes -> readable names (most common ones; anything else falls back to its archive).
const CATEGORY_NAMES: Record<string, string> = {
  'cs.AI': 'Artificial Intelligence',
  'cs.CL': 'Natural Language Processing',
  'cs.CV': 'Computer Vision',
  'cs.LG': 'Machine Learning',
  'cs.NE': 'Neural & Evolutionary Computing',
  'cs.RO': 'Robotics',
  'cs.CR': 'Security & Cryptography',
  'cs.HC': 'Human-Computer Interaction',
  'cs.IR': 'Information Retrieval',
  'cs.CY': 'Computers & Society',
  'cs.SE': 'Software Engineering',
  'cs.DC': 'Distributed Computing',
  'cs.DS': 'Algorithms & Data Structures',
  'cs.MA': 'Multi-Agent Systems',
  'cs.GT': 'Game Theory',
  'cs.SI': 'Social & Information Networks',
  'cs.SD': 'Sound',
  'cs.GR': 'Graphics',
  'cs.DB': 'Databases',
  'cs.PL': 'Programming Languages',
  'cs.LO': 'Logic in Computer Science',
  'cs.IT': 'Information Theory',
  'cs.MM': 'Multimedia',
  'cs.NI': 'Networking',
  'cs.SY': 'Systems & Control',
  'cs.CC': 'Computational Complexity',
  'cs.CG': 'Computational Geometry',
  'cs.ET': 'Emerging Technologies',
  'cs.AR': 'Hardware Architecture',
  'cs.OS': 'Operating Systems',
  'cs.PF': 'Performance',
  'cs.DL': 'Digital Libraries',
  'cs.FL': 'Formal Languages',
  'cs.MS': 'Mathematical Software',
  'cs.NA': 'Numerical Analysis',
  'cs.SC': 'Symbolic Computation',
  'cs.DM': 'Discrete Mathematics',
  'stat.ML': 'Statistical Machine Learning',
  'stat.ME': 'Statistical Methodology',
  'stat.AP': 'Applied Statistics',
  'stat.CO': 'Computational Statistics',
  'stat.TH': 'Statistics Theory',
  'math.OC': 'Optimization & Control',
  'math.ST': 'Statistics Theory',
  'math.PR': 'Probability',
  'math.NA': 'Numerical Analysis',
  'eess.AS': 'Audio & Speech Processing',
  'eess.IV': 'Image & Video Processing',
  'eess.SP': 'Signal Processing',
  'eess.SY': 'Systems & Control',
  'quant-ph': 'Quantum Physics',
  'q-bio.NC': 'Neurons & Cognition',
  'q-bio.QM': 'Quantitative Biology Methods',
  'q-bio.BM': 'Biomolecules',
  'q-bio.GN': 'Genomics',
  'econ.EM': 'Econometrics',
  'econ.GN': 'General Economics',
  'econ.TH': 'Economic Theory',
  'physics.comp-ph': 'Computational Physics',
  'physics.soc-ph': 'Physics & Society',
}

const ARCHIVE_NAMES: Record<string, string> = {
  cs: 'Computer Science',
  math: 'Mathematics',
  stat: 'Statistics',
  physics: 'Physics',
  'astro-ph': 'Astrophysics',
  'cond-mat': 'Condensed Matter',
  'q-bio': 'Quantitative Biology',
  'q-fin': 'Quantitative Finance',
  eess: 'Electrical Engineering & Systems',
  econ: 'Economics',
  'hep-th': 'High Energy Physics',
  'hep-ph': 'High Energy Physics',
  'gr-qc': 'General Relativity',
  'nlin': 'Nonlinear Sciences',
}

export function areaLabel(code: string): string {
  if (CATEGORY_NAMES[code]) return CATEGORY_NAMES[code]
  const archive = code.split('.')[0]
  return ARCHIVE_NAMES[archive] ?? code
}

/** Swipes needed before we call the niche "revealed". */
export const NICHE_READY_AFTER = 10
const MIN_LIKES_FOR_READY = 3
/** A skip counts against an area, but less than a like counts for it. */
const SKIP_WEIGHT = 0.35

export type SwipeInput = { liked: boolean; categories: string[]; keywords: string[] }

export type NicheTally = {
  swipes: number
  likes: number
  cats: Record<string, { likes: number; skips: number }>
  kws: Record<string, number>
}

export type NicheArea = { code: string; label: string; likes: number; skips: number; score: number; share: number }

export type Niche = {
  swipes: number
  likes: number
  skips: number
  ready: boolean
  swipesToReady: number
  areas: NicheArea[]
  keywords: { term: string; count: number }[]
}

export function emptyTally(): NicheTally {
  return { swipes: 0, likes: 0, cats: {}, kws: {} }
}

// Category codes sometimes show up as keywords (the importer falls back to them); keep them out of keywords.
const looksLikeCategory = (s: string) => /^[a-z-]+(\.[A-Za-z-]+)?$/.test(s) && (s.includes('.') || s in ARCHIVE_NAMES)

/** Adds (sign 1) or removes (sign -1, for undo) one swipe. Returns a new tally. */
export function applySwipe(t: NicheTally, s: SwipeInput, sign: 1 | -1 = 1): NicheTally {
  const next: NicheTally = {
    swipes: t.swipes + sign,
    likes: t.likes + (s.liked ? sign : 0),
    cats: { ...t.cats },
    kws: { ...t.kws },
  }
  // The first category is arXiv's primary one: it counts fully, cross-lists count half.
  s.categories.forEach((code, i) => {
    const w = (i === 0 ? 1 : 0.5) * sign
    const cur = next.cats[code] ?? { likes: 0, skips: 0 }
    next.cats[code] = s.liked ? { ...cur, likes: cur.likes + w } : { ...cur, skips: cur.skips + w }
  })
  if (s.liked) {
    for (const k of s.keywords) {
      const term = k.toLowerCase().trim()
      if (!term || looksLikeCategory(term)) continue
      next.kws[term] = (next.kws[term] ?? 0) + sign
    }
  }
  return next
}

export function nicheFromTally(t: NicheTally): Niche {
  const scored = Object.entries(t.cats)
    .map(([code, v]) => ({ code, label: areaLabel(code), likes: v.likes, skips: v.skips, score: v.likes - SKIP_WEIGHT * v.skips }))
    .filter((a) => a.score > 0 && a.likes > 0)
  // Merge codes that share a readable label (e.g. stat.TH and math.ST).
  const byLabel = new Map<string, (typeof scored)[number]>()
  for (const a of scored) {
    const prev = byLabel.get(a.label)
    if (!prev) byLabel.set(a.label, { ...a })
    else byLabel.set(a.label, { ...prev, likes: prev.likes + a.likes, skips: prev.skips + a.skips, score: prev.score + a.score })
  }
  const merged = Array.from(byLabel.values()).sort((a, b) => b.score - a.score)
  const total = merged.reduce((n, a) => n + a.score, 0) || 1
  const areas = merged.slice(0, 6).map((a) => ({ ...a, share: a.score / total }))
  const keywords = Object.entries(t.kws)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([term, count]) => ({ term, count }))
  const ready = t.swipes >= NICHE_READY_AFTER && t.likes >= MIN_LIKES_FOR_READY && areas.length > 0
  return {
    swipes: t.swipes,
    likes: t.likes,
    skips: t.swipes - t.likes,
    ready,
    swipesToReady: Math.max(0, NICHE_READY_AFTER - t.swipes),
    areas,
    keywords,
  }
}

/** How well a paper's categories match the niche (0 = not at all). */
export function nicheAffinity(categories: string[], niche: Niche): number {
  const share = new Map(niche.areas.map((a) => [a.label, a.share]))
  return categories.reduce((n, code, i) => n + (share.get(areaLabel(code)) ?? 0) * (i === 0 ? 1 : 0.5), 0)
}

/**
 * Orders a deck so papers in your niche come first, but every `exploreEvery`-th card is
 * something outside it, so you keep discovering areas you haven't tried.
 */
export function rankForNiche<T extends { categories: string[] }>(papers: T[], niche: Niche, exploreEvery = 4): T[] {
  if (!niche.ready) return papers
  const scored = papers.map((p, i) => ({ p, i, s: nicheAffinity(p.categories, niche) }))
  const matching = scored.filter((x) => x.s > 0).sort((a, b) => b.s - a.s || a.i - b.i)
  const outside = scored.filter((x) => x.s === 0)
  const out: T[] = []
  while (matching.length || outside.length) {
    const exploreSlot = (out.length + 1) % exploreEvery === 0
    const next = (exploreSlot && outside.length ? outside : matching.length ? matching : outside).shift()!
    out.push(next.p)
  }
  return out
}

/** The paper's best-matching niche area, or its primary category's readable name. */
export function primaryAreaLabel(categories: string[]): string {
  return categories.length ? areaLabel(categories[0]) : 'Uncategorised'
}
