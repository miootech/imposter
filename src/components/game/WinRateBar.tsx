'use client'

import { motion } from 'framer-motion'
import { CountUp } from '@/components/game/AnimatedNumber'

/**
 * WinRateBar
 * ----------
 * 4-segment stacked horizontal bar showing the breakdown of a player's
 * game outcomes by faction:
 *
 *   ┌──────────────────────────────────────────────┐
 *   │ Jester Wins │ Crew Wins │ Impostor Wins │ Losses │
 *   └──────────────────────────────────────────────┘
 *
 * Color-coded:
 *   - Jester    → var(--jester)     (purple)
 *   - Crew      → var(--crewmate)   (teal)
 *   - Impostor  → var(--impostor)   (red)
 *   - Losses    → var(--destructive) (gray)
 *
 * Crew wins include Detective wins. Impostor wins include Accomplice wins.
 *
 * Used in PlayerStatsBottomSheet — both the per-player modal and the global
 * stats modal.
 */
export interface FactionWins {
  /** Jester wins (neutral faction). */
  jester: number
  /** Crewmate + Detective wins (crew faction). */
  crew: number
  /** Impostor + Accomplice wins (traitor faction). */
  impostor: number
  /** Losses — any game where the player did NOT win, regardless of faction. */
  losses: number
}

interface WinRateBarProps {
  wins: FactionWins
  /** Optional label for the headline number (default: "Sieg-Quote"). */
  label?: string
  /** Show the percentage headline above the bar (default: true). */
  showPercentage?: boolean
  /** Visual size of the bar — 'sm' for inline use, 'md' for modal use. */
  size?: 'sm' | 'md'
}

const SEGMENT_COLORS = {
  jester: 'var(--jester)',
  crew: 'var(--crewmate)',
  impostor: 'var(--impostor)',
  losses: 'var(--destructive)',
} as const

const SEGMENT_META = [
  { key: 'jester' as const, label: 'Jester', icon: '🤡' },
  { key: 'crew' as const, label: 'Crew', icon: '🛡️' },
  { key: 'impostor' as const, label: 'Impostor', icon: '👤' },
  { key: 'losses' as const, label: 'Niederl.', icon: '💀' },
]

export function WinRateBar({
  wins,
  label = 'Sieg-Quote',
  showPercentage = true,
  size = 'md',
}: WinRateBarProps) {
  const total = wins.jester + wins.crew + wins.impostor + wins.losses
  const totalWins = wins.jester + wins.crew + wins.impostor
  const winPct = total > 0 ? Math.round((totalWins / total) * 100) : 0

  // Pre-compute widths (0–100). If total is 0, all segments are 0.
  const segments = SEGMENT_META.map(seg => {
    const value = wins[seg.key]
    const pct = total > 0 ? (value / total) * 100 : 0
    return { ...seg, value, pct, color: SEGMENT_COLORS[seg.key] }
  })

  const barHeight = size === 'sm' ? 'h-2.5' : 'h-3'
  const legendText = size === 'sm' ? 'text-[10px]' : 'text-xs'

  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
      {showPercentage && (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <span className="text-2xl font-bold tabular-nums text-foreground">
            <CountUp from={0} to={winPct} duration={1.2} />%
          </span>
        </div>
      )}

      {/* Stacked bar */}
      <div className={`flex ${barHeight} overflow-hidden rounded-full bg-muted`}>
        {segments.map((seg, idx) => {
          // Skip 0-width segments to avoid rendering artifacts
          if (seg.value === 0) return null
          return (
            <motion.div
              key={seg.key}
              initial={{ width: 0 }}
              animate={{ width: `${seg.pct}%` }}
              transition={{ delay: 0.15 + idx * 0.08, duration: 0.7, ease: 'easeOut' }}
              style={{ backgroundColor: seg.color }}
              className="h-full first:rounded-l-full last:rounded-r-full"
              title={`${seg.label}: ${seg.value} (${Math.round(seg.pct)}%)`}
            />
          )
        })}
      </div>

      {/* Legend — 4 color chips with counts + percentages */}
      <div className={`mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 ${legendText}`}>
        {segments.map(seg => {
          const segPct = total > 0 ? Math.round((seg.value / total) * 100) : 0
          return (
            <div key={seg.key} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-muted-foreground">
                {seg.icon} {seg.label}
              </span>
              <span className="ml-auto font-semibold tabular-nums text-foreground">
                {seg.value}
                <span className="ml-1 font-normal text-muted-foreground">({segPct}%)</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Convert a PlayerStats record into the FactionWins shape consumed by WinRateBar.
 * Defensive — handles missing fields (pre-v2.4.0 records).
 */
export function statsToFactionWins(stats: {
  crewWins?: number
  impostorWins?: number
  jesterWins?: number
  jesterSuccess?: number
  losses?: number
}): FactionWins {
  return {
    jester: stats.jesterWins ?? stats.jesterSuccess ?? 0,
    crew: stats.crewWins ?? 0,
    impostor: stats.impostorWins ?? 0,
    losses: stats.losses ?? 0,
  }
}
