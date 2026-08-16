'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Check, Skull, Equal } from 'lucide-react'
import { useGameStore, proceedAfterElimination } from '@/stores/gameStore'
import { GameButton } from '@/components/game/GameButton'
import { RoleIcon } from '@/components/game/RoleBadge'
import { haptic } from '@/lib/game/services/haptics'
import { playSound } from '@/lib/game/services/sound'

export function VotingResultsScreen() {
  const session = useGameStore(s => s.session)
  const tally = useGameStore(s => s.currentTally)
  const proceedFromVotingResults = useGameStore(s => s.proceedFromVotingResults)
  const [revealedCount, setRevealedCount] = useState(0)

  useEffect(() => {
    if (!tally || tally.sortedCandidates.length === 0) return
    // Progressive reveal: least votes first, staggered
    const interval = setInterval(() => {
      setRevealedCount(c => {
        if (c >= tally.sortedCandidates.length) {
          clearInterval(interval)
          return c
        }
        haptic('tick')
        return c + 1
      })
    }, 600)
    return () => clearInterval(interval)
  }, [tally])

  useEffect(() => {
    if (!tally) return
    if (revealedCount >= tally.sortedCandidates.length) {
      // Final reveal
      setTimeout(() => {
        if (tally.isTie) {
          haptic('warning')
          playSound('tie')
        } else {
          haptic('error')
          playSound('eliminate')
        }
      }, 200)
    }
  }, [revealedCount, tally])

  if (!session || !tally) return null

  const allRevealed = revealedCount >= tally.sortedCandidates.length

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-background px-5 pt-12 pb-32">
      <div className="mx-auto w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Runde {session.round}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-foreground">Abstimmungsergebnis</h1>
        </motion.div>

        {/* Progressive candidate reveal */}
        <div className="space-y-2">
          {tally.sortedCandidates.map((c, idx) => {
            const player = session.players.find(p => p.id === c.playerId)
            if (!player) return null
            const visible = idx < revealedCount
            const isMax = c.votes === tally.maxVotes
            const isEliminated = c.playerId === tally.eliminatedPlayerId

            return (
              <AnimatePresence key={c.playerId}>
                {visible && (
                  <motion.div
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className={`flex items-center gap-3 rounded-2xl p-4 ring-1 ${
                      isEliminated
                        ? 'bg-destructive/10 ring-destructive shadow-lg'
                        : isMax
                        ? 'bg-card ring-border'
                        : 'bg-card/50 ring-border'
                    }`}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: player.color }}
                    >
                      {player.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{player.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.votes} {c.votes === 1 ? 'Stimme' : 'Stimmen'}
                      </p>
                    </div>
                    {isEliminated ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                      >
                        <Skull className="h-4 w-4" />
                      </motion.div>
                    ) : isMax ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/20 text-warning">
                        <Equal className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            )
          })}
        </div>

        {/* Result summary */}
        <AnimatePresence>
          {allRevealed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              {tally.isTie ? (
                <div className="rounded-2xl bg-warning/10 p-6 text-center ring-1 ring-warning/30">
                  <Equal className="mx-auto h-10 w-10 text-warning" />
                  <h3 className="mt-2 text-xl font-bold text-foreground">Unentschieden</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Niemand wird eliminiert. Der Timer bleibt unverändert.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl bg-destructive/10 p-6 text-center ring-1 ring-destructive/30">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                    className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                  >
                    <Skull className="h-7 w-7" />
                  </motion.div>
                  <h3 className="mt-3 text-xl font-bold text-foreground">
                    {session.players.find(p => p.id === tally.eliminatedPlayerId)?.displayName} eliminiert
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Mit {tally.maxVotes} Stimmen
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Continue button */}
      <AnimatePresence>
        {allRevealed && (
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
                hapticPattern="heavy"
                onClick={() => {
                  haptic('heavy')
                  playSound('select')
                  proceedFromVotingResults()
                }}
                className="shadow-2xl"
              >
                {tally.isTie ? 'Nächste Runde' : 'Rolle aufdecken'}
              </GameButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Elimination screen — shows role of eliminated player
export function EliminationScreen() {
  const session = useGameStore(s => s.session)
  const eliminatedId = useGameStore(s => s.eliminatedPlayerIdThisRound)
  const [showRole, setShowRole] = useState(false)

  useEffect(() => {
    haptic('error')
    playSound('eliminate')
    const t = setTimeout(() => setShowRole(true), 1200)
    return () => clearTimeout(t)
  }, [])

  if (!session || !eliminatedId) return null

  const player = session.players.find(p => p.id === eliminatedId)!
  const assignment = session.assignments.find(a => a.playerId === eliminatedId)!
  const isGameOver = !!session.winnerFaction

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-2xl"
        >
          <Skull className="h-12 w-12" />
        </motion.div>
        <h1 className="mt-6 text-3xl font-bold text-foreground">Eliminiert</h1>
        <p className="mt-2 text-lg text-foreground">{player.displayName}</p>
        <p className="text-sm text-muted-foreground">mit {session.eliminationOrder.length > 0 ? '' : ''} Stimmenmehrheit</p>

        <AnimatePresence>
          {showRole && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="mt-8"
            >
              <div
                className="rounded-3xl p-6 shadow-xl"
                style={{
                  backgroundColor: `var(--${assignment.role === 'crewmate' ? 'crewmate' : assignment.role === 'detective' ? 'detective' : assignment.role === 'impostor' ? 'impostor' : assignment.role === 'accomplice' ? 'accomplice' : 'jester'}-soft)`,
                }}
              >
                <div className="text-6xl">
                  <RoleIcon role={assignment.role} size="huge" />
                </div>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Rolle
                </p>
                <p className="text-2xl font-bold capitalize text-foreground">
                  {assignment.role}
                </p>
                {assignment.word && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Wort: <span className="font-semibold text-foreground">{assignment.word}</span>
                  </p>
                )}
              </div>

              <div className="mt-8">
                <GameButton
                  size="lg"
                  onClick={() => {
                    haptic('heavy')
                    playSound('select')
                    if (isGameOver) {
                      useGameStore.setState({ gameScreen: 'results' })
                    } else {
                      // Next round
                      proceedAfterElimination()
                    }
                  }}
                >
                  {isGameOver ? 'Ergebnis ansehen' : 'Nächste Runde'}
                </GameButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
