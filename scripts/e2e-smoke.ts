/**
 * End-to-end smoke test against a running production build (BASE, default http://localhost:3000)
 * whose ARXIV_API_URL points at scripts/mock-arxiv.mjs. Run: npm run test:e2e
 * Covers the journeys that matter most; each step prints ok or throws.
 */
import assert from 'node:assert/strict'
import { chromium, request, type Page } from 'playwright-core'
import { PrismaClient } from '@prisma/client'
import { TRACKS } from '../lib/quest/bank'

const BASE = process.env.BASE || 'http://localhost:3000'
const prisma = new PrismaClient()
const answers = new Map<string, string>()
for (const t of TRACKS) for (const l of t.levels) for (const x of l.lessons) for (const q of x.q) answers.set(q[0], q[1][q[2]])

let passed = 0
async function step(name: string, fn: () => Promise<void>) {
  await fn()
  passed++
  console.log(`  ok  ${name}`)
}

async function signUp(tag: string) {
  const ctx = await request.newContext({ baseURL: BASE })
  const id = `${tag}${Date.now().toString(36).slice(-6)}`
  const r = await ctx.post('/api/auth/register', { data: { username: id, email: `${id}@test.local`, password: 'secret123', name: tag } })
  assert.ok(r.ok(), `register ${r.status()}`)
  const { csrfToken } = await (await ctx.get('/api/auth/csrf')).json()
  await ctx.post('/api/auth/callback/credentials', { form: { csrfToken, email: `${id}@test.local`, password: 'secret123', json: 'true' } })
  const s = await (await ctx.get('/api/auth/session')).json()
  assert.ok(s.user, 'login failed')
  return { ctx, id, email: `${id}@test.local`, userId: s.user.id as string }
}

async function playLesson(p: Page, correct: boolean) {
  await p.waitForSelector('[role=dialog] h2')
  for (let i = 0; i < 5; i++) {
    await p.waitForTimeout(700)
    const text = (await p.locator('[role=dialog] h2').first().innerText()).trim()
    const want = answers.get(text)
    assert.ok(want, `unknown question: ${text}`)
    const options = p.locator('[role=dialog] button:has(span.rounded-lg)')
    const n = await options.count()
    for (let k = 0; k < n; k++) {
      const t = (await options.nth(k).innerText()).replace(/^\d\s*/, '').trim()
      if ((t === want) === correct) {
        await options.nth(k).click()
        break
      }
    }
    await p.keyboard.press('Enter')
    await p.waitForTimeout(250)
    await p.keyboard.press('Enter')
  }
}

