'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Pause, Play } from 'lucide-react'

// A short looping walkthrough shown where a feature needs an account, so people can see
// how it works before signing up. Each demo is a few scripted frames (no recorded video).

const FRAME_MS = 3200

function Typed({ text, delay = 0.3 }: { text: string; delay?: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    setN(0)
    const t = setTimeout(() => {
      const id = setInterval(() => setN((v) => (v >= text.length ? (clearInterval(id), v) : v + 1)), 28)
    }, delay * 1000)
    return () => clearTimeout(t)
  }, [text, delay])
  return (
    <span>
      {text.slice(0, n)}
      <span className="ml-px inline-block h-3.5 w-px translate-y-0.5 animate-pulse bg-gray-500" />
    </span>
  )
}

const Line = ({ w = 'w-full', c = 'bg-gray-200' }: { w?: string; c?: string }) => <div className={`h-2 rounded-full ${c} ${w}`} />

function Btn({ children, pressAt = 1.6, tone = 'primary' }: { children: React.ReactNode; pressAt?: number; tone?: 'primary' | 'ghost' }) {
  return (
    <motion.span
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1, 0.9, 1.04, 1] }}
      transition={{ duration: 0.7, delay: pressAt, times: [0, 0.2, 0.45, 0.75, 1] }}
      className={`inline-block rounded-lg px-3 py-1.5 text-xs font-semibold ${
        tone === 'primary' ? 'bg-primary text-white' : 'bg-primary-50 text-primary'
      }`}
    >
      {children}
    </motion.span>
  )
}

function Chip({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${active ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
      {children}
    </span>
  )
}

const Panel = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">{children}</div>
)

type Frame = { caption: string; mock: React.ReactNode }

