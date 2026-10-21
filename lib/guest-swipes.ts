// Guest swiping: decisions live in localStorage until the user signs up or logs in,
// then GuestSwipeImporter saves them to the account.

export type GuestSwipe = { paperId: string; liked: boolean; categories: string[]; keywords: string[] }

const KEY = 'rs-guest-swipes-v1'

export function readGuestSwipes(): GuestSwipe[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeGuestSwipes(swipes: GuestSwipe[]) {
  try {
    if (swipes.length) localStorage.setItem(KEY, JSON.stringify(swipes))
    else localStorage.removeItem(KEY)
  } catch {
    // storage unavailable (private mode etc.): guest swipes just won't survive a reload
  }
}
