'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Sun, Volume2, VolumeX, Music, Smile, RotateCcw, Info, Sparkles, Download, Upload, Palette, Languages, BookOpen } from 'lucide-react'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { ROLES, type RoleId } from '@/lib/game/models'
import { GameButton } from '@/components/game/GameButton'
import { DonutStatsRing, type DonutSegment } from '@/components/game/DonutStatsRing'
import { PlayerStatsBottomSheet, type StatsModalEntry } from '@/components/game/PlayerStatsBottomSheet'
import type { FactionWins } from '@/components/game/WinRateBar'
import { UserProfileSection } from '@/components/settings/UserProfileSection'
import { SettingsFooter } from '@/components/settings/SettingsFooter'
import { DataPortModal } from '@/components/settings/DataPortModal'
import { CustomCategoriesSection } from '@/components/settings/CustomCategoriesSection'
import { EmojiPickerModal } from '@/components/common/EmojiPickerModal'
import { IconRenderer } from '@/components/common/IconRenderer'
import { GRADIENT_PRESETS } from '@/lib/game/content/gradientPresets'
import { aggregateGlobalStats } from '@/lib/repositories/groupRepository'
import { getDb } from '@/lib/db/localDb'
import { haptic } from '@/lib/game/services/haptics'
import { playSound } from '@/lib/game/services/sound'
import { useTranslation } from '@/lib/i18n/useTranslation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

/** App version — keep in sync with package.json + android/app/build.gradle (versionName). */
const APP_VERSION = '2.4.0'

