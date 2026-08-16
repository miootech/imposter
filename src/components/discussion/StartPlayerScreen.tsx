'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Clock } from 'lucide-react'
import { useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { GameButton } from '@/components/game/GameButton'
import { currentTimerSeconds } from '@/lib/game/services/GameSessionManager'
import { formatTime } from '@/lib/game/engines/TimerEngine'
import { haptic } from '@/lib/game/services/haptics'
import { playSound } from '@/lib/game/services/sound'

export function StartPlayerScreen() {
  const session = useGameStore(s => s.session)
  const setScreen = useGameStore.setState

  useEffect(() => {
    haptic('success')
    playSound('reveal')
  }, [])

  if (!session) return null

  const startPlayer = session.players.find(p => p.id === session.startPlayerId)
  if (!startPlayer) return null

  const timerSec = currentTimerSeconds(session)

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="blob-bg" />
      <div className="relative z-10 w-full max-w-md text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-medium uppercase tracking-widest text-muted-foreground"
        >
          Runde {session.round}
        </motion.p>

        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="my-8 flex flex-col items-center"
        >
          <div
            className="flex h-32 w-32 items-center justify-center rounded-full text-5xl font-bold text-white shadow-2xl"
            style={{ backgroundColor: startPlayer.color }}
          >
            {startPlayer.displayName.slice(0, 2).toUpperCase()}
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-3xl font-bold text-foreground"
          >
            {startPlayer.displayName} startet
          </motion.h1>
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <ArrowRight className="h-4 w-4" />
            Im Uhrzeigersinn weiter
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm ring-1 ring-border"
        >
          <Clock className="h-4 w-4" />
          Diskussionszeit: {formatTime(timerSec)}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <GameButton
            size="lg"
            onClick={() => {
              haptic('heavy')
              playSound('select')
              setScreen({ gameScreen: 'discussion' })
            }}
          >
            Zur Diskussion
          </GameButton>
        </motion.div>
      </div>
    </div>
  )
}
