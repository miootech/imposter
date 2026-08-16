'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/game/engines/TimerEngine'
import { TIMER_WARNING_THRESHOLD_SECONDS } from '@/lib/game/models'
import { haptic } from '@/lib/game/services/haptics'
import { playSound } from '@/lib/game/services/sound'

interface TimerRingProps {
  totalSeconds: number
  remainingSeconds: number
  /** Round number, 1-indexed */
  round: number
  startPlayerName?: string
  className?: string
  onExpire?: () => void
}

export function TimerRing({
  totalSeconds,
  remainingSeconds,
  round,
  startPlayerName,
  className,
  onExpire,
}: TimerRingProps) {
  const isWarning = remainingSeconds <= TIMER_WARNING_THRESHOLD_SECONDS && remainingSeconds > 0
  const isExpired = remainingSeconds <= 0
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0
  const radius = 130
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  // Track previous seconds to fire tick + warning haptics
  const [prevSec, setPrevSec] = useState(remainingSeconds)
  useEffect(() => {
    if (remainingSeconds === prevSec) return
    if (remainingSeconds <= TIMER_WARNING_THRESHOLD_SECONDS && remainingSeconds > 0) {
      haptic('tick')
      playSound('tick')
    }
    if (remainingSeconds === 0) {
      haptic('error')
      playSound('timerEnd')
      onExpire?.()
    }
    setPrevSec(remainingSeconds)
  }, [remainingSeconds, prevSec, onExpire])

  return (
    <div className={cn('relative flex flex-col items-center justify-center', className)}>
      <div className="relative h-[300px] w-[300px]">
        <svg
          className="absolute inset-0 -rotate-90"
          viewBox="0 0 300 300"
          aria-label={`Timer: ${formatTime(Math.max(0, remainingSeconds))}`}
        >
          {/* Background ring */}
          <circle
            cx="150"
            cy="150"
            r={radius}
            fill="none"
            stroke="var(--muted)"
            strokeWidth="14"
          />
          {/* Progress ring */}
          <motion.circle
            cx="150"
            cy="150"
            r={radius}
            fill="none"
            stroke={
              isExpired ? 'var(--destructive)'
              : isWarning ? 'var(--warning)'
              : 'var(--primary)'
            }
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: 'linear' }}
          />
        </svg>

        {/* Center content */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          animate={
            isWarning
              ? { scale: [1, 1.04, 1] }
              : { scale: 1 }
          }
          transition={
            isWarning
              ? { duration: 0.8, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.2 }
          }
        >
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            Runde {round}
          </div>
          <motion.div
            className={cn(
              'font-mono font-bold tabular-nums',
              isExpired ? 'text-destructive text-7xl'
              : isWarning ? 'text-warning text-7xl'
              : 'text-foreground text-7xl',
            )}
            animate={
              isWarning
                ? { opacity: [1, 0.7, 1] }
                : { opacity: 1 }
            }
            transition={
              isWarning
                ? { duration: 0.5, repeat: Infinity }
                : { duration: 0.2 }
            }
          >
            {formatTime(Math.max(0, remainingSeconds))}
          </motion.div>
          {startPlayerName && (
            <div className="mt-2 text-sm text-muted-foreground">
              Start: <span className="font-semibold text-foreground">{startPlayerName}</span>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
