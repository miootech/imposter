/**
 * ScoreEngine (§69, §70, §71, §72, §73)
 * -------------------------------------
 * Pure function that takes a GameResult-like input and produces per-player
 * score deltas. UI must NEVER compute points (§69).
 *
 * Scoring rules summary:
 *
 * Base point: every player who finished the game gets +1.
 *
 * CREW (Crewmate + Detective) — §70:
 *   +1 base
 *   +3 if an impostor is eliminated first
 *   +2 if jester is eliminated first AND at least one impostor is eliminated later
 *   +1 if a regular Crewmate is eliminated first
 *   +0 bonus (base only) if Detective is eliminated first
 *
 * TRAITORS (Impostor + Accomplice) — §71, §72:
 *   +1 base
 *   Boni only on TRAITOR WIN:
 *     +3 if Detective eliminated first
 *     +2 if Crewmate or Jester eliminated first
 *     +1 if Accomplice sacrificed as shield first AND an impostor alone wins
 *     +0 bonus if an Impostor is caught first
 *   Surviving impostors get full traitor points.
 *
 * JESTER — §73:
 *   +1 base
 *   +5 if eliminated first
 *   +2 if eliminated later (not first)
 *   +3 if survived to game end
 *   No crew / traitor points.
 *
 * NOTE: The jester is NEUTRAL and does not "win" or "lose" with crew/traitor.
 */

import type { GameResult, PlayerScoreResult, PlayerRoleAssignment, RoleId, Faction } from '../models'

export interface ScoreInput {
  assignments: PlayerRoleAssignment[]
  eliminationOrder: string[]
  winnerFaction: Faction
  firstEliminatedId: string | null
  jesterFirst: boolean
  jesterSurvived: boolean
  /** True if the martyr (chaos mode) was eliminated — traitors get +3 bonus */
  martyrEliminated?: boolean
  /** Points before this game, keyed by playerId */
  pointsBefore: Map<string, number>
}

export function computeScores(input: ScoreInput): PlayerScoreResult[] {
  const {
    assignments,
    eliminationOrder,
    winnerFaction,
    firstEliminatedId,
    jesterFirst,
    jesterSurvived,
    pointsBefore,
  } = input

  const firstEliminatedAssignment = firstEliminatedId
    ? assignments.find(a => a.playerId === firstEliminatedId) ?? null
    : null
  const roleOfFirst = firstEliminatedAssignment?.role ?? null
  const detectiveWasFirst = roleOfFirst === 'detective'
  const impostorWasFirst = roleOfFirst === 'impostor'
  const crewmateWasFirst = roleOfFirst === 'crewmate'
  const accompliceWasFirst = roleOfFirst === 'accomplice'

  // Check if any impostor was eliminated at any point during the game (for crew bonus)
  const anyImpostorEliminated = eliminationOrder.some(id => {
    const a = assignments.find(x => x.playerId === id)
    return a?.role === 'impostor'
  })

  return assignments.map(a => {
    const before = pointsBefore.get(a.playerId) ?? 0
    let earned = 1  // base point for completing the game
    let won = false

    if (a.role === 'crewmate' || a.role === 'detective') {
      won = winnerFaction === 'crew'
      if (impostorWasFirst) {
        earned += 3
      } else if (jesterFirst && anyImpostorEliminated) {
        earned += 2
      } else if (crewmateWasFirst) {
        earned += 1
      }
      // Detective first: no extra bonus, base only
    } else if (a.role === 'impostor' || a.role === 'accomplice') {
      won = winnerFaction === 'traitor'
      if (won) {
        // Boni only on traitor win
        if (detectiveWasFirst) {
          earned += 3
        } else if (crewmateWasFirst || jesterFirst) {
          earned += 2
        } else if (accompliceWasFirst) {
          // Accomplice sacrificed first AND at least one impostor alive at end
          // "an impostor alone wins" — interpret as traitors won and ≥1 impostor survived
          const livingImpostors = assignments.filter(
            x => x.role === 'impostor' && !x.eliminated,
          ).length
          if (livingImpostors > 0) {
            earned += 1
          }
        }
        // Impostor first: no bonus
        // Chaos mode: martyr eliminated → +3 bonus for traitors
        if (input.martyrEliminated) {
          earned += 3
        }
      }
    } else if (a.role === 'jester') {
      // Neutral: no "win" in faction sense
      won = false
      if (jesterFirst) {
        earned += 5
      } else if (a.eliminated) {
        // Eliminated later (not first)
        earned += 2
      } else if (jesterSurvived) {
        earned += 3
      }
    }

    return {
      playerId: a.playerId,
      role: a.role,
      faction: factionOf(a.role),
      pointsEarned: earned,
      pointsBefore: before,
      pointsAfter: before + earned,
      survived: !a.eliminated,
      won,
    }
  })
}

function factionOf(role: RoleId): Faction {
  switch (role) {
    case 'crewmate':
    case 'detective':
      return 'crew'
    case 'impostor':
    case 'accomplice':
      return 'traitor'
    case 'jester':
      return 'neutral'
  }
}

/**
 * Build a full GameResult from a ScoreInput + computed scores.
 */
export function buildGameResult(
  input: ScoreInput,
  scores: PlayerScoreResult[],
  gameId: string,
  groupId: string,
  roundCount: number,
): GameResult {
  const livingImpostors = input.assignments.filter(
    a => a.role === 'impostor' && !a.eliminated,
  ).length
  const firstEliminatedAssignment = input.firstEliminatedId
    ? input.assignments.find(a => a.playerId === input.firstEliminatedId) ?? null
    : null

  return {
    gameId,
    groupId,
    winnerFaction: input.winnerFaction,
    roundCount,
    eliminationOrder: input.eliminationOrder,
    firstEliminated: input.firstEliminatedId,
    roleOfFirstEliminated: firstEliminatedAssignment?.role ?? null,
    jesterFirst: input.jesterFirst,
    jesterSurvived: input.jesterSurvived,
    detectiveWasFirst: firstEliminatedAssignment?.role === 'detective',
    impostorsRemaining: livingImpostors,
    traitorsReachedParity: input.winnerFaction === 'traitor',
    martyrEliminated: input.martyrEliminated ?? false,
    playerResults: scores,
    completedAt: Date.now(),
  }
}
