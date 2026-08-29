'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useMotionValue, useTransform, animate as animateFn } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AnimatedNumberProps {
  value: number
  className?: string
  format?: (n: number) => string
}

/**
 * AnimatedNumber — smoothly counts up/down to the target value.
 * Used for score updates (§82) and stats displays.
 */
export function AnimatedNumber({
  value,
  className,
  format = (n) => n.toString(),
}: AnimatedNumberProps) {
  return (
    <motion.span
      className={cn('tabular-nums', className)}
      key={value}
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {format(value)}
    </motion.span>
  )
}

/**
 * CountUp — animates from `from` to `to` over `duration` seconds.
 * Used on the results screen to visualize point gains.
 */
export function CountUp({
  from,
  to,
  className,
  duration = 1.2,
  format = (n) => Math.round(n).toString(),
}: {
  from: number
  to: number
  className?: string
  duration?: number
  format?: (n: number) => string
}) {
  const mv = useMotionValue(from)
  const rounded = useTransform(mv, (v) => format(v))
  const [display, setDisplay] = useState(format(from))

  useEffect(() => {
    const controls = animateFn(mv, to, { duration, ease: 'easeOut' })
    const unsub = rounded.on('change', (v: string) => setDisplay(v))
    return () => {
      controls.stop()
      unsub()
    }
  }, [mv, to, duration, rounded])

  return <span className={cn('tabular-nums', className)}>{display}</span>
}
