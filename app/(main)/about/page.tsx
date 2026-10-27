import Link from 'next/link'

export const metadata = { title: 'About' }

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">About ResearchSwipe</h1>
      <div className="mt-6 space-y-4 leading-relaxed text-gray-700">
        <p>
          ResearchSwipe is for students and early-career researchers getting into machine learning and AI safety who
          aren&apos;t yet sure which problems they want to work on.
        </p>
        <p>
          <strong className="font-medium text-gray-900">Find your niche from evidence.</strong> You rate real arXiv abstracts:
          would you want to work on this? Each rating counts toward the paper&apos;s arXiv category. Over time, the categories you
          keep choosing stand out from your own average, with an honest range around each estimate. Nothing is concluded from
          a handful of ratings.
        </p>
        <p>
          <strong className="font-medium text-gray-900">Discuss papers with people reading them.</strong> Every paper has a
          thread for questions, follow-ups and short reviews. Verified experts carry a badge; posts can be reported and are
          moderated.
        </p>
        <p>
          <strong className="font-medium text-gray-900">Practise reviewing.</strong> Timed critiques of abstracts, scored by
          other people, so you get better at reading papers critically.
        </p>
        <p>
          All papers come from <a href="https://arxiv.org" className="text-primary underline">arXiv</a> and link back to it.
          Thank you to arXiv for use of its open access interoperability.
        </p>
      </div>
      <Link href="/swipe" className="mt-8 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-light">
        Start rating abstracts
      </Link>
    </div>
  )
}
