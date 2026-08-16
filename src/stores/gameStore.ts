/**
 * Game Store (Zustand) — UI-side state for navigation and active session
 * ---------------------------------------------------------------------
 *
 * Single source of truth for:
 *   - Top-level tab navigation (Home / Groups / Settings)
 *   - Active game screen (setup / reveal / discussion / voting / results)
 *   - Current GameSession (in-memory only, NEVER persisted)
 *   - Pending votes for the current round
 *   - Last completed GameResult (for results screen)
 *
 * The UI never mutates GameSession directly — it calls action methods that
 * delegate to GameSessionManager (pure functions).
 */

import { create } from 'zustand'
import type {
  GameSession,
  GameSetupConfig,
  GameResult,
} from '../lib/game/models'
import {
  createSession,
  markRevealed,
  eliminatePlayer,
  tieRound,
  advanceRound,
  endSession,
  rerollChaosForNextRound,
} from '../lib/game/services/GameSessionManager'
import { computeScores, buildGameResult } from '../lib/game/engines/ScoreEngine'
import { tallyVotes } from '../lib/game/engines/VotingEngine'
import { checkWinConditions } from '../lib/game/engines/WinConditionEngine'
import {
  findReverseElimination,
  tallyVotesWithDoubleAgent,
  canPlayerVote,
  isMartyrEliminated,
  type ChaosState,
} from '../lib/game/engines/ChaosEngine'

export type Tab = 'home' | 'groups' | 'settings'

export type GameScreen =
  | 'none'
  | 'setup'
  | 'reveal'
  | 'reveal-between'
  | 'start-player'
  | 'discussion'
  | 'voting'
  | 'voting-results'
  | 'elimination'
  | 'results'

interface GameState {
  activeTab: Tab
  gameScreen: GameScreen
  selectedGroupId: string | null

  session: GameSession | null
  revealIndex: number
  votes: Map<string, string>
  currentTally: ReturnType<typeof tallyVotes> | null
  eliminatedPlayerIdThisRound: string | null
  lastResult: GameResult | null

  setActiveTab: (tab: Tab) => void
  openGroupDetail: (groupId: string | null) => void
  startSetup: () => void
  cancelSetup: () => void
  startGame: (config: GameSetupConfig, players: Array<{ id: string; displayName: string; color: string }>) => void
  markCurrentRevealed: () => void
  advanceReveal: () => void
  startPlay: () => void
  submitVote: (voterId: string, targetId: string) => void
  finishVoting: () => void
  proceedFromVotingResults: () => void
  finishDiscussion: () => void
  startVoting: () => void
  backToHome: () => void
  setLastResult: (result: GameResult | null) => void
}

