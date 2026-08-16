'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, AlertCircle, Info } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { GameButton } from '@/components/game/GameButton'
import { CompactCategoryCard } from '@/components/setup/CompactCategoryCard'
import { CategorySelectorSheet } from '@/components/setup/CategorySelectorSheet'
import { ChaosModeToggle } from '@/components/setup/ChaosModeToggle'
import { listGroups, getGroup } from '@/lib/repositories/groupRepository'
import { CATALOG } from '@/lib/game/content/catalog'
import { validateSetup, computeRoleComposition, specMaxImpostorCount, defaultImpostorCount, canAddSpecialRole } from '@/lib/game/rules/GameRules'
import type { GameSetupConfig, Group, GameMode } from '@/lib/game/models'
import { cn } from '@/lib/utils'
import { haptic } from '@/lib/game/services/haptics'
import { playSound } from '@/lib/game/services/sound'
import { MIN_PLAYERS_PER_GROUP } from '@/lib/game/models'

export function SetupScreen() {
  const startGame = useGameStore(s => s.startGame)
  const cancelSetup = useGameStore(s => s.cancelSetup)
  const setLastUsedGroupId = usePreferencesStore(s => s.setLastUsedGroupId)
  const setLastUsedCategoryId = usePreferencesStore(s => s.setLastUsedCategoryId)
  const setLastUsedMode = usePreferencesStore(s => s.setLastUsedMode)
  const lastGroupId = usePreferencesStore(s => s.lastUsedGroupId)
  const lastCategoryId = usePreferencesStore(s => s.lastUsedCategoryId)
  const lastMode = usePreferencesStore(s => s.lastUsedMode)

  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [categorySheetOpen, setCategorySheetOpen] = useState(false)
  const [config, setConfig] = useState<GameSetupConfig>({
    groupId: '',
    impostorCount: 1,
    includeDetective: false,
    includeAccomplice: false,
    includeJester: false,
    categoryId: CATALOG[0].id,
    mode: 'normal',
    chaosMode: false,
  })

  useEffect(() => {
    (async () => {
      const all = await listGroups()
      const playable = all.filter(g => g.players.length >= MIN_PLAYERS_PER_GROUP)
      setGroups(playable)
      // Pick last-used group if available, else first playable
      const last = lastGroupId ? playable.find(g => g.id === lastGroupId) : null
      const first = playable[0]
      const chosen = last ?? first
      if (chosen) {
        setConfig(c => ({
          ...c,
          groupId: chosen.id,
          impostorCount: defaultImpostorCount(chosen.players.length),
          categoryId: lastCategoryId ?? CATALOG[0].id,
          mode: lastMode,
        }))
      }
      setLoading(false)
    })()
  }, [lastGroupId, lastCategoryId, lastMode])

  const selectedGroup = groups.find(g => g.id === config.groupId)
  const playerCount = selectedGroup?.players.length ?? 0

  const validation = useMemo(() => {
    if (!selectedGroup) {
      return { valid: false, errors: ['Wähle eine Gruppe mit mindestens 3 Spielern.'], disabledReasons: {} }
    }
    return validateSetup({ id: selectedGroup.id, playerCount }, config)
  }, [selectedGroup, playerCount, config])

  const composition = useMemo(() => {
    if (!selectedGroup) return null
    return computeRoleComposition(playerCount, config)
  }, [selectedGroup, playerCount, config])

  // Compute whether each special role can be enabled without violating "crew faction > traitor faction".
  // Faction math: Crew = Crewmate + Detective, Traitor = Impostor + Accomplice, Jester = neutral.
  // If already enabled, we keep it enabled (user must be able to turn it off).
  const specMax = specMaxImpostorCount(playerCount)
  const canAddDetective = config.includeDetective || canAddSpecialRole(playerCount, config, 'detective').allowed
  const canAddAccomplice = config.includeAccomplice || canAddSpecialRole(playerCount, config, 'accomplice').allowed
  const canAddJester = config.includeJester || canAddSpecialRole(playerCount, config, 'jester').allowed
  const detectiveBlockedByMode = config.mode === 'hard'
  const detectiveBlocked = detectiveBlockedByMode || !canAddDetective
  const accompliceBlocked = !canAddAccomplice
  const jesterBlocked = !canAddJester
  const detectiveDisabledReason = detectiveBlockedByMode
    ? 'Detektiv nur in NORMAL verfügbar.'
    : !canAddDetective ? 'Crew-Fraktion wäre nicht mehr in der Mehrheit.' : undefined
  const accompliceDisabledReason = !canAddAccomplice ? 'Verräter-Fraktion wäre zu stark.' : undefined
  const jesterDisabledReason = !canAddJester ? 'Crew-Fraktion wäre nicht mehr in der Mehrheit.' : undefined

  const handleStart = () => {
    if (!validation.valid || !selectedGroup) return
    const players = selectedGroup.players.map(p => ({
      id: p.id,
      displayName: p.displayName,
      color: p.color,
    }))
    setLastUsedGroupId(selectedGroup.id)
    setLastUsedCategoryId(config.categoryId)
    setLastUsedMode(config.mode)
    haptic('heavy')
    playSound('reveal')
    startGame(config, players)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="relative min-h-screen">
        <div className="mx-auto max-w-md px-5 pt-12">
          <BackButton onBack={cancelSetup} />
          <div className="mt-12 flex flex-col items-center text-center">
            <div className="mb-4 text-5xl">👥</div>
            <h2 className="text-xl font-bold text-foreground">Keine spielbare Gruppe</h2>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Du brauchst eine Gruppe mit mindestens 3 Spielern, um ein Spiel zu starten.
            </p>
            <GameButton
              className="mt-6"
              onClick={() => {
                cancelSetup()
                useGameStore.getState().setActiveTab('groups')
              }}
            >
              Gruppe erstellen
            </GameButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen pb-32">
      <div className="mx-auto max-w-md px-5 pt-12">
        <BackButton onBack={cancelSetup} />

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 mt-4 text-2xl font-bold tracking-tight text-foreground"
        >
          Spiel einrichten
        </motion.h1>

        {/* Group selection */}
        <Section title="Gruppe">
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 no-scrollbar">
            {groups.map(g => (
              <button
                key={g.id}
                onClick={() => {
                  haptic('light')
                  setConfig(c => ({
                    ...c,
                    groupId: g.id,
                    impostorCount: Math.min(c.impostorCount, specMaxImpostorCount(g.players.length)),
                  }))
                }}
                className={cn(
                  'flex min-w-[140px] flex-col items-start gap-2 rounded-2xl p-3 text-left transition-all',
                  config.groupId === g.id
                    ? 'bg-card ring-2 ring-primary shadow-md'
                    : 'bg-card ring-1 ring-border',
                )}
                style={config.groupId === g.id ? { boxShadow: `0 8px 24px -8px ${g.color}40` } : undefined}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                  style={{ backgroundColor: `${g.color}25` }}
                >
                  {g.icon}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{g.name}</p>
                  <p className="text-xs text-muted-foreground">{g.players.length} Spieler</p>
                </div>
              </button>
            ))}
          </div>
        </Section>

        {/* Mode selector */}
        <Section title="Modus">
          <ModeSlider
            value={config.mode}
            onChange={(mode) => {
              haptic('medium')
              setConfig(c => ({
                ...c,
                mode,
                // Disable detective when switching to HARD (§15)
                includeDetective: mode === 'normal' ? c.includeDetective : false,
              }))
            }}
          />
          <div className="mt-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
            {config.mode === 'normal' ? (
              <>Hints aktiv. Der Impostor sieht die Kategorie, der Detektiv sieht das Wort + den Hint.</>
            ) : (
              <>Keine Hints. Der Impostor tappt im Dunkeln. Kein Detektiv. Der Komplize sieht nur die Kategorie.</>
            )}
          </div>
        </Section>

        {/* Roles */}
        <Section title="Rollen">
          <RoleCounter
            label="Impostoren"
            description={`Empfohlen für ${playerCount} Spieler: ${defaultImpostorCount(playerCount)}`}
            value={config.impostorCount}
            min={1}
            max={specMax}
            onDec={() => {
              haptic('light')
              setConfig(c => ({ ...c, impostorCount: Math.max(1, c.impostorCount - 1) }))
            }}
            onInc={() => {
              haptic('light')
              setConfig(c => ({ ...c, impostorCount: Math.min(specMax, c.impostorCount + 1) }))
            }}
            color="var(--impostor)"
          />
          <RoleToggle
            label="Detektiv"
            description="Echtes Wort + Impostor-Hint (nur NORMAL)"
            enabled={config.includeDetective}
            disabled={detectiveBlocked}
            disabledReason={detectiveDisabledReason}
            onToggle={() => {
              haptic('medium')
              setConfig(c => ({ ...c, includeDetective: !c.includeDetective }))
            }}
            color="var(--detective)"
          />
          <RoleToggle
            label="Komplize"
            description="Max 1. Kennt alle Impostoren."
            enabled={config.includeAccomplice}
            disabled={accompliceBlocked}
            disabledReason={accompliceDisabledReason}
            onToggle={() => {
              haptic('medium')
              setConfig(c => ({ ...c, includeAccomplice: !c.includeAccomplice }))
            }}
            color="var(--accomplice)"
          />
          <RoleToggle
            label="Jester"
            description="Neutral. Eigenes Wort. Will eliminiert werden."
            enabled={config.includeJester}
            disabled={jesterBlocked}
            disabledReason={jesterDisabledReason}
            onToggle={() => {
              haptic('medium')
              setConfig(c => ({ ...c, includeJester: !c.includeJester }))
            }}
            color="var(--jester)"
          />
        </Section>

        {/* Composition preview */}
        {composition && (
          <Section title="Verteilung">
            <div className="grid grid-cols-5 gap-2">
              <CompositionTile label="Crew" count={composition.crewmate} color="var(--crewmate)" />
              <CompositionTile label="Det." count={composition.detective} color="var(--detective)" />
              <CompositionTile label="Imp." count={composition.impostor} color="var(--impostor)" />
              <CompositionTile label="Komp." count={composition.accomplice} color="var(--accomplice)" />
              <CompositionTile label="Jest." count={composition.jester} color="var(--jester)" />
            </div>
          </Section>
        )}

        {/* Chaos Mode toggle */}
        <Section title="Chaos">
          <ChaosModeToggle
            enabled={config.chaosMode}
            onToggle={() => {
              haptic('medium')
              playSound('select')
              setConfig(c => ({ ...c, chaosMode: !c.chaosMode }))
            }}
          />
        </Section>

        {/* Category selection — compact single-card display with bottom-sheet selector */}
        <Section title="Kategorie">
          <CompactCategoryCard
            categoryId={config.categoryId}
            onChange={() => {
              haptic('medium')
              playSound('tap')
              setCategorySheetOpen(true)
            }}
          />
        </Section>

        {/* Validation errors */}
        <AnimatePresence>
          {validation.errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 flex items-start gap-3 rounded-2xl bg-destructive/10 p-4"
            >
              <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
              <div className="space-y-1">
                {validation.errors.map((err, i) => (
                  <p key={i} className="text-sm text-destructive-foreground">{err}</p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Faction majority info — crew faction (Crewmate + Detective) must be > traitor faction (Impostor + Accomplice) */}
        {composition && (() => {
          const crewFaction = composition.crewmate + composition.detective
          const traitorFaction = composition.impostor + composition.accomplice
          if (crewFaction > traitorFaction && composition.crewmate >= 1) return null
          return (
            <div className="mb-4 flex items-start gap-3 rounded-2xl bg-warning/10 p-4">
              <Info className="h-5 w-5 shrink-0 text-warning" />
              <p className="text-sm text-warning-foreground">
                Crew-Fraktion (🛡️+🔎 = {crewFaction}) muss stärker sein als Verräter (👤+⭐ = {traitorFaction}).{composition.crewmate < 1 ? ' Außerdem mind. 1 reiner Crewmate nötig.' : ''}
              </p>
            </div>
          )
        })()}
      </div>

      {/* Sticky start button */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-6 left-0 right-0 z-20 px-5"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto max-w-md">
          <GameButton
            size="lg"
            fullWidth
            disabled={!validation.valid}
            hapticPattern="heavy"
            soundType="reveal"
            onClick={handleStart}
            className="shadow-2xl"
          >
            Spiel starten · {playerCount} Spieler
          </GameButton>
        </div>
      </motion.div>

      {/* Category selector bottom sheet */}
      <CategorySelectorSheet
        open={categorySheetOpen}
        onOpenChange={setCategorySheetOpen}
        selectedId={config.categoryId}
        onSelect={(categoryId) => {
          haptic('success')
          setConfig(c => ({ ...c, categoryId }))
        }}
      />
    </div>
  )
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      onClick={() => {
        haptic('light')
        onBack()
      }}
      className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Zurück
    </button>
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

function ModeSlider({ value, onChange }: { value: GameMode; onChange: (m: GameMode) => void }) {
  return (
    <div className="relative rounded-2xl bg-card p-2 ring-1 ring-border">
      <div className="relative flex">
        <motion.div
          className="absolute top-0 bottom-0 w-1/2 rounded-xl bg-primary"
          animate={{ x: value === 'normal' ? 0 : '100%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
        <button
          onClick={() => onChange('normal')}
          className={cn(
            'relative z-10 flex-1 py-3 text-sm font-semibold transition-colors',
            value === 'normal' ? 'text-primary-foreground' : 'text-muted-foreground',
          )}
        >
          NORMAL
        </button>
        <button
          onClick={() => onChange('hard')}
          className={cn(
            'relative z-10 flex-1 py-3 text-sm font-semibold transition-colors',
            value === 'hard' ? 'text-primary-foreground' : 'text-muted-foreground',
          )}
        >
          HARD
        </button>
      </div>
    </div>
  )
}

function RoleCounter({
  label,
  description,
  value,
  min,
  max,
  onDec,
  onInc,
  color,
}: {
  label: string
  description: string
  value: number
  min: number
  max: number
  onDec: () => void
  onInc: () => void
  color: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border">
      <div
        className="h-10 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onDec}
          disabled={value <= min}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted font-bold text-foreground disabled:opacity-30"
        >
          −
        </button>
        <span className="w-6 text-center text-lg font-bold tabular-nums text-foreground">{value}</span>
        <button
          onClick={onInc}
          disabled={value >= max}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted font-bold text-foreground disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  )
}

function RoleToggle({
  label,
  description,
  enabled,
  disabled,
  disabledReason,
  onToggle,
  color,
}: {
  label: string
  description: string
  enabled: boolean
  disabled?: boolean
  disabledReason?: string
  onToggle: () => void
  color: string
}) {
  return (
    <button
      onClick={disabled ? undefined : onToggle}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl p-3 text-left ring-1 transition-all',
        disabled
          ? 'cursor-not-allowed bg-muted/30 ring-border opacity-60'
          : 'bg-card ring-border hover:bg-muted/30',
      )}
    >
      <div
        className="h-10 w-1.5 shrink-0 rounded-full opacity-70"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">
          {disabled && disabledReason ? disabledReason : description}
        </p>
      </div>
      <div
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors',
          enabled ? 'bg-primary' : 'bg-muted',
          disabled && 'opacity-50',
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

function CompositionTile({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="rounded-2xl bg-card p-3 text-center ring-1 ring-border">
      <div className="text-2xl font-bold tabular-nums" style={{ color }}>
        {count}
      </div>
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
    </div>
  )
}
