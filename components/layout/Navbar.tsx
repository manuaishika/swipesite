'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  Home,
  MessageSquare,
  Users,
  BookOpen,
  User,
  LogOut,
  Sparkles,
  Calendar,
  Mail,
  GitCompare,
  Lightbulb,
  Palette,
  PenLine,
  Layers,
  Compass,
  ChevronDown,
  Menu,
  X,
  Bookmark,
} from 'lucide-react'

// The two things ResearchSwipe is for: finding your niche (swipe) and peer review (discuss).
const primaryNavItems = [
  { href: '/swipe', label: 'Swipe', icon: Layers },
  { href: '/niche', label: 'My niche', icon: Compass },
  { href: '/discussions', label: 'Peer review', icon: MessageSquare },
]

const secondaryNavItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/collection', label: 'Collection', icon: Bookmark },
  { href: '/practice', label: 'Practice critiques', icon: PenLine },
  { href: '/recommendations', label: 'Recommendations', icon: Sparkles },
  { href: '/compare', label: 'Compare', icon: GitCompare },
  { href: '/collaborations', label: 'Collaborate', icon: Users },
  { href: '/conferences', label: 'Conferences', icon: Calendar },
  { href: '/opportunities', label: 'Opportunities', icon: Mail },
  { href: '/critique', label: 'Idea critique', icon: Lightbulb },
]

const publicNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/conferences', label: 'Conferences', icon: Calendar },
  { href: '/opportunities', label: 'Opportunities', icon: Mail },
]

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false
  if (href === '/') return pathname === '/'
  if (href === '/discussions') return pathname.startsWith('/discussions') || pathname.startsWith('/paper/')
  return pathname === href || pathname.startsWith(href + '/')
}

export function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [colorMode, setColorMode] = useState<'default' | 'alt'>('default')
  const [moreOpen, setMoreOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  // Close menus on navigation and on outside click.
  useEffect(() => {
    setMoreOpen(false)
    setMobileOpen(false)
  }, [pathname])
  useEffect(() => {
    if (!moreOpen) return
    const onClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [moreOpen])

  const toggleColorMode = () => {
    setColorMode(prev => prev === 'default' ? 'alt' : 'default')
  }

  const bgColor = colorMode === 'default' ? 'bg-primary' : 'bg-accent'
  const hoverBg = colorMode === 'default' ? 'hover:bg-primary-light' : 'hover:bg-accent-light'
  const moreActive = secondaryNavItems.some((i) => isActive(pathname, i.href))

  const linkCls = (active: boolean) =>
    `inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
      active ? 'bg-white/20 text-white' : `text-white/85 ${hoverBg} hover:text-white`
    }`

  return (
    <nav className={`${bgColor} shadow-lg border-b border-white/10 transition-colors duration-300 relative z-40`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-6">
            <Link
              href={session ? '/dashboard' : '/'}
              className="text-2xl font-bold text-white flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <BookOpen className="w-7 h-7" />
              <span>ResearchSwipe</span>
            </Link>

            {session ? (
              <div className="hidden md:flex md:items-center md:gap-1">
                {primaryNavItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link key={item.href} href={item.href} className={linkCls(isActive(pathname, item.href))}>
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  )
                })}
                <div className="relative" ref={moreRef}>
                  <button
                    type="button"
                    onClick={() => setMoreOpen((o) => !o)}
                    aria-expanded={moreOpen}
                    aria-haspopup="menu"
                    className={linkCls(moreActive)}
                  >
                    More <ChevronDown className={`w-4 h-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {moreOpen && (
                    <div
                      role="menu"
                      className="absolute left-0 mt-2 w-56 rounded-xl bg-white py-2 shadow-xl ring-1 ring-black/5"
                    >
                      {secondaryNavItems.map((item) => {
                        const Icon = item.icon
                        const active = isActive(pathname, item.href)
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            role="menuitem"
                            className={`flex items-center gap-3 px-4 py-2 text-sm ${
                              active ? 'bg-primary-50 text-primary font-semibold' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <Icon className="w-4 h-4 text-gray-400" />
                            {item.label}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden md:flex md:items-center md:gap-1">
                {publicNavItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link key={item.href} href={item.href} className={linkCls(isActive(pathname, item.href))}>
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleColorMode}
              className={`hidden sm:inline-flex p-2 rounded-lg ${hoverBg} text-white/90 hover:text-white transition-all`}
              title="Toggle color theme"
            >
              <Palette className="w-5 h-5" />
            </button>
            {session ? (
              <>
                <Link
                  href="/profile"
                  className={`hidden sm:flex items-center text-white/90 hover:text-white ${hoverBg} px-3 py-2 rounded-lg transition-all`}
                >
                  <User className="w-5 h-5 mr-2" />
                  <span className="font-medium">{session.user.name || session.user.username}</span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className={`hidden sm:flex items-center text-white/90 hover:text-white ${hoverBg} p-2 rounded-lg transition-all`}
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className={`text-sm font-medium text-white/90 hover:text-white px-3 py-2 rounded-lg ${hoverBg} transition-all`}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:inline-flex px-4 py-2 rounded-lg bg-white text-primary text-sm font-bold hover:bg-gray-100 transition-all shadow-lg"
                >
                  Sign up Free
                </Link>
              </div>
            )}
            {session && (
              <button
                type="button"
                onClick={() => setMobileOpen((o) => !o)}
                aria-expanded={mobileOpen}
                aria-label="Open menu"
                className={`md:hidden p-2 rounded-lg text-white ${hoverBg}`}
              >
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* mobile menu */}
      {session && mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-white shadow-xl">
          <div className="grid grid-cols-3 gap-2 p-3">
            {primaryNavItems.map((item) => {
              const Icon = item.icon
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-sm font-semibold ${
                    active ? 'bg-primary text-white' : 'bg-primary-50 text-primary'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              )
            })}
          </div>
          <div className="border-t border-gray-100 py-2">
            {secondaryNavItems.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700">
                  <Icon className="w-4 h-4 text-gray-400" />
                  {item.label}
                </Link>
              )
            })}
            <Link href="/profile" className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700">
              <User className="w-4 h-4 text-gray-400" />
              Profile
            </Link>
            <button onClick={() => signOut()} className="flex w-full items-center gap-3 px-5 py-2.5 text-sm text-gray-700">
              <LogOut className="w-4 h-4 text-gray-400" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
