import type { Metadata } from 'next'
import { PathMap } from '@/components/paths/PathMap'

export const metadata: Metadata = { title: 'Research paths', description: 'Undergrad, master’s, pre-doc, PhD, postdoc and the routes in between, at a glance.' }

export default function PathsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">Research paths</h1>
      <p className="mt-1 max-w-2xl text-gray-600">The routes from undergrad to a research career, and the steps in between. Click any step.</p>
      <PathMap />
    </div>
  )
}
