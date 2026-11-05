import { getSafeServerSession } from '@/lib/safe-session'
import { LoginGate } from '@/components/auth/LoginGate'
import { NewCollaborationForm } from '@/components/collaboration/NewCollaborationForm'

export default async function NewCollaborationPage() {
  const session = await getSafeServerSession()
  if (!session) {
    return <LoginGate title="Post a collaboration" body="Say what you're working on and who you're looking for. Log in to post." next="/collaborations/new" demo="collab" />
  }
  return <NewCollaborationForm />
}
