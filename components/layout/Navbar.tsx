'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import {
  Home,
  MessageSquare,
  Users,
  BookOpen,
  User,
  LogOut,
  Calendar,
  Mail,
  PenLine,
  Layers,
  Compass,
  Menu,
  X,
  Bookmark,
  Map as MapIcon,
  Route,
} from 'lucide-react'

// The core loops: find your niche (swipe), discuss and practise reviewing.
const primaryNavItems = [
  { href: '/swipe', label: 'Swipe', icon: Layers },
  { href: '/niche', label: 'My niche', icon: Compass },
  { href: '/discussions', label: 'Discussions', icon: MessageSquare },
  { href: '/practice', label: 'Practice', icon: PenLine },
]

// Supporting pages. Compare lives inside Collection, recommendations inside My niche.
const secondaryNavItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/landscape', label: 'Landscape', icon: MapIcon },
  { href: '/paths', label: 'Paths', icon: Route },
  { href: '/collection', label: 'Collection', icon: Bookmark },
  { href: '/conferences', label: 'Conferences', icon: Calendar },
  { href: '/opportunities', label: 'Opportunities', icon: Mail },
  { href: '/collaborations', label: 'Collaborate', icon: Users },
]

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false
  if (href === '/') return pathname === '/'
  if (href === '/discussions') return pathname.startsWith('/discussions') || pathname.startsWith('/paper/')
  return pathname === href || pathname.startsWith(href + '/')
}

const MotionLink = motion(Link)

export function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => setMobileOpen(false), [pathname])

  // Logged-out visitors land on the marketing page when they click "Home".
  const secondary = session ? secondaryNavItems : secondaryNavItems.map((i) => (i.href === '/dashboard' ? { ...i, href: '/' } : i))

  const linkCls = (active: boolean, strong = false) =>
    `inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
      strong ? 'font-medium' : ''
    } ${active ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'}`

  return (
    <nav className="relative z-40 bg-primary shadow-lg" aria-label="Main">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary"
      >
        Skip to content
      </a>
      {/* top row: brand and account */}
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <MotionLink
          href={session ? '/dashboard' : '/'}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          className="flex items-center gap-2 text-xl font-semibold text-white"
        >
          <BookOpen className="h-6 w-6" />
          ResearchSwipe
        </MotionLink>

        <div className="flex items-center gap-2">
          {session ? (
            <>
              <NotificationBell />
              <Link
                href="/profile"
                className="hidden items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-white/90 transition-colors hover:bg-white/10 hover:text-white sm:flex"
              >
                <User className="h-4 w-4" />
                {session.user.name || session.user.username}
              </Link>
              <button
                onClick={() => signOut()}
                className="hidden rounded-lg p-2 text-white/90 transition-colors hover:bg-white/10 hover:text-white sm:flex"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-1.5 text-sm text-white/90 transition-colors hover:bg-white/10 hover:text-white">
                Log in
              </Link>
              <MotionLink
                href="/register"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                className="hidden rounded-lg bg-white px-4 py-1.5 text-sm font-medium text-primary sm:inline-flex"
              >
                Sign up free
              </MotionLink>
            </>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-label="Open menu"
            className="rounded-lg p-2 text-white transition-colors hover:bg-white/10 md:hidden"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* second row (desktop): every page, always visible */}
      <div className="hidden border-t border-white/10 bg-black/10 md:block">
        <div className="mx-auto flex max-w-7xl items-center gap-0.5 overflow-x-auto px-4 py-1.5 sm:px-6 lg:px-8">
          {primaryNavItems.map((item) => {
            const Icon = item.icon
            return (
              <MotionLink
                key={item.href}
                href={item.href}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                className={linkCls(isActive(pathname, item.href), true)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </MotionLink>
            )
          })}
          <span className="mx-2 h-5 w-px shrink-0 bg-white/20" aria-hidden />
          {secondary.map((item) => (
            <MotionLink
              key={item.href}
              href={item.href}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className={linkCls(isActive(pathname, item.href))}
            >
              {item.label}
            </MotionLink>
          ))}
        </div>
      </div>

      {/* mobile menu */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-white shadow-xl md:hidden">
          <div className="grid grid-cols-4 gap-2 p-3">
            {primaryNavItems.map((item) => {
              const Icon = item.icon
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-sm font-medium ${
                    active ? 'bg-primary text-white' : 'bg-primary-50 text-primary'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </div>
          <div className="border-t border-gray-100 py-2">
            {secondary.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700">
                  <Icon className="h-4 w-4 text-gray-400" />
                  {item.label}
                </Link>
              )
            })}
            {session ? (
              <>
                <Link href="/profile" className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700">
                  <User className="h-4 w-4 text-gray-400" />
                  Profile
                </Link>
                <button onClick={() => signOut()} className="flex w-full items-center gap-3 px-5 py-2.5 text-sm text-gray-700">
                  <LogOut className="h-4 w-4 text-gray-400" />
                  Sign out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 px-4 pt-2">
                <Link href="/login" className="rounded-lg border border-primary py-2.5 text-center text-sm font-medium text-primary">
                  Log in
                </Link>
                <Link href="/register" className="rounded-lg bg-primary py-2.5 text-center text-sm font-medium text-white">
                  Sign up free
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
