# ResearchSwipe playbook

What the product is for, how we measure it, and the work that isn't code.

## Who it's for

Students and early-career researchers getting into ML and AI safety who don't yet know which
problems they want to work on. Everything else (conferences, opportunities, collaboration) is
supporting material for that person.

The two core loops:

1. **Find your niche from evidence**: rate real arXiv abstracts; the niche method shows which
   categories you keep choosing, with an honest range, and only concludes once the evidence is there.
2. **Discuss and practise**: a thread on every paper (questions, follow-ups, short reviews) and
   timed, peer-scored practice critiques.

## The one number

**Weekly active contributors**: people who, in the last 7 days, rated an abstract, posted or replied
in a discussion, or submitted a practice critique. See `/admin/metrics`.

Watch alongside it:

- **Came back from last week**: share of last week's contributors active again this week.
- **Niche method lift**: on `/admin/metrics`. It compares how often people like papers in the
  categories the method predicted for them with how often they like papers elsewhere, using ratings
  made after the prediction. Above 1.0 means the method predicts something. Below or at 1.0 means fix
  the method before marketing it.

Suggested first target: 25 weekly active contributors, with at least 40% coming back the next week.

## Switch these on in Vercel (Settings → Environment Variables)

| Variable | What it does |
| --- | --- |
| `ADMIN_EMAILS` | Comma-separated emails that can open `/admin/metrics` and `/admin/moderation`. Add your own. |
| `CRON_SECRET` | Any long random string. Locks the daily arXiv sync and the weekly digest to Vercel's scheduler. |
| `RESEND_API_KEY`, `EMAIL_FROM` | Turns on the weekly email digest ([resend.com](https://resend.com), free tier; `EMAIL_FROM` like `ResearchSwipe <digest@yourdomain>` on a verified domain). Without them the digest is only logged. |
| `NEXTAUTH_URL` | The site's public URL, used in email links and link previews. |

Redeploy after changing variables.

## First 30 days (not code)

1. **Recruit 25 people by hand** from one community. Examples: a university AI safety reading group,
   alignment course alumni, or ML students at one university. Sit with 5 of them while they use it,
   and note where they stop.
2. **Seed the discussions.** Before inviting people, ask 10–20 researchers or senior students to each
   answer a few questions in threads in their own area. Give them the expert badge
   (`/admin/moderation`), with a one-line expertise label you have checked.
3. **Weekly ritual.** Every Monday, read `/admin/metrics`, read the reported posts, and post one new
   question in a thread that has gone quiet.
4. **Make it shareable.** Ask early users to switch on their public research map and share it. The
   link preview shows their top categories.

## Distribution ideas, in order of cost

- Reading groups and courses: offer the practice critiques as homework. One instructor brings a whole
  cohort.
- Show HN or LessWrong post: "I rated 100 arXiv abstracts and this is my research map". Lead with the
  method and a real map, not with the features.
- AI safety field-building programmes, fellowships and Discords. The opportunities board gives them
  a reason to link here.

## Business model (later, not now)

Don't charge yet. Possible paths, so decisions now don't close them off:

- **Institutional**: universities and training programmes pay for cohorts (practice critiques, a
  dashboard of each student's progress).
- **Sponsored listings**: fellowships, PhD positions and jobs on the opportunities board.
- **Mentorship tier**: paid structured feedback from verified experts.

## Known gaps

- Conference dates are a hand-maintained list (`lib/conferences.ts`). Entries marked `~` are
  estimated from the previous edition; replace them as dates are announced.
- arXiv papers are fetched daily plus on demand. arXiv's OAI-PMH feed is the right tool if we ever
  need bulk history.
- Notifications are in-app and weekly email only (no push).
