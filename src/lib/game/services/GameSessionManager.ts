/**
 * GameSessionManager (§51, §67, §88)
 * ----------------------------------
 * Orchestrates a game in memory. NOT persisted to disk until the game completes (§75, §88).
 * On crash/abort: no state is recovered, no stats are written (§76).
 *
 * This module is framework-agnostic. It exposes pure-ish functions that take
 * the current session + an action and return a new session.
 *
 * The UI never mutates a session directly — it dispatches actions through this manager.
 */

import type {
  GameSession,
  GameSetupConfig,
  PlayerRoleAssignment,
  Faction,
} from '../models'
import { computeRoleComposition } from '../rules/GameRules'
import { buildAssignments } from '../engines/RoleAssignmentEngine'
import { selectWords, type WordSelectionResult } from '../engines/WordSelectionEngine'
import { applyHints } from '../engines/HintEngine'
import { pickStartPlayer, type StartPlayerContext } from '../engines/StartPlayerEngine'
import { checkWinConditions, wasJesterFirst, didJesterSurvive } from '../engines/WinConditionEngine'
import { getCategoryById } from '../content/catalog'
import { getTimerSeconds } from '../engines/TimerEngine'
import {
  emptyChaosState,
  initChaosState,
  pickChaosModifier,
  type ChaosState,
} from '../engines/ChaosEngine'

export type SessionAction =
  | { type: 'INIT'; players: Array<{ id: string; displayName: string; color: string }>; rng?: () => number }
  | { type: 'MARK_REVEALED'; playerId: string }
  | { type: 'START_PLAY' }
  | { type: 'ADVANCE_ROUND'; hadElimination: boolean }
  | { type: 'ELIMINATE'; playerId: string; rng?: () => number }
  | { type: 'TIE_ROUND' }

/**
 * Create a fresh session from a setup config + player list.
 * Performs §51 initialization steps 1-10.
 */
export function createSession(
  config: GameSetupConfig,
  players: Array<{ id: string; displayName: string; color: string }>,
  rng: () => number = Math.random,
): GameSession {
  const composition = computeRoleComposition(players.length, config)
  if (!composition) {
    throw new Error('Invalid role composition for this player count.')
  }

  // §51.4: Main word from chosen category
  const category = getCategoryById(config.categoryId)
  const selection: WordSelectionResult = selectWords(category, rng)

  // §51.3: Assign roles to players (shuffled)
  let assignments: PlayerRoleAssignment[] = buildAssignments(
    players.map(p => p.id),
    composition,
    rng,
  )

  // §51.5-6: Apply hints based on mode
  assignments = applyHints(assignments, selection, config.mode)

  // §51.9: Pick start player
  const startCtx: StartPlayerContext = {
    assignments,
    mode: config.mode,
    mainHint: selection.mainHint,
  }
  const startPlayerId = pickStartPlayer(startCtx, rng)

  return {
    id: `game_${Date.now()}_${Math.floor(rng() * 1000000)}`,
    groupId: config.groupId,
    config,
    players: players.map(p => ({ id: p.id, displayName: p.displayName, color: p.color })),
    assignments,
    mainWord: selection.mainWord,
    mainHint: selection.mainHint,
    jesterWord: selection.jesterWord,
    jesterCategoryId: selection.jesterCategoryId,
    startPlayerId,
    round: 1,
    lastRoundHadElimination: false,
    eliminationOrder: [],
    jesterFirst: false,
    jesterSurvived: false,
    chaosState: initChaosForRound(config.chaosMode, assignments, rng),
    martyrEliminated: false,
    startedAt: Date.now(),
  }
}

/**
 * Pick & init the chaos state for a new round.
 * If chaos mode is off, returns empty state.
 */
function initChaosForRound(
  chaosMode: boolean,
  assignments: PlayerRoleAssignment[],
  rng: () => number,
): ChaosState {
  if (!chaosMode) return emptyChaosState()
  const modifier = pickChaosModifier(rng)
  return initChaosState(modifier, assignments, rng)
}

/**
 * Re-roll the chaos modifier for the next round.
 * Called by advanceRound.
 */
export function rerollChaosForNextRound(
  session: GameSession,
  rng: () => number = Math.random,
): GameSession {
  if (!session.config.chaosMode) {
    return { ...session, chaosState: emptyChaosState() }
  }
  const newChaos = initChaosState(pickChaosModifier(rng), session.assignments, rng)
  return { ...session, chaosState: newChaos }
}

