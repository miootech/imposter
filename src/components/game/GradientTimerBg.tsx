'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface GradientTimerBgProps {
  /** Whether the timer is in the warning phase (last 10s) — intensifies gradient */
  warning?: boolean
  /** Round number — used to seed a stable gradient per round */
  round: number
}

/**
 * GradientTimerBg
 * ---------------
 * Animated, randomly-generated gradient background shown behind the timer
 * during the discussion phase (when the user enables it in Settings).
 *
 * - Picks a random color pair per round (deterministic via `round` seed)
 * - Slowly rotates / shifts colors using Framer Motion
 * - In warning phase (<10s), shifts to red/orange palette + faster animation
 */
const COLOR_PAIRS = [
  ['#E07A5F', '#457B9D'],  // coral + blue
  ['#81B29A', '#F2CC8F'],  // green + yellow
  ['#9B5DE5', '#F15BB5'],  // purple + pink
  ['#00BBF9', '#2A9D8F'],  // cyan + green
  ['#F4A261', '#E76F51'],  // amber + red
  ['#A8DADC', '#B8C0EC'],  // soft teal + lavender
  ['#FFB4A2', '#E5989B'],  // peach + pink
  ['#06AED5', '#086788'],  // bright blue + dark blue
]

const WARNING_COLORS = ['#E63946', '#F77F00']  // red + orange

export function GradientTimerBg({ warning = false, round }: GradientTimerBgProps) {
  // Stable color pair per round (so it doesn't reshuffle every render)
  const colors = useMemo(() => {
    if (warning) return WARNING_COLORS
    return COLOR_PAIRS[round % COLOR_PAIRS.length]
  }, [round, warning])

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: warning ? 0.5 : 0.25 }}
      transition={{ duration: 0.8 }}
    >
      {/* Animated blob 1 */}
      <motion.div
        className="absolute h-[120%] w-[120%] rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle at 30% 30%, ${colors[0]}, transparent 60%)` }}
        animate={{
          x: ['-20%', '20%', '-20%'],
          y: ['-10%', '10%', '-10%'],
          rotate: [0, 180, 360],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: warning ? 4 : 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {/* Animated blob 2 */}
      <motion.div
        className="absolute h-[120%] w-[120%] rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle at 70% 70%, ${colors[1]}, transparent 60%)` }}
        animate={{
          x: ['20%', '-20%', '20%'],
          y: ['10%', '-10%', '10%'],
          rotate: [360, 180, 0],
          scale: [1.1, 1, 1.1],
        }}
        transition={{
          duration: warning ? 5 : 14,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  )
}
