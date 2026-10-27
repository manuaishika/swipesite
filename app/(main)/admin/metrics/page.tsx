import { notFound } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import { getSafeServerSession } from '@/lib/safe-session'
import { safeLoad } from '@/lib/safe-load'
import { DbUnavailable } from '@/components/DbUnavailable'
import { activityByWeek, isAdmin, nicheValidation, recentErrors, trafficByDay } from '@/lib/metrics'

export const dynamic = 'force-dynamic'

const pct = (x: number | null) => (x === null ? '–' : `${Math.round(x * 100)}%`)

// Visible only to addresses in ADMIN_EMAILS. Everyone else gets a 404.
export default async function MetricsPage() {
  const session = await getSafeServerSession()
  if (!isAdmin(session?.user?.email)) notFound()

  const data = await safeLoad('metrics', async () => {
    const [weeks, niche, errors, traffic] = await Promise.all([activityByWeek(8), nicheValidation(), recentErrors(15), trafficByDay(14)])
    return { weeks, niche, errors, traffic }
  })
  if (!data) return <DbUnavailable />
  const { weeks, niche, errors, traffic } = data
  const cur = weeks[weeks.length - 1]
  const prev = weeks[weeks.length - 2]
  const max = Math.max(1, ...weeks.map((w) => w.wac))

  const Stat = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
    </div>
  )

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Metrics</h1>
        <p className="mt-1 text-sm text-gray-600">
          North-star: <strong>weekly active contributors</strong>, people who rated, posted, replied or submitted a critique in the last 7 days.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Active contributors (7 days)" value={cur.wac} sub={prev ? `${cur.wac - prev.wac >= 0 ? '+' : ''}${cur.wac - prev.wac} vs week before` : undefined} />
        <Stat label="Came back from last week" value={pct(cur.retention)} />
        <Stat label="New sign-ups (7 days)" value={cur.signups} />
        <Stat label="Visitors (14 days)" value={traffic.visitors} sub={`${traffic.views} page views`} />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-900">Last 8 weeks</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                {['Week of', 'Active', '', 'Rated', 'Discussed', 'Practised', 'Ratings', 'Posts', 'Sign-ups', 'Returned'].map((h, i) => (
                  <th key={i} className="px-3 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 tabular-nums">
              {weeks.map((w) => (
                <tr key={w.weekStart.toISOString()}>
                  <td className="px-3 py-2 text-gray-600">{format(w.weekStart, 'd MMM')}</td>
                  <td className="px-3 py-2 font-medium text-gray-900">{w.wac}</td>
                  <td className="w-32 px-3 py-2">
                    <div className="h-2 rounded-full bg-gray-100"><div className="h-full rounded-full bg-primary" style={{ width: `${(w.wac / max) * 100}%` }} /></div>
                  </td>
                  <td className="px-3 py-2">{w.raters}</td>
                  <td className="px-3 py-2">{w.discussers}</td>
                  <td className="px-3 py-2">{w.practisers}</td>
                  <td className="px-3 py-2">{w.ratings}</td>
                  <td className="px-3 py-2">{w.posts}</td>
                  <td className="px-3 py-2">{w.signups}</td>
                  <td className="px-3 py-2">{pct(w.retention)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900">Does the niche method predict interest?</h2>
        <p className="mt-1 text-sm text-gray-600">
          For people with {niche.minRatings}+ ratings: likely categories are estimated from their first two thirds of ratings, then checked against the last third.
        </p>
        {niche.users === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Not enough data yet.</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="People checked" value={niche.users} />
            <Stat label="Interesting, predicted categories" value={pct(niche.inRate)} sub={`${niche.inSeen} later ratings`} />
            <Stat label="Interesting, other categories" value={pct(niche.outRate)} sub={`${niche.outSeen} later ratings`} />
            <Stat label="Lift" value={niche.lift ? `${niche.lift.toFixed(2)}×` : '–'} sub="above 1 means it predicts" />
          </div>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="text-sm font-semibold text-gray-900">Most viewed (14 days)</h2>
          <ul className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white text-sm">
            {traffic.top.map(([p, n]) => (
              <li key={p} className="flex justify-between px-4 py-2"><span className="truncate text-gray-700">{p}</span><span className="tabular-nums text-gray-500">{n}</span></li>
            ))}
            {!traffic.top.length && <li className="px-4 py-3 text-gray-500">No page views recorded yet.</li>}
          </ul>
        </section>
        <section>
          <h2 className="text-sm font-semibold text-gray-900">Recent browser errors</h2>
          <ul className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white text-sm">
            {errors.map((e) => (
              <li key={e.id} className="px-4 py-2">
                <p className="truncate font-medium text-red-700">{e.props.message ?? 'Unknown error'}</p>
                <p className="text-xs text-gray-500">{e.path} · {formatDistanceToNow(e.createdAt, { addSuffix: true })}{e.props.digest ? ` · ID ${e.props.digest}` : ''}</p>
              </li>
            ))}
            {!errors.length && <li className="px-4 py-3 text-gray-500">No errors reported.</li>}
          </ul>
        </section>
      </div>
    </div>
  )
}
