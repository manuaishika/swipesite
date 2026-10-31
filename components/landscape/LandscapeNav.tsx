import Link from 'next/link'

const TABS = [
  { href: '/landscape', label: 'Biggest areas' },
  { href: '/landscape/niche', label: 'How niche is a topic?' },
  { href: '/landscape/bridges', label: 'From another field' },
]

/** Header and tabs shared by the three Landscape views. */
export function LandscapeNav({ active, title, sub }: { active: string; title: string; sub: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">{title}</h1>
      <p className="mt-1 max-w-2xl text-gray-600">{sub}</p>
      <nav className="mt-5 flex flex-wrap gap-2" aria-label="Landscape views">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active === t.href ? 'page' : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              active === t.href ? 'bg-primary text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:ring-primary'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
