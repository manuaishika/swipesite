import { Navbar } from '@/components/layout/Navbar'
import { GuestSwipeImporter } from '@/components/swipe/GuestSwipeImporter'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
      <GuestSwipeImporter />
    </div>
  )
}
