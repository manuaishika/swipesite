/**
 * Live checks for /admin/health: is each outside dependency and setting actually working on this
 * deployment? Every check returns ok / warn / fail with a plain-language next step.
 */
import { prisma } from '@/lib/prisma'
import { ARXIV_API, fetchArxivPapers } from '@/lib/arxiv'
import { emailConfigured } from '@/lib/email'
import { countArxiv, currentPeriod, CATEGORY_TARGETS, ALL_TARGET, monthWindows } from '@/lib/research-stats'
import { dbRoundTrip } from '@/lib/metrics'

export type Check = { id: string; label: string; status: 'ok' | 'warn' | 'fail'; detail: string; fix?: string; ms?: number }

const timed = async <T>(fn: () => Promise<T>) => {
  const t = performance.now()
  const value = await fn()
  return { value, ms: Math.round(performance.now() - t) }
}

const ago = (d: Date) => {
  const h = (Date.now() - d.getTime()) / 3600_000
  return h < 1 ? `${Math.round(h * 60)} min ago` : h < 48 ? `${Math.round(h)} h ago` : `${Math.round(h / 24)} days ago`
}

export async function runChecks(): Promise<Check[]> {
  const out: Check[] = []
  const push = (c: Check) => out.push(c)

  // settings
  const env = (k: string) => Boolean(process.env[k])
  push(env('NEXTAUTH_SECRET') ? { id: 'secret', label: 'Login secret (NEXTAUTH_SECRET)', status: 'ok', detail: 'Set' } : { id: 'secret', label: 'Login secret (NEXTAUTH_SECRET)', status: 'fail', detail: 'Missing: logins break', fix: 'Add NEXTAUTH_SECRET in Vercel → Settings → Environment Variables.' })
  push(env('NEXTAUTH_URL') ? { id: 'url', label: 'Site address (NEXTAUTH_URL)', status: 'ok', detail: process.env.NEXTAUTH_URL! } : { id: 'url', label: 'Site address (NEXTAUTH_URL)', status: 'warn', detail: 'Not set', fix: 'Set it to the public URL so email links and link previews point to the right place.' })
  push(env('CRON_SECRET') ? { id: 'cron', label: 'Scheduled jobs locked (CRON_SECRET)', status: 'ok', detail: 'Set' } : { id: 'cron', label: 'Scheduled jobs locked (CRON_SECRET)', status: 'warn', detail: 'Not set: the daily job only runs when data is stale', fix: 'Add any long random string as CRON_SECRET.' })
  push(emailConfigured() ? { id: 'email', label: 'Email (Resend)', status: 'ok', detail: `Sending as ${process.env.EMAIL_FROM}` } : { id: 'email', label: 'Email (Resend)', status: 'warn', detail: 'Not configured: weekly digests are only logged', fix: 'Add RESEND_API_KEY and EMAIL_FROM (a verified domain at resend.com).' })

  // database
  try {
    const db = await dbRoundTrip()
    push({ id: 'db', label: 'Database round trip', status: db.ms > 60 ? 'warn' : 'ok', ms: db.ms, detail: `${db.ms} ms from region ${db.region}`, fix: db.ms > 60 ? 'Vercel → Project → Settings → Functions → Function Region: pick the region your database is in.' : undefined })
    const last = await prisma.$queryRaw<{ migration_name: string; finished_at: Date | null }[]>`SELECT migration_name, finished_at FROM "_prisma_migrations" ORDER BY started_at DESC LIMIT 1`
    push({ id: 'migrations', label: 'Database migrations', status: last[0]?.finished_at ? 'ok' : 'fail', detail: last[0] ? `Latest: ${last[0].migration_name}` : 'No migration history', fix: last[0]?.finished_at ? undefined : 'Redeploy; check the build log for scripts/migrate.mjs.' })
  } catch (err) {
    push({ id: 'db', label: 'Database', status: 'fail', detail: String(err).slice(0, 200), fix: 'Check DATABASE_URL in Vercel.' })
    return out
  }

  // arXiv: a live count (the query Landscape depends on) and a live search (what the deck uses)
  try {
    const w = monthWindows(1)[0]
    const { value: n, ms } = await timed(() => countArxiv('cat:cs.LG', w.from, w.to))
    push({ id: 'arxiv-count', label: 'arXiv paper counting (Landscape)', status: n > 1000 ? 'ok' : 'warn', ms, detail: `cs.LG, ${w.label}: ${n.toLocaleString('en-US')} papers`, fix: n > 1000 ? undefined : 'Expected tens of thousands. The date-range query may not be working; tell your developer with this number.' })
  } catch (err) {
    push({ id: 'arxiv-count', label: 'arXiv paper counting (Landscape)', status: 'fail', detail: String(err).slice(0, 200), fix: `arXiv (${ARXIV_API}) didn’t answer the count query.` })
  }
  await new Promise((r) => setTimeout(r, 3100)) // arXiv asks for ~3 s between requests
  try {
    const { value: papers, ms } = await timed(() => fetchArxivPapers({ category: 'cs.CL', maxResults: 3 }))
    push({ id: 'arxiv-search', label: 'arXiv search (swipe deck)', status: papers.length ? 'ok' : 'fail', ms, detail: papers.length ? `Got “${papers[0].title.slice(0, 70)}”` : 'No papers returned', fix: papers.length ? undefined : 'arXiv answered but returned nothing.' })
  } catch (err) {
    push({ id: 'arxiv-search', label: 'arXiv search (swipe deck)', status: 'fail', detail: String(err).slice(0, 200) })
  }

  // data freshness
  const [papers, newest, counted, jobs] = await Promise.all([
    prisma.paper.count(),
    prisma.paper.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
    prisma.researchStat.findMany({ where: { kind: { in: ['category', 'all'] } }, select: { data: true } }),
    prisma.appEvent.findMany({ where: { name: 'cron_run' }, orderBy: { createdAt: 'desc' }, take: 20, select: { path: true, props: true, createdAt: true } }),
  ])
  const age = newest ? (Date.now() - newest.createdAt.getTime()) / 86400_000 : Infinity
  push({ id: 'papers', label: 'Papers in the deck', status: papers >= 100 && age < 3 ? 'ok' : 'warn', detail: `${papers} papers, newest added ${newest ? ago(newest.createdAt) : 'never'}`, fix: papers >= 100 && age < 3 ? undefined : 'Open /swipe once to trigger a fetch, or check the daily job below.' })
  const fresh = counted.filter((r) => r.data.includes(`"period":"${currentPeriod()}"`)).length
  const totalTargets = CATEGORY_TARGETS.length + 1
  push({ id: 'landscape', label: 'Landscape counts this month', status: fresh >= totalTargets ? 'ok' : fresh ? 'warn' : 'fail', detail: `${fresh} of ${totalTargets} areas counted`, fix: fresh >= totalTargets ? undefined : 'Open /landscape and leave it open a few minutes, or wait for the daily job.' })
  void ALL_TARGET
  for (const job of ['arxiv', 'digest']) {
    const run = jobs.find((j) => j.path === job)
    const ok = run ? JSON.parse(run.props).ok === 'true' : false
    const maxAge = job === 'arxiv' ? 30 : 8 * 24
    const late = run ? (Date.now() - run.createdAt.getTime()) / 3600_000 > maxAge : true
    push({
      id: `job-${job}`,
      label: job === 'arxiv' ? 'Daily arXiv job' : 'Weekly digest job',
      status: run && ok && !late ? 'ok' : run && !ok ? 'fail' : 'warn',
      detail: run ? `Last ran ${ago(run.createdAt)}${ok ? '' : ' with errors'}` : 'No run recorded yet',
      fix: run && ok && !late ? undefined : 'Check Vercel → Project → Cron Jobs. Runs are recorded from this release on.',
    })
  }
  return out
}
