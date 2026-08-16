'use client'

import { motion } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { GameButton } from '@/components/game/GameButton'
import { TimerRing } from '@/components/game/TimerRing'
import { ChaosBanner } from '@/components/game/ChaosBanner'
import { currentTimerSeconds } from '@/lib/game/services/GameSessionManager'
import { haptic } from '@/lib/game/services/haptics'

export function DiscussionScreen() {
  const session = useGameStore(s => s.session)
  const startVoting = useGameStore(s => s.startVoting)
  const [remaining, setRemaining] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!session) return
    const total = currentTimerSeconds(session)
    setRemaining(total)

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setTimeout(() => startVoting(), 600)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [session, startVoting])

  if (!session) return null

  const total = currentTimerSeconds(session)
  const startPlayer = session.players.find(p => p.id === session.startPlayerId)

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Diskussion
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">
            Wer lügt?
          </h1>
        </motion.div>

        {/* Chaos modifier banner — shown if chaos mode is active this round */}
        {session.chaosState.modifier !== 'none' && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex justify-center"
          >
            <ChaosBanner chaosState={session.chaosState} variant="compact" />
          </motion.div>
        )}

        <TimerRing
          totalSeconds={total}
          remainingSeconds={remaining}
          round={session.round}
          startPlayerName={startPlayer?.displayName}
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 flex flex-col items-center gap-3"
        >
          <p className="text-center text-sm text-muted-foreground">
            Tauscht Hinweise aus, diskutiert verdächtiges Verhalten, findet die Impostoren.
          </p>
          <GameButton
            variant="secondary"
            size="md"
            onClick={() => {
              haptic('medium')
              startVoting()
            }}
          >
            Vorzeitig zur Abstimmung
          </GameButton>
        </motion.div>
      </div>
    </div>
  )
}
