// Sends email through Resend's HTTP API when RESEND_API_KEY and EMAIL_FROM are set.
// Without them nothing is sent and the message is only logged, so the app works unconfigured.

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)

export async function sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
  if (!emailConfigured()) {
    console.log(`[email] not configured; would send "${subject}" to ${to.replace(/(.).+@/, '$1***@')}`)
    return false
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html, text }),
  })
  if (!res.ok) console.error('[email] send failed', res.status, await res.text().catch(() => ''))
  return res.ok
}