async function main() {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
  const errors: string[] = []
  const page = async (w = 390) => {
    const p = await browser.newPage({ viewport: { width: w, height: 844 } })
    p.on('pageerror', (e) => errors.push(`${p.url()}: ${e.message}`))
    return p
  }

  await step('the deck stocks itself from arXiv on first visit', async () => {
    const p = await page()
    await p.goto(BASE + '/swipe')
    await p.waitForFunction(() => document.body.innerText.includes('Test paper'), null, { timeout: 90_000 })
    assert.ok((await prisma.paper.count()) >= 10)
    await p.close()
  })

  const paper = await prisma.paper.findFirst({ select: { id: true } })
  assert.ok(paper)

  await step('every main page renders on a phone without errors or overflow', async () => {
    const p = await page()
    for (const path of ['/', '/swipe', '/niche', '/discussions', `/paper/${paper!.id}`, '/practice', '/quest', '/quest/ml', '/landscape/niche', '/landscape/bridges?from=economics', '/paths', '/conferences', '/opportunities', '/collaborations', '/about', '/privacy', '/login', '/register', '/forgot-password']) {
      await p.goto(BASE + path, { waitUntil: 'load' })
      await p.waitForTimeout(300)
      const info = await p.evaluate(() => ({ text: document.body.innerText, overflow: document.documentElement.scrollWidth - innerWidth }))
      assert.ok(!/Something went wrong|Database Connection Error|Internal server error/i.test(info.text), `${path} shows an error`)
      assert.ok(info.overflow <= 0, `${path} overflows by ${info.overflow}px`)
    }
    await p.close()
  })

  await step('discussion: post, reply, notification', async () => {
    const a = await signUp('ann')
    const b = await signUp('bob')
    const c = await (await a.ctx.post('/api/comments', { data: { paperId: paper!.id, content: 'Does this hold for larger models?', kind: 'question' } })).json()
    assert.ok(c.comment?.id)
    assert.equal((await b.ctx.post('/api/comments/reply', { data: { commentId: c.comment.id, content: 'Table 2 says yes.' } })).status(), 200)
    const n = await (await a.ctx.get('/api/notifications')).json()
    assert.ok(n.unread >= 1, 'no notification for the reply')
    assert.equal((await a.ctx.post('/api/comments/vote', { data: { commentId: c.comment.id, voteType: 'upvote' } })).status(), 400, 'self-vote allowed')
  })

  await step('niche reveal -> placement -> quest path (guest)', async () => {
    const p = await page(1280)
    await p.goto(BASE + '/about')
    await p.evaluate(() => {
      const cats = ['cs.LG', 'cs.CV', 'cs.CL', 'math.ST', 'q-bio.NC']
      const swipes = []
      for (let r = 0; r < 8; r++) for (const c of cats) swipes.push({ paperId: `g${r}${c}`, liked: c === 'cs.CL', categories: [c], keywords: [], title: 'T' })
      localStorage.setItem('rs-guest-swipes-v1', JSON.stringify(swipes))
    })
    await p.goto(BASE + '/niche')
    await p.waitForSelector('text=How well do you know it?', { timeout: 15_000 })
    await p.click('button:has-text("Beginner")')
    await p.waitForURL(/\/quest\/nlp\?placement=0/)
    await playLesson(p, true)
    await p.waitForSelector('text=You start at Beginner')
    const local = await p.evaluate(() => JSON.parse(localStorage.getItem('rs-quest') || '{}'))
    assert.equal(local.tracks?.nlp?.placed, true)
    await p.close()
  })

  await step('quest lesson saves to the account, locked lessons are refused', async () => {
    const u = await signUp('quinn')
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const p = await ctx.newPage()
    await p.goto(BASE + '/login')
    await p.fill('input[type=email]', u.email)
    await p.fill('input[type=password]', 'secret123')
    await p.click('button[type=submit]')
    await p.waitForTimeout(1500)
    await p.goto(BASE + '/quest/ml')
    await p.locator('button[aria-label^="Learning from data"]').click({ force: true })
    await playLesson(p, true)
    await p.waitForSelector('text=Perfect lesson!')
    await p.waitForTimeout(500)
    const stats = await prisma.questStats.findUnique({ where: { userId: u.userId } })
    assert.equal(stats?.xp, 60)
    assert.equal((await u.ctx.post('/api/quest', { data: { action: 'lesson', track: 'ml', lessonId: 'ml-a2', score: 5 } })).status(), 400)
    await ctx.close()
  })

  await step('topic counts from arXiv (How niche is a topic?)', async () => {
    const r = await request.newContext({ baseURL: BASE })
    const res = await r.post('/api/research/topic', { data: { q: 'mechanistic interpretability' }, timeout: 60_000 })
    const d = await res.json()
    assert.equal(res.status(), 200, JSON.stringify(d))
    assert.equal(d.data.windows.length, 5)
  })

  await step('admin pages are hidden from non-admins', async () => {
    const u = await signUp('eve')
    assert.equal((await u.ctx.get('/api/admin/health')).status(), 403)
    assert.ok((await (await u.ctx.get('/admin/metrics')).text()).includes('could not be found'))
  })

  assert.deepEqual(errors, [], 'page errors')
  await browser.close()
  await prisma.$disconnect()
  console.log(`\n${passed} end-to-end checks passed`)
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
