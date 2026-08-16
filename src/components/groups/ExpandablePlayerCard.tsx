'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { ChevronDown, Pencil, X, Info, Crown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { PlayerStatsBottomSheet } from '@/components/game/PlayerStatsBottomSheet'
import type { Player } from '@/lib/game/models'
import { haptic } from '@/lib/game/services/haptics'
import { cn } from '@/lib/utils'

interface ExpandablePlayerCardProps {
  player: Player
  index: number
  isMain?: boolean  // device owner → crown badge
  onRemove?: () => void
  onRename?: (newName: string) => void
}

/**
 * ExpandablePlayerCard
 * --------------------
 * Accordion-style player row. Tap to expand → reveals 3 pill stat badges
 * (Games / Wins / Losses) and an info icon that opens the per-player
 * stats modal.
 *
 * Animation: animateContentSize with spring spec — smooth expand/collapse,
 * no overlap with following cards.
 */
export function ExpandablePlayerCard({
  player,
  index,
  isMain,
  onRemove,
  onRename,
}: ExpandablePlayerCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(player.displayName)
  const [statsOpen, setStatsOpen] = useState(false)

  const stats = player.stats
  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0

  return (
    <>
      <motion.div
        layout
        className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border"
      >
        <motion.div
          layout
          className="flex items-center gap-3 p-3"
          animate={{ backgroundColor: expanded ? 'var(--muted)' : 'var(--card)' }}
          transition={{ duration: 0.2 }}
        >
          {/* Avatar */}
          <button
            onClick={() => {
              haptic('light')
              setExpanded(e => !e)
            }}
            className="flex items-center gap-3 text-left"
            aria-expanded={expanded}
            aria-label={`Spieler ${player.displayName}`}
          >
            <div className="relative">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: player.color }}
              >
                {player.displayName.slice(0, 2).toUpperCase()}
              </div>
              {isMain && (
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                  className="absolute -right-1 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accomplice text-[10px] shadow-sm"
                  style={{ backgroundColor: 'var(--accomplice)' }}
                  aria-label="Haupt-User"
                  title="Gerätebesitzer"
                >
                  👑
                </motion.div>
              )}
            </div>
          </button>

          {/* Name + meta */}
          <button
            onClick={() => {
              haptic('light')
              setExpanded(e => !e)
            }}
            className="min-w-0 flex-1 text-left"
          >
            <div className="flex items-center gap-1.5">
              <p className="truncate font-semibold text-foreground">{player.displayName}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {player.points} Punkte · {winRate}% Win-Rate
            </p>
          </button>

          {/* Expand chevron */}
          <motion.button
            onClick={() => {
              haptic('light')
              setExpanded(e => !e)
            }}
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/50"
            aria-label={expanded ? 'Einklappen' : 'Ausklappen'}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.button>
        </motion.div>

        {/* Expandable content */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 35 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 pt-1">
                {/* 3 Pill Badges — icon + number only, no text label */}
                <div className="grid grid-cols-3 gap-2">
                  <PillBadge
                    icon="🎮"
                    value={stats.gamesPlayed}
                    color="var(--primary)"
                  />
                  <PillBadge
                    icon="🏆"
                    value={stats.wins}
                    color="var(--success)"
                  />
                  <PillBadge
                    icon="💀"
                    value={stats.losses}
                    color="var(--destructive)"
                  />
                </div>

                {/* Actions row */}
                <div className="mt-3 flex items-center justify-between">
                  {/* Info button → modal */}
                  <button
                    onClick={() => {
                      haptic('medium')
                      setStatsOpen(true)
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    <Info className="h-3.5 w-3.5" />
                    Details
                  </button>

                  {/* Edit / Remove */}
                  <div className="flex items-center gap-1">
                    {editing ? (
                      <>
                        <input
                          autoFocus
                          value={name}
                          onChange={e => setName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              if (name.trim() && name.trim() !== player.displayName) onRename?.(name.trim())
                              setEditing(false)
                            } else if (e.key === 'Escape') {
                              setName(player.displayName)
                              setEditing(false)
                            }
                          }}
                          onBlur={() => {
                            if (name.trim() && name.trim() !== player.displayName) onRename?.(name.trim())
                            setEditing(false)
                          }}
                          className="h-8 w-32 rounded-lg border border-border bg-card px-2 text-sm text-foreground"
                          maxLength={20}
                        />
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          haptic('light')
                          setEditing(true)
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="Bearbeiten"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        haptic('warning')
                        onRemove?.()
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Entfernen"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Player-specific stats modal */}
      <PlayerStatsBottomSheet
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        playerName={player.displayName}
        stats={stats}
      />
    </>
  )
}

function PillBadge({
  icon,
  value,
  color,
}: {
  icon: string
  value: number
  color: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="flex items-center gap-2 rounded-2xl px-3 py-2.5"
      style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
      title={`${icon} ${value}`}
    >
      <span className="text-lg leading-none">{icon}</span>
      <span
        className="text-lg font-bold tabular-nums"
        style={{ color }}
      >
        {value}
      </span>
    </motion.div>
  )
}

// Suppress unused warnings
void Input
void Crown
