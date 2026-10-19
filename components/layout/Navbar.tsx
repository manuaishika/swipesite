'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
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
} from 'lucide-react'

export function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [colorMode, setColorMode] = useState<'default' | 'alt'>('default')

  const loggedInNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/swipe', label: 'Swipe', icon: BookOpen },
    { href: '/collection', label: 'Collection', icon: BookOpen },
    { href: '/compare', label: 'Compare', icon: GitCompare },
    { href: '/practice', label: 'Practice', icon: PenLine },
    { href: '/critique', label: 'Critique', icon: Lightbulb },
    { href: '/discussions', label: 'Discussions', icon: MessageSquare },
    { href: '/collaborations', label: 'Collaborate', icon: Users },
    { href: '/conferences', label: 'Conferences', icon: Calendar },
    { href: '/opportunities', label: 'Opportunities', icon: Mail },
    { href: '/recommendations', label: 'Recommendations', icon: Sparkles },
  ]

  const publicNavItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/conferences', label: 'Conferences', icon: Calendar },
    { href: '/opportunities', label: 'Opportunities', icon: Mail },
  ]

  const navItems = session ? loggedInNavItems : publicNavItems

  const toggleColorMode = () => {
    setColorMode(prev => prev === 'default' ? 'alt' : 'default')
  }

  const bgColor = colorMode === 'default' ? 'bg-primary' : 'bg-accent'
  const textColor = 'text-white'
  const hoverBg = colorMode === 'default' ? 'hover:bg-primary-light' : 'hover:bg-accent-light'

  return (
    <nav className={`${bgColor} shadow-lg border-b border-white/10 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link
                href={session ? '/dashboard' : '/'}
                className={`text-2xl font-bold ${textColor} flex items-center gap-2 hover:scale-105 transition-transform`}
              >
                <BookOpen className="w-7 h-7" />
                <span>ResearchSwipe</span>
              </Link>
            </div>
            <div className="hidden lg:ml-8 lg:flex lg:space-x-1">
              {navItems.slice(0, 7).map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-2 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : `${textColor}/90 ${hoverBg} hover:text-white`
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-1.5" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleColorMode}
              className={`p-2 rounded-lg ${hoverBg} ${textColor}/90 hover:text-white transition-all`}
              title="Toggle color theme"
            >
              <Palette className="w-5 h-5" />
            </button>
            {session ? (
              <>
                <Link
                  href="/profile"
                  className={`flex items-center ${textColor}/90 hover:text-white ${hoverBg} px-3 py-2 rounded-lg transition-all`}
                >
                  <User className="w-5 h-5 mr-2" />
                  <span className="hidden sm:inline font-medium">
                    {session.user.name || session.user.username}
                  </span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className={`flex items-center ${textColor}/90 hover:text-white ${hoverBg} px-3 py-2 rounded-lg transition-all`}
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className={`text-sm font-medium ${textColor}/90 hover:text-white px-4 py-2 rounded-lg ${hoverBg} transition-all`}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg bg-white text-primary text-sm font-bold hover:bg-gray-100 transition-all shadow-lg"
                >
                  Sign up Free
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
