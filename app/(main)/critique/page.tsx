import { redirect } from 'next/navigation'

// "Idea critique" was a placeholder that pretended to be AI feedback. It's gone; practice critiques
// (timed, reviewed by people) are the honest version of the same idea.
export default function CritiquePage() {
  redirect('/practice')
}
