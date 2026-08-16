'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Trophy, Skull, Heart, Crown, Home } from 'lucide-react'
import { useGameStore, buildResultFromSession } from '@/stores/gameStore'
import { GameButton } from '@/components/game/GameButton'
import { RoleIcon } from '@/components/game/RoleBadge'
import { CountUp } from '@/components/game/AnimatedNumber'
import { applyGameResult, getGroup } from '@/lib/repositories/groupRepository'
import type { GameResult, Faction } from '@/lib/game/models'
import { haptic } from '@/lib/game/services/haptics'
import { playSound } from '@/lib/game/services/sound'

const FACTION_INFO: Record<Faction, { label: string; color: string; icon: string }> = {
  crew: { label: 'Crew gewinnt', color: 'var(--crewmate)', icon: '🛡️' },
  traitor: { label: 'Verräter gewinnen', color: 'var(--impostor)', icon: '👤' },
  neutral: { label: 'Unentschieden', color: 'var(--jester)', icon: '🤡' },
}

export function ResultsScreen() {
  const session = useGameStore(s => s.session)
  const backToHome = useGameStore(s => s.backToHome)
  const setLastResult = useGameStore(s => s.setLastResult)
  const [result, setResult] = useState<GameResult | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!session || !session.winnerFaction) return
    ;(async () => {
      const group = await getGroup(session.groupId)
      if (!group) return
      const pointsBefore = new Map<string, number>()
      for (const p of group.players) pointsBefore.set(p.id, p.points)
      const built = buildResultFromSession(session, pointsBefore)
      setResult(built)
      setLastResult(built)
      haptic('victory')
      playSound('victory')
      // Persist
      try {
        await applyGameResult(built)
        setSaved(true)
      } catch (e) {
        console.error('Failed to persist game result', e)
      }
    })()
  }, [session, setLastResult])

  if (!session || !result) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const winnerInfo = FACTION_INFO[result.winnerFaction]
  const sortedResults = [...result.playerResults].sort((a, b) => b.pointsEarned - a.pointsEarned)

  return (
    <div className="relative min-h-screen overflow-hidden bg-background pb-32">
      {/* Decorative blob */}
      <div
        className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full blur-3xl opacity-30"
        style={{ backgroundColor: winnerInfo.color }}
      />

      <div className="relative z-10 mx-auto max-w-md px-5 pt-16">
        {/* Winner banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-center"
        >
          <motion.div
            initial={{ rotate: -10, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }}
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-full text-5xl shadow-2xl"
            style={{ backgroundColor: `${winnerInfo.color}30` }}
          >
            {winnerInfo.icon}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-3xl font-bold"
            style={{ color: winnerInfo.color }}
          >
            {winnerInfo.label}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-1 text-sm text-muted-foreground"
          >
            {result.roundCount} Runden · {result.eliminationOrder.length} Eliminierungen
          </motion.p>
        </motion.div>

        {/* Jester status */}
        {(result.jesterFirst || result.jesterSurvived) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 rounded-2xl bg-jester-soft p-4 text-center"
            style={{ backgroundColor: 'var(--jester-soft)' }}
          >
            <p className="text-sm font-semibold" style={{ color: 'var(--jester)' }}>
              {result.jesterFirst ? '🤡 Jester wurde als Erster eliminiert — Mission erfüllt!' : '🤡 Jester hat überlebt — Beeindruckend!'}
            </p>
          </motion.div>
        )}

        {/* Chaos: Märtyrer eliminated */}
        {result.martyrEliminated && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 200, damping: 12 }}
            className="mt-4 rounded-2xl p-4 text-center ring-2"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--impostor) 15%, transparent)',
              borderColor: 'var(--impostor)',
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-3xl mb-1"
            >
              🎯
            </motion.div>
            <p className="text-sm font-bold" style={{ color: 'var(--impostor)' }}>
              MÄRTYRER ELIMINIERT!
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              +3 Punkte für die Verräter.
            </p>
          </motion.div>
        )}

        {/* Player results */}
        <div className="mt-8 space-y-2">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Punkte
          </h2>
          {sortedResults.map((pr, idx) => {
            const player = session.players.find(p => p.id === pr.playerId)!
            return (
              <motion.div
                key={pr.playerId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + idx * 0.1 }}
                className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: player.color }}
                >
                  {player.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{player.displayName}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <RoleIcon role={pr.role} size="sm" />
                    <span className="capitalize">{pr.role}</span>
                    {pr.survived ? (
                      <Heart className="h-3 w-3 text-success" />
                    ) : (
                      <Skull className="h-3 w-3 text-muted-foreground" />
                    )}
                    {pr.won && <Crown className="h-3 w-3" style={{ color: winnerInfo.color }} />}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm text-muted-foreground">{pr.pointsBefore}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-lg font-bold tabular-nums text-foreground">
                      <CountUp from={pr.pointsBefore} to={pr.pointsAfter} duration={1.2} />
                    </span>
                  </div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--success)' }}>
                    +{pr.pointsEarned}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Elimination order */}
        {result.eliminationOrder.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-8"
          >
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Eliminierungs-Reihenfolge
            </h2>
            <div className="flex flex-wrap gap-2">
              {result.eliminationOrder.map((id, idx) => {
                const p = session.players.find(pp => pp.id === id)!
                const assignment = session.assignments.find(a => a.playerId === id)!
                return (
                  <motion.div
                    key={id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.3 + idx * 0.1, type: 'spring', stiffness: 200, damping: 15 }}
                    className="flex items-center gap-2 rounded-full bg-card py-1.5 pl-1.5 pr-3 ring-1 ring-border"
                  >
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: p.color }}
                    >
                      {idx + 1}
                    </div>
                    <span className="text-sm font-medium text-foreground">{p.displayName}</span>
                    <RoleIcon role={assignment.role} size="sm" />
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Save status */}
        {saved && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-center text-xs text-muted-foreground"
          >
            ✓ Statistiken aktualisiert
          </motion.p>
        )}
      </div>

      {/* Continue button */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="fixed bottom-6 left-0 right-0 z-20 px-5"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto max-w-md">
          <GameButton
            size="lg"
            fullWidth
            onClick={() => {
              haptic('heavy')
              playSound('select')
              backToHome()
            }}
            leftIcon={<Home className="h-5 w-5" />}
            className="shadow-2xl"
          >
            Zurück zum Home
          </GameButton>
        </div>
      </motion.div>
    </div>
  )
}

// Silence unused
void Trophy
void AnimatePresence
