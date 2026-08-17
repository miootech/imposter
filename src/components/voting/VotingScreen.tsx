'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useCallback, useEffect } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { useGameStore } from '@/stores/gameStore'
import { GameButton } from '@/components/game/GameButton'
import { PrivacyGuard } from '@/components/common/PrivacyGuard'
import { ChaosBanner, DoppelAgentBadge } from '@/components/game/ChaosBanner'
import { canPlayerVote } from '@/lib/game/engines/ChaosEngine'
import { haptic } from '@/lib/game/services/haptics'
import { playSound } from '@/lib/game/services/sound'
import { cn } from '@/lib/utils'

export function VotingScreen() {
  const session = useGameStore(s => s.session)
  const votes = useGameStore(s => s.votes)
  const submitVote = useGameStore(s => s.submitVote)
  const finishVoting = useGameStore(s => s.finishVoting)
  const [currentVoterIndex, setCurrentVoterIndex] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  if (!session) return null

  // Living voters in stored order
  const livingPlayers = session.assignments
    .filter(a => !a.eliminated)
    .map(a => session.players.find(p => p.id === a.playerId)!)
  const currentVoter = livingPlayers[currentVoterIndex]
  const alreadyVoted = currentVoter ? votes.has(currentVoter.id) : false

  const handleConfirm = () => {
    if (!currentVoter || !selectedTarget) return
    submitVote(currentVoter.id, selectedTarget.id)
    setConfirmed(true)
    haptic('success')
    playSound('vote')

    setTimeout(() => {
      if (currentVoterIndex + 1 >= livingPlayers.length) {
        finishVoting()
      } else {
        // Advance to next voter + show inter-vote pass screen
        setCurrentVoterIndex(i => i + 1)
        setConfirmed(false)
        setConfirming(false)
        setSelectedTarget(null)
        // Trigger the inter-vote pass screen
        useGameStore.setState({ gameScreen: 'vote-pass' })
      }
    }, 800)
  }

  const [selectedTarget, setSelectedTarget] = useState<{ id: string; displayName: string; color: string } | null>(null)

  useEffect(() => {
    setSelectedTarget(null)
    setConfirming(false)
    setConfirmed(false)
  }, [currentVoterIndex])

  // All voted — go to results
  if (currentVoterIndex >= livingPlayers.length) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Stimmen werden gezählt…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <PrivacyGuard active />
      <div className="mx-auto w-full max-w-md px-5 pt-12 pb-32">
        {/* Chaos: Spiegel-Voting warning banner */}
        {session.chaosState.modifier === 'spiegel_voting' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <ChaosBanner chaosState={session.chaosState} variant="warning" />
          </motion.div>
        )}

        {/* Chaos: compact banner for other modifiers */}
        {session.chaosState.modifier !== 'none' && session.chaosState.modifier !== 'spiegel_voting' && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex justify-center"
          >
            <ChaosBanner chaosState={session.chaosState} variant="compact" />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center"
        >
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Abstimmung · {currentVoterIndex + 1} / {livingPlayers.length}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">
            {currentVoter.displayName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Wen möchtest du eliminieren? Self-Voting ist erlaubt.
          </p>
        </motion.div>

        {/* Chaos: Doppelagent badge — only on the agent's vote screen */}
        {session.chaosState.modifier === 'doppelagent' &&
         session.chaosState.doubleAgentPlayerId === currentVoter.id && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 flex justify-center"
          >
            <DoppelAgentBadge />
          </motion.div>
        )}

        {/* Voter color indicator — subtle accent bar */}
        <div className="mb-6 flex justify-center">
          <motion.div
            className="h-1.5 w-20 rounded-full"
            style={{ backgroundColor: currentVoter.color }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>

        {/* Candidates — Among Us inspired card grid (2 columns) */}
        <div className="grid grid-cols-2 gap-2.5">
          {livingPlayers.map((p, idx) => {
            const isSelected = selectedTarget?.id === p.id
            const isSelf = p.id === currentVoter.id
            return (
              <motion.button
                key={p.id}
                onClick={() => {
                  if (confirmed) return
                  haptic('light')
                  setSelectedTarget({ id: p.id, displayName: p.displayName, color: p.color })
                  setConfirming(true)
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, type: 'spring', stiffness: 300, damping: 22 }}
                className={cn(
                  'group relative flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition-all',
                  isSelected
                    ? 'bg-primary/10 ring-2 ring-primary shadow-lg'
                    : 'bg-card ring-1 ring-border hover:ring-primary/30',
                )}
                whileTap={{ scale: 0.96 }}
              >
                {/* Large avatar circle */}
                <motion.div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-base font-bold text-white shadow-md"
                  style={{ backgroundColor: p.color }}
                  animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  {p.displayName.slice(0, 2).toUpperCase()}
                </motion.div>
                <p className="text-sm font-semibold text-foreground">{p.displayName}</p>
                {isSelf && (
                  <span className="absolute -top-1.5 right-2 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase text-muted-foreground">
                    Du
                  </span>
                )}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-background"
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </motion.div>
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Hold-to-confirm */}
        <AnimatePresence>
          {confirming && selectedTarget && !confirmed && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-6 left-0 right-0 z-20 px-5"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="mx-auto max-w-md">
                <HoldToConfirmButton
                  targetName={selectedTarget.displayName}
                  onConfirm={handleConfirm}
                  onCancel={() => {
                    haptic('light')
                    setConfirming(false)
                    setSelectedTarget(null)
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirmed feedback */}
        <AnimatePresence>
          {confirmed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="fixed bottom-6 left-0 right-0 z-20 px-5"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="mx-auto max-w-md">
                <div className="flex items-center justify-center gap-2 rounded-2xl bg-success p-4 text-success-foreground shadow-xl">
                  <Check className="h-5 w-5" />
                  <span className="font-semibold">Stimme abgegeben</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function HoldToConfirmButton({
  targetName,
  onConfirm,
  onCancel,
}: {
  targetName: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const [progress, setProgress] = useState(0)
  const [holding, setHolding] = useState(false)
  const startTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const HOLD_DURATION = 800

  const tick = useCallback(() => {
    if (startTimeRef.current === null) return
    const elapsed = Date.now() - startTimeRef.current
    const pct = Math.min(1, elapsed / HOLD_DURATION)
    setProgress(pct)
    if (pct >= 1) {
      setHolding(false)
      onConfirm()
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [onConfirm])

  const start = () => {
    if (holding) return
    setHolding(true)
    startTimeRef.current = Date.now()
    haptic('light')
    rafRef.current = requestAnimationFrame(tick)
  }

  const stop = () => {
    setHolding(false)
    startTimeRef.current = null
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setProgress(0)
  }

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div className="rounded-2xl bg-card p-4 shadow-2xl ring-1 ring-border">
      <p className="mb-2 text-center text-sm text-muted-foreground">
        Halten, um <span className="font-bold text-foreground">{targetName}</span> zu eliminieren
      </p>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="rounded-xl bg-muted px-4 text-sm font-semibold text-foreground"
        >
          Abbrechen
        </button>
        <motion.button
          onPointerDown={(e) => {
            e.preventDefault()
            start()
          }}
          onPointerUp={(e) => {
            e.preventDefault()
            stop()
          }}
          onPointerLeave={stop}
          onPointerCancel={stop}
          onContextMenu={(e) => {
            e.preventDefault()
            e.stopPropagation()
            return false
          }}
          onTouchStart={(e) => e.preventDefault()}
          onTouchEnd={(e) => e.preventDefault()}
          onTouchMove={(e) => e.preventDefault()}
          className="relative flex-1 overflow-hidden rounded-xl bg-destructive py-3 font-semibold text-destructive-foreground"
          style={{
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
          whileTap={{ scale: 0.97 }}
        >
          <motion.div
            className="absolute inset-0 bg-destructive/70"
            animate={{ width: `${progress * 100}%` }}
            style={{ originX: 0, pointerEvents: 'none' }}
          />
          <span className="relative inline-flex items-center gap-2 pointer-events-none">
            <ArrowRight className="h-4 w-4" />
            Bestätigen
          </span>
        </motion.button>
      </div>
    </div>
  )
}
