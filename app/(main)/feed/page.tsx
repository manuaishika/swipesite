import { redirect } from 'next/navigation'

// The activity feed needed following people, which the site doesn't offer; replies and new posts
// in your threads are on the Notifications page instead.
export default function FeedPage() {
  redirect('/notifications')
}
