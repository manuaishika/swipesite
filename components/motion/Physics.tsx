'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'

const MotionLink = motion(Link)
const SPRING = { type: 'spring', stiffness: 320, damping: 18, mass: 0.8 } as const

/**
 * A card with a bit of physics: it lifts toward you, tilts to follow the cursor (or your finger while
 * you press), and squishes when pressed, all on springs so it settles with a little overshoot.
 * Works for touch: pressing tilts it toward the touch point and scales it down, releasing springs back.
 */
export function PhysicsCard({
  children,
  className = '',
  href,
  tilt = 9,
  lift = 6,
  external = false,
}: {
  children: React.ReactNode
  className?: string
  href?: string
  tilt?: number
  lift?: number
  external?: boolean
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const rotateY = useSpring(useTransform(px, [0, 1], [-tilt, tilt]), { stiffness: 220, damping: 16 })
  const rotateX = useSpring(useTransform(py, [0, 1], [tilt, -tilt]), { stiffness: 220, damping: 16 })
  const track = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r || !r.width) return
    px.set((e.clientX - r.left) / r.width)
    py.set((e.clientY - r.top) / r.height)
  }
  const rest = () => {
    px.set(0.5)
    py.set(0.5)
  }

  const inner = href ? (
    external ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block h-full">
        {children}
      </a>
    ) : (
      <Link href={href} className="block h-full">
        {children}
      </Link>
    )
  ) : (
    children
  )

  if (reduce) return <div className={className}>{inner}</div>

  return (
    <motion.div
      ref={ref}
      data-physics="card"
      onPointerMove={track}
      onPointerDown={track}
      onPointerLeave={rest}
      onPointerUp={rest}
      onPointerCancel={rest}
      style={{ rotateX, rotateY, transformPerspective: 900, transformStyle: 'preserve-3d' }}
      whileHover={{ y: -lift, scale: 1.035 }}
      whileTap={{ scale: 0.93, y: 0 }}
      transition={SPRING}
      className={`relative ${className}`}
    >
      {inner}
    </motion.div>
  )
}

/** A group whose children fly in one after another as it scrolls into view. */
export function Stagger({
  children,
  className = '',
  gap = 0.09,
  as = 'div',
}: {
  children: React.ReactNode
  className?: string
  gap?: number
  as?: 'div' | 'ul' | 'ol'
}) {
  const reduce = useReducedMotion()
  const Tag = motion[as] as typeof motion.div
  if (reduce) return <Tag className={className}>{children}</Tag>
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-50px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </Tag>
  )
}

export function StaggerItem({ children, className = '', as = 'div' }: { children: React.ReactNode; className?: string; as?: 'div' | 'li' }) {
  const reduce = useReducedMotion()
  const Tag = motion[as] as typeof motion.div
  if (reduce) return <Tag className={className}>{children}</Tag>
  return (
    <Tag
      className={className}
      variants={{
        hidden: { opacity: 0, y: 36, scale: 0.9, rotate: -1.5 },
        show: { opacity: 1, y: 0, scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 240, damping: 16, mass: 0.9 } },
      }}
    >
      {children}
    </Tag>
  )
}

/** A link/button that springs up on hover and squishes when pressed. */
export function PhysicsLink({
  href,
  children,
  className = '',
}: {
  href: string
  children: React.ReactNode
  className?: string
}) {
  const reduce = useReducedMotion()
  if (reduce) return <Link href={href} className={className}>{children}</Link>
  return (
    <MotionLink href={href} whileHover={{ scale: 1.06, y: -3 }} whileTap={{ scale: 0.92 }} transition={SPRING} className={className}>
      {children}
    </MotionLink>
  )
}