/**
 * Mark a player as having revealed their role.
 */
export function markRevealed(session: GameSession, playerId: string): GameSession {
  return {
    ...session,
    assignments: session.assignments.map(a =>
      a.playerId === playerId ? { ...a, revealed: true } : a,
    ),
  }
}

/**
 * Eliminate a player. Updates elimination order, checks win conditions,
 * returns new session with possibly-set winnerFaction.
 *
 * §67 post-elimination steps:
 *   1. Mark eliminated
 *   2. Update elimination order
 *   3. Check win conditions
 *   4. If game over → winnerFaction set; else continue
 */
export function eliminatePlayer(
  session: GameSession,
  playerId: string,
  rng: () => number = Math.random,
): GameSession {
  const order = session.eliminationOrder.length
  const updatedAssignments = session.assignments.map(a =>
    a.playerId === playerId
      ? { ...a, eliminated: true, eliminationOrder: order }
      : a,
  )
  const updatedEliminationOrder = [...session.eliminationOrder, playerId]

  // Update jester flags
  const jesterFirst = wasJesterFirst(updatedAssignments, updatedEliminationOrder)
  const jesterSurvived = didJesterSurvive(updatedAssignments)

  // Update martyr flag (chaos mode)
  const martyrEliminated = session.martyrEliminated ||
    (session.chaosState.modifier === 'maertyrer' &&
     session.chaosState.martyrPlayerId === playerId)

  // Check win conditions
  const winCheck = checkWinConditions(updatedAssignments)

  let nextStartPlayerId = session.startPlayerId
  if (winCheck.winner === null) {
    // If the start player was eliminated, pick a new one for the next round
    if (playerId === session.startPlayerId) {
      const startCtx: StartPlayerContext = {
        assignments: updatedAssignments,
        mode: session.config.mode,
        mainHint: session.mainHint,
      }
      nextStartPlayerId = pickStartPlayer(startCtx, rng)
    }
  }

  return {
    ...session,
    assignments: updatedAssignments,
    eliminationOrder: updatedEliminationOrder,
    jesterFirst,
    jesterSurvived,
    martyrEliminated,
    winnerFaction: winCheck.winner ?? undefined,
    lastRoundHadElimination: true,
    startPlayerId: nextStartPlayerId,
  }
}

/**
 * Apply a tie round: nobody eliminated, timer does not reduce (§48, §65).
 * Round number still advances for tracking, but effective timer round stays.
 * We track this via `lastRoundHadElimination = false`.
 */
export function tieRound(session: GameSession): GameSession {
  return {
    ...session,
    round: session.round + 1,
    lastRoundHadElimination: false,
  }
}

/**
 * Advance to the next round after a real elimination.
 */
export function advanceRound(
  session: GameSession,
  rng: () => number = Math.random,
): GameSession {
  if (session.winnerFaction) return session  // game over

  const startCtx: StartPlayerContext = {
    assignments: session.assignments,
    mode: session.config.mode,
    mainHint: session.mainHint,
  }
  // Pick a new random start player for the new round (clockwise from new random start)
  const newStart = pickStartPlayer(startCtx, rng)

  return {
    ...session,
    round: session.round + 1,
    lastRoundHadElimination: true,
    startPlayerId: newStart,
  }
}

/**
 * Mark session as ended.
 */
export function endSession(session: GameSession, winnerFaction: Faction): GameSession {
  return {
    ...session,
    winnerFaction,
    endedAt: Date.now(),
    jesterSurvived: didJesterSurvive(session.assignments),
  }
}

/**
 * Determine the player whose turn it is to reveal next.
 * Returns the first non-revealed player, or null if all done.
 */
export function nextRevealPlayer(session: GameSession): PlayerRoleAssignment | null {
  return session.assignments.find(a => !a.revealed) ?? null
}

/**
 * Get the current timer duration in seconds for the session,
 * accounting for tie rounds (timer doesn't advance).
 */
export function currentTimerSeconds(session: GameSession): number {
  const eliminationRounds = session.eliminationOrder.length
  const effectiveRound = eliminationRounds + 1
  return getTimerSeconds(session.players.length, effectiveRound)
}