const DEMOS: Record<string, { title: string; frames: Frame[] }> = {
  practice: {
    title: 'How a practice session works',
    frames: [
      {
        caption: '1. Pick an abstract and set a timer, from 5 minutes to 2 hours.',
        mock: (
          <Panel>
            <Line w="w-3/4" c="bg-gray-300" />
            <div className="flex gap-1.5">
              {['15 min', '30 min', '60 min'].map((m, i) => (
                <Chip key={m} active={i === 1}>{m}</Chip>
              ))}
            </div>
            <Btn>Start timer</Btn>
          </Panel>
        ),
      },
      {
        caption: '2. The abstract and your questions appear together. You write against the clock.',
        mock: (
          <Panel>
            <div className="flex items-center justify-between text-[11px] text-gray-500">
              <span>Abstract</span>
              <span className="font-semibold tabular-nums text-primary">29:41</span>
            </div>
            <Line /><Line w="w-11/12" /><Line w="w-4/5" />
            <div className="rounded-lg bg-gray-50 p-2 text-xs text-gray-700">
              <Typed text="The claim rests on a single benchmark, so…" />
            </div>
          </Panel>
        ),
      },
      {
        caption: '3. Submit when you are done. Your answers go into a pool of anonymous peer reviews.',
        mock: (
          <Panel>
            <div className="text-xs text-gray-600">7 of 7 answered</div>
            <div className="h-1.5 rounded-full bg-gray-100">
              <motion.div initial={{ width: '40%' }} animate={{ width: '100%' }} transition={{ duration: 1.2 }} className="h-full rounded-full bg-primary" />
            </div>
            <Btn pressAt={1.4}>Submit</Btn>
          </Panel>
        ),
      },
      {
        caption: '4. Other people score your answers on clarity, evidence and alternatives, and you review theirs.',
        mock: (
          <Panel>
            {['Clarity', 'Evidence', 'Alternatives'].map((c, i) => (
              <div key={c} className="flex items-center justify-between text-xs text-gray-700">
                {c}
                <span className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <motion.span
                      key={s}
                      initial={{ opacity: 0.2 }}
                      animate={{ opacity: s <= 3 + (i % 2) ? 1 : 0.2 }}
                      transition={{ delay: 0.3 + i * 0.35 + s * 0.06 }}
                      className="h-3 w-3 rounded-full bg-primary"
                    />
                  ))}
                </span>
              </div>
            ))}
          </Panel>
        ),
      },
    ],
  },
  review: {
    title: 'How the discussion works',
    frames: [
      {
        caption: '1. Open any paper from your picks. Its thread is a place to ask questions.',
        mock: (
          <Panel>
            <Line w="w-2/3" c="bg-gray-300" />
            <Line /><Line w="w-5/6" />
            <div className="flex gap-1.5"><Chip>cs.LG</Chip><Chip>3 posts</Chip></div>
          </Panel>
        ),
      },
      {
        caption: '2. Ask a question, or say what you found unclear or want to see tested.',
        mock: (
          <Panel>
            <div className="rounded-lg bg-gray-50 p-2 text-xs text-gray-700">
              <Typed text="Did they control for model size here?" />
            </div>
            <Btn pressAt={2.1}>Post</Btn>
          </Panel>
        ),
      },
      {
        caption: '3. Authors and other readers reply, and you can follow up in the same thread.',
        mock: (
          <Panel>
            <div className="rounded-lg bg-gray-50 p-2 text-xs text-gray-700">Did they control for model size here?</div>
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="ml-5 rounded-lg bg-primary-50 p-2 text-xs text-gray-800">
              Table 2 holds it fixed, but only for two sizes.
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.3 }} className="ml-5 rounded-lg bg-gray-50 p-2 text-xs text-gray-700">
              Thanks. Would a third size change it?
            </motion.div>
          </Panel>
        ),
      },
    ],
  },
  collab: {
    title: 'How collaboration requests work',
    frames: [
      {
        caption: '1. Someone posts what they are working on and who they are looking for.',
        mock: (
          <Panel>
            <Line w="w-1/2" c="bg-gray-300" /><Line /><Line w="w-4/5" />
            <div className="flex gap-1.5"><Chip>Interpretability</Chip><Chip>Looking for: stats</Chip></div>
          </Panel>
        ),
      },
      {
        caption: '2. You send a short note about why you would fit.',
        mock: (
          <Panel>
            <div className="rounded-lg bg-gray-50 p-2 text-xs text-gray-700">
              <Typed text="I have run similar probing experiments…" />
            </div>
            <Btn pressAt={2.2}>Request to collaborate</Btn>
          </Panel>
        ),
      },
      {
        caption: '3. Only the poster sees your note. If they accept, you can start talking.',
        mock: (
          <Panel>
            <div className="flex items-center justify-between text-xs text-gray-700">
              Request sent
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7, type: 'spring' }} className="rounded-full bg-green-100 px-2 py-0.5 font-semibold text-green-700">
                Accepted
              </motion.span>
            </div>
          </Panel>
        ),
      },
    ],
  },
  save: {
    title: 'How your collection works',
    frames: [
      {
        caption: '1. Swipe right, or tap Save, on any abstract. Add a tag like “read later”.',
        mock: (
          <Panel>
            <Line w="w-3/4" c="bg-gray-300" /><Line /><Line w="w-5/6" />
            <div className="flex gap-1.5"><Chip active>read later</Chip><Chip>baseline</Chip></div>
          </Panel>
        ),
      },
      {
        caption: '2. Everything you saved collects in one list you can filter by tag.',
        mock: (
          <Panel>
            {['w-2/3', 'w-3/4', 'w-1/2'].map((w, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.3 }} className="flex items-center justify-between">
                <Line w={w} c="bg-gray-300" /><Chip active={i === 0}>read later</Chip>
              </motion.div>
            ))}
          </Panel>
        ),
      },
      {
        caption: '3. Pick two and compare them side by side, or open a thread on one.',
        mock: (
          <Panel>
            <div className="grid grid-cols-2 gap-2">
              {[0, 1].map((i) => (
                <div key={i} className="space-y-1.5 rounded-lg bg-gray-50 p-2"><Line c="bg-gray-300" /><Line w="w-3/4" /><Line w="w-1/2" /></div>
              ))}
            </div>
          </Panel>
        ),
      },
    ],
  },
  idea: {
    title: 'How idea critique works',
    frames: [
      {
        caption: '1. Write a research idea in a few sentences.',
        mock: (
          <Panel>
            <div className="rounded-lg bg-gray-50 p-2 text-xs text-gray-700">
              <Typed text="Does steering vectors transfer across fine-tunes?" />
            </div>
            <Btn pressAt={2.4}>Ask for critique</Btn>
          </Panel>
        ),
      },
      {
        caption: '2. You get structured feedback on what is clear, what is missing and what to test first.',
        mock: (
          <Panel>
            {['Clear', 'Missing', 'Test first'].map((l, i) => (
              <motion.div key={l} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.4 }} className="flex items-center gap-2">
                <Chip active={i === 0}>{l}</Chip><Line w={['w-3/4', 'w-2/3', 'w-4/5'][i]} />
              </motion.div>
            ))}
          </Panel>
        ),
      },
    ],
  },
  recs: {
    title: 'How recommendations work',
    frames: [
      {
        caption: '1. The more abstracts you rate, the clearer your pattern gets.',
        mock: (
          <Panel>
            {[80, 55, 30].map((w, i) => (
              <div key={i} className="h-2 rounded-full bg-gray-100">
                <motion.div initial={{ width: 0 }} animate={{ width: `${w}%` }} transition={{ delay: 0.2 + i * 0.25, duration: 0.8 }} className="h-full rounded-full bg-primary" />
              </div>
            ))}
          </Panel>
        ),
      },
      {
        caption: '2. New papers from the categories you rate highly are put first.',
        mock: (
          <Panel>
            {[0, 1, 2].map((i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.3 }} className="flex items-center justify-between">
                <Line w={['w-2/3', 'w-3/4', 'w-1/2'][i]} c="bg-gray-300" /><Chip>cs.LG</Chip>
              </motion.div>
            ))}
          </Panel>
        ),
      },
    ],
  },
  profile: {
    title: 'What an account gives you',
    frames: [
      {
        caption: '1. Your swipes, saved papers and niche progress are kept between visits and devices.',
        mock: (
          <Panel>
            <div className="flex items-center gap-2"><div className="h-8 w-8 rounded-full bg-primary-100" /><Line w="w-1/3" c="bg-gray-300" /></div>
            <div className="flex gap-1.5"><Chip active>42 rated</Chip><Chip>9 saved</Chip></div>
          </Panel>
        ),
      },
      {
        caption: '2. Your name and research interests appear on your posts and collaboration requests.',
        mock: (
          <Panel>
            <Line w="w-1/2" c="bg-gray-300" /><div className="flex gap-1.5"><Chip>Interpretability</Chip><Chip>Evals</Chip></div>
          </Panel>
        ),
      },
    ],
  },
  opps: {
    title: 'How posting an opportunity works',
    frames: [
      {
        caption: '1. Add a title, a link and a deadline.',
        mock: (
          <Panel>
            <div className="rounded-lg bg-gray-50 p-2 text-xs text-gray-700"><Typed text="Summer research fellowship, applications open" /></div>
            <Btn pressAt={2.3}>Post</Btn>
          </Panel>
        ),
      },
      {
        caption: '2. It shows on the board for everyone, with the days left.',
        mock: (
          <Panel>
            <div className="flex items-center justify-between"><Line w="w-2/3" c="bg-gray-300" /><Chip active>12 days left</Chip></div>
          </Panel>
        ),
      },
    ],
  },
}

