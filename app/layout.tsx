import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

// DM Sans: clean and light; weights above 600 aren't used anywhere.
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
})

const siteUrl =
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'ResearchSwipe: find your research niche', template: '%s · ResearchSwipe' },
  description: 'Rate real arXiv abstracts to find the research areas that hold your interest, then discuss papers with people reading the same ones.',
  openGraph: { siteName: 'ResearchSwipe', type: 'website' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className={dmSans.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
