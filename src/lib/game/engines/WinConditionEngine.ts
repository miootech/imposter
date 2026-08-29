/**
 * WinConditionEngine (§68)
 * ------------------------
 * Pure functions for checking win conditions.
 *
 * CREW wins: all impostors eliminated.
 * TRAITORS win: living impostors + (living accomplice if exists) >= all other living players.
 *   Note: accomplice alone cannot win (§68). The accomplice counts toward the
 *   traitor parity only if at least one impostor is still alive.
 * JESTER: neutral. If first eliminated, personal special condition is met but
 *   the game continues (§22, §68).
 */

import type { Faction, PlayerRoleAssignment } from '../models'

export interface WinCheckResult {
  winner: Faction | null
  /** Whether traitors have reached parity (≥ other living players) */
  traitorsReachedParity: boolean
  /** Number of living impostors */
  livingImpostors: number
  /** Number of living accomplices (0 or 1) */
  livingAccomplice: number
  /** Total living players */
  livingPlayers: number
}

export function checkWinConditions(
  assignments: PlayerRoleAssignment[],
): WinCheckResult {
  const living = assignments.filter(a => !a.eliminated)
  const livingImpostors = living.filter(a => a.role === 'impostor').length
  const livingAccomplice = living.filter(a => a.role === 'accomplice').length
  const livingPlayers = living.length

  // Crew wins: all impostors eliminated
  if (livingImpostors === 0) {
    return {
      winner: 'crew',
      traitorsReachedParity: false,
      livingImpostors: 0,
      livingAccomplice,
      livingPlayers,
    }
  }

  // Traitor parity check: living impostors + living accomplice >= other living players.
  // "Other living players" = livingPlayers - (impostors + accomplice)
  // Condition: impostors + accomplice >= other_living
  //          = impostors + accomplice >= livingPlayers - impostors - accomplice
  //          = 2*(impostors + accomplice) >= livingPlayers
  const traitorCount = livingImpostors + livingAccomplice
  const otherLiving = livingPlayers - traitorCount
  const traitorsReachedParity = traitorCount >= otherLiving && livingImpostors > 0

  if (traitorsReachedParity) {
    return {
      winner: 'traitor',
      traitorsReachedParity: true,
      livingImpostors,
      livingAccomplice,
      livingPlayers,
    }
  }

  return {
    winner: null,
    traitorsReachedParity,
    livingImpostors,
    livingAccomplice,
    livingPlayers,
  }
}

/**
 * Check whether the jester was the first player eliminated.
 * Used by ScoreEngine (§73: +5 if jester first).
 */
export function wasJesterFirst(
  assignments: PlayerRoleAssignment[],
  eliminationOrder: string[],
): boolean {
  if (eliminationOrder.length === 0) return false
  const firstId = eliminationOrder[0]
  const firstAssignment = assignments.find(a => a.playerId === firstId)
  return firstAssignment?.role === 'jester'
}

/**
 * Check whether the jester survived to the end of the game.
 */
export function didJesterSurvive(assignments: PlayerRoleAssignment[]): boolean {
  const jester = assignments.find(a => a.role === 'jester')
  if (!jester) return false
  return !jester.eliminated
}
