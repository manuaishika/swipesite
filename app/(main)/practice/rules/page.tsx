import Link from 'next/link'
import { Ban, EyeOff, Flag, Gauge, Scale, Users } from 'lucide-react'
import { Rules } from '@/components/practice/Notices'
import { Card, PageShell } from '@/components/practice/ui'

const ITEMS = [
  { icon: Ban, title: 'Declare no AI assistance', body: 'You confirm this before every session. Pasting into answer boxes is disabled as a deterrent; the rest relies on honesty. The AI critique tool elsewhere on this site is not part of practice.' },
  { icon: Users, title: 'Give to get', body: 'You can review others only after you have submitted your own answers. Each submission is reviewed by up to 2 other users.' },
  { icon: EyeOff, title: 'Anonymous both ways', body: 'Authors never see who reviewed them, and reviewers never see who wrote the answers.' },
  { icon: Scale, title: 'Score every prompt', body: 'Reviewers rate each prompt 1-5 on clarity, evidence-vs-claim reasoning and quality of alternatives, and write one specific comment.' },
  { icon: Flag, title: 'Report problems', body: 'No links, personal attacks or real assessment content. Content reported by 3 different users is hidden pending manual review.' },
  { icon: Gauge, title: 'Rate limits', body: 'Limits apply to starting sessions, submitting, claiming reviews and reporting, to keep things fair.' },
]

export default function RulesPage() {
  return (
    <PageShell>
      <h1 className="text-3xl font-bold text-gray-900">Practice rules</h1>
      <p className="mt-1 text-gray-600">Short version: do your own thinking, be specific and kind, and keep real tests out.</p>
      <div className="mt-5">
        <Rules />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {ITEMS.map((it) => (
          <Card key={it.title} className="p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary">
              <it.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-3 font-semibold text-gray-900">{it.title}</h2>
            <p className="mt-1 text-sm text-gray-600">{it.body}</p>
          </Card>
        ))}
      </div>
      <p className="mt-6 text-sm">
        <Link href="/practice" className="font-medium text-primary hover:underline">
          Back to practice
        </Link>
      </p>
    </PageShell>
  )
}
