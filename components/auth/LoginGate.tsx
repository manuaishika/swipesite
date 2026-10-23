import Link from 'next/link'
import { Layers, Lock } from 'lucide-react'
import { loginHref, registerHref } from '@/lib/login-href'
import { DemoPlayer, type DemoKey } from './DemoPlayer'

/** Shown instead of a hard redirect when a page is personal to a logged-in user. */
export function LoginGate({ title, body, next, demo }: { title: string; body: string; next: string; demo?: DemoKey }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-12 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary">
        <Lock className="h-6 w-6" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold text-gray-900 sm:text-3xl">{title}</h1>
      <p className="mt-2 text-gray-600">{body}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href={loginHref(next)} className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-light">
          Log in
        </Link>
        <Link href={registerHref(next)} className="rounded-xl border-2 border-primary px-6 py-3 text-sm font-semibold text-primary hover:bg-primary-50">
          Sign up free
        </Link>
      </div>
      {demo && <DemoPlayer demo={demo} className="mt-8 text-left" />}
      <Link href="/swipe" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
        <Layers className="h-4 w-4" /> Or keep swiping, no account needed
      </Link>
    </div>
  )
}

/** Inline call-to-action for a participation step (posting, voting, starting a session...). */
export function LoginToParticipate({ action, next, demo }: { action: string; next: string; demo?: DemoKey }) {
  return (
    <div className="space-y-3">
    {demo && <DemoPlayer demo={demo} />}
    <div className="rounded-2xl border border-primary/20 bg-primary-50 p-5 text-center">
      <p className="font-semibold text-gray-900">Log in to {action}</p>
      <p className="mt-1 text-sm text-gray-600">Reading is open to everyone. You need a free account to take part.</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Link href={loginHref(next)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-light">
          Log in
        </Link>
        <Link href={registerHref(next)} className="rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-white">
          Sign up free
        </Link>
      </div>
    </div>
    </div>
  )
}
