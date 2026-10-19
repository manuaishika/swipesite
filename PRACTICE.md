# Abstract critique practice (MVP)

A peer-review practice layer inside ResearchSwipe for critiquing AI safety paper abstracts. You read an abstract,
answer seven fixed prompts under a timer, then get anonymous scored feedback from two other users. You can review
others only after you have submitted your own answers.

It lives under `/practice` and reuses what the app already has: **users and login (next-auth + Prisma `User`)** and
**paper data (Prisma `Paper`, arXiv)**. Nothing else in the app was changed apart from a navbar link, an
`arxiv.ts` helper, and the schema additions.

## What is in the MVP

| Area | Behaviour |
| --- | --- |
| Auth | The existing next-auth credentials login. Every practice page and API route requires a session. |
| Abstract library | `PracticeAbstract` marks which `Paper` rows are practice papers. `npm run seed:practice` fetches 20 AI-safety abstracts from the arXiv API (title, abstract, arXiv link) and links them, reusing any paper the swipe app already imported. arXiv attribution is shown wherever an abstract appears. |
| Timed session | Default 30 min, configurable 5-120. Abstract shown first. Server-side deadline (60 s grace on submit), client countdown corrected for clock skew, auto-submit at zero, draft kept in `localStorage`. |
| Fixed prompts | The seven prompts from the spec (`lib/practice/constants.ts`). |
| Rules | "No AI assistance" notice plus a self-declaration before every session (stored as `noAiDeclaredAt`). Pasting into answer boxes is blocked as a deterrent. No AI features anywhere in the practice flow. |
| Reciprocity | `claimReview` refuses until you have your own submission. |
| Peer review | Each submission goes to at most 2 distinct other users, handed out from a queue (least-reviewed first, `FOR UPDATE SKIP LOCKED` so concurrent claims cannot overfill). Reviewers score every prompt 1-5 on clarity, evidence-vs-claim reasoning and quality of alternatives, and must write one comment (20-1500 chars). Max 3 unfinished reviews at once. |
| Feedback | Author sees per-criterion averages and each reviewer's scores and comment ("Reviewer A/B"), and can mark a review helpful. |
| Anonymity | Both directions. `lib/practice/service.ts` never selects reviewer ids for authors or author ids for reviewers. |
| Moderation | Report button on submissions (reviewers) and reviews (authors); 3 distinct reports auto-hide the item. Text checks reject links, personal-attack phrases and "real exam/assessment question" phrasing. A notice about real assessment material is on every practice page. |
| Rate limits | Per user per hour: 10 sessions, 10 submissions, 15 review claims, 20 reviews, 10 reports (`PracticeRateEvent`). |

All rules live in one file, `lib/practice/service.ts`. API routes (`app/api/practice/*`) and pages call it and nothing else.

> The existing **Critique** page (`/critique`) is an AI feature and is deliberately not linked from, or part of, the
> practice flow.

## Setup

1. **Schema.** The build command already runs `prisma db push`, so the new `Practice*` tables are created on the next
   deploy. Locally: `npx prisma db push`. This only adds tables; it changes no existing ones.
2. **Env.** Same as the rest of the app: `DATABASE_URL` (PostgreSQL), `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.
3. **Seed the library** (needs network access to `export.arxiv.org`; run it once per database):
   ```bash
   npm run seed:practice -- --dry-run   # prints the titles it would load; check them
   npm run seed:practice
   ```
   For production, run it locally with the production `DATABASE_URL` exported. The paper list is the `ARXIV_IDS`
   array in `prisma/seed-practice.ts`.
4. Log in, open **Practice** in the navbar. You need at least 3 accounts to see the whole loop.

## Tests

`DATABASE_URL=<a disposable/dev database> npm run test:practice` runs an integration test against the real database
(18 checks): reciprocity gate, 2-reviewer cap (including a concurrent-claims race), no self-review, anonymity both
ways, access control, moderation, expiry, double-submit, report auto-hide and rate limits. It creates and deletes its
own users and paper.

## Admin / moderation

There is no admin UI. Look at the `PracticeReport` table; items with 3 reports are already hidden
(`PracticeSubmission.status` / `PracticeReview.status` = `hidden`). To restore or remove one, edit those rows.

## Deliberately left out

- Leaderboards, streaks, points, notifications (email or in-app), as requested
- An admin/moderation dashboard, appeals, and user suspension (moderation is auto-hide + manual SQL)
- Any AI features: no generation, rewriting, hints, summarisation or AI-based moderation or scoring
- Reliable enforcement of "no AI assistance": it is a declaration plus a paste block, not proctoring
- Review assignment expiry/reassignment: an abandoned claimed review keeps its slot until completed (the 3-open cap limits the damage)
- Matching reviewers by topic or experience; assignment is least-reviewed first, then oldest
- Weighting or ranking reviewers by "helpful" marks (marks are stored, not used)
- Atomic rate limiting under heavy parallel abuse: counts are checked then inserted in one transaction, so a burst of simultaneous requests can slightly exceed a limit
- Editing a submission after submitting; comparing attempts over time
- Server-side draft autosave (drafts live in the browser's `localStorage`)
- Browser/UI automated tests in CI (the service layer has an integration test; the UI was exercised by hand with a scripted browser run)
- Accessibility audit and i18n
