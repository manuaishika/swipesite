import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { PracticeError } from './errors'
import { moderationCheck } from './moderation'
import { rateLimit } from './rate-limit'
import { CRITERIA, LIMITS, PROMPTS, type Answers, type Scores } from './constants'

// All practice rules live here (reciprocity, 2-reviewer cap, anonymity, rate limits,
// moderation). Route handlers and pages call these functions and nothing else.
// Anonymity is enforced by what these functions return: author ids are never
// included in reviewer-facing data and reviewer ids are never included in author-facing data.

const paperSelect = { id: true, title: true, abstract: true, arxivId: true, url: true } as const

export function arxivUrl(p: { arxivId: string | null; url: string | null }) {
  if (p.url) return p.url
  return p.arxivId ? `https://arxiv.org/abs/${p.arxivId}` : null
}

// ------------------------------------------------------------------ library

export async function listLibrary() {
  const rows = await prisma.practiceAbstract.findMany({
    include: { paper: { select: { title: true, arxivId: true, publishedDate: true } } },
  })
  return rows
    .map((r) => ({ id: r.id, title: r.paper.title, arxivId: r.paper.arxivId, publishedDate: r.paper.publishedDate }))
    .sort((a, b) => (b.publishedDate?.getTime() ?? 0) - (a.publishedDate?.getTime() ?? 0))
}

export async function getLibraryItem(id: string) {
  const r = await prisma.practiceAbstract.findUnique({ where: { id }, include: { paper: { select: paperSelect } } })
  if (!r) return null
  return { id: r.id, title: r.paper.title, arxivId: r.paper.arxivId, arxivUrl: arxivUrl(r.paper) }
}

// ------------------------------------------------------------------ sessions

export async function startSession(userId: string, abstractId: string, minutes: number, declared: boolean) {
  if (declared !== true) throw new PracticeError('You must confirm the no-AI-assistance declaration.')
  if (!Number.isInteger(minutes) || minutes < LIMITS.minMinutes || minutes > LIMITS.maxMinutes) {
    throw new PracticeError(`Duration must be ${LIMITS.minMinutes}-${LIMITS.maxMinutes} minutes.`)
  }
  const abs = await prisma.practiceAbstract.findUnique({ where: { id: abstractId } })
  if (!abs) throw new PracticeError('Unknown abstract.', 404)
  return prisma.$transaction(async (tx) => {
    await rateLimit(tx, userId, 'start_session')
    const now = new Date()
    const s = await tx.practiceSession.create({
      data: {
        userId,
        abstractId,
        durationMinutes: minutes,
        deadlineAt: new Date(now.getTime() + minutes * 60_000),
        noAiDeclaredAt: now,
      },
    })
    return s.id
  })
}

export type RunnerData =
  | { state: 'submitted'; submissionId: string }
  | {
      state: 'open'
      sessionId: string
      deadlineMs: number
      abstract: { title: string; abstract: string; arxivId: string | null; arxivUrl: string | null }
    }

export async function getRunnerData(userId: string, sessionId: string): Promise<RunnerData | null> {
  const s = await prisma.practiceSession.findFirst({
    where: { id: sessionId, userId },
    include: { submission: { select: { id: true } }, abstract: { include: { paper: { select: paperSelect } } } },
  })
  if (!s) return null
  if (s.submission) return { state: 'submitted', submissionId: s.submission.id }
  const p = s.abstract.paper
  return {
    state: 'open',
    sessionId: s.id,
    deadlineMs: s.deadlineAt.getTime(),
    abstract: { title: p.title, abstract: p.abstract, arxivId: p.arxivId, arxivUrl: arxivUrl(p) },
  }
}

export async function submitAnswers(userId: string, sessionId: string, raw: unknown) {
  const s = await prisma.practiceSession.findFirst({ where: { id: sessionId, userId } })
  if (!s) throw new PracticeError('Session not found.', 404)
  if (Date.now() > s.deadlineAt.getTime() + LIMITS.submitGraceMs) {
    throw new PracticeError('This session has expired.')
  }
  const input = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const clean: Answers = {}
  let total = 0
  for (const p of PROMPTS) {
    const v = typeof input[p.id] === 'string' ? (input[p.id] as string).trim() : ''
    if (v.length > LIMITS.maxAnswerChars) {
      throw new PracticeError(`Answer ${p.id} is too long (max ${LIMITS.maxAnswerChars} characters).`)
    }
    total += v.length
    clean[p.id] = v
  }
  if (total < LIMITS.minTotalAnswerChars) {
    throw new PracticeError(
      `Please write a bit more before submitting (at least ${LIMITS.minTotalAnswerChars} characters in total).`
    )
  }
  moderationCheck(Object.values(clean).join('\n'))
  try {
    return await prisma.$transaction(async (tx) => {
      await rateLimit(tx, userId, 'submit_answers')
      const sub = await tx.practiceSubmission.create({
        data: { sessionId, userId, abstractId: s.abstractId, answers: clean },
      })
      return sub.id
    })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new PracticeError('This session was already submitted.')
    }
    throw e
  }
}

