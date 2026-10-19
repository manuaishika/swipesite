/**
 * Integration test for the peer-review practice rules, against a REAL database.
 *   DATABASE_URL=postgresql://... npm run test:practice
 * Use a disposable/dev database. It creates its own users + one paper and deletes them afterwards.
 */
import assert from 'node:assert/strict'
import { prisma } from '../lib/prisma'
import { PracticeError } from '../lib/practice/errors'
import {
  claimReview, fileReport, getFeedback, getReviewTask, markHelpful, startSession, submitAnswers, submitReview,
} from '../lib/practice/service'
import { PROMPTS, CRITERIA } from '../lib/practice/constants'

const tag = `ptest${Date.now()}`
const ANSWER = 'x'.repeat(40)
const answers = Object.fromEntries(PROMPTS.map((p) => [p.id, `${p.id}: ${ANSWER}`]))
const scores = Object.fromEntries(PROMPTS.map((p) => [p.id, Object.fromEntries(CRITERIA.map((c) => [c.id, 4]))]))
const COMMENT = 'Answer 3 names the gap but does not say which benchmark is missing.'

let passed = 0
async function t(name: string, fn: () => Promise<void>) {
  await fn()
  passed++
  console.log(`  ok  ${name}`)
}
async function rejects(fn: () => Promise<unknown>, match: RegExp) {
  try {
    await fn()
  } catch (e) {
    assert.ok(e instanceof PracticeError, `expected PracticeError, got ${e}`)
    assert.match((e as Error).message, match)
    return
  }
  assert.fail(`expected rejection matching ${match}`)
}

async function mkUser(n: string) {
  return (await prisma.user.create({ data: { email: `${tag}-${n}@t.dev`, username: `${tag}-${n}`, password: 'x' } })).id
}
async function submitOne(userId: string, abstractId: string) {
  const sid = await startSession(userId, abstractId, 30, true)
  return submitAnswers(userId, sid, answers)
}

