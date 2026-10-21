/**
 * Finding a research niche, methodically.
 *
 * Papers are classified with arXiv's own taxonomy: field (arXiv group, e.g. Computer Science)
 * -> category (e.g. cs.CL, Computation and Language) -> topics (keywords). Every swipe is a
 * data point. For each category we estimate your interest rate with a 90% Wilson score
 * interval and compare it with your own average interest rate, so one or two likes never
 * decide anything. The process has three stages:
 *
 *   1. Explore   - rate enough papers across enough categories (breadth before depth).
 *   2. Narrow    - the deck tests the categories it is least sure about (upper-confidence-bound
 *                  sampling) until some category is clearly above your average.
 *   3. Focus     - a category counts as a likely niche only once it has enough ratings and its
 *                  interval sits above your average. Topics inside it show what to read next.
 *
 * Pure functions only (no database), so the swipe page can update the analysis live.
 */

// ---------------------------------------------------------------- arXiv taxonomy

// Official arXiv category names (subset: the common ones).
const CATEGORY_NAMES: Record<string, string> = {
  'cs.AI': 'Artificial Intelligence',
  'cs.AR': 'Hardware Architecture',
  'cs.CC': 'Computational Complexity',
  'cs.CE': 'Computational Engineering, Finance, and Science',
  'cs.CG': 'Computational Geometry',
  'cs.CL': 'Computation and Language',
  'cs.CR': 'Cryptography and Security',
  'cs.CV': 'Computer Vision and Pattern Recognition',
  'cs.CY': 'Computers and Society',
  'cs.DB': 'Databases',
  'cs.DC': 'Distributed, Parallel, and Cluster Computing',
  'cs.DL': 'Digital Libraries',
  'cs.DM': 'Discrete Mathematics',
  'cs.DS': 'Data Structures and Algorithms',
  'cs.ET': 'Emerging Technologies',
  'cs.FL': 'Formal Languages and Automata Theory',
  'cs.GT': 'Computer Science and Game Theory',
  'cs.GR': 'Graphics',
  'cs.HC': 'Human-Computer Interaction',
  'cs.IR': 'Information Retrieval',
  'cs.IT': 'Information Theory',
  'cs.LG': 'Machine Learning',
  'cs.LO': 'Logic in Computer Science',
  'cs.MA': 'Multiagent Systems',
  'cs.MM': 'Multimedia',
  'cs.MS': 'Mathematical Software',
  'cs.NA': 'Numerical Analysis',
  'cs.NE': 'Neural and Evolutionary Computing',
  'cs.NI': 'Networking and Internet Architecture',
  'cs.OS': 'Operating Systems',
  'cs.PF': 'Performance',
  'cs.PL': 'Programming Languages',
  'cs.RO': 'Robotics',
  'cs.SC': 'Symbolic Computation',
  'cs.SD': 'Sound',
  'cs.SE': 'Software Engineering',
  'cs.SI': 'Social and Information Networks',
  'cs.SY': 'Systems and Control',
  'stat.AP': 'Applications',
  'stat.CO': 'Computation',
  'stat.ME': 'Methodology',
  'stat.ML': 'Machine Learning',
  'stat.TH': 'Statistics Theory',
  'math.CO': 'Combinatorics',
  'math.LO': 'Logic',
  'math.NA': 'Numerical Analysis',
  'math.OC': 'Optimization and Control',
  'math.PR': 'Probability',
  'math.ST': 'Statistics Theory',
  'eess.AS': 'Audio and Speech Processing',
  'eess.IV': 'Image and Video Processing',
  'eess.SP': 'Signal Processing',
  'eess.SY': 'Systems and Control',
  'quant-ph': 'Quantum Physics',
  'physics.comp-ph': 'Computational Physics',
  'physics.soc-ph': 'Physics and Society',
  'q-bio.BM': 'Biomolecules',
  'q-bio.GN': 'Genomics',
  'q-bio.NC': 'Neurons and Cognition',
  'q-bio.QM': 'Quantitative Methods',
  'econ.EM': 'Econometrics',
  'econ.GN': 'General Economics',
  'econ.TH': 'Theoretical Economics',
}

