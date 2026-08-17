'use client'

import { motion } from 'framer-motion'
import { Moon, Sun, Volume2, VolumeX, Vibrate, VibrateOff, Smile, RotateCcw, Info, Sparkles } from 'lucide-react'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { ROLES, type RoleId } from '@/lib/game/models'
import { GameButton } from '@/components/game/GameButton'
import { DonutStatsRing, type DonutSegment } from '@/components/game/DonutStatsRing'
import { PlayerStatsBottomSheet, type StatsModalEntry } from '@/components/game/PlayerStatsBottomSheet'
import { UserProfileSection } from '@/components/settings/UserProfileSection'
import { CustomEmojiInput } from '@/components/common/CustomEmojiInput'
import { aggregateGlobalStats } from '@/lib/repositories/groupRepository'
import { getDb } from '@/lib/db/localDb'
import { haptic } from '@/lib/game/services/haptics'
import { playSound } from '@/lib/game/services/sound'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export function SettingsScreen() {
  const prefs = usePreferencesStore()
  const [emojiPickerOpen, setEmojiPickerOpen] = useState<RoleId | null>(null)
  const [statsOpen, setStatsOpen] = useState(false)
  const [globalEntries, setGlobalEntries] = useState<StatsModalEntry[]>([])
  const [totalGames, setTotalGames] = useState(0)
  const [donutSegments, setDonutSegments] = useState<DonutSegment[]>([])

  // Aggregate global stats from all groups (§28, §84)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [agg, totalGameSessions, allResults] = await Promise.all([
          aggregateGlobalStats(),
          // Count distinct game sessions (1 per completed game, NOT sum over players)
          getDb().results.count().catch(() => 0),
          // Fetch all results so we can compute faction wins (1 per game, not N×players)
          getDb().results.toArray().catch(() => [] as Array<{ winnerFaction: string }>),
        ])
        if (cancelled) return
        // Compute faction wins from results: 1 win per game (not per player)
        const crewWins = allResults.filter(r => r.winnerFaction === 'crew').length
        const traitorWins = allResults.filter(r => r.winnerFaction === 'traitor').length
        // Build totals across all players
        // Note: gamesPlayed/wins/losses use real session counts (1 per game, not N×players)
        // roleCount/eliminations/survived are summed per-player (each is a player-specific event)
        const totals = agg.reduce(
          (acc, p) => ({
            gamesPlayed: totalGameSessions,
            wins: crewWins + traitorWins > 0 ? crewWins : acc.wins,  // overwrite with real faction wins
            losses: crewWins + traitorWins > 0 ? traitorWins : acc.losses,
            totalPoints: acc.totalPoints + p.totalPoints,
            eliminations: acc.eliminations + p.eliminations,
            survived: acc.survived + p.survived,
            jesterSuccess: acc.jesterSuccess + p.jesterSuccess,
            crewmate: acc.crewmate + (p.roleCount.crewmate ?? 0),
            detective: acc.detective + (p.roleCount.detective ?? 0),
            impostor: acc.impostor + (p.roleCount.impostor ?? 0),
            accomplice: acc.accomplice + (p.roleCount.accomplice ?? 0),
            jester: acc.jester + (p.roleCount.jester ?? 0),
          }),
          {
            gamesPlayed: 0, wins: 0, losses: 0, totalPoints: 0,
            eliminations: 0, survived: 0, jesterSuccess: 0,
            crewmate: 0, detective: 0, impostor: 0, accomplice: 0, jester: 0,
          },
        )
        setTotalGames(totals.gamesPlayed)
        setGlobalEntries([
          { icon: '🎮', label: 'Spiele', value: totals.gamesPlayed, color: 'var(--primary)' },
          { icon: '🏆', label: 'Siege', value: totals.wins, color: 'var(--success)' },
          { icon: '💀', label: 'Niederlagen', value: totals.losses, color: 'var(--destructive)' },
          { icon: '⭐', label: 'Punkte', value: totals.totalPoints, color: 'var(--accomplice)' },
          { icon: '🛡️', label: 'Überlebt', value: totals.survived, color: 'var(--crewmate)' },
          { icon: '☠️', label: 'Eliminiert', value: totals.eliminations, color: 'var(--impostor)' },
          { icon: '🤡', label: 'Jester-Erfolg', value: totals.jesterSuccess, color: 'var(--jester)' },
        ])
        // Build donut segments — proportional to role distribution
        setDonutSegments([
          { id: 'crewmate', value: totals.crewmate, color: 'var(--crewmate)', icon: '🛡️', label: 'Crewmate' },
          { id: 'detective', value: totals.detective, color: 'var(--detective)', icon: '🔎', label: 'Detektiv' },
          { id: 'impostor', value: totals.impostor, color: 'var(--impostor)', icon: '👤', label: 'Impostor' },
          { id: 'accomplice', value: totals.accomplice, color: 'var(--accomplice)', icon: '⭐', label: 'Komplize' },
          { id: 'jester', value: totals.jester, color: 'var(--jester)', icon: '🤡', label: 'Jester' },
        ].filter(s => s.value > 0))
      } catch (e) {
        console.error('Failed to aggregate global stats', e)
      }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="relative min-h-screen pb-24">
      <div className="mx-auto max-w-md px-5 pt-12">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-2xl font-bold tracking-tight text-foreground"
        >
          Einstellungen
        </motion.h1>

        {/* User Profile Section (Feature #1) */}
        <UserProfileSection />

        {/* Donut Stats Ring (Feature #2) */}
        {totalGames > 0 && donutSegments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Übersicht
            </h2>
            <div className="relative overflow-hidden rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
              <div className="flex flex-col items-center">
                <DonutStatsRing
                  segments={donutSegments}
                  centerValue={totalGames}
                  centerLabel="Spiele"
                  size={240}
                  strokeWidth={30}
                  gapDegrees={14}
                />

                {/* Legend */}
                <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2">
                  {donutSegments.map(seg => (
                    <div key={seg.id} className="flex items-center gap-1.5">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: seg.color }}
                      />
                      <span className="text-xs font-medium text-muted-foreground">
                        {seg.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Info button */}
                <button
                  onClick={() => {
                    haptic('medium')
                    playSound('select')
                    setStatsOpen(true)
                  }}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  <Info className="h-3.5 w-3.5" />
                  Details ansehen
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Appearance */}
        <Section title="Aussehen">
          <div className="grid grid-cols-2 gap-3">
            <ThemeOption
              label="Light"
              icon={<Sun className="h-5 w-5" />}
              active={prefs.theme === 'light'}
              onClick={() => {
                haptic('medium')
                prefs.setTheme('light')
              }}
            />
            <ThemeOption
              label="Dark"
              icon={<Moon className="h-5 w-5" />}
              active={prefs.theme === 'dark'}
              onClick={() => {
                haptic('medium')
                prefs.setTheme('dark')
              }}
            />
          </div>
        </Section>

        {/* Sound & Haptics */}
        <Section title="Feedback">
          <ToggleRow
            label="Sound"
            description="Kurze, hochwertige Sounds"
            icon={prefs.soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            enabled={prefs.soundEnabled}
            onToggle={() => {
              haptic('medium')
              const next = !prefs.soundEnabled
              prefs.setSoundEnabled(next)
              if (next) playSound('select')
            }}
          />
          <ToggleRow
            label="Haptik"
            description="Vibration bei Interaktionen"
            icon={prefs.hapticsEnabled ? <Vibrate className="h-5 w-5" /> : <VibrateOff className="h-5 w-5" />}
            enabled={prefs.hapticsEnabled}
            onToggle={() => {
              const next = !prefs.hapticsEnabled
              prefs.setHapticsEnabled(next)
              if (next) haptic('heavy')
            }}
          />
          <ToggleRow
            label="Timer-Gradient"
            description="Animierter Gradient-Hintergrund während der Diskussion"
            icon={<Sparkles className="h-5 w-5" />}
            enabled={prefs.gradientTimerBg}
            onToggle={() => {
              haptic('medium')
              prefs.setGradientTimerBg(!prefs.gradientTimerBg)
            }}
          />
        </Section>

        {/* Role Icons */}
        <Section title="Rollen-Icons">
          <p className="mb-3 text-xs text-muted-foreground">
            Passe die Emojis für jede Rolle an. Die Rollenfarbe bleibt erhalten.
          </p>
          <div className="space-y-2">
            {(Object.keys(ROLES) as RoleId[]).map(role => (
              <button
                key={role}
                onClick={() => {
                  haptic('light')
                  setEmojiPickerOpen(role)
                }}
                className="flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left shadow-sm ring-1 ring-border transition-shadow hover:shadow-md"
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-2xl"
                  style={{ backgroundColor: `var(--${ROLES[role].colorVar}-soft)` }}
                >
                  {prefs.roleEmojis[role]}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{ROLES[role].displayName}</p>
                  <p className="text-xs text-muted-foreground">{ROLES[role].description}</p>
                </div>
                <Smile className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </Section>

        {/* Reset */}
        <Section title="Erweitert">
          <GameButton
            variant="ghost"
            fullWidth
            className="text-destructive"
            leftIcon={<RotateCcw className="h-4 w-4" />}
            onClick={() => {
              if (confirm('Alle Einstellungen zurücksetzen?')) {
                prefs.reset()
                haptic('warning')
              }
            }}
          >
            Einstellungen zurücksetzen
          </GameButton>
        </Section>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Secret Role · v1.0 · 100% offline
        </p>
      </div>

      {/* Global stats modal (Feature #2) */}
      <PlayerStatsBottomSheet
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        entries={globalEntries}
      />

      <EmojiPickerDialog
        open={emojiPickerOpen !== null}
        role={emojiPickerOpen}
        currentEmoji={emojiPickerOpen ? prefs.roleEmojis[emojiPickerOpen] : ''}
        onClose={() => setEmojiPickerOpen(null)}
        onSelect={(emoji) => {
          if (emojiPickerOpen) {
            prefs.setRoleEmoji(emojiPickerOpen, emoji)
            haptic('success')
            playSound('vote')
          }
          setEmojiPickerOpen(null)
        }}
      />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </motion.div>
  )
}

function ThemeOption({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-2xl p-4 transition-all',
        active
          ? 'bg-primary/10 ring-2 ring-primary text-primary'
          : 'bg-card text-muted-foreground ring-1 ring-border hover:bg-muted/50',
      )}
    >
      {icon}
      <span className="font-semibold">{label}</span>
    </button>
  )
}

function ToggleRow({
  label,
  description,
  icon,
  enabled,
  onToggle,
}: {
  label: string
  description: string
  icon: React.ReactNode
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-sm ring-1 ring-border"
    >
      <div className={cn('text-foreground', !enabled && 'text-muted-foreground')}>{icon}</div>
      <div className="flex-1">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors',
          enabled ? 'bg-primary' : 'bg-muted',
        )}
      >
        <motion.div
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
          animate={{ x: enabled ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
    </button>
  )
}

// Curated emoji palette for the picker
const EMOJI_PALETTE = [
  '🛡️', '🔎', '👤', '⭐', '🤡',
  '🦊', '🐺', '🐱', '🐶', '🦁',
  '👑', '💎', '🔥', '⚡', '🌈',
  '🎭', '🎲', '🎯', '🏆', '💀',
  '👀', '🤔', '😏', '😱', '🥸',
  '👻', '🤖', '👽', '🦄', '🐉',
  '🍕', '🎮', '🎧', '🎵', '⭐',
]

function EmojiPickerDialog({
  open,
  role,
  currentEmoji,
  onClose,
  onSelect,
}: {
  open: boolean
  role: RoleId | null
  currentEmoji: string
  onClose: () => void
  onSelect: (emoji: string) => void
}) {
  if (!role) return null
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {ROLES[role].displayName} Icon
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-6 gap-2">
          {EMOJI_PALETTE.map((emoji, i) => (
            <button
              key={`${emoji}-${i}`}
              onClick={() => onSelect(emoji)}
              className={cn(
                'flex h-12 items-center justify-center rounded-xl text-2xl transition-all',
                currentEmoji === emoji
                  ? 'bg-primary/15 ring-2 ring-primary'
                  : 'bg-muted hover:bg-muted/70',
              )}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Custom emoji input for roles */}
        <div className="mt-3">
          <CustomEmojiInput
            currentEmoji={currentEmoji}
            onSelect={(emoji) => {
              if (role) {
                prefs.setRoleEmoji(role, emoji)
                haptic('success')
                playSound('vote')
              }
              setEmojiPickerOpen(null)
            }}
          />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Tippe ein Emoji an oder gib ein eigenes ein.
        </p>
      </DialogContent>
    </Dialog>
  )
}