// ------------------------------------------------------------------ peer review

// Reciprocity: you can only claim reviews once you have submitted your own answers.
// Each submission is handed to at most 2 distinct reviewers, never its author.
export async function claimReview(userId: string) {
  return prisma.$transaction(async (tx) => {
    const own = await tx.practiceSubmission.count({ where: { userId } })
    if (own === 0) {
      throw new PracticeError(
        'Submit your own answers first: you can only review others after you have submitted.',
        403
      )
    }
    const open = await tx.practiceReviewAssignment.count({ where: { reviewerId: userId, completedAt: null } })
    if (open >= LIMITS.maxOpenReviews) {
      throw new PracticeError(
        `Finish your unfinished reviews before claiming more (max ${LIMITS.maxOpenReviews} at a time).`
      )
    }
    await rateLimit(tx, userId, 'claim_review')
    // Least-reviewed first, then oldest. SKIP LOCKED stops two reviewers grabbing the same last slot.
    const rows = await tx.$queryRaw<{ id: string }[]>`
      SELECT s.id FROM "PracticeSubmission" s
       WHERE s.status = 'visible'
         AND s."userId" <> ${userId}
         AND NOT EXISTS (SELECT 1 FROM "PracticeReviewAssignment" a WHERE a."submissionId" = s.id AND a."reviewerId" = ${userId})
         AND (SELECT COUNT(*) FROM "PracticeReviewAssignment" a WHERE a."submissionId" = s.id) < ${LIMITS.reviewsPerSubmission}
       ORDER BY (SELECT COUNT(*) FROM "PracticeReviewAssignment" a WHERE a."submissionId" = s.id), s."submittedAt"
       LIMIT 1
       FOR UPDATE OF s SKIP LOCKED`
    if (rows.length === 0) throw new PracticeError('No submissions need a review right now. Check back later.', 404)
    const a = await tx.practiceReviewAssignment.create({ data: { submissionId: rows[0].id, reviewerId: userId } })
    return a.id
  })
}

export async function getReviewTask(userId: string, assignmentId: string) {
  const a = await prisma.practiceReviewAssignment.findFirst({
    where: { id: assignmentId, reviewerId: userId },
    include: {
      review: { select: { scores: true, comment: true } },
      submission: {
        select: {
          id: true,
          status: true,
          answers: true,
          abstract: { include: { paper: { select: paperSelect } } },
        },
      },
    },
  })
  if (!a || a.submission.status !== 'visible') return null
  const p = a.submission.abstract.paper
  return {
    assignmentId: a.id,
    submissionId: a.submission.id,
    completed: a.completedAt !== null,
    answers: a.submission.answers as Answers,
    abstract: { title: p.title, abstract: p.abstract, arxivId: p.arxivId, arxivUrl: arxivUrl(p) },
    review: a.review ? { scores: a.review.scores as Scores, comment: a.review.comment } : null,
  }
}

function validateScores(raw: unknown): Scores {
  const input = (raw && typeof raw === 'object' ? raw : {}) as Record<string, Record<string, unknown>>
  const out: Scores = {}
  for (const p of PROMPTS) {
    out[p.id] = {}
    for (const c of CRITERIA) {
      const v = input[p.id]?.[c.id]
      if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > 5) {
        throw new PracticeError(
          'Every prompt needs a 1-5 score for clarity, evidence-vs-claim reasoning and alternatives.'
        )
      }
      out[p.id][c.id] = v
    }
  }
  return out
}

export async function submitReview(userId: string, assignmentId: string, rawScores: unknown, rawComment: unknown) {
  const a = await prisma.practiceReviewAssignment.findFirst({
    where: { id: assignmentId, reviewerId: userId },
    include: { submission: { select: { status: true } } },
  })
  if (!a) throw new PracticeError('Review not found.', 404)
  if (a.completedAt) throw new PracticeError('You already submitted this review.')
  if (a.submission.status !== 'visible') throw new PracticeError('This submission is no longer available.')
  const scores = validateScores(rawScores)
  const comment = typeof rawComment === 'string' ? rawComment.trim() : ''
  if (comment.length < LIMITS.minCommentChars) {
    throw new PracticeError(`Write one specific comment (at least ${LIMITS.minCommentChars} characters).`)
  }
  if (comment.length > LIMITS.maxCommentChars) {
    throw new PracticeError(`Comment is too long (max ${LIMITS.maxCommentChars} characters).`)
  }
  moderationCheck(comment)
  return prisma.$transaction(async (tx) => {
    await rateLimit(tx, userId, 'submit_review')
    // updateMany guards against a double-submit race: only one request flips completedAt.
    const flipped = await tx.practiceReviewAssignment.updateMany({
      where: { id: assignmentId, reviewerId: userId, completedAt: null },
      data: { completedAt: new Date() },
    })
    if (flipped.count === 0) throw new PracticeError('You already submitted this review.')
    const r = await tx.practiceReview.create({
      data: { assignmentId, submissionId: a.submissionId, reviewerId: userId, scores, comment },
    })
    return r.id
  })
}

