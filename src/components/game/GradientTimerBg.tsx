'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { getPresetColors } from '@/lib/game/content/gradientPresets'

interface GradientTimerBgProps {
  /** Gradient preset ID ('none' = off, 'sunset', 'ocean', 'random', etc.) */
  presetId: string
  /** Whether the timer is in warning phase (last 10s) */
  warning?: boolean
  /** Round number — used to seed gradient for 'random' preset */
  round: number
}

const WARNING_COLORS: [string, string] = ['#E63946', '#F77F00']

export function GradientTimerBg({ presetId, warning = false, round }: GradientTimerBgProps) {
  const colors = useMemo(() => {
    if (warning) return WARNING_COLORS
    return getPresetColors(presetId, round)
  }, [presetId, round, warning])

  // Don't render if 'none' and not warning
  if (colors[0] === 'transparent' && !warning) return null

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: warning ? 0.5 : 0.25 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        className="absolute h-[120%] w-[120%] rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle at 30% 30%, ${colors[0]}, transparent 60%)` }}
        animate={{
          x: ['-20%', '20%', '-20%'],
          y: ['-10%', '10%', '-10%'],
          rotate: [0, 180, 360],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: warning ? 4 : 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute h-[120%] w-[120%] rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle at 70% 70%, ${colors[1]}, transparent 60%)` }}
        animate={{
          x: ['20%', '-20%', '20%'],
          y: ['10%', '-10%', '10%'],
          rotate: [360, 180, 0],
          scale: [1.1, 1, 1.1],
        }}
        transition={{ duration: warning ? 5 : 14, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  )
}
