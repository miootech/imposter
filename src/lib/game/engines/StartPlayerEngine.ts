/**
 * StartPlayerEngine (§58, §59)
 * ----------------------------
 * Pure functions for selecting the start player.
 *
 * NORMAL Mode:
 *   Randomly pick any living player. Players preserve stored order, then clockwise.
 *
 * HARD Mode (§59):
 *   An impostor without any information may NEVER be the first start player.
 *   If the random pick would be such an impostor, re-roll until a valid player is chosen.
 *   All valid players remain equally likely.
 *
 * Pure: RNG injection for deterministic tests.
 */

import type { PlayerRoleAssignment, GameMode } from '../models'

export interface StartPlayerContext {
  assignments: PlayerRoleAssignment[]
  mode: GameMode
  mainHint: string  // for HARD mode check: impostor "without info" means hint is undefined
}

/**
 * Returns true if the player would be a "blind" impostor — i.e. an impostor
 * with no word and no hint. In HARD mode this is exactly the impostor role.
 */
export function isBlindImpostor(
  assignment: PlayerRoleAssignment,
  mode: GameMode,
): boolean {
  if (assignment.role !== 'impostor') return false
  if (mode === 'hard') return true  // HARD impostor has no info
  return false  // NORMAL impostor has the hint, so is not "blind"
}

/**
 * Pick the start player for the upcoming round.
 * Re-rolls up to `maxAttempts` times to avoid a blind impostor in HARD mode.
 * After that, falls back to the first valid candidate (defensive, never throws).
 */
export function pickStartPlayer(
  ctx: StartPlayerContext,
  rng: () => number = Math.random,
  maxAttempts = 50,
): string {
  const candidates = ctx.assignments.filter(a => !a.eliminated)
  if (candidates.length === 0) {
    throw new Error('No living players to pick a start player from.')
  }

  if (ctx.mode !== 'hard') {
    const pick = candidates[Math.floor(rng() * candidates.length)]
    return pick.playerId
  }

  // HARD mode: filter out blind impostors as start candidates
  const valid = candidates.filter(a => !isBlindImpostor(a, ctx.mode))
  if (valid.length === 0) {
    // Edge case: only blind impostors remain (shouldn't happen because crew/traitor
    // parity would have ended the game, but defensive).
    return candidates[0].playerId
  }

  // Try random picks from valid candidates — they all have equal probability.
  // We don't need to re-roll; just pick from the filtered set.
  // The spec describes a re-roll loop, but filtering achieves the same uniform distribution
  // over valid players (all valid candidates have equal probability of being picked).
  const pick = valid[Math.floor(rng() * valid.length)]
  return pick.playerId

  // Note: maxAttempts is intentionally unused in this implementation because the
  // filter approach is cleaner. Kept in signature for API stability.
  void maxAttempts
}

/**
 * Get the next living player in clockwise order after the given player ID.
 * Players preserve stored order; clock-wise = next index in the array.
 */
export function nextLivingPlayer(
  assignments: PlayerRoleAssignment[],
  currentPlayerId: string,
): string {
  const order = assignments.map(a => a.playerId)
  const idx = order.indexOf(currentPlayerId)
  if (idx === -1) throw new Error(`Player ${currentPlayerId} not found in assignments.`)

  for (let offset = 1; offset <= order.length; offset++) {
    const nextIdx = (idx + offset) % order.length
    const nextId = order[nextIdx]
    const nextAssignment = assignments.find(a => a.playerId === nextId)!
    if (!nextAssignment.eliminated) return nextId
  }
  throw new Error('No other living players found.')
}
