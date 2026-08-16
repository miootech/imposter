'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronRight, Eye, EyeOff, Lock } from 'lucide-react'
import { useGameStore } from '@/stores/gameStore'
import { GameButton } from '@/components/game/GameButton'
import { RoleIcon, RoleBadge } from '@/components/game/RoleBadge'
import { MartyrBadge } from '@/components/game/ChaosBanner'
import { PrivacyGuard } from '@/components/common/PrivacyGuard'
import type { PlayerRoleAssignment, RoleId } from '@/lib/game/models'
import { ROLES } from '@/lib/game/models'
import { haptic } from '@/lib/game/services/haptics'
import { playSound } from '@/lib/game/services/sound'
import { cn } from '@/lib/utils'

export function RevealScreen() {
  const session = useGameStore(s => s.session)
  const revealIndex = useGameStore(s => s.revealIndex)
  const markCurrentRevealed = useGameStore(s => s.markCurrentRevealed)
  const advanceReveal = useGameStore(s => s.advanceReveal)
  const startPlay = useGameStore(s => s.startPlay)
  const [revealed, setRevealed] = useState(false)
  const [holdProgress, setHoldProgress] = useState(0)

  useEffect(() => {
    setRevealed(false)
    setHoldProgress(0)
  }, [revealIndex])

  const handleRevealed = useCallback(() => {
    if (revealed) return
    setRevealed(true)
    markCurrentRevealed()
    haptic('success')
    playSound('reveal')
  }, [revealed, markCurrentRevealed])

  const handleAdvance = () => {
    haptic('light')
    advanceReveal()
  }

  if (!session) return null

  // All players have revealed — RevealBetweenScreen handles this state.
  if (revealIndex >= session.assignments.length) {
    return null
  }

  const currentAssignment = session.assignments[revealIndex]
  const currentPlayer = session.players[revealIndex]

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-background px-6"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      <PrivacyGuard active />

      <div className="flex w-full max-w-md flex-col items-center justify-center gap-10">
        {/* Player name */}
        <motion.div
          key={`name-${currentPlayer.id}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Spieler {revealIndex + 1} / {session.assignments.length}
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">
            {currentPlayer.displayName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Nimm das Smartphone, wenn du dran bist.
          </p>
        </motion.div>

        {/* Reveal area — centered */}
        <div className="flex w-full flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {!revealed ? (
              <HoldToReveal
                key="hold"
                onReveal={handleRevealed}
                progress={holdProgress}
                setProgress={setHoldProgress}
              />
            ) : (
              <RevealedContent
                key="revealed"
                assignment={currentAssignment}
                playerName={currentPlayer.displayName}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Bottom action — fixed-height slot to keep layout stable */}
        <div className="flex h-14 items-center justify-center">
          <AnimatePresence>
            {revealed && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <GameButton
                  size="lg"
                  onClick={handleAdvance}
                  rightIcon={<ChevronRight className="h-5 w-5" />}
                >
                  {revealIndex + 1 < session.assignments.length
                    ? `Weiter zu ${session.players[revealIndex + 1]?.displayName ?? 'nächstem Spieler'}`
                    : 'Alle fertig'}
                </GameButton>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function HoldToReveal({
  onReveal,
  progress,
  setProgress,
}: {
  onReveal: () => void
  progress: number
  setProgress: (p: number) => void
}) {
  const [holding, setHolding] = useState(false)
  const startTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const HOLD_DURATION = 600  // ms

  const tick = useCallback(() => {
    if (startTimeRef.current === null) return
    const elapsed = Date.now() - startTimeRef.current
    const pct = Math.min(1, elapsed / HOLD_DURATION)
    setProgress(pct)
    if (pct >= 1) {
      setHolding(false)
      onReveal()
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [onReveal, setProgress])

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

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Pointer + touch handlers with full popup suppression
  // - preventDefault on pointerdown stops the browser's context menu / long-press
  // - touch-action: none on the element prevents touch scrolling gestures
  // - onContextMenu handler explicitly blocks the contextmenu event
  // - user-select: none prevents text selection during long press
  const handlers = {
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault()
      // Cancel any pending context menu / long-press the browser might fire
      ;(e.target as HTMLElement).setAttribute('touch-action', 'none')
      start()
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault()
      stop()
    },
    onPointerLeave: stop,
    onPointerCancel: stop,
    onContextMenu: (e: React.MouseEvent) => {
      // Hard-block the browser context menu (Android long-press popup)
      e.preventDefault()
      e.stopPropagation()
      return false
    },
    onTouchStart: (e: React.TouchEvent) => {
      // Prevent the browser from synthesizing a context menu on long-press
      e.preventDefault()
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault()
    },
    onTouchMove: (e: React.TouchEvent) => {
      // Prevent scrolling while holding
      e.preventDefault()
    },
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center"
      style={{
        // Block native long-press behavior at the CSS level
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <motion.button
        {...handlers}
        className="relative flex h-48 w-48 items-center justify-center rounded-full bg-card shadow-lg ring-1 ring-border focus:outline-none"
        style={{
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
        whileTap={{ scale: 0.95 }}
        aria-label="Gedrückt halten zum Aufdecken"
      >
        {/* Progress ring */}
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 200 200" style={{ pointerEvents: 'none' }}>
          <circle cx="100" cy="100" r="92" fill="none" stroke="var(--muted)" strokeWidth="6" />
          <motion.circle
            cx="100"
            cy="100"
            r="92"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 92}
            strokeDashoffset={2 * Math.PI * 92 * (1 - progress)}
          />
        </svg>
        <div className="flex flex-col items-center pointer-events-none">
          <Eye className="h-10 w-10 text-muted-foreground" />
          <span className="mt-2 text-xs font-medium text-muted-foreground">
            Halten zum Aufdecken
          </span>
        </div>
      </motion.button>
      <p className="mt-6 max-w-xs text-center text-xs text-muted-foreground">
        Drücke und halte den Button, um deine Rolle zu sehen. Lass los, sobald du sie gesehen hast — die Informationen verschwinden automatisch beim Weitergeben.
      </p>
    </motion.div>
  )
}

function RevealedContent({
  assignment,
  playerName,
}: {
  assignment: PlayerRoleAssignment
  playerName: string
}) {
  const session = useGameStore(s => s.session)
  const info = ROLES[assignment.role]
  const [visible, setVisible] = useState(true)

  // Auto-hide after 5 seconds for additional privacy
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 5000)
    return () => clearTimeout(t)
  }, [])

  // Chaos: is this player the martyr?
  const isMartyr = session?.chaosState.modifier === 'maertyrer' &&
    session.chaosState.martyrPlayerId === assignment.playerId

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotateX: -90 }}
      animate={{ opacity: 1, scale: 1, rotateX: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="flex w-full flex-col items-center"
    >
      {/* Big role reveal card */}
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-3xl p-8 shadow-xl',
          'ring-2 transition-all',
        )}
        style={{
          backgroundColor: `var(--${info.colorVar}-soft)`,
          boxShadow: `0 20px 50px -10px var(--${info.colorVar})`,
          borderColor: `var(--${info.colorVar})`,
        }}
      >
        <motion.div
          className="absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl"
          style={{ backgroundColor: `var(--${info.colorVar})` }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        <div className="relative flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="text-7xl"
          >
            <RoleIcon role={assignment.role} size="huge" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-3 text-3xl font-bold"
            style={{ color: `var(--${info.colorVar})` }}
          >
            {info.displayName}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-1 text-sm text-muted-foreground"
          >
            {info.description}
          </motion.p>

          {/* Sensitive info: word + hint */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10 }}
            transition={{ delay: 0.4 }}
            className="mt-6 w-full space-y-3"
          >
            {visible ? (
              <>
                <SensitiveInfo assignment={assignment} />
                {isMartyr && <MartyrBadge />}
              </>
            ) : (
              <button
                onClick={() => setVisible(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-card/60 p-4 text-sm font-medium text-muted-foreground backdrop-blur"
              >
                <EyeOff className="h-4 w-4" />
                Tippen, um erneut zu sehen
              </button>
            )}
          </motion.div>
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {playerName}, merke dir deine Rolle. Tippe „Weiter&quot;, sobald du bereit bist.
      </p>
    </motion.div>
  )
}

function SensitiveInfo({ assignment }: { assignment: PlayerRoleAssignment }) {
  return (
    <div className="space-y-3">
      {assignment.word && (
        <InfoBlock label="Dein Wort" value={assignment.word} highlight />
      )}
      {assignment.hint && (
        <InfoBlock label="Hinweis" value={assignment.hint} />
      )}
      {!assignment.word && !assignment.hint && (
        <div className="rounded-2xl bg-card/60 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Du erhältst keine Hinweise.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Du bist komplett im Dunkeln.
          </p>
        </div>
      )}

      {/* Traitor knowledge */}
      {assignment.knownTraitors && assignment.knownTraitors.length > 0 && (
        <TraitorInfo assignment={assignment} />
      )}
    </div>
  )
}

function InfoBlock({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-2xl p-4 text-center',
        highlight ? 'bg-card shadow-sm' : 'bg-card/60',
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={cn('mt-1', highlight ? 'text-2xl font-bold text-foreground' : 'text-lg font-semibold text-foreground')}>
        {value}
      </p>
    </div>
  )
}

function TraitorInfo({ assignment }: { assignment: PlayerRoleAssignment }) {
  const session = useGameStore(s => s.session)
  if (!session) return null
  const known = assignment.knownTraitors ?? []
  const traitorPlayers = known.map(id => session.players.find(p => p.id === id)).filter(Boolean)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-2xl bg-card p-4"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {assignment.role === 'impostor' ? 'Deine Verräter-Team' : 'Du kennst die Impostoren'}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {traitorPlayers.map(p => (
          <div
            key={p!.id}
            className="flex items-center gap-1.5 rounded-full bg-impostor-soft px-3 py-1.5 text-sm font-semibold"
            style={{ backgroundColor: 'var(--impostor-soft)', color: 'var(--impostor)' }}
          >
            <RoleIcon role="impostor" size="sm" />
            {p!.displayName}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// Silence unused
void RoleBadge