// ------------------------------------------------------------------ feedback (author view)

export async function getFeedback(userId: string, submissionId: string) {
  const s = await prisma.practiceSubmission.findFirst({
    where: { id: submissionId, userId },
    include: {
      abstract: { include: { paper: { select: paperSelect } } },
      // NOTE: reviewerId is deliberately not selected: authors never see who reviewed them.
      reviews: {
        where: { status: 'visible' },
        orderBy: { createdAt: 'asc' },
        select: { id: true, scores: true, comment: true, helpful: true, createdAt: true },
      },
    },
  })
  if (!s) return null
  const p = s.abstract.paper
  return {
    submissionId: s.id,
    status: s.status,
    answers: s.answers as Answers,
    abstract: { title: p.title, arxivId: p.arxivId, arxivUrl: arxivUrl(p) },
    reviews: s.reviews.map((r) => ({
      id: r.id,
      scores: r.scores as Scores,
      comment: r.comment,
      helpful: r.helpful,
    })),
  }
}

export async function markHelpful(userId: string, reviewId: string, helpful: boolean) {
  const r = await prisma.practiceReview.updateMany({
    where: { id: reviewId, submission: { userId } },
    data: { helpful },
  })
  if (r.count === 0) throw new PracticeError('Review not found.', 404)
}

// ------------------------------------------------------------------ reports

// A submission/review reported by 3 distinct users is hidden pending manual review.
export async function fileReport(userId: string, type: unknown, targetId: unknown, rawReason: unknown) {
  const reason = typeof rawReason === 'string' ? rawReason.trim() : ''
  if (reason.length < 5 || reason.length > 500) throw new PracticeError('Please give a short reason (5-500 characters).')
  if ((type !== 'submission' && type !== 'review') || typeof targetId !== 'string') {
    throw new PracticeError('Unknown report type.')
  }
  const allowed =
    type === 'submission'
      ? (await prisma.practiceReviewAssignment.count({ where: { submissionId: targetId, reviewerId: userId } })) > 0
      : (await prisma.practiceReview.count({ where: { id: targetId, submission: { userId } } })) > 0
  if (!allowed) throw new PracticeError('You can only report content you have been shown.', 403)

  await prisma.$transaction(async (tx) => {
    await rateLimit(tx, userId, 'file_report')
    await tx.practiceReport.upsert({
      where: { reporterId_targetType_targetId: { reporterId: userId, targetType: type, targetId } },
      create: { reporterId: userId, targetType: type, targetId, reason },
      update: {},
    })
    const n = await tx.practiceReport.count({ where: { targetType: type, targetId } })
    if (n >= LIMITS.reportsToHide) {
      if (type === 'submission') await tx.practiceSubmission.update({ where: { id: targetId }, data: { status: 'hidden' } })
      else await tx.practiceReview.update({ where: { id: targetId }, data: { status: 'hidden' } })
    }
  })
}

// ------------------------------------------------------------------ dashboard lists

export async function getDashboard(userId: string) {
  const [subs, assignments, sessions] = await Promise.all([
    prisma.practiceSubmission.findMany({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        status: true,
        abstract: { select: { paper: { select: { title: true } } } },
        _count: { select: { reviews: { where: { status: 'visible' } } } },
      },
    }),
    prisma.practiceReviewAssignment.findMany({
      where: { reviewerId: userId, submission: { status: 'visible' } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, completedAt: true, submission: { select: { abstract: { select: { paper: { select: { title: true } } } } } } },
    }),
    prisma.practiceSession.findMany({
      where: { userId, submission: null, deadlineAt: { gt: new Date(Date.now() - LIMITS.submitGraceMs) } },
      orderBy: { startedAt: 'desc' },
      select: { id: true, abstract: { select: { paper: { select: { title: true } } } } },
    }),
  ])
  return {
    unlocked: subs.length > 0,
    submissions: subs.map((s) => ({
      id: s.id,
      title: s.abstract.paper.title,
      status: s.status,
      reviewsDone: s._count.reviews,
    })),
    queue: assignments.map((a) => ({
      id: a.id,
      title: a.submission.abstract.paper.title,
      completed: a.completedAt !== null,
    })),
    inProgress: sessions.map((s) => ({ id: s.id, title: s.abstract.paper.title })),
  }
}
