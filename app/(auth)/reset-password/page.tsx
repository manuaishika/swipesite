'use client'

import Link from 'next/link'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'

function ResetForm() {
  const token = useSearchParams().get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [state, setState] = useState<'idle' | 'saving' | 'done'>('idle')
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) return setError('The two passwords don’t match')
    setState('saving')
    setError('')
    const res = await fetch('/api/auth/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) }).catch(() => null)
    const data = await res?.json().catch(() => null)
    if (res?.ok) setState('done')
    else {
      setError(data?.error ?? 'Something went wrong. Try again.')
      setState('idle')
    }
  }

  const input = 'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
  return (
    <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-2xl">
      {state === 'done' ? (
        <>
          <h1 className="text-2xl font-semibold text-primary-dark">Password changed</h1>
          <p className="text-gray-600">You can log in with your new password now.</p>
          <Link href="/login" className="inline-flex rounded-xl bg-primary px-5 py-2.5 font-semibold text-white">Log in</Link>
        </>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <h1 className="text-2xl font-semibold text-primary-dark">Choose a new password</h1>
          {!token && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">This page needs the link from your email.</p>}
          {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
          <label className="block text-sm font-medium text-gray-700">
            New password
            <input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Repeat it
            <input type="password" required minLength={6} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} />
          </label>
          <button disabled={!token || state === 'saving'} className="w-full rounded-xl bg-primary py-3 font-semibold text-white disabled:opacity-50">
            {state === 'saving' ? 'Saving…' : 'Set new password'}
          </button>
          <Link href="/forgot-password" className="block text-center text-sm text-primary hover:underline">Need a new link?</Link>
        </form>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-primary/10 px-4">
      <Suspense>
        <ResetForm />
      </Suspense>
    </div>
  )
}
