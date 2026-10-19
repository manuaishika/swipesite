import { redirect } from 'next/navigation'
import { getSafeServerSession } from '@/lib/safe-session'

export async function requireUserId(): Promise<string> {
  const session = await getSafeServerSession()
  if (!session?.user?.id) redirect('/login')
  return session.user.id
}
