// Squarified treemap (Bruls, Huizing & van Wijk): tiles whose areas match their values, kept
// as close to square as possible so they're easy to compare and label. Pure, no DOM.

export type Rect = { x: number; y: number; w: number; h: number }
export type Tile<T> = Rect & { item: T }

function worst(row: number[], side: number) {
  const sum = row.reduce((a, b) => a + b, 0)
  const max = Math.max(...row)
  const min = Math.min(...row)
  return Math.max((side * side * max) / (sum * sum), (sum * sum) / (side * side * min))
}

/** Lays out `items` (any order; sorted largest first here) inside `rect`. Zero values get no tile. */
export function squarify<T>(items: T[], value: (t: T) => number, rect: Rect): Tile<T>[] {
  const list = items.map((item) => ({ item, v: value(item) })).filter((x) => x.v > 0).sort((a, b) => b.v - a.v)
  const total = list.reduce((a, b) => a + b.v, 0)
  if (!total || rect.w <= 0 || rect.h <= 0) return []
  const scale = (rect.w * rect.h) / total
  const areas = list.map((x) => ({ item: x.item, a: x.v * scale }))
  const out: Tile<T>[] = []
  let { x, y, w, h } = rect
  let i = 0
  while (i < areas.length) {
    const side = Math.min(w, h)
    const row = [areas[i]]
    i++
    while (i < areas.length && worst([...row.map((r) => r.a), areas[i].a], side) <= worst(row.map((r) => r.a), side)) {
      row.push(areas[i])
      i++
    }
    const sum = row.reduce((s, r) => s + r.a, 0)
    if (w >= h) {
      // column on the left
      const cw = sum / h
      let cy = y
      for (const r of row) {
        const rh = r.a / cw
        out.push({ x, y: cy, w: cw, h: rh, item: r.item })
        cy += rh
      }
      x += cw
      w -= cw
    } else {
      // row along the top
      const rh = sum / w
      let cx = x
      for (const r of row) {
        const rw = r.a / rh
        out.push({ x: cx, y, w: rw, h: rh, item: r.item })
        cx += rw
      }
      y += rh
      h -= rh
    }
  }
  return out
}
