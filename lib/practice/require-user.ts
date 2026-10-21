import { redirect } from 'next/navigation'
import { getSafeServerSession } from '@/lib/safe-session'
import { loginHref } from '@/lib/login-href'

/** For participation pages: logged-out visitors go to log in, then come straight back to `next`. */
export async function requireUserId(next: string): Promise<string> {
  const session = await getSafeServerSession()
  if (!session?.user?.id) redirect(loginHref(next))
  return session.user.id
}

export async function optionalUserId(): Promise<string | null> {
  const session = await getSafeServerSession()
  return session?.user?.id ?? null
}
