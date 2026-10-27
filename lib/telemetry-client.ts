// Browser side of first-party analytics. Never throws.

function anonId() {
  try {
    let id = localStorage.getItem('rs-anon')
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem('rs-anon', id)
    }
    return id
  } catch {
    return undefined
  }
}

export function track(name: 'page_view' | 'client_error', props: Record<string, string | undefined> = {}) {
  try {
    const body = JSON.stringify({ name, anonId: anonId(), path: location.pathname, props })
    if (navigator.sendBeacon) navigator.sendBeacon('/api/telemetry', new Blob([body], { type: 'application/json' }))
    else fetch('/api/telemetry', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {})
  } catch {}
}

let reported = 0
const recent = new Map<string, number>()
export function reportError(err: unknown, extra: Record<string, string | undefined> = {}) {
  const e = err instanceof Error ? err : new Error(String(err))
  // the same error often arrives twice (error event + boundary); send it once per 10 s
  const key = `${location.pathname}|${e.message}`
  if (Date.now() - (recent.get(key) ?? 0) < 10_000) return
  recent.set(key, Date.now())
  if (reported++ > 5) return // don't flood from one page
  track('client_error', { message: e.message, stack: e.stack?.slice(0, 1500), ...extra })
}