export const useGameStore = create<GameState>((set, get) => ({
  activeTab: 'home',
  gameScreen: 'none',
  selectedGroupId: null,
  session: null,
  revealIndex: 0,
  votes: new Map(),
  currentTally: null,
  eliminatedPlayerIdThisRound: null,
  lastResult: null,

  setActiveTab: (tab) => set({ activeTab: tab, gameScreen: 'none' }),
  openGroupDetail: (groupId) => set({ selectedGroupId: groupId }),

  startSetup: () => set({ gameScreen: 'setup' }),
  cancelSetup: () => set({ gameScreen: 'none' }),

  startGame: (config, players) => {
    const session = createSession(config, players)
    set({
      session,
      revealIndex: 0,
      votes: new Map(),
      currentTally: null,
      eliminatedPlayerIdThisRound: null,
      lastResult: null,
      gameScreen: 'reveal',
    })
  },

  markCurrentRevealed: () => {
    const { session, revealIndex } = get()
    if (!session) return
    const player = session.assignments[revealIndex]
    if (!player) return
    set({ session: markRevealed(session, player.playerId) })
  },

  advanceReveal: () => {
    const { session, revealIndex } = get()
    if (!session) return
    const next = revealIndex + 1
    if (next >= session.assignments.length) {
      // All players revealed — show end-of-reveal privacy screen
      set({ revealIndex: next, gameScreen: 'reveal-between' })
    } else {
      set({ revealIndex: next, gameScreen: 'reveal-between' })
    }
  },

  startPlay: () => set({ gameScreen: 'start-player' }),

  startVoting: () => set({ gameScreen: 'voting', votes: new Map(), currentTally: null }),

  submitVote: (voterId, targetId) => {
    const votes = new Map(get().votes)
    votes.set(voterId, targetId)
    set({ votes })
  },

  finishVoting: () => {
    const { session, votes } = get()
    if (!session) return
    const chaos = session.chaosState
    // Chaos: Doppelagent — agent's vote counts as 2
    const weightedVotes = chaos.modifier === 'doppelagent'
      ? tallyVotesWithDoubleAgent(new Map(votes), chaos.doubleAgentPlayerId)
      : null
    // Chaos: Spiegel-Voting — invert elimination (fewest votes eliminated)
    let tally
    if (chaos.modifier === 'spiegel_voting') {
      const voteMap = weightedVotes ?? tallyVotes(new Map(votes)).sortedCandidates.reduce(
        (m, c) => m.set(c.playerId, c.votes),
        new Map<string, number>(),
      )
      const reverseResult = findReverseElimination(voteMap)
      // Re-shape into a tally-like object compatible with the existing UI
      const sortedCandidates = [...voteMap.entries()]
        .map(([playerId, v]) => ({ playerId, votes: v }))
        .sort((a, b) => b.votes - a.votes)  // For UI: most first (visual only)
      tally = {
        sortedCandidates,
        eliminatedPlayerId: reverseResult.eliminatedPlayerId,
        isTie: reverseResult.isTie,
        maxVotes: reverseResult.minVotes,  // For UI banner: show min as "key" votes
      }
    } else if (weightedVotes) {
      // Doppelagent — build tally from weighted counts
      const sortedCandidates = [...weightedVotes.entries()]
        .map(([playerId, v]) => ({ playerId, votes: v }))
        .sort((a, b) => a.votes - b.votes)
      const maxVotes = sortedCandidates.length > 0 ? sortedCandidates[sortedCandidates.length - 1].votes : 0
      const topCandidates = sortedCandidates.filter(c => c.votes === maxVotes)
      tally = {
        sortedCandidates,
        eliminatedPlayerId: topCandidates.length === 1 ? topCandidates[0].playerId : null,
        isTie: topCandidates.length > 1,
        maxVotes,
      }
    } else {
      tally = tallyVotes(new Map(votes))
    }
    set({ currentTally: tally, gameScreen: 'voting-results' })
  },

  proceedFromVotingResults: () => {
    const { session, currentTally } = get()
    if (!session || !currentTally) return

    if (currentTally.eliminatedPlayerId === null) {
      const tied = tieRound(session)
      const withChaos = rerollChaosForNextRound(tied)
      set({
        session: withChaos,
        gameScreen: 'discussion',
        eliminatedPlayerIdThisRound: null,
        currentTally: null,
        votes: new Map(),
      })
      return
    }

    const eliminatedId = currentTally.eliminatedPlayerId
    const updated = eliminatePlayer(session, eliminatedId)
    set({
      session: updated,
      eliminatedPlayerIdThisRound: eliminatedId,
      gameScreen: 'elimination',
      currentTally: null,
      votes: new Map(),
    })
  },

  finishDiscussion: () => {
    set({ gameScreen: 'voting', votes: new Map(), currentTally: null })
  },

  backToHome: () => {
    set({
      session: null,
      revealIndex: 0,
      votes: new Map(),
      currentTally: null,
      eliminatedPlayerIdThisRound: null,
      lastResult: null,
      gameScreen: 'none',
      activeTab: 'home',
    })
  },

  setLastResult: (result) => set({ lastResult: result }),
}))

/**
 * Build the GameResult from the current session, using the provided points-before map.
 * Pure-ish: reads session state, calls ScoreEngine.
 */
export function buildResultFromSession(
  session: GameSession,
  pointsBefore: Map<string, number>,
): GameResult {
  if (!session.winnerFaction) {
    throw new Error('Cannot build result: game has no winner yet.')
  }
  const firstEliminatedId = session.eliminationOrder[0] ?? null
  const scores = computeScores({
    assignments: session.assignments,
    eliminationOrder: session.eliminationOrder,
    winnerFaction: session.winnerFaction,
    firstEliminatedId,
    jesterFirst: session.jesterFirst,
    jesterSurvived: session.jesterSurvived,
    martyrEliminated: session.martyrEliminated,
    pointsBefore,
  })
  return buildGameResult(
    {
      assignments: session.assignments,
      eliminationOrder: session.eliminationOrder,
      winnerFaction: session.winnerFaction,
      firstEliminatedId,
      jesterFirst: session.jesterFirst,
      jesterSurvived: session.jesterSurvived,
      martyrEliminated: session.martyrEliminated,
      pointsBefore,
    },
    scores,
    session.id,
    session.groupId,
    session.round,
  )
}

/**
 * Continue to next round or end the game (called from elimination screen).
 */
export function proceedAfterElimination(): void {
  const store = useGameStore.getState()
  const session = store.session
  if (!session) return

  if (session.winnerFaction) {
    useGameStore.setState({ gameScreen: 'results' })
  } else {
    const advanced = advanceRound(session)
    // Re-roll chaos modifier for the new round (if chaos mode is on)
    const withChaos = rerollChaosForNextRound(advanced)
    useGameStore.setState({
      session: withChaos,
      gameScreen: 'discussion',
      eliminatedPlayerIdThisRound: null,
    })
  }
}

/**
 * Mark session ended with the determined winner faction.
 */
export function endGame(winnerFaction: 'crew' | 'traitor' | 'neutral'): void {
  const store = useGameStore.getState()
  if (!store.session) return
  const ended = endSession(store.session, winnerFaction)
  useGameStore.setState({ session: ended, gameScreen: 'results' })
}

// Silence unused-import warning for checkWinConditions (used in future extension)
void checkWinConditions
