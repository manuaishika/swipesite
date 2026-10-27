import Link from 'next/link'

// arXiv asks API users to acknowledge them; every paper here comes from arXiv.
export function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          Thank you to <a href="https://arxiv.org" className="underline hover:text-gray-700">arXiv</a> for use of its open access
          interoperability. Abstracts and metadata come from the arXiv API; every paper links back to arXiv.
        </p>
        <nav className="flex shrink-0 gap-4" aria-label="Footer">
          <Link href="/about" className="hover:text-gray-700">About</Link>
          <Link href="/privacy" className="hover:text-gray-700">Privacy</Link>
        </nav>
      </div>
    </footer>
  )
}
