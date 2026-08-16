'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { ChaosState } from '@/lib/game/engines/ChaosEngine'
import { getActiveChaosInfo } from '@/lib/game/engines/ChaosEngine'
import { haptic } from '@/lib/game/services/haptics'
import { useEffect } from 'react'

interface ChaosBannerProps {
  chaosState: ChaosState
  /** Compact mode for inline display on discussion/voting screens */
  variant?: 'compact' | 'warning'
}

/**
 * ChaosBanner
 * -----------
 * Shows the currently active chaos modifier.
 * - `compact`: small pill-style indicator (discussion + voting screens)
 * - `warning`: large red banner with warning text (Spiegel-Voting on voting screen)
 */
export function ChaosBanner({ chaosState, variant = 'compact' }: ChaosBannerProps) {
  const info = getActiveChaosInfo(chaosState)
  if (!info) return null

  // Trigger haptic when chaos modifier becomes visible
  useEffect(() => {
    haptic('warning')
  }, [chaosState.modifier])

  if (variant === 'warning' && chaosState.modifier === 'spiegel_voting') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="rounded-2xl bg-impostor/15 p-4 ring-2 ring-impostor/40"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--impostor) 15%, transparent)',
          borderColor: 'var(--impostor)',
        }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 180, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-3xl"
          >
            {info.icon}
          </motion.div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--impostor)' }}>
              ACHTUNG — Spiegel-Voting!
            </p>
            <p className="text-sm font-semibold text-foreground">
              Wer die wenigsten Stimmen hat, fliegt raus.
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  // Compact pill
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      key={chaosState.modifier}
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ring-1"
      style={{
        backgroundColor: `color-mix(in srgb, ${info.colorVar} 15%, transparent)`,
        color: info.colorVar,
        borderColor: `color-mix(in srgb, ${info.colorVar} 30%, transparent)`,
      }}
    >
      <motion.span
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="text-base leading-none"
      >
        {info.icon}
      </motion.span>
      <span>{info.displayName}</span>
    </motion.div>
  )
}

/**
 * Doppelagent badge — shown only on the agent's individual vote screen.
 */
export function DoppelAgentBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
      className="inline-flex items-center gap-1.5 rounded-full bg-detective/15 px-3 py-1.5 text-xs font-bold ring-1 ring-detective/30"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--detective) 15%, transparent)',
        color: 'var(--detective)',
        borderColor: 'color-mix(in srgb, var(--detective) 30%, transparent)',
      }}
    >
      <motion.span
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      >
        🕵️
      </motion.span>
      Deine Stimme zählt doppelt!
    </motion.div>
  )
}

/**
 * Martyr badge — shown only on the martyr's reveal screen.
 */
export function MartyrBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
      className="rounded-2xl bg-impostor/10 p-4 ring-2 ring-impostor/30"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--impostor) 10%, transparent)',
        borderColor: 'var(--impostor)',
      }}
    >
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-3xl"
        >
          🎯
        </motion.div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--impostor)' }}>
            Märtyrer
          </p>
          <p className="text-sm font-semibold text-foreground">
            Wenn du eliminiert wirst, bekommen die Verräter +3 Punkte.
          </p>
        </div>
      </div>
    </motion.div>
  )
}