export function SettingsScreen() {
  const { t } = useTranslation()
  const prefs = usePreferencesStore()
  const [emojiPickerOpen, setEmojiPickerOpen] = useState<RoleId | null>(null)
  const [statsOpen, setStatsOpen] = useState(false)
  const [dataPortOpen, setDataPortOpen] = useState(false)
  const [dataPortMode, setDataPortMode] = useState<'export' | 'import'>('export')
  const [globalEntries, setGlobalEntries] = useState<StatsModalEntry[]>([])
  const [globalFactionWins, setGlobalFactionWins] = useState<FactionWins>({ jester: 0, crew: 0, impostor: 0, losses: 0 })
  const [totalGames, setTotalGames] = useState(0)
  const [donutSegments, setDonutSegments] = useState<DonutSegment[]>([])

  // Aggregate global stats from all groups (§28, §84)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [agg, totalGameSessions] = await Promise.all([
          aggregateGlobalStats(),
          getDb().results.count().catch(() => 0),
        ])
        if (cancelled) return

        // STRICT FILTER: Only aggregate the device owner's stats
        // Match by username (case-insensitive) — only players whose displayName
        // matches the device owner's username should be summed
        const username = prefs.username?.trim().toLowerCase()
        const myStats = username
          ? agg.filter(p => p.displayName.trim().toLowerCase() === username)
          : []

        // Sum only the device owner's stats across all groups.
        // Faction-aware wins (v2.4.0) are aggregated per-player from each player's stats.
        const totals = myStats.reduce(
          (acc, p) => ({
            gamesPlayed: totalGameSessions,
            wins: acc.wins + p.wins,
            losses: acc.losses + p.losses,
            totalPoints: acc.totalPoints + p.totalPoints,
            eliminations: acc.eliminations + p.eliminations,
            survived: acc.survived + p.survived,
            jesterSuccess: acc.jesterSuccess + p.jesterSuccess,
            // Faction-aware wins (v2.4.0)
            crewWins: acc.crewWins + p.crewWins,
            impostorWins: acc.impostorWins + p.impostorWins,
            jesterWins: acc.jesterWins + p.jesterWins,
            crewmate: acc.crewmate + (p.roleCount.crewmate ?? 0),
            detective: acc.detective + (p.roleCount.detective ?? 0),
            impostor: acc.impostor + (p.roleCount.impostor ?? 0),
            accomplice: acc.accomplice + (p.roleCount.accomplice ?? 0),
            jester: acc.jester + (p.roleCount.jester ?? 0),
          }),
          {
            gamesPlayed: 0, wins: 0, losses: 0, totalPoints: 0,
            eliminations: 0, survived: 0, jesterSuccess: 0,
            crewWins: 0, impostorWins: 0, jesterWins: 0,
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
        // 4-segment bar uses per-player faction wins aggregated across all groups.
        setGlobalFactionWins({
          jester: totals.jesterWins,
          crew: totals.crewWins,
          impostor: totals.impostorWins,
          losses: totals.losses,
        })
        // Build donut segments — proportional to role distribution
        setDonutSegments([
          { id: 'crewmate', value: totals.crewmate, color: 'var(--crewmate)', icon: prefs.roleEmojis.crewmate, label: ROLES.crewmate.germanName },
          { id: 'detective', value: totals.detective, color: 'var(--detective)', icon: prefs.roleEmojis.detective, label: ROLES.detective.germanName },
          { id: 'impostor', value: totals.impostor, color: 'var(--impostor)', icon: prefs.roleEmojis.impostor, label: ROLES.impostor.germanName },
          { id: 'accomplice', value: totals.accomplice, color: 'var(--accomplice)', icon: prefs.roleEmojis.accomplice, label: ROLES.accomplice.germanName },
          { id: 'jester', value: totals.jester, color: 'var(--jester)', icon: prefs.roleEmojis.jester, label: ROLES.jester.germanName },
        ].filter(s => s.value > 0))
      } catch (e) {
        console.error('Failed to aggregate global stats', e)
      }
    })()
    return () => { cancelled = true }
  }, [prefs.roleEmojis, prefs.username]) // Re-run when role emojis or username change

  // Expose version globally for SettingsFooter to read
  if (typeof window !== 'undefined') {
    ;(window as any).__APP_VERSION__ = APP_VERSION
  }

  return (
    <div className="relative min-h-screen pb-24">
      <div className="mx-auto max-w-md px-5 pt-12">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-2xl font-bold tracking-tight text-foreground"
        >
          {t('settingsTitle')}
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

        {/* Language & Content Section */}
        <Section title={t('languageSection')}>
          {/* App UI Language Toggle */}
          <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <button
              onClick={() => {
                haptic('medium')
                const nextLang = prefs.uiLanguage === 'de' ? 'en' : 'de'
                prefs.setUiLanguage(nextLang)
                playSound('select')
              }}
              className="flex w-full items-center gap-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Languages className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">{t('uiLanguageTitle')}</p>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {prefs.uiLanguage === 'en' ? 'EN' : 'DE'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{t('uiLanguageDesc')}</p>
              </div>
              <div
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors',
                  prefs.uiLanguage === 'en' ? 'bg-primary' : 'bg-muted',
                )}
              >
                <motion.div
                  className="absolute top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[9px] font-bold text-black shadow-sm"
                  animate={{ x: prefs.uiLanguage === 'en' ? 22 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  {prefs.uiLanguage === 'en' ? 'EN' : 'DE'}
                </motion.div>
              </div>
            </button>
          </div>

          {/* Words & Hints Language Toggle */}
          <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <button
              onClick={() => {
                haptic('medium')
                const nextLang = prefs.wordLanguage === 'de' ? 'en' : 'de'
                prefs.setWordLanguage(nextLang)
                playSound('select')
              }}
              className="flex w-full items-center gap-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">{t('wordLanguageTitle')}</p>
                  <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    {prefs.wordLanguage === 'en' ? 'EN' : 'DE'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{t('wordLanguageDesc')}</p>
              </div>
              <div
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors',
                  prefs.wordLanguage === 'en' ? 'bg-emerald-600' : 'bg-muted',
                )}
              >
                <motion.div
                  className="absolute top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[9px] font-bold text-black shadow-sm"
                  animate={{ x: prefs.wordLanguage === 'en' ? 22 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  {prefs.wordLanguage === 'en' ? 'EN' : 'DE'}
                </motion.div>
              </div>
            </button>
          </div>
        </Section>

        {/* Sound & Haptics */}
        <Section title={t('audioSection')}>
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
            label="Hintergrundmusik"
            description="Verschiedene Tracks für Idle, Diskussion, Voting & Reveal"
            icon={<Music className="h-5 w-5" />}
            enabled={prefs.bgMusicEnabled}
            onToggle={() => {
              haptic('medium')
              prefs.setBgMusicEnabled(!prefs.bgMusicEnabled)
            }}
          />
          {/* Gradient Toggle → expandable pill with presets */}
          <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <button
              onClick={() => {
                haptic('medium')
                if (prefs.gradientPreset === 'none') {
                  prefs.setGradientPreset('sunset')
                } else {
                  prefs.setGradientPreset('none')
                }
              }}
              className="flex w-full items-center gap-3"
            >
              <Palette className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground">Timer-Gradient</p>
                <p className="text-xs text-muted-foreground">
                  {prefs.gradientPreset === 'none' ? 'Aus' : GRADIENT_PRESETS.find(p => p.id === prefs.gradientPreset)?.name || 'An'}
                </p>
              </div>
              <div
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors',
                  prefs.gradientPreset !== 'none' ? 'bg-primary' : 'bg-muted',
                )}
              >
                <motion.div
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
                  animate={{ x: prefs.gradientPreset !== 'none' ? 22 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </div>
            </button>
            {/* Expandable presets — only when enabled */}
            <AnimatePresence>
              {prefs.gradientPreset !== 'none' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 grid grid-cols-5 gap-1.5 px-1">
                    {GRADIENT_PRESETS.filter(p => p.id !== 'none').map(preset => (
                      <motion.button
                        key={preset.id}
                        onClick={() => { haptic('light'); prefs.setGradientPreset(preset.id) }}
                        whileTap={{ scale: 0.92 }}
                        className={cn(
                          'flex flex-col items-center gap-1 rounded-xl p-1.5 transition-all',
                          prefs.gradientPreset === preset.id
                            ? 'ring-2 ring-primary bg-primary/5'
                            : 'hover:bg-muted/50',
                        )}
                      >
                        {preset.id === 'random' ? (
                          <div className="h-7 w-7 rounded-full" style={{ background: 'conic-gradient(from 0deg, #E07A5F, #457B9D, #81B29A, #F2CC8F, #9B5DE5, #E07A5F)' }} />
                        ) : (
                          <div className="h-7 w-7 rounded-full" style={{ background: `linear-gradient(135deg, ${preset.colors[0]}, ${preset.colors[1]})` }} />
                        )}
                        <span className="text-[9px] font-medium leading-tight text-muted-foreground">{preset.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Section>

        {/* Role Icons */}
        <Section title={t('roleEmojis')}>
          <p className="mb-3 text-xs text-muted-foreground">
            {t('roleEmojisDesc')}
          </p>
          <div className="space-y-2">
            {(Object.keys(ROLES) as RoleId[]).map(role => {
              const roleKey = role === 'crewmate' ? 'crewmateDesc'
                : role === 'detective' ? 'detectiveDesc'
                : role === 'impostor' ? 'impostorDesc'
                : role === 'accomplice' ? 'accompliceDesc'
                : 'jesterDesc'
              return (
                <button
                  key={role}
                  onClick={() => {
                    haptic('light')
                    setEmojiPickerOpen(role)
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left shadow-sm ring-1 ring-border transition-shadow hover:shadow-md"
                >
                  <div
                    className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl text-2xl"
                    style={{ backgroundColor: `var(--${ROLES[role].colorVar}-soft)` }}
                  >
                    <IconRenderer icon={prefs.roleEmojis[role]} size={44} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{ROLES[role].displayName}</p>
                    <p className="text-xs text-muted-foreground">{t(roleKey as any)}</p>
                  </div>
                  <Smile className="h-4 w-4 text-muted-foreground" />
                </button>
              )
            })}
          </div>
        </Section>

        {/* Custom Categories — view all + create up to 5 own */}
        <CustomCategoriesSection />

        {/* Reset */}
        <Section title={t('dataPort')}>
          <div className="grid grid-cols-2 gap-2">
            <GameButton
              variant="secondary"
              fullWidth
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => {
                haptic('light')
                setDataPortMode('export')
                setDataPortOpen(true)
              }}
            >
              Export
            </GameButton>
            <GameButton
              variant="secondary"
              fullWidth
              leftIcon={<Upload className="h-4 w-4" />}
              onClick={() => {
                haptic('light')
                setDataPortMode('import')
                setDataPortOpen(true)
              }}
            >
              Import
            </GameButton>
          </div>
        </Section>

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

        {/* Footer: Social links + Author + Copyright */}
        <SettingsFooter />
      </div>

      {/* Data Export/Import Modal */}
      <DataPortModal
        open={dataPortOpen}
        mode={dataPortMode}
        onClose={() => setDataPortOpen(false)}
        onImported={() => {
          // Trigger stats refresh
          window.location.reload()
        }}
      />

      {/* Global stats modal (Feature #2) */}
      <PlayerStatsBottomSheet
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        entries={globalEntries}
        factionWins={globalFactionWins}
      />

      {/* Role Icon Picker — uses the new responsive modal */}
      <EmojiPickerModal
        open={emojiPickerOpen !== null}
        onClose={() => setEmojiPickerOpen(null)}
        title={emojiPickerOpen ? `${ROLES[emojiPickerOpen].germanName} Icon` : 'Icon wählen'}
        currentEmoji={emojiPickerOpen ? prefs.roleEmojis[emojiPickerOpen] : ''}
        onSelect={(emoji) => {
          if (emojiPickerOpen) {
            prefs.setRoleEmoji(emojiPickerOpen, emoji)
          }
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

// (Legacy EmojiPickerDialog removed — replaced by the responsive EmojiPickerModal above)