// arXiv groups archives into fields; e.g. quant-ph and cond-mat both belong to Physics.
export const FIELDS: { id: string; label: string; archives: string[] }[] = [
  { id: 'cs', label: 'Computer Science', archives: ['cs'] },
  { id: 'stat', label: 'Statistics', archives: ['stat'] },
  { id: 'math', label: 'Mathematics', archives: ['math'] },
  { id: 'eess', label: 'Electrical Engineering and Systems Science', archives: ['eess'] },
  {
    id: 'physics',
    label: 'Physics',
    archives: ['physics', 'quant-ph', 'cond-mat', 'astro-ph', 'gr-qc', 'hep-ex', 'hep-lat', 'hep-ph', 'hep-th', 'math-ph', 'nlin', 'nucl-ex', 'nucl-th'],
  },
  { id: 'q-bio', label: 'Quantitative Biology', archives: ['q-bio'] },
  { id: 'q-fin', label: 'Quantitative Finance', archives: ['q-fin'] },
  { id: 'econ', label: 'Economics', archives: ['econ'] },
]

const archiveOf = (code: string) => code.split('.')[0]

export function fieldOf(code: string): { id: string; label: string } {
  const archive = archiveOf(code)
  const f = FIELDS.find((x) => x.archives.includes(archive))
  return f ? { id: f.id, label: f.label } : { id: 'other', label: 'Other' }
}

/** Category name on its own, e.g. "Computation and Language". */
export function areaLabel(code: string): string {
  return CATEGORY_NAMES[code] ?? (code ? `${fieldOf(code).label} (${code})` : 'Uncategorised')
}

/** Full taxonomy path, e.g. "Computer Science › Computation and Language". */
export function categoryPath(code: string): string {
  const name = CATEGORY_NAMES[code]
  return name ? `${fieldOf(code).label} › ${name}` : areaLabel(code)
}

export function primaryAreaLabel(categories: string[]): string {
  return categories.length ? areaLabel(categories[0]) : 'Uncategorised'
}

// ---------------------------------------------------------------- evidence

export type SwipeInput = { liked: boolean; categories: string[]; keywords: string[] }

export type NicheTally = {
  swipes: number
  likes: number
  /** per primary arXiv category */
  cats: Record<string, { likes: number; skips: number }>
  /** keyword counts among liked papers, per primary category */
  kws: Record<string, Record<string, number>>
}

export function emptyTally(): NicheTally {
  return { swipes: 0, likes: 0, cats: {}, kws: {} }
}

const looksLikeCategory = (s: string) => /^[a-z-]+(\.[a-z-]+)?$/i.test(s) && (s.includes('.') || s.includes('-ph'))

/** Adds (sign 1) or removes (sign -1, for undo) one swipe. Returns a new tally. */
export function applySwipe(t: NicheTally, s: SwipeInput, sign: 1 | -1 = 1): NicheTally {
  const next: NicheTally = {
    swipes: t.swipes + sign,
    likes: t.likes + (s.liked ? sign : 0),
    cats: { ...t.cats },
    kws: { ...t.kws },
  }
  // Evidence goes to the paper's primary arXiv category (arXiv's own classification);
  // cross-lists are shown on the card but don't count, so every count is a whole paper.
  const primary = s.categories[0]
  if (primary) {
    const cur = next.cats[primary] ?? { likes: 0, skips: 0 }
    next.cats[primary] = s.liked ? { ...cur, likes: cur.likes + sign } : { ...cur, skips: cur.skips + sign }
  }
  if (s.liked && primary) {
    const bucket = { ...(next.kws[primary] ?? {}) }
    for (const k of s.keywords) {
      const term = k.toLowerCase().trim()
      if (!term || looksLikeCategory(term)) continue
      bucket[term] = (bucket[term] ?? 0) + sign
    }
    next.kws[primary] = bucket
  }
  return next
}

const Z = 1.645 // 90% interval

/** Wilson score interval for a proportion (works with fractional counts). */
export function wilson(successes: number, n: number): { rate: number; low: number; high: number } {
  if (n <= 0) return { rate: 0, low: 0, high: 1 }
  const p = Math.min(1, Math.max(0, successes / n))
  const z2 = Z * Z
  const denom = 1 + z2 / n
  const centre = p + z2 / (2 * n)
  const margin = Z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))
  return { rate: p, low: Math.max(0, (centre - margin) / denom), high: Math.min(1, (centre + margin) / denom) }
}

