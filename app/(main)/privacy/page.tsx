export const metadata = { title: 'Privacy' }

const ITEMS: [string, string][] = [
  ['Without an account', 'Your ratings and saved papers stay in your browser (local storage). If you sign up, they are copied to your account.'],
  ['With an account', 'We store your email, username, the papers you rate and save, your posts and votes, and practice answers and reviews. Your password is stored only as a hash.'],
  ['Who sees what', 'Posts, replies and your name on them are public. Which papers you rated is private. Your research map is public only if you switch it on, and then only category-level results are shown.'],
  ['Analytics', 'We record page views with a random id kept in your browser, and errors that happen in the page, to see what is used and fix what breaks. No IP addresses, no third-party trackers or ads. These records are deleted after 90 days.'],
  ['Email', 'If you have an account we may send a weekly digest. Every email has a one-click unsubscribe, and you can switch it off under Notifications.'],
  ['Deleting your data', 'Profile → Delete account removes your account and everything attached to it: ratings, saved papers, posts, replies, votes and practice work.'],
]

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">Privacy</h1>
      <p className="mt-2 text-gray-600">What we keep, and why, in plain words.</p>
      <dl className="mt-6 space-y-5">
        {ITEMS.map(([t, d]) => (
          <div key={t}>
            <dt className="font-medium text-gray-900">{t}</dt>
            <dd className="mt-1 leading-relaxed text-gray-700">{d}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
