'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useMemo } from 'react'
import { X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RoleIcon } from '@/components/game/RoleBadge'
import { CountUp } from '@/components/game/AnimatedNumber'
import { WinRateBar, statsToFactionWins, type FactionWins } from '@/components/game/WinRateBar'
import type { PlayerStats, RoleId } from '@/lib/game/models'
import { ROLES } from '@/lib/game/models'
import { haptic } from '@/lib/game/services/haptics'
import { cn } from '@/lib/utils'

import { useTranslation } from '@/lib/i18n/useTranslation'

export interface StatsModalEntry {
  icon: string
  label: string
  value: number
  color: string
}

interface PlayerStatsBottomSheetProps {
  open: boolean
  onClose: () => void
  /** Optional player name for the modal title. If omitted, shows global stats. */
  playerName?: string
  /** Player stats to display. If omitted, uses the `entries` prop directly. */
  stats?: PlayerStats
  /** Optional direct entries (for global aggregated stats). */
  entries?: StatsModalEntry[]
  /**
   * Optional faction wins for the 4-segment WinRateBar.
   * If omitted, falls back to extracting them from `stats` (per-player path).
   * SettingsScreen passes this explicitly because its `entries` array is
   * already pre-computed and it has the totals separately.
   */
  factionWins?: FactionWins
}

/**
 * PlayerStatsBottomSheet
 * ----------------------
 * Reusable modal showing a detailed stats breakdown with count-up animation.
 * Used in two contexts:
 *   1. SettingsScreen — global aggregated stats (entries prop)
 *   2. ExpandablePlayerCard — single-player filtered stats (stats prop)
 *
 * Animation:
 *   - On open: each value counts up from 0 → target over ~1.2s
 *   - Staggered entry appearance
 */
export function PlayerStatsBottomSheet({
  open,
  onClose,
  playerName,
  stats,
  entries,
  factionWins,
}: PlayerStatsBottomSheetProps) {
  const { t } = useTranslation()

  // Build entries from stats if not provided directly
  const computedEntries = useMemo<StatsModalEntry[]>(() => {
    if (entries) return entries
    if (!stats) return []
    return [
      { icon: '🎮', label: t('games'), value: stats.gamesPlayed, color: 'var(--primary)' },
      { icon: '🏆', label: t('wins'), value: stats.wins, color: 'var(--success)' },
      { icon: '💀', label: t('losses'), value: stats.losses, color: 'var(--destructive)' },
      { icon: '⭐', label: t('points'), value: stats.totalPoints, color: 'var(--accomplice)' },
      { icon: '🛡️', label: t('survived'), value: stats.survived, color: 'var(--crewmate)' },
      { icon: '☠️', label: t('eliminated'), value: stats.eliminations, color: 'var(--impostor)' },
      { icon: '🤡', label: t('jesterSuccess'), value: stats.jesterSuccess, color: 'var(--jester)' },
    ]
  }, [entries, stats, t])

  // Resolve faction wins for the 4-segment bar:
  //   1. Explicit `factionWins` prop (SettingsScreen global modal)
  //   2. Derived from `stats` (ExpandablePlayerCard per-player modal)
  //   3. Empty fallback (no stats at all)
  const resolvedFactionWins = useMemo<FactionWins>(() => {
    if (factionWins) return factionWins
    if (stats) return statsToFactionWins(stats)
    return { jester: 0, crew: 0, impostor: 0, losses: 0 }
  }, [factionWins, stats])

  // Role breakdown (only if stats provided)
  const roleEntries = useMemo<Array<{ role: RoleId; count: number }>>(() => {
    if (!stats) return []
    return (Object.keys(ROLES) as RoleId[]).map(role => ({
      role,
      count: stats.roleCount[role] ?? 0,
    }))
  }, [stats])

  // Trigger haptic on open
  useEffect(() => {
    if (open) haptic('medium')
  }, [open])

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {playerName ? (
              <>
                <span>{t('stats')}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-primary">{playerName}</span>
              </>
            ) : (
              t('globalStats')
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 4-segment win-rate bar: Jester / Crew / Impostor / Losses */}
          {(() => {
            const total = resolvedFactionWins.jester + resolvedFactionWins.crew + resolvedFactionWins.impostor + resolvedFactionWins.losses
            if (total === 0) return null
            return (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <WinRateBar wins={resolvedFactionWins} />
              </motion.div>
            )
          })()}

          {/* Quick stats grid (2 columns) */}
          <div className="grid grid-cols-2 gap-2">
            {computedEntries.map((entry, idx) => (
              <motion.div
                key={entry.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{ backgroundColor: `color-mix(in srgb, ${entry.color} 15%, transparent)` }}
                >
                  {entry.icon}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {entry.label}
                  </p>
                  <p className="text-xl font-bold tabular-nums text-foreground">
                    <CountUp from={0} to={entry.value} duration={1.2} />
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Role breakdown (only if stats provided) */}
          {stats && roleEntries.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl bg-card p-4 ring-1 ring-border"
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('roleDistribution')}
              </p>
              <div className="space-y-2">
                {roleEntries.map((re, idx) => {
                  const total = roleEntries.reduce((s, r) => s + r.count, 0)
                  const percent = total > 0 ? (re.count / total) * 100 : 0
                  return (
                    <motion.div
                      key={re.role}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + idx * 0.06 }}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-7 w-7 items-center justify-center">
                        <RoleIcon role={re.role} size="sm" />
                      </div>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: `var(--${ROLES[re.role].colorVar})` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ delay: 0.6 + idx * 0.06, duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                      <span className="w-8 text-right text-sm font-semibold tabular-nums text-foreground">
                        <CountUp from={0} to={re.count} duration={1.0} />
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Suppress unused-import warning for AnimatePresence (kept for future extensions)
void AnimatePresence
void X
void cn

