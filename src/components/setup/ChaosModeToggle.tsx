'use client'

import { motion } from 'framer-motion'
import { Sparkles, Zap } from 'lucide-react'
import { CHAOS_MODIFIERS } from '@/lib/game/engines/ChaosEngine'
import { cn } from '@/lib/utils'

interface ChaosModeToggleProps {
  enabled: boolean
  onToggle: () => void
}

/**
 * ChaosModeToggle
 * ---------------
 * Premium-feel toggle for enabling/disabling Chaos Mode in the setup screen.
 * When ON, shows a hint that one of 5 random modifiers will be active each round.
 * When OFF, the game plays normally.
 */
export function ChaosModeToggle({ enabled, onToggle }: ChaosModeToggleProps) {
  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative w-full overflow-hidden rounded-2xl p-4 text-left ring-1 transition-all',
        enabled
          ? 'bg-gradient-to-br from-impostor/15 via-accomplice/10 to-jester/15 ring-impostor/40 shadow-lg shadow-impostor/10'
          : 'bg-card ring-border hover:bg-muted/30',
      )}
      style={enabled ? {
        background: 'linear-gradient(135deg, color-mix(in srgb, var(--impostor) 15%, transparent), color-mix(in srgb, var(--accomplice) 10%, transparent), color-mix(in srgb, var(--jester) 15%, transparent))',
      } : undefined}
    >
      <div className="flex items-center gap-3">
        {/* Icon with pulse animation when enabled */}
        <motion.div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl',
            enabled ? 'bg-impostor/20' : 'bg-muted',
          )}
          style={enabled ? { backgroundColor: 'color-mix(in srgb, var(--impostor) 20%, transparent)' } : undefined}
          animate={enabled ? { scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] } : {}}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {enabled ? '🎲' : '🔕'}
        </motion.div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-foreground">Chaos-Modus</p>
            {enabled && (
              <motion.span
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                className="inline-flex items-center gap-0.5 rounded-full bg-impostor/15 px-1.5 py-0.5 text-[10px] font-bold text-impostor"
                style={{ backgroundColor: 'color-mix(in srgb, var(--impostor) 15%, transparent)', color: 'var(--impostor)' }}
              >
                <Zap className="h-2.5 w-2.5" />
                AN
              </motion.span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {enabled
              ? 'Jede Runde wird ein zufälliger Modifikator aktiv'
              : 'Standard-Spiel ohne Modifikatoren'}
          </p>
        </div>

        {/* Toggle switch */}
        <div
          className={cn(
            'relative h-7 w-12 shrink-0 rounded-full transition-colors',
            enabled ? 'bg-impostor' : 'bg-muted',
          )}
          style={enabled ? { backgroundColor: 'var(--impostor)' } : undefined}
        >
          <motion.div
            className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm"
            animate={{ x: enabled ? 22 : 4 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </div>
      </div>

      {/* Modifier preview when enabled */}
      {enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 overflow-hidden"
        >
          <div className="flex flex-wrap gap-1.5">
            {Object.values(CHAOS_MODIFIERS).map((mod, idx) => (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + idx * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
                className="flex items-center gap-1 rounded-full bg-card/80 px-2 py-1 text-[10px] font-semibold text-foreground ring-1 ring-border"
              >
                <span className="text-sm">{mod.icon}</span>
                {mod.displayName}
              </motion.div>
            ))}
          </div>
          <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            Geheim — wird erst beim Start der Runde enthüllt
          </p>
        </motion.div>
      )}
    </motion.button>
  )
}
