/**
 * GameRules (§23, §24, §50)
 * ------------------------
 * Pure functions for validating game setup configurations.
 * No UI, no IO, no React. Fully unit-testable.
 *
 * Hard rules:
 *   - 3-12 players (§25, §26)
 *   - Impostor distribution by player count (§23)
 *   - Max 1 accomplice (§21)
 *   - Detective only in NORMAL mode (§15)
 *   - Crewmates - Impostors >= 2 (§24)
 */

import type {
  GameSetupConfig,
  RoleId,
  ValidationResult,
} from '../models'
import {
  MAX_PLAYERS_PER_GROUP,
  MIN_PLAYERS_PER_GROUP,
} from '../models'

export interface GroupSnapshot {
  id: string
  playerCount: number
}

/**
 * Default impostor count for a given player count (§23).
 *   3-5  → 1
 *   6-9  → 2
 *   10-12 → 3
 */
export function defaultImpostorCount(playerCount: number): number {
  if (playerCount <= 5) return 1
  if (playerCount <= 9) return 2
  return 3
}

/**
 * Maximum allowed impostors for a given player count.
 *
 * Faction-aware rule:
 *   Crew faction = Crewmate + Detective
 *   Traitor faction = Impostor + Accomplice
 *   Jester = neutral (doesn't count toward either side)
 *
 * Constraint: crewFaction > traitorFaction (strict)
 *   (crewmate + detective) > (impostors + accomplice)
 *
 * Solving for max impostors given fixed accomplice + detective + jester:
 *   crewmate = playerCount - impostors - accomplice - detective - jester
 *   crewmate + detective > impostors + accomplice
 *   playerCount - impostors - accomplice - detective - jester + detective > impostors + accomplice
 *   playerCount - jester - 2*accomplice > 2*impostors
 *   impostors < (playerCount - jester - 2*accomplice) / 2
 *
 * Note: Detective is on the Crew side, so adding one does NOT reduce
 * the max impostor count. Jester is neutral but consumes a player slot,
 * so it reduces the max impostor count by 0.5 (since 2*impostors < playerCount - jester - 2*accomplice).
 */
export function maxImpostorCount(
  playerCount: number,
  opts: { includeAccomplice: boolean; includeJester: boolean; includeDetective: boolean },
): number {
  const accomplice = opts.includeAccomplice ? 1 : 0
  const jester = opts.includeJester ? 1 : 0
  // Detective doesn't affect max impostors (it's on crew side)
  // Strict inequality: impostors <= floor((playerCount - jester - 2*accomplice - 1) / 2)
  const strict = (playerCount - jester - 2 * accomplice - 1) / 2
  return Math.max(1, Math.floor(strict))
}

/**
 * Check whether adding an additional special role (accomplice/jester/detective)
 * would violate the "crew > traitor" faction rule.
 *
 * Faction-aware:
 *   - Detective joins Crew (doesn't count against crew majority)
 *   - Accomplice joins Traitors (counts against crew majority 2x — both as traitor and as non-crewmate)
 *   - Jester is neutral but consumes a slot (reduces crewmate by 1)
 *
 * Used by the UI to disable role toggles when they can't be enabled.
 */
export function canAddSpecialRole(
  playerCount: number,
  currentConfig: Pick<GameSetupConfig, 'impostorCount' | 'includeAccomplice' | 'includeDetective' | 'includeJester' | 'mode'>,
  role: 'accomplice' | 'jester' | 'detective',
): { allowed: boolean; reason: string } {
  // Simulate adding this role
  const simulated: typeof currentConfig = {
    ...currentConfig,
    includeAccomplice: role === 'accomplice' ? true : currentConfig.includeAccomplice,
    includeDetective: role === 'detective' ? true : currentConfig.includeDetective,
    includeJester: role === 'jester' ? true : currentConfig.includeJester,
  }
  const composition = computeRoleComposition(playerCount, simulated)
  if (!composition) {
    return { allowed: false, reason: 'Zu viele Spezialrollen für diese Spielerzahl.' }
  }
  const crewFaction = composition.crewmate + composition.detective
  const traitorFaction = composition.impostor + composition.accomplice
  if (crewFaction <= traitorFaction) {
    return {
      allowed: false,
      reason: 'Crew muss stärker sein als die Verräter (Crewmate + Detektiv > Impostor + Komplize).',
    }
  }
  // Also need at least 1 crewmate (can't have all crew be detectives)
  if (composition.crewmate < 1) {
    return { allowed: false, reason: 'Mindestens 1 Crewmate erforderlich.' }
  }
  return { allowed: true, reason: '' }
}

