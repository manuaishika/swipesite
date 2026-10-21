/** Login/register links that bring the user back to where they were. */
export function loginHref(next?: string) {
  return next ? `/login?next=${encodeURIComponent(next)}` : '/login'
}

export function registerHref(next?: string) {
  return next ? `/register?next=${encodeURIComponent(next)}` : '/register'
}

/** Only allow same-site relative paths as a post-login destination. */
export function safeNext(next: string | null | undefined, fallback = '/dashboard') {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback
}
