/**
 * Seeds the peer-review practice library with AI-safety abstracts from the arXiv API.
 * Reuses the existing Paper table: papers already imported by the swipe app are linked, not duplicated.
 *
 *   npm run seed:practice               # fetch + save (needs DATABASE_URL)
 *   npm run seed:practice -- --dry-run  # fetch + print titles only (no database needed)
 *
 * Abstracts and metadata come from the arXiv API (https://info.arxiv.org/help/api/).
 */
import { PrismaClient } from '@prisma/client'
import { fetchArxivPapersByIds, arxivPaperToDbFormat } from '../lib/arxiv'

// AI-safety papers. Check titles with --dry-run; edit this list freely.
const ARXIV_IDS = [
  '2212.08073', // Constitutional AI
  '2401.05566', // Sleeper Agents
  '2212.03827', // Discovering Latent Knowledge
  '2412.14093', // Alignment faking in large language models
  '2202.03286', // Red Teaming Language Models with Language Models
  '2305.04388', // Language Models Don't Always Say What They Think
  '2307.15043', // Universal and Transferable Adversarial Attacks
  '2310.13548', // Towards Understanding Sycophancy in Language Models
  '2210.10760', // Scaling Laws for Reward Model Overoptimization
  '2310.01405', // Representation Engineering
  '2211.00593', // Interpretability in the Wild (IOI circuit)
  '2209.10652', // Toy Models of Superposition
  '2305.15324', // Model evaluation for extreme risks
  '2204.05862', // Training a Helpful and Harmless Assistant with RLHF
  '2307.15217', // Open Problems and Fundamental Limitations of RLHF
  '2307.13702', // Measuring Faithfulness in Chain-of-Thought Reasoning
  '2306.12001', // An Overview of Catastrophic AI Risks
  '2109.07958', // TruthfulQA
  '2209.11895', // In-context Learning and Induction Heads
  '2209.07858', // Red Teaming Language Models to Reduce Harms
]

const baseId = (id: string) => id.replace(/v\d+$/, '')
const clean = (s: string) => s.replace(/\s+/g, ' ').trim()

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const fetched = await fetchArxivPapersByIds(ARXIV_IDS)
  const missing = ARXIV_IDS.filter((id) => !fetched.some((p) => baseId(p.id) === id))
  if (missing.length) console.warn('Not returned by arXiv (check the IDs):', missing.join(', '))
  for (const p of fetched) console.log(`${baseId(p.id)}  ${clean(p.title)}`)
  if (dryRun) return

  const prisma = new PrismaClient()
  let linked = 0
  for (const p of fetched) {
    const id = baseId(p.id)
    let paper = await prisma.paper.findFirst({
      where: { OR: [{ arxivId: id }, { arxivId: { startsWith: `${id}v` } }] },
    })
    if (!paper) {
      const data = arxivPaperToDbFormat(p)
      paper = await prisma.paper.create({
        data: { ...data, title: clean(data.title), abstract: clean(data.abstract), doi: data.doi ?? undefined },
      })
    }
    await prisma.practiceAbstract.upsert({
      where: { paperId: paper.id },
      create: { paperId: paper.id },
      update: {},
    })
    linked++
  }
  console.log(`\nPractice library: ${linked} abstracts linked.`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
