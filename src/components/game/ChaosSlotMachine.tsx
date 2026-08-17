'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback, useRef } from 'react'
import { CHAOS_MODIFIERS, type ChaosModifierId, type ChaosState } from '@/lib/game/engines/ChaosEngine'
import { GameButton } from '@/components/game/GameButton'
import { haptic } from '@/lib/game/services/haptics'
import { playSound } from '@/lib/game/services/sound'

interface ChaosSlotMachineProps {
  /** Active chaos state (already picked by the engine) */
  chaosState: ChaosState
  /** Called when the user dismisses the animation */
  onContinue: () => void
}

const ALL_MODS = Object.values(CHAOS_MODIFIERS)

/**
 * ChaosSlotMachine
 * ---------------
 * Dramatic "slot machine" reveal animation shown after all players have revealed
 * their roles and the user taps "Spiel starten". Cycles rapidly through all 5
 * chaos modifiers, then decelerates and lands on the actual active one.
 *
 * Animation timeline:
 *   - 0-1500ms: rapid cycling (50ms per mod)
 *   - 1500-2500ms: decelerating cycle (100ms, 150ms, 200ms...)
 *   - 2500-3000ms: final landing with bounce + glow
 *   - 3000ms+: continue button appears
 */
export function ChaosSlotMachine({ chaosState, onContinue }: ChaosSlotMachineProps) {
  const [displayedIdx, setDisplayedIdx] = useState(0)
  const [phase, setPhase] = useState<'spinning' | 'decelerating' | 'landed'>('spinning')
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startTimeRef = useRef<number>(0)

  const finalIdx = ALL_MODS.findIndex(m => m.id === chaosState.modifier)
  const finalMod = finalIdx >= 0 ? ALL_MODS[finalIdx] : ALL_MODS[0]

  const tick = useCallback(() => {
    if (startTimeRef.current === 0) startTimeRef.current = Date.now()
    const elapsed = Date.now() - startTimeRef.current

    // Phase 1: rapid spin (0-1500ms) — cycle every 80ms
    if (elapsed < 1500) {
      setDisplayedIdx(i => (i + 1) % ALL_MODS.length)
      haptic('tick')
      rafRef.current = setTimeout(tick, 80)
      return
    }

    // Phase 2: decelerating (1500-2800ms) — slow down progressively
    if (elapsed < 2800) {
      setDisplayedIdx(i => (i + 1) % ALL_MODS.length)
      haptic('tick')
      // Compute delay based on progress through deceleration phase
      const progress = (elapsed - 1500) / 1300  // 0 → 1
      const delay = 80 + progress * 200  // 80ms → 280ms
      rafRef.current = setTimeout(tick, delay)
      return
    }

    // Phase 3: land on final
    if (phase !== 'landed') {
      setDisplayedIdx(finalIdx)
      setPhase('landed')
      haptic('success')
      playSound('chaos')
      // Final haptic pattern after a beat
      setTimeout(() => haptic('heavy'), 200)
    }
  }, [finalIdx, phase])

  useEffect(() => {
    rafRef.current = setTimeout(tick, 100)
    return () => {
      if (rafRef.current) clearTimeout(rafRef.current)
    }
  }, [tick])

  const currentMod = phase === 'landed' ? finalMod : ALL_MODS[displayedIdx]

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background px-6">
      {/* Decorative background blobs that pulse */}
      <motion.div
        className="absolute inset-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="absolute -left-32 top-1/4 h-64 w-64 rounded-full blur-3xl"
          style={{ backgroundColor: currentMod.colorVar }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2],
            x: [0, 50, 0],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -right-32 bottom-1/4 h-64 w-64 rounded-full blur-3xl"
          style={{ backgroundColor: currentMod.colorVar }}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -50, 0],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <motion.p
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-sm font-bold uppercase tracking-widest text-muted-foreground"
          >
            {phase === 'landed' ? 'Chaos-Modifikator' : 'Würfelt...'}
          </motion.p>
        </motion.div>

        {/* Slot machine display */}
        <div className="relative flex h-64 w-64 items-center justify-center">
          {/* Outer glow ring — appears when landed */}
          <AnimatePresence>
            {phase === 'landed' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 rounded-full"
                style={{
                  boxShadow: `0 0 60px 20px ${currentMod.colorVar}`,
                }}
              />
            )}
          </AnimatePresence>

          {/* Spinning container */}
          <motion.div
            className="relative flex h-48 w-48 items-center justify-center rounded-full bg-card shadow-2xl ring-1 ring-border"
            animate={
              phase === 'spinning'
                ? { scale: [1, 1.02, 1] }
                : phase === 'decelerating'
                ? { scale: [1, 1.05, 1] }
                : { scale: 1 }
            }
            transition={{
              duration: phase === 'spinning' ? 0.1 : 0.2,
              repeat: phase === 'landed' ? 0 : Infinity,
            }}
            style={
              phase === 'landed'
                ? {
                    backgroundColor: `color-mix(in srgb, ${currentMod.colorVar} 15%, var(--card))`,
                    borderColor: currentMod.colorVar,
                  }
                : undefined
            }
          >
            {/* Mod icon with crossfade on change */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentMod.id + phase}
                initial={
                  phase === 'landed'
                    ? { scale: 0, rotate: -180, opacity: 0 }
                    : { scale: 0.6, opacity: 0.5 }
                }
                animate={
                  phase === 'landed'
                    ? { scale: 1, rotate: 0, opacity: 1 }
                    : { scale: 1, opacity: 1 }
                }
                exit={
                  phase === 'landed'
                    ? { opacity: 0 }
                    : { scale: 1.3, opacity: 0 }
                }
                transition={
                  phase === 'landed'
                    ? { type: 'spring', stiffness: 200, damping: 12 }
                    : { duration: 0.08 }
                }
                className="text-7xl"
              >
                {currentMod.icon}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Mod name */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMod.id + phase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: phase === 'landed' ? 0.4 : 0.08 }}
            className="mt-8 text-center"
          >
            <h2
              className="text-2xl font-bold"
              style={{ color: phase === 'landed' ? currentMod.colorVar : 'var(--foreground)' }}
            >
              {currentMod.displayName}
            </h2>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              {currentMod.description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Continue button — only after landing */}
        <AnimatePresence>
          {phase === 'landed' && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 20 }}
              className="mt-10"
            >
              <GameButton
                size="lg"
                hapticPattern="heavy"
                soundType="select"
                onClick={onContinue}
              >
                Los geht's
              </GameButton>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spinning indicator dots */}
        {phase !== 'landed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 flex gap-1.5"
          >
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                className="h-2 w-2 rounded-full bg-muted-foreground"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