export type DemoKey = keyof typeof DEMOS

export function DemoPlayer({ demo, className = '' }: { demo: DemoKey; className?: string }) {
  const { title, frames } = DEMOS[demo]
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    if (!playing || reduced) return
    const t = setTimeout(() => setI((v) => (v + 1) % frames.length), FRAME_MS)
    return () => clearTimeout(t)
  }, [i, playing, reduced, frames.length])

  return (
    <figure className={`overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 ${className}`} data-demo={demo}>
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
        <figcaption className="text-xs font-semibold text-gray-700">{title}</figcaption>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'Pause demo' : 'Play demo'}
          className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
        >
          {playing && !reduced ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>
      </div>
      <div className="p-4">
        <div className="min-h-[9.5rem]">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            >
              {frames[i].mock}
            </motion.div>
          </AnimatePresence>
        </div>
        <p className="mt-3 min-h-[2.5rem] text-sm leading-snug text-gray-700" aria-live="polite">{frames[i].caption}</p>
        <div className="mt-2 flex gap-1.5">
          {frames.map((_, k) => (
            <button
              key={k}
              type="button"
              aria-label={`Step ${k + 1}`}
              onClick={() => { setI(k); setPlaying(false) }}
              className={`h-1.5 flex-1 rounded-full transition-colors ${k === i ? 'bg-primary' : 'bg-gray-200 hover:bg-gray-300'}`}
            />
          ))}
        </div>
      </div>
    </figure>
  )
}
