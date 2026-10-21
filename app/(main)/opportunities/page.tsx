import { ExternalLink } from 'lucide-react'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { prisma } from '@/lib/prisma'
import { getSafeServerSession } from '@/lib/safe-session'
import { safeLoad } from '@/lib/safe-load'
import { typeLabel } from '@/lib/opportunities'
import { DbUnavailable } from '@/components/DbUnavailable'
import { LoginToParticipate } from '@/components/auth/LoginGate'
import { OpportunityForm, RemoveOpportunity } from '@/components/opportunities/OpportunityForm'

export const dynamic = 'force-dynamic'

// Public board of research opportunities posted by members. Listings past their deadline
// drop off the main list automatically.
export default async function OpportunitiesPage() {
  const session = await getSafeServerSession()
  const userId = session?.user?.id ?? null
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const rows = await safeLoad('opportunities', () =>
    prisma.opportunity.findMany({
      orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }],
      take: 200,
      include: { user: { select: { name: true, username: true } } },
    })
  )
  if (!rows) return <DbUnavailable />

  const open = rows.filter((o) => !o.deadline || o.deadline >= startOfToday)
  // deadline-first, rolling ones (no deadline) after
  const sorted = [...open.filter((o) => o.deadline), ...open.filter((o) => !o.deadline)]
  const closed = rows.filter((o) => o.deadline && o.deadline < startOfToday).slice(-20).reverse()

  const Card = ({ o, past = false }: { o: (typeof rows)[number]; past?: boolean }) => (
    <li className={`rounded-2xl border border-gray-200 bg-white p-5 ${past ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">{typeLabel(o.type)}</span>
        {o.deadline ? (
          <span className="text-xs text-gray-500">
            Deadline {format(o.deadline, 'd MMM yyyy')}
            {!past && ` · ${formatDistanceToNowStrict(o.deadline)} left`}
          </span>
        ) : (
          <span className="text-xs text-gray-500">Rolling / no fixed deadline</span>
        )}
      </div>
      <h3 className="mt-2 font-semibold text-gray-900">{o.title}</h3>
      <p className="text-sm text-gray-600">{o.organization}</p>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-700">{o.description}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <a href={o.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          Official posting <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <span className="flex items-center gap-3 text-xs text-gray-400">
          posted by {o.user.name || o.user.username}
          {o.userId === userId && <RemoveOpportunity id={o.id} />}
        </span>
      </div>
    </li>
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">Opportunities</h1>
          <p className="mt-1 text-gray-600">Internships, PhD and postdoc positions, and calls for collaborators, posted by members.</p>
        </div>
      </div>
      <div className="mt-5">
        {userId ? <OpportunityForm /> : <LoginToParticipate action="post an opportunity" next="/opportunities" />}
      </div>

      <h2 className="mt-8 text-sm font-medium text-gray-500">Open · {sorted.length}</h2>
      {sorted.length ? (
        <ul className="mt-2 space-y-3">
          {sorted.map((o) => (
            <Card key={o.id} o={o} />
          ))}
        </ul>
      ) : (
        <p className="mt-2 rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-600">
          No open opportunities right now. If you know of one, post it with a link to the official page.
        </p>
      )}

      {closed.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm font-medium text-gray-500">Recently closed · {closed.length}</summary>
          <ul className="mt-2 space-y-3">
            {closed.map((o) => (
              <Card key={o.id} o={o} past />
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
