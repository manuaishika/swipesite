'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import type { Niche } from '@/lib/niche-core'
import { trackById } from '@/lib/quest/bank'
import { trackIdFor } from '@/lib/quest/ids'
import { Confetti } from './Confetti'

const KEY = (code: string) => `rs-reveal:${code}`

const CHOICES = [
  { level: 0, title: 'Beginner', line: 'I’m new to this area', emoji: '🌱' },
  { level: 1, title: 'Intermediate', line: 'I know the basics', emoji: '🚀' },
  { level: 2, title: 'Advanced', line: 'I already read papers in it', emoji: '🧠' },
]

/**
 * The moment the evidence settles on a niche: a full-screen reveal, then "how well do you know it?",
 * which starts the matching placement test. Shown once per niche (remembered in this browser).
 */
export function NicheReveal({ niche }: { niche: Niche }) {
  const router = useRouter()
  const top = niche.stage === 'focus' ? niche.likely[0] : undefined
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!top) return
    try {
      if (localStorage.getItem(KEY(top.code))) return
    } catch {
      return
    }
    setOpen(true)
    setStep(0)
    const t1 = setTimeout(() => setStep(1), 1300)
    const t2 = setTimeout(() => setStep(2), 3000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [top])

  if (!top) return null
  const trackId = trackIdFor(top.code)
  const emoji = trackById(trackId)?.emoji ?? '✨'
  const close = (go?: string) => {
    try {
      localStorage.setItem(KEY(top.code), '1')
    } catch {}
    setOpen(false)
    if (go) router.push(go)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-slate-950/90 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={`Your niche: ${top.name}`}
        >
          {/* rings pulsing out from the centre */}
          {[0, 1, 2].map((r) => (
            <motion.span
              key={r}
              className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal-300/30"
              initial={{ scale: 0.3, opacity: 0.8 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 3.2, repeat: Infinity, delay: r * 1.05, ease: 'easeOut' }}
              aria-hidden
            />
          ))}
          {step >= 1 && <Confetti count={90} />}

          <div className="relative w-full max-w-2xl text-center text-white">
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 160, damping: 12 }}
              className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-teal-300 to-emerald-600 text-6xl shadow-[0_0_80px_rgba(45,212,191,0.6)]"
              aria-hidden
            >
              {emoji}
            </motion.div>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8 text-sm uppercase tracking-[0.3em] text-teal-200">
              The evidence is in
            </motion.p>
            <AnimatePresence>
              {step >= 1 && (
                <motion.div initial={{ opacity: 0, scale: 0.6, filter: 'blur(12px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} transition={{ type: 'spring', stiffness: 120, damping: 14 }}>
                  <p className="mt-3 text-lg text-white/80">Your niche is</p>
                  <h2 className="mt-1 bg-gradient-to-r from-teal-200 via-white to-amber-200 bg-clip-text text-4xl font-semibold leading-tight text-transparent sm:text-6xl">{top.name}</h2>
                  <p className="mt-3 text-sm text-white/70">
                    {Math.round(top.likes)} of {Math.round(top.seen)} papers marked interesting, clearly above your {Math.round(niche.baseRate * 100)}% average
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {step >= 2 && (
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 140, damping: 18 }} className="mt-10">
                  <p className="text-lg font-medium">How well do you know it?</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {CHOICES.map((c, i) => (
                      <motion.button
                        key={c.level}
                        type="button"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i }}
                        whileHover={{ y: -6, scale: 1.03 }}
                        whileTap={{ scale: 0.95, y: 2 }}
                        onClick={() => close(`/quest/${trackId}?placement=${c.level}`)}
                        className="rounded-2xl bg-white px-4 py-5 text-gray-900 shadow-[0_6px_0_0_rgba(20,184,166,0.6)]"
                      >
                        <span className="text-3xl" aria-hidden>{c.emoji}</span>
                        <p className="mt-2 font-semibold">{c.title}</p>
                        <p className="text-xs text-gray-500">{c.line}</p>
                      </motion.button>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-white/60">Five quick questions at that level place you on the path.</p>
                  <button type="button" onClick={() => close()} className="mt-5 text-sm text-white/70 underline-offset-4 hover:text-white hover:underline">
                    Maybe later
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
