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
import { fetchArxivPapersByIds } from '../lib/arxiv'
import { PRACTICE_ARXIV_IDS as ARXIV_IDS } from '../lib/practice/arxiv-ids'
import { syncPracticeLibrary } from '../lib/practice/library-sync'


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
  const linked = await syncPracticeLibrary(prisma)
  console.log(`\nPractice library: ${linked} abstracts linked.`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
