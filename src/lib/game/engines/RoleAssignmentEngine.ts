/**
 * RoleAssignmentEngine (§14, §15, §18-22, §51)
 * --------------------------------------------
 * Pure functions for randomly assigning roles to players.
 *
 * Inputs: ordered list of player IDs + role composition.
 * Output: shuffled role list aligned with player IDs.
 *
 * This module does NOT know about categories, words, or hints.
 * It only assigns role IDs.
 */

import type { PlayerRoleAssignment, RoleId, RoleComposition } from '../models'

/**
 * Fisher-Yates shuffle. Pure: does not mutate input.
 * Uses provided RNG (so tests can be deterministic).
 */
export function shuffle<T>(arr: readonly T[], rng: () => number = Math.random): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Build the list of role slots based on composition.
 */
export function buildRoleSlots(composition: RoleComposition): RoleId[] {
  const slots: RoleId[] = []
  for (let i = 0; i < composition.crewmate; i++) slots.push('crewmate')
  for (let i = 0; i < composition.detective; i++) slots.push('detective')
  for (let i = 0; i < composition.impostor; i++) slots.push('impostor')
  for (let i = 0; i < composition.accomplice; i++) slots.push('accomplice')
  for (let i = 0; i < composition.jester; i++) slots.push('jester')
  return slots
}

/**
 * Assign roles to players. Returns map of playerId → role.
 *
 * Pure: same input + same RNG → same output. Testable.
 */
export function assignRoles(
  playerIds: readonly string[],
  composition: RoleComposition,
  rng: () => number = Math.random,
): Map<string, RoleId> {
  if (playerIds.length !== buildRoleSlots(composition).length) {
    throw new Error(
      `Player count (${playerIds.length}) does not match role slots (${buildRoleSlots(composition).length}).`,
    )
  }
  const shuffledRoles = shuffle(buildRoleSlots(composition), rng)
  const out = new Map<string, RoleId>()
  playerIds.forEach((id, idx) => {
    out.set(id, shuffledRoles[idx])
  })
  return out
}

/**
 * Build the traitor knowledge map. Per §20 and §21:
 *  - Impostors know all other impostors AND the accomplice (if present).
 *  - Accomplice knows all impostors.
 *  - Jester knows nothing about other traitors.
 *  - Crew / Detective know nothing.
 *
 * Returns map: playerId → list of traitor teammate IDs they know about.
 */
export function computeTraitorKnowledge(
  assignments: Map<string, RoleId>,
): Map<string, string[]> {
  const impostorIds = [...assignments.entries()]
    .filter(([, role]) => role === 'impostor')
    .map(([id]) => id)
  const accompliceId = [...assignments.entries()]
    .filter(([, role]) => role === 'accomplice')
    .map(([id]) => id)[0]

  const out = new Map<string, string[]>()
  for (const [id, role] of assignments.entries()) {
    if (role === 'impostor') {
      // Knows other impostors + accomplice
      const teammates = impostorIds.filter(other => other !== id)
      if (accompliceId) teammates.push(accompliceId)
      out.set(id, teammates)
    } else if (role === 'accomplice') {
      // Knows all impostors
      out.set(id, [...impostorIds])
    }
  }
  return out
}

/**
 * Initialize a full PlayerRoleAssignment list. Words and hints are filled by
 * WordSelectionEngine and HintEngine respectively.
 */
export function buildAssignments(
  playerIds: readonly string[],
  composition: RoleComposition,
  rng: () => number = Math.random,
): PlayerRoleAssignment[] {
  const roles = assignRoles(playerIds, composition, rng)
  const knowledge = computeTraitorKnowledge(roles)
  return playerIds.map(id => ({
    playerId: id,
    role: roles.get(id)!,
    knownTraitors: knowledge.get(id) ?? [],
    revealed: false,
    eliminated: false,
    eliminationOrder: -1,
  }))
}
