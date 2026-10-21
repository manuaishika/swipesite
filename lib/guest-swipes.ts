// Guest swiping: decisions live in localStorage until the user signs up or logs in,
// then GuestSwipeImporter saves them to the account.

export type GuestSwipe = { paperId: string; liked: boolean; categories: string[]; keywords: string[]; title?: string }

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

// Papers a guest saved for later (with tags); imported to the account on sign-in like swipes.
export type GuestSave = { paperId: string; title: string; tags: string[] }
const SAVES_KEY = 'rs-guest-saves-v1'

export function readGuestSaves(): GuestSave[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVES_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeGuestSaves(saves: GuestSave[]) {
  try {
    if (saves.length) localStorage.setItem(SAVES_KEY, JSON.stringify(saves))
    else localStorage.removeItem(SAVES_KEY)
  } catch {
    // storage unavailable: guest saves just won't survive a reload
  }
}