// Thresholds of the method (kept here so the UI can explain them).
export const METHOD = {
  exploreMinRatings: 20,
  exploreMinCategories: 4,
  categoryMinToCount: 2,
  minRatingsToJudge: 4,
  minRatingsForLikely: 6,
  likelyFloor: 0.3,
} as const

export type CategoryStatus = 'likely' | 'uncertain' | 'unlikely'

export type CategoryEvidence = {
  code: string
  name: string
  field: string
  seen: number
  likes: number
  rate: number
  low: number
  high: number
  status: CategoryStatus
  confidence: 'low' | 'medium' | 'high'
}

export type NicheStage = 'explore' | 'narrow' | 'focus'

export type Niche = {
  swipes: number
  likes: number
  skips: number
  /** your average interest rate across everything you've rated */
  baseRate: number
  stage: NicheStage
  stageIndex: 1 | 2 | 3
  /** 0..1 progress through the current stage */
  stageProgress: number
  /** what evidence is still missing, in plain words */
  nextStep: string
  /** categories you have rated, strongest evidence first */
  categories: CategoryEvidence[]
  likely: CategoryEvidence[]
  fields: { id: string; label: string; seen: number; likes: number; rate: number }[]
  /** recurring topics among papers you liked in your likely (or leading) categories */
  topics: { term: string; count: number }[]
  /** kept for older callers: true once at least one category is a likely niche */
  ready: boolean
}

const pct = (x: number) => `${Math.round(x * 100)}%`
const n1 = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(1))

export function nicheFromTally(t: NicheTally): Niche {
  const baseRate = t.swipes > 0 ? t.likes / t.swipes : 0
  const categories: CategoryEvidence[] = Object.entries(t.cats)
    .map(([code, v]) => {
      const seen = v.likes + v.skips
      const w = wilson(v.likes, seen)
      const status: CategoryStatus =
        seen >= METHOD.minRatingsForLikely && w.low > Math.max(baseRate, METHOD.likelyFloor)
          ? 'likely'
          : seen >= METHOD.minRatingsToJudge && w.high < baseRate
            ? 'unlikely'
            : 'uncertain'
      const width = w.high - w.low
      return {
        code,
        name: areaLabel(code),
        field: fieldOf(code).label,
        seen,
        likes: v.likes,
        ...w,
        status,
        confidence: (width < 0.35 ? 'high' : width < 0.55 ? 'medium' : 'low') as CategoryEvidence['confidence'],
      }
    })
    .filter((c) => c.seen > 0.01)
    .sort((a, b) => b.low - a.low || b.seen - a.seen)

  const likely = categories.filter((c) => c.status === 'likely')
  const breadth = categories.filter((c) => c.seen >= METHOD.categoryMinToCount).length

  const fieldMap = new Map<string, { id: string; label: string; seen: number; likes: number }>()
  for (const c of categories) {
    const f = fieldOf(c.code)
    const cur = fieldMap.get(f.id) ?? { id: f.id, label: f.label, seen: 0, likes: 0 }
    fieldMap.set(f.id, { ...cur, seen: cur.seen + c.seen, likes: cur.likes + c.likes })
  }
  const fields = Array.from(fieldMap.values())
    .map((f) => ({ ...f, rate: f.seen ? f.likes / f.seen : 0 }))
    .sort((a, b) => b.seen - a.seen)

  let stage: NicheStage
  let stageProgress: number
  let nextStep: string
  const leading = categories.filter((c) => c.rate > baseRate && c.seen >= METHOD.categoryMinToCount)

  if (t.swipes < METHOD.exploreMinRatings || breadth < METHOD.exploreMinCategories) {
    stage = 'explore'
    stageProgress =
      0.5 * Math.min(1, t.swipes / METHOD.exploreMinRatings) + 0.5 * Math.min(1, breadth / METHOD.exploreMinCategories)
    const morePapers = Math.max(0, METHOD.exploreMinRatings - t.swipes)
    const moreCats = Math.max(0, METHOD.exploreMinCategories - breadth)
    nextStep =
      morePapers && moreCats
        ? `Rate ${morePapers} more papers, from at least ${moreCats} more categor${moreCats === 1 ? 'y' : 'ies'}. Nothing is concluded before that.`
        : morePapers
          ? `Rate ${morePapers} more papers. Nothing is concluded before that.`
          : `Rate papers from ${moreCats} more categor${moreCats === 1 ? 'y' : 'ies'}. Nothing is concluded before that.`
  } else if (likely.length === 0) {
    stage = 'narrow'
    const best = leading[0]
    stageProgress = best ? Math.min(0.95, best.seen / METHOD.minRatingsForLikely) : 0.1
    if (baseRate > 0.8) {
      nextStep = `You marked ${pct(baseRate)} of papers interesting, so nothing stands out. Swipe right only on work you'd really do.`
    } else if (best) {
      nextStep = `${best.name} looks promising (${n1(best.likes)} of ${n1(best.seen)}). A few more papers from it will show whether that holds up.`
    } else {
      nextStep = `Nothing stands out yet. You'll see more papers from categories you've barely rated.`
    }
  } else {
    stage = 'focus'
    stageProgress = Math.min(1, likely[0].seen / (METHOD.minRatingsForLikely * 2))
    const top = likely[0]
    nextStep = `${top.name}: ${n1(top.likes)} of ${n1(top.seen)} interesting, well above your ${pct(baseRate)} average.`
  }

  const topicSource = (likely.length ? likely : leading.slice(0, 2)).map((c) => c.code)
  const topicCounts: Record<string, number> = {}
  for (const code of topicSource) for (const [term, c] of Object.entries(t.kws[code] ?? {})) topicCounts[term] = (topicCounts[term] ?? 0) + c
  const topics = Object.entries(topicCounts)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([term, count]) => ({ term, count }))

  return {
    swipes: t.swipes,
    likes: t.likes,
    skips: t.swipes - t.likes,
    baseRate,
    stage,
    stageIndex: stage === 'explore' ? 1 : stage === 'narrow' ? 2 : 3,
    stageProgress,
    nextStep,
    categories,
    likely,
    fields,
    topics,
    ready: likely.length > 0,
  }
}

