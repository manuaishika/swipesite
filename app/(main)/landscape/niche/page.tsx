import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { LandscapeNav } from '@/components/landscape/LandscapeNav'
import { TopicExplorer } from '@/components/landscape/TopicExplorer'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'How niche is a topic?', description: 'Papers per year on arXiv for any research topic, where it lives and how many people write about it.' }

const EXAMPLES = ['mechanistic interpretability', 'model context protocol', 'reward hacking', 'diffusion models', 'mechanism design', 'protein design']

export default async function NichePage({ searchParams }: { searchParams: { q?: string } }) {
  // topics other people looked up recently (already counted, so instant)
  const recent = await prisma.researchStat
    .findMany({ where: { kind: 'topic' }, orderBy: { updatedAt: 'desc' }, take: 8, select: { label: true } })
    .catch(() => [])
  const suggestions = Array.from(new Set([...recent.map((r) => r.label), ...EXAMPLES])).slice(0, 8)
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <LandscapeNav
        active="/landscape/niche"
        title="How niche is a topic?"
        sub="Type any research topic. See how many papers it gets a year, whether it's growing, where it lives on arXiv and how many people write about it."
      />
      <TopicExplorer initial={searchParams.q?.slice(0, 80) ?? ''} suggestions={suggestions} />
    </div>
  )
}
