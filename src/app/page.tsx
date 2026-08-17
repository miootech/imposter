'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '@/stores/gameStore'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { AppProviders } from '@/components/common/AppProviders'
import { BottomNav } from '@/components/game/BottomNav'
import { HomeScreen } from '@/components/home/HomeScreen'
import { GroupsScreen } from '@/components/groups/GroupsScreen'
import { GroupDetailScreen } from '@/components/groups/GroupDetailScreen'
import { SettingsScreen } from '@/components/settings/SettingsScreen'
import { SetupScreen } from '@/components/setup/SetupScreen'
import { RevealScreen } from '@/components/reveal/RevealScreen'
import { StartPlayerScreen } from '@/components/discussion/StartPlayerScreen'
import { DiscussionScreen } from '@/components/discussion/DiscussionScreen'
import { VotingScreen } from '@/components/voting/VotingScreen'
import { VotingResultsScreen, EliminationScreen } from '@/components/voting/VotingResultsScreen'
import { ResultsScreen } from '@/components/results/ResultsScreen'
import { ChaosSlotMachine } from '@/components/game/ChaosSlotMachine'

function AppShell() {
  const activeTab = useGameStore(s => s.activeTab)
  const gameScreen = useGameStore(s => s.gameScreen)
  const selectedGroupId = useGameStore(s => s.selectedGroupId)
  const hydrate = usePreferencesStore(s => s.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  // Game screens take over the full viewport (no bottom nav)
  if (gameScreen !== 'none') {
    return (
      <main className="min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={gameScreen}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {gameScreen === 'setup' && <SetupScreen />}
            {gameScreen === 'reveal' && <RevealScreen />}
            {gameScreen === 'reveal-between' && <RevealBetweenScreen />}
            {gameScreen === 'chaos-reveal' && <ChaosSlotMachineScreen />}
            {gameScreen === 'start-player' && <StartPlayerScreen />}
            {gameScreen === 'discussion' && <DiscussionScreen />}
            {gameScreen === 'voting' && <VotingScreen />}
            {gameScreen === 'vote-pass' && <VotePassScreen />}
            {gameScreen === 'voting-results' && <VotingResultsScreen />}
            {gameScreen === 'elimination' && <EliminationScreen />}
            {gameScreen === 'results' && <ResultsScreen />}
          </motion.div>
        </AnimatePresence>
      </main>
    )
  }

  // Group detail is shown within the Groups tab
  const showGroupDetail = activeTab === 'groups' && selectedGroupId !== null

  return (
    <main className="min-h-screen pb-20">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeTab}-${selectedGroupId ?? 'none'}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'home' && <HomeScreen />}
          {activeTab === 'groups' && !showGroupDetail && <GroupsScreen />}
          {activeTab === 'groups' && showGroupDetail && <GroupDetailScreen />}
          {activeTab === 'settings' && <SettingsScreen />}
        </motion.div>
      </AnimatePresence>
      <BottomNav />
    </main>
  )
}

// Inter-player privacy screen between reveals
function RevealBetweenScreen() {
  const session = useGameStore(s => s.session)
  const revealIndex = useGameStore(s => s.revealIndex)
  const startPlay = useGameStore(s => s.startPlay)

  if (!session) return null

  // When all players have revealed, show end-of-reveal privacy screen
  if (revealIndex >= session.assignments.length) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <PrivacyGuardSimple />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center"
        >
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted text-5xl">
            🔒
          </div>
          <h2 className="text-2xl font-bold text-foreground">Alle bereit</h2>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Alle Spieler haben ihre Rollen gesehen. Das Smartphone kann hingelegt werden.
          </p>
          <div className="mt-8">
            <button
              onClick={() => {
                // If chaos mode is active and a modifier is set, show slot machine first
                if (session.config.chaosMode && session.chaosState.modifier !== 'none') {
                  useGameStore.setState({ gameScreen: 'chaos-reveal' })
                } else {
                  startPlay()
                }
              }}
              className="rounded-2xl bg-primary px-10 py-4 font-semibold text-primary-foreground shadow-lg"
            >
              Spiel starten
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Otherwise: pass-the-phone screen
  const nextPlayer = session.players[revealIndex]

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted text-4xl">
          📱
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Smartphone weitergeben
        </h2>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          An {nextPlayer?.displayName} weitergeben.
        </p>
        <div className="mt-8">
          <button
            onClick={() => {
              // Switch back to reveal screen for next player
              useGameStore.setState({ gameScreen: 'reveal' })
            }}
            className="rounded-2xl bg-primary px-10 py-4 font-semibold text-primary-foreground shadow-lg"
          >
            {nextPlayer?.displayName} ist bereit
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function PrivacyGuardSimple() {
  return null
}

// Chaos slot machine screen — shown after reveal if chaos mode is active
function ChaosSlotMachineScreen() {
  const session = useGameStore(s => s.session)
  const startPlay = useGameStore(s => s.startPlay)
  if (!session) return null
  return (
    <ChaosSlotMachine
      chaosState={session.chaosState}
      onContinue={() => startPlay()}
    />
  )
}

// Vote-Pass screen — inter-vote privacy screen shown between each voter
function VotePassScreen() {
  const session = useGameStore(s => s.session)
  const votes = useGameStore(s => s.votes)
  if (!session) return null

  // Determine who votes next — the first living player who hasn't voted yet
  const livingPlayers = session.assignments
    .filter(a => !a.eliminated)
    .map(a => session.players.find(p => p.id === a.playerId)!)
  const nextVoter = livingPlayers.find(p => !votes.has(p.id)) ?? null

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-muted text-4xl"
        >
          📱
        </motion.div>
        <h2 className="text-2xl font-bold text-foreground">Smartphone weitergeben</h2>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          An <span className="font-bold text-foreground">{nextVoter?.displayName}</span> weitergeben.
        </p>
        <div className="mt-8">
          <button
            onClick={() => useGameStore.setState({ gameScreen: 'voting' })}
            className="rounded-2xl bg-primary px-10 py-4 font-semibold text-primary-foreground shadow-lg"
          >
            {nextVoter?.displayName} ist bereit
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function Home() {
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  )
}