export function categoryEvidence(code: string | undefined, niche: Niche): CategoryEvidence | null {
  return code ? niche.categories.find((c) => c.code === code) ?? null : null
}

// ---------------------------------------------------------------- deck order

/**
 * Orders the deck according to the stage:
 *  - explore: stratified round-robin over primary categories, least-rated categories first,
 *    so early evidence is spread across the taxonomy;
 *  - narrow/focus: upper-confidence-bound sampling: categories whose interval still reaches
 *    high (uncertain or promising ones, and untested ones) come first; categories that are
 *    clearly below your average sink. No more than two cards in a row from one category.
 */
export function orderDeck<T extends { categories: string[] }>(papers: T[], niche: Niche): T[] {
  const primary = (p: T) => p.categories[0] ?? 'none'
  const seen = new Map(niche.categories.map((c) => [c.code, c]))

  if (niche.stage === 'explore') {
    const groups = new Map<string, T[]>()
    for (const p of papers) groups.set(primary(p), [...(groups.get(primary(p)) ?? []), p])
    const order = Array.from(groups.keys()).sort((a, b) => (seen.get(a)?.seen ?? 0) - (seen.get(b)?.seen ?? 0))
    const out: T[] = []
    while (out.length < papers.length) for (const k of order) { const g = groups.get(k)!; if (g.length) out.push(g.shift()!) }
    return out
  }

  const score = (p: T) => seen.get(primary(p))?.high ?? 1
  const sorted = papers.map((p, i) => ({ p, i, s: score(p) })).sort((a, b) => b.s - a.s || a.i - b.i).map((x) => x.p)
  // de-cluster: avoid more than two in a row from the same category
  const out: T[] = []
  const pool = [...sorted]
  while (pool.length) {
    const lastTwo = out.slice(-2).map(primary)
    const blocked = lastTwo.length === 2 && lastTwo[0] === lastTwo[1] ? lastTwo[0] : null
    const idx = blocked ? pool.findIndex((p) => primary(p) !== blocked) : 0
    out.push(pool.splice(idx === -1 ? 0 : idx, 1)[0])
  }
  return out
}