async function main() {
  const paper = await prisma.paper.create({ data: { title: `${tag} paper`, abstract: 'abs', arxivId: `${tag}` } })
  const abs = await prisma.practiceAbstract.create({ data: { paperId: paper.id } })
  const users = await Promise.all(['a', 'b', 'c', 'd', 'e'].map(mkUser))
  const [A, B, C, D, E] = users

  try {
    await t('start requires the no-AI declaration', () => rejects(() => startSession(A, abs.id, 30, false), /declaration/))
    await t('start validates duration', () => rejects(() => startSession(A, abs.id, 500, true), /Duration/))

    await t('reviewing is locked until you have submitted (reciprocity)', () => rejects(() => claimReview(A), /Submit your own answers first/))

    const subA = await submitOne(A, abs.id)
    await t('submit: double submit rejected', async () => {
      const s = await prisma.practiceSubmission.findUniqueOrThrow({ where: { id: subA } })
      await rejects(() => submitAnswers(A, s.sessionId, answers), /already submitted/)
    })
    await t('submit: expired session rejected', async () => {
      const sid = await startSession(A, abs.id, 5, true)
      await prisma.practiceSession.update({ where: { id: sid }, data: { deadlineAt: new Date(Date.now() - 120_000) } })
      await rejects(() => submitAnswers(A, sid, answers), /expired/)
    })
    await t('submit: links rejected by moderation', async () => {
      const sid = await startSession(A, abs.id, 5, true)
      await rejects(() => submitAnswers(A, sid, { ...answers, q1: 'see http://x.com ' + ANSWER }), /Links/)
    })
    await t('submit: too short rejected', async () => {
      const sid = await startSession(A, abs.id, 5, true)
      await rejects(() => submitAnswers(A, sid, { q1: 'short' }), /at least/)
    })
    await t("submit: another user's session is not found", async () => {
      const sid = await startSession(B, abs.id, 5, true)
      await rejects(() => submitAnswers(A, sid, answers), /not found/)
    })

    const subB = await submitOne(B, abs.id)
    const subC = await submitOne(C, abs.id)
    const subD = await submitOne(D, abs.id)
    await submitOne(E, abs.id)

    await t('claims: nobody gets their own submission, caps at 2 reviewers, 3 open max', async () => {
      const claimed: Record<string, string[]> = {}
      for (const u of users) {
        for (let i = 0; i < 3; i++) {
          try {
            const aid = await claimReview(u)
            const a = await prisma.practiceReviewAssignment.findUniqueOrThrow({ where: { id: aid } })
            assert.notEqual((await prisma.practiceSubmission.findUniqueOrThrow({ where: { id: a.submissionId } })).userId, u)
            ;(claimed[u] ??= []).push(aid)
          } catch (e) {
            assert.ok(e instanceof PracticeError)
          }
        }
        await rejects(() => claimReview(u), /unfinished reviews|No submissions|Rate limit/)
      }
      const per = await prisma.practiceReviewAssignment.groupBy({ by: ['submissionId'], _count: true })
      assert.ok(per.every((g) => g._count <= 2), 'a submission got more than 2 reviewers')
    })

    await t('concurrent claims never exceed 2 reviewers per submission', async () => {
      const extra = await Promise.all(['f1', 'f2', 'f3', 'f4', 'f5', 'f6'].map(mkUser))
      const target = await prisma.practiceAbstract.create({ data: { paperId: (await prisma.paper.create({ data: { title: `${tag} p2`, abstract: 'a' } })).id } })
      for (const u of extra) await submitOne(u, target.id)
      const results = await Promise.allSettled(extra.map((u) => claimReview(u)))
      assert.ok(results.some((r) => r.status === 'fulfilled'))
      const per = await prisma.practiceReviewAssignment.groupBy({
        by: ['submissionId'],
        where: { reviewerId: { in: extra } },
        _count: true,
      })
      assert.ok(per.every((g) => g._count <= 2), 'race: a submission got more than 2 reviewers')
      const own = await prisma.practiceReviewAssignment.findMany({ where: { reviewerId: { in: extra } }, include: { submission: true } })
      assert.ok(own.every((a) => a.submission.userId !== a.reviewerId))
    })

    // pick a concrete assignment: someone reviewing subA's author (A)
    const asg = await prisma.practiceReviewAssignment.findFirst({
      where: { submissionId: subA, completedAt: null },
    })
    assert.ok(asg, 'expected subA to have an assignment')
    const reviewer = asg!.reviewerId
    const other = users.find((u) => u !== reviewer && u !== A)!

    await t('review: incomplete scores / short comment / link rejected', async () => {
      await rejects(() => submitReview(reviewer, asg!.id, { q1: { clarity: 3 } }, COMMENT), /1-5 score/)
      await rejects(() => submitReview(reviewer, asg!.id, { ...scores, q1: { clarity: 9, evidence: 3, alternatives: 3 } }, COMMENT), /1-5 score/)
      await rejects(() => submitReview(reviewer, asg!.id, scores, 'short'), /at least/)
      await rejects(() => submitReview(reviewer, asg!.id, scores, 'visit www.spam.com for a very good deal now'), /Links/)
    })
    await t("review: another user can't read or submit someone else's assignment", async () => {
      assert.equal(await getReviewTask(other, asg!.id), null)
      await rejects(() => submitReview(other, asg!.id, scores, COMMENT), /not found/)
    })
    await t('review: reviewer sees answers but no author identity', async () => {
      const task = await getReviewTask(reviewer, asg!.id)
      assert.ok(task)
      assert.ok(!JSON.stringify(task).includes(A), 'author id leaked to reviewer')
    })
    await t('review: submit works once, double submit rejected', async () => {
      await submitReview(reviewer, asg!.id, scores, COMMENT)
      await rejects(() => submitReview(reviewer, asg!.id, scores, COMMENT), /already submitted/)
    })
    await t('feedback: author sees scores+comment, never reviewer identity; others cannot read it', async () => {
      const f = await getFeedback(A, subA)
      assert.ok(f && f.reviews.length === 1)
      assert.equal(f!.reviews[0].comment, COMMENT)
      assert.ok(!JSON.stringify(f).includes(reviewer), 'reviewer id leaked to author')
      assert.equal(await getFeedback(other, subA), null)
    })
    await t('helpful: only the author can mark a review helpful', async () => {
      const f = await getFeedback(A, subA)
      await rejects(() => markHelpful(other, f!.reviews[0].id, true), /not found/)
      await markHelpful(A, f!.reviews[0].id, true)
      assert.equal((await getFeedback(A, subA))!.reviews[0].helpful, true)
    })

    await t('report: only people shown the content can report; 3 distinct reports hide it', async () => {
      const reporters = await Promise.all(['r1', 'r2', 'r3'].map(mkUser))
      await prisma.practiceReviewAssignment.createMany({ data: reporters.map((r) => ({ submissionId: subD, reviewerId: r })) })
      const outsider = await mkUser('outsider')
      users.push(outsider)
      await rejects(() => fileReport(outsider, 'submission', subD, 'real exam question pasted'), /only report content/)
      await rejects(() => fileReport(reporters[0], 'submission', subD, 'x'), /short reason/)
      await fileReport(reporters[0], 'submission', subD, 'real exam question pasted')
      await fileReport(reporters[0], 'submission', subD, 'real exam question pasted') // same reporter twice: still 1
      await fileReport(reporters[1], 'submission', subD, 'real exam question pasted')
      assert.equal((await prisma.practiceSubmission.findUniqueOrThrow({ where: { id: subD } })).status, 'visible')
      await fileReport(reporters[2], 'submission', subD, 'real exam question pasted')
      assert.equal((await prisma.practiceSubmission.findUniqueOrThrow({ where: { id: subD } })).status, 'hidden')
      users.push(...reporters)
    })

    await t('rate limit: 10 sessions per hour per user', async () => {
      const u = await mkUser('rl')
      users.push(u)
      for (let i = 0; i < 10; i++) await startSession(u, abs.id, 5, true)
      await rejects(() => startSession(u, abs.id, 5, true), /Rate limit/)
    })

    void subB; void subC
    console.log(`\n${passed} checks passed`)
  } finally {
    await prisma.user.deleteMany({ where: { email: { startsWith: tag } } })
    await prisma.paper.deleteMany({ where: { OR: [{ title: { startsWith: tag } }, { arxivId: tag }] } })
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error('\nFAILED:', e)
  process.exit(1)
})
