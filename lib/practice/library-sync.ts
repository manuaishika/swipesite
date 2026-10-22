import type { PrismaClient } from '@prisma/client'
import { fetchArxivPapersByIds, arxivPaperToDbFormat } from '../arxiv'
import { PRACTICE_ARXIV_IDS } from './arxiv-ids'

const baseId = (id: string) => id.replace(/v\d+$/, '')
const clean = (s: string) => s.replace(/\s+/g, ' ').trim()

/**
 * Fetches the practice abstracts from the arXiv API and links them into the practice library.
 * Papers the swipe app already has are linked, not duplicated. Returns how many are linked.
 */
export async function syncPracticeLibrary(prisma: PrismaClient): Promise<number> {
  const fetched = await fetchArxivPapersByIds([...PRACTICE_ARXIV_IDS])
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
    await prisma.practiceAbstract.upsert({ where: { paperId: paper.id }, create: { paperId: paper.id }, update: {} })
    linked++
  }
  return linked
}
