// A stand-in for export.arxiv.org/api/query, for tests (point ARXIV_API_URL at it). Answers counts
// (max_results=0), id_list lookups and searches with deterministic fake papers.
import http from 'node:http'

const PORT = Number(process.env.MOCK_ARXIV_PORT || 9911)
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
const feed = (total, entries) =>
  `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom" xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/"><opensearch:totalResults>${total}</opensearch:totalResults>${entries}</feed>`
const entry = (id, cat, k) =>
  `<entry><id>http://arxiv.org/abs/${id}v1</id><published>2026-09-10T00:00:00Z</published><title>Test paper ${id} on ${cat}</title><summary>We study ${cat} problem number ${k}. We propose a simple method. Results improve on the baseline.</summary><author><name>Author ${k % 37}</name></author><author><name>Author ${(k * 7) % 53}</name></author><link href="http://arxiv.org/abs/${id}v1" rel="alternate" type="text/html"/><category term="${cat}"/></entry>`

http
  .createServer((req, res) => {
    const u = new URL(req.url, 'http://x')
    const q = u.searchParams.get('search_query') || ''
    const max = Number(u.searchParams.get('max_results') ?? 10)
    res.setHeader('Content-Type', 'application/atom+xml')
    const ids = (u.searchParams.get('id_list') || '').split(',').filter(Boolean)
    if (ids.length) return res.end(feed(ids.length, ids.map((i, k) => entry(i, 'cs.LG', k)).join('')))
    const base = q.startsWith('submittedDate') ? '' : q.replace(/\s*AND\s*submittedDate:\[[^\]]*\]/, '').replace(/^\(|\)$/g, '')
    if (max === 0) return res.end(feed(base ? (base.startsWith('cat:') ? 2000 + (hash(base) % 30000) : 5 + (hash(base) % 2500)) : 280000, ''))
    const cat = (base.match(/cat:([^ )]+)/) || [])[1] || ['cs.LG', 'cs.CL', 'cs.AI'][hash(base) % 3]
    const n = Math.min(max, 100)
    res.end(feed(n, Array.from({ length: n }, (_, k) => entry(`2610.${String((hash(base) % 9000) + k).padStart(5, '0')}`, cat, k)).join('')))
  })
  .listen(PORT, () => console.log(`mock arXiv on :${PORT}`))
