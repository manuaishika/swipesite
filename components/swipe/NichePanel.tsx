import Link from 'next/link'
import { ArrowRight, Compass, MessagesSquare } from 'lucide-react'
import { NICHE_READY_AFTER, type Niche } from '@/lib/niche-core'

export function NichePanel({ niche, compact = false }: { niche: Niche; compact?: boolean }) {
  const progress = Math.min(1, niche.swipes / NICHE_READY_AFTER)
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary">
          <Compass className="h-4 w-4" />
        </span>
        <h2 className="font-semibold text-gray-900">Your niche</h2>
        <span className="ml-auto text-xs tabular-nums text-gray-500">
          {niche.likes} interested · {niche.skips} skipped
        </span>
      </div>

      {!niche.ready && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500">
            <span>
              {niche.swipesToReady > 0
                ? `Swipe ${niche.swipesToReady} more to reveal your niche`
                : 'Swipe right on a few more papers you like'}
            </span>
            <span className="tabular-nums">
              {Math.min(niche.swipes, NICHE_READY_AFTER)}/{NICHE_READY_AFTER}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      )}

      {niche.areas.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {niche.ready ? 'You lean towards' : 'Emerging'}
          </p>
          <ul className="space-y-2.5">
            {niche.areas.slice(0, compact ? 3 : 5).map((a, i) => (
              <li key={a.label}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className={`truncate ${i === 0 && niche.ready ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{a.label}</span>
                  <span className="shrink-0 text-xs tabular-nums text-gray-500">{Math.round(a.share * 100)}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${i === 0 && niche.ready ? 'bg-primary' : 'bg-primary-300'}`}
                    style={{ width: `${Math.max(4, a.share * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-500">
          Swipe right on abstracts you&apos;d want to work on, left on ones you wouldn&apos;t. Areas you lean towards show up here.
        </p>
      )}

      {!compact && niche.keywords.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Recurring topics</p>
          <div className="flex flex-wrap gap-1.5">
            {niche.keywords.slice(0, 8).map((k) => (
              <span key={k.term} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700">
                {k.term}
              </span>
            ))}
          </div>
        </div>
      )}

      {!compact && (
        <div className="mt-5 space-y-1 border-t border-gray-100 pt-4 text-sm">
          <Link href="/niche" className="flex items-center justify-between rounded-lg px-2 py-1.5 font-medium text-primary hover:bg-primary-50">
            See my niche <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/discussions" className="flex items-center justify-between rounded-lg px-2 py-1.5 font-medium text-primary hover:bg-primary-50">
            <span className="inline-flex items-center gap-2">
              <MessagesSquare className="h-4 w-4" /> Review your picks
            </span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
