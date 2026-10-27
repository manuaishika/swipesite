import { ImageResponse } from 'next/og'
import { getPublicMap } from '@/lib/public-map'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Research map on ResearchSwipe'

// The preview card shown when a research map link is shared.
export default async function Image({ params }: { params: { username: string } }) {
  const map = await getPublicMap(params.username).catch(() => null)
  const name = map ? map.user.name || map.user.username : 'ResearchSwipe'
  const cats = map ? (map.niche.likely.length ? map.niche.likely : map.niche.categories).slice(0, 4) : []
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: 64, background: 'linear-gradient(135deg,#1f5c5c,#2f8f83)', color: 'white', fontFamily: 'sans-serif' }}>
        <div style={{ fontSize: 28, opacity: 0.75 }}>Research map · ResearchSwipe</div>
        <div style={{ fontSize: 64, fontWeight: 600, marginTop: 12 }}>{name}</div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 40, gap: 18 }}>
          {cats.map((c) => (
            <div key={c.code} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 380, fontSize: 30, overflow: 'hidden', whiteSpace: 'nowrap' }}>{c.name.length > 24 ? `${c.name.slice(0, 23).trimEnd()}…` : c.name}</div>
              <div style={{ display: 'flex', width: 560, height: 22, borderRadius: 11, background: 'rgba(255,255,255,0.2)' }}>
                <div style={{ width: `${Math.max(4, c.rate * 100)}%`, height: 22, borderRadius: 11, background: 'white' }} />
              </div>
            </div>
          ))}
          {!cats.length && <div style={{ fontSize: 34 }}>Find your research niche from real arXiv abstracts</div>}
        </div>
      </div>
    ),
    size,
  )
}
