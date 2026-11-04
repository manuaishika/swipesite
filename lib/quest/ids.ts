// Track ids, safe to use in the browser (no database imports).
import { trackById, trackForCategory } from './bank'

export const AREA_PREFIX = 'area-'

/** The track someone with this niche category should play. */
export const trackIdFor = (code: string) => trackForCategory(code)?.id ?? `${AREA_PREFIX}${code}`

export const isTrackId = (id: string) => Boolean(trackById(id)) || /^area-[a-z-]+(\.[A-Za-z-]+)?$/.test(id)
