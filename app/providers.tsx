'use client'

import { SessionProvider } from 'next-auth/react'
import { Telemetry } from '@/components/Telemetry'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Telemetry />
      {children}
    </SessionProvider>
  )
}
