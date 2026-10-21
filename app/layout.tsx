import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Providers } from './providers'

// New Spirit: the house font, used everywhere.
const newSpirit = localFont({
  src: [
    { path: './fonts/NewSpirit-Light.otf', weight: '300', style: 'normal' },
    { path: './fonts/NewSpirit-Regular.otf', weight: '400', style: 'normal' },
    { path: './fonts/NewSpirit-Medium.otf', weight: '500', style: 'normal' },
    { path: './fonts/NewSpirit-SemiBold.otf', weight: '600', style: 'normal' },
    { path: './fonts/NewSpirit-Bold.otf', weight: '700', style: 'normal' },
  ],
  variable: '--font-new-spirit',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'TinderP - Academic Paper Platform',
  description: 'Discover, discuss, and collaborate on academic papers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={newSpirit.variable}>
      <body className={newSpirit.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