/**
 * Recommended (spec-defined) max impostors by player count, ignoring the §24 crew constraint.
 * Used as the upper bound when configuring — but the actual allowed max may be lower.
 */
export function specMaxImpostorCount(playerCount: number): number {
  if (playerCount <= 5) return 1
  if (playerCount <= 9) return 2
  return 3
}

export interface RoleComposition {
  impostor: number
  accomplice: number
  detective: number
  jester: number
  crewmate: number
}

/**
 * Compute the exact role composition for a given config.
 * Returns null if config is invalid.
 */
export function computeRoleComposition(
  playerCount: number,
  config: Pick<GameSetupConfig, 'impostorCount' | 'includeAccomplice' | 'includeDetective' | 'includeJester' | 'mode'>,
): RoleComposition | null {
  const accomplice = config.includeAccomplice ? 1 : 0
  const detective = config.includeDetective && config.mode === 'normal' ? 1 : 0
  const jester = config.includeJester ? 1 : 0
  const impostor = config.impostorCount
  const crewmate = playerCount - impostor - accomplice - detective - jester
  if (crewmate < 0) return null
  return { impostor, accomplice, detective, jester, crewmate }
}

/**
 * Validate a full setup configuration (§50).
 * Returns a structured result with errors and disabled-reasons for the UI.
 */
export function validateSetup(
  group: GroupSnapshot,
  config: GameSetupConfig,
): ValidationResult {
  const errors: string[] = []
  const disabledReasons: Record<string, string> = {}
  const playerCount = group.playerCount

  // 1. Player count (§25)
  if (playerCount < MIN_PLAYERS_PER_GROUP) {
    errors.push(`Mindestens ${MIN_PLAYERS_PER_GROUP} Spieler nötig.`)
  }
  if (playerCount > MAX_PLAYERS_PER_GROUP) {
    errors.push(`Maximal ${MAX_PLAYERS_PER_GROUP} Spieler erlaubt.`)
  }

  // 2. Impostor count (§23)
  const specMax = specMaxImpostorCount(playerCount)
  if (config.impostorCount < 1) {
    errors.push('Mindestens 1 Impostor erforderlich.')
  }
  if (config.impostorCount > specMax) {
    errors.push(`Max ${specMax} Impostoren für ${playerCount} Spieler.`)
    disabledReasons.impostorUp = `Limit für ${playerCount} Spieler erreicht.`
  }

  // 3. Faction majority — crew faction > traitor faction (strict)
  //    Crew faction = Crewmate + Detective
  //    Traitor faction = Impostor + Accomplice
  //    Jester = neutral (doesn't count toward either side)
  //    Also requires at least 1 pure Crewmate (can't have all crew be detectives).
  const composition = computeRoleComposition(playerCount, config)
  if (!composition) {
    errors.push('Zu viele Spezialrollen für diese Spielerzahl.')
  } else {
    const crewFaction = composition.crewmate + composition.detective
    const traitorFaction = composition.impostor + composition.accomplice
    if (crewFaction <= traitorFaction) {
      errors.push('Crew-Fraktion muss stärker sein als Verräter-Fraktion (Crewmate + Detektiv > Impostor + Komplize).')
      disabledReasons.impostorUp = 'Sonst sind Verräter in der Mehrheit.'
      disabledReasons.accomplice = 'Crew-Fraktion wäre nicht mehr in der Mehrheit.'
    }
    if (composition.crewmate < 1) {
      errors.push('Mindestens 1 reiner Crewmate erforderlich.')
    }
  }

  // 4. Detective in HARD (§15, §50)
  if (config.includeDetective && config.mode === 'hard') {
    errors.push('Detektiv existiert nicht im HARD-Modus.')
    disabledReasons.detective = 'Detektiv nur in NORMAL verfügbar.'
  }

  // 5. Accomplice limit (§21, §50)
  // Single toggle, so count is 0 or 1; this is always satisfied but we surface the reason.

  return {
    valid: errors.length === 0,
    errors,
    disabledReasons,
  }
}

/**
 * Get the list of roles that will be in play for a given config.
 * Used by RoleAssignmentEngine.
 */
export function rolesForConfig(composition: RoleComposition): RoleId[] {
  const list: RoleId[] = []
  for (let i = 0; i < composition.crewmate; i++) list.push('crewmate')
  for (let i = 0; i < composition.detective; i++) list.push('detective')
  for (let i = 0; i < composition.impostor; i++) list.push('impostor')
  for (let i = 0; i < composition.accomplice; i++) list.push('accomplice')
  for (let i = 0; i < composition.jester; i++) list.push('jester')
  return list
}
