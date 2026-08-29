/**
 * ChaosEngine — Optional game-mode extension
 * ------------------------------------------
 * When chaos mode is enabled in the setup config, the GameSessionManager
 * invokes `pickChaosModifier()` at the start of each round. The returned
 * modifier drives specific UI / voting / scoring behaviors.
 *
 * Design goals:
 *  - Pure functions, framework-agnostic, fully unit-testable
 *  - All 5 modifiers are mutually exclusive (only one active per round)
 *  - Default behavior is unchanged when no modifier is active
 *
 * The 5 modifiers:
 *   1. SPIEGEL_VOTING — Inverts the tally (fewest votes eliminated)
 *   2. DOPPELAGENT   — One player's vote counts as 2 (kept secret)
 *   3. MAERTYRER     — A random crewmate is marked; if eliminated, traitors get +3
 *   4. HEISSE_KARTOFFEL — Hot-potato timer (45-90s), holder at expiry is eliminated
 *   5. RUSSISCHES_VERHOER — Mid-discussion interrogation; loser loses voting right
 */

import type { PlayerRoleAssignment, RoleId } from '../models'

export type ChaosModifierId =
  | 'none'
  | 'spiegel_voting'
  | 'doppelagent'
  | 'maertyrer'
  | 'heisse_kartoffel'
  | 'russisches_verhoer'

export interface ChaosModifierInfo {
  id: ChaosModifierId
  /** Display name shown in the UI */
  displayName: string
  /** Short description shown in setup / chaos banner */
  description: string
  /** Emoji icon */
  icon: string
  /** CSS color var for theming */
  colorVar: string
}

export const CHAOS_MODIFIERS: Record<Exclude<ChaosModifierId, 'none'>, ChaosModifierInfo> = {
  spiegel_voting: {
    id: 'spiegel_voting',
    displayName: 'Spiegel-Voting',
    description: 'Wer die wenigsten Stimmen bekommt, fliegt raus.',
    icon: '🔄',
    colorVar: 'var(--crewmate)',
  },
  doppelagent: {
    id: 'doppelagent',
    displayName: 'Doppelagent',
    description: 'Ein Spieler hat heimlich doppeltes Stimmrecht.',
    icon: '🕵️',
    colorVar: 'var(--detective)',
  },
  maertyrer: {
    id: 'maertyrer',
    displayName: 'Der Märtyrer',
    description: 'Ein Crewmate ist markiert. Wenn er eliminiert wird, bekommen Verräter +3 Punkte.',
    icon: '🎯',
    colorVar: 'var(--impostor)',
  },
  heisse_kartoffel: {
    id: 'heisse_kartoffel',
    displayName: 'Heiße Kartoffel',
    description: 'Eine Bombe tickt 45–90 Sekunden. Wer sie hält, wenn sie hochgeht, fliegt raus.',
    icon: '💣',
    colorVar: 'var(--destructive)',
  },
  russisches_verhoer: {
    id: 'russisches_verhoer',
    displayName: 'Russisches Verhör',
    description: 'In der Mitte der Diskussion gibt es einen Blitz-Check. Verlierer verliert sein Stimmrecht.',
    icon: '⚖️',
    colorVar: 'var(--accomplice)',
  },
}

/**
 * Per-round chaos state — set by GameSessionManager at round start.
 */
export interface ChaosState {
  modifier: ChaosModifierId
  /** For doppelagent: player ID whose vote counts twice */
  doubleAgentPlayerId?: string
  /** For maertyrer: player ID who is the martyr (must be crewmate) */
  martyrPlayerId?: string
  /** For heisse_kartoffel: random fuse length in seconds (45-90) */
  bombFuseSeconds?: number
  /** For heisse_kartoffel: current holder of the bomb */
  bombHolderId?: string
  /** For russisches_verhoer: questioner (random) */
  interrogatorId?: string
  /** For russisches_verhoer: suspect (random, different from questioner) */
  suspectId?: string
  /** For russisches_verhoer: whether interrogation has triggered this round */
  interrogationTriggered?: boolean
  /** For russisches_verhoer: player who lost voting right (suspect if group votes "Lüge") */
  votingRightRevokedId?: string
}

export function emptyChaosState(): ChaosState {
  return { modifier: 'none' }
}

/**
 * Pick a random chaos modifier (uniformly from the 5 options).
 * Pure: RNG injection for deterministic tests.
 */
export function pickChaosModifier(rng: () => number = Math.random): ChaosModifierId {
  const ids = Object.keys(CHAOS_MODIFIERS) as Array<Exclude<ChaosModifierId, 'none'>>
  return ids[Math.floor(rng() * ids.length)]
}

/**
 * Initialize the full ChaosState for the active modifier at round start.
 *
 * Caller passes the current assignments so the engine can pick a random
 * living crewmate for maertyrer, random living players for doppelagent etc.
 */
export function initChaosState(
  modifier: ChaosModifierId,
  assignments: PlayerRoleAssignment[],
  rng: () => number = Math.random,
): ChaosState {
  if (modifier === 'none') return emptyChaosState()

  const living = assignments.filter(a => !a.eliminated)
  if (living.length === 0) return emptyChaosState()

  const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)]

  switch (modifier) {
    case 'spiegel_voting':
      return { modifier }

    case 'doppelagent': {
      const agent = pickRandom(living)
      return { modifier, doubleAgentPlayerId: agent.playerId }
    }

    case 'maertyrer': {
      // Pick a random living crewmate (NOT detective — detective sees too much info)
      const crewmates = living.filter(a => a.role === 'crewmate')
      if (crewmates.length === 0) return emptyChaosState()
      const martyr = pickRandom(crewmates)
      return { modifier, martyrPlayerId: martyr.playerId }
    }

    case 'heisse_kartoffel': {
      const fuse = 45 + Math.floor(rng() * 46)  // 45-90 seconds
      const holder = pickRandom(living)
      return { modifier, bombFuseSeconds: fuse, bombHolderId: holder.playerId }
    }

    case 'russisches_verhoer': {
      // Pick questioner + suspect (different players, both living)
      const interrogator = pickRandom(living)
      const suspects = living.filter(a => a.playerId !== interrogator.playerId)
      const suspect = suspects.length > 0 ? pickRandom(suspects) : interrogator
      return {
        modifier,
        interrogatorId: interrogator.playerId,
        suspectId: suspect.playerId,
        interrogationTriggered: false,
      }
    }

    default:
      return emptyChaosState()
  }
}

/**
 * For Spiegel-Voting: invert the elimination logic.
 * Returns the player with the FEWEST votes (instead of most).
 * On tie for fewest, returns null (nobody eliminated — same tie rule as normal).
 */
export function findReverseElimination(
  voteCounts: Map<string, number>,
): { eliminatedPlayerId: string | null; isTie: boolean; minVotes: number } {
  if (voteCounts.size === 0) {
    return { eliminatedPlayerId: null, isTie: false, minVotes: 0 }
  }
  const minVotes = Math.min(...voteCounts.values())
  const minCandidates = [...voteCounts.entries()]
    .filter(([, v]) => v === minVotes)
    .map(([playerId]) => playerId)
  return {
    eliminatedPlayerId: minCandidates.length === 1 ? minCandidates[0] : null,
    isTie: minCandidates.length > 1,
    minVotes,
  }
}

/**
 * For Doppelagent: tally votes where the agent's vote counts as 2.
 * `votes` is the standard map of voterId → targetId.
 * `agentId` is the player whose vote counts twice.
 */
export function tallyVotesWithDoubleAgent(
  votes: Map<string, string>,
  agentId: string | undefined,
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const [voter, target] of votes.entries()) {
    const weight = voter === agentId ? 2 : 1
    counts.set(target, (counts.get(target) ?? 0) + weight)
  }
  return counts
}

/**
 * For Maertyrer: check whether the eliminated player is the martyr.
 */
export function isMartyrEliminated(
  martyrPlayerId: string | undefined,
  eliminatedPlayerId: string | null,
): boolean {
  if (!martyrPlayerId || !eliminatedPlayerId) return false
  return martyrPlayerId === eliminatedPlayerId
}

/**
 * For Heiße Kartoffel: pass the bomb to a new random living player.
 * The new holder must differ from the current one (if possible).
 */
export function passBomb(
  assignments: PlayerRoleAssignment[],
  currentHolderId: string,
  rng: () => number = Math.random,
): string {
  const living = assignments.filter(a => !a.eliminated && a.playerId !== currentHolderId)
  if (living.length === 0) return currentHolderId
  return living[Math.floor(rng() * living.length)].playerId
}

/**
 * For Russisches Verhör: determine whether the interrogation should trigger now.
 * Triggers at the halfway point of the discussion timer.
 */
export function shouldTriggerInterrogation(
  totalSeconds: number,
  remainingSeconds: number,
  alreadyTriggered: boolean,
): boolean {
  if (alreadyTriggered) return false
  return remainingSeconds <= Math.floor(totalSeconds / 2)
}

/**
 * Apply the interrogation result: if the group voted "Lüge" (lie),
 * the suspect loses their voting right for the main voting phase.
 */
export function applyInterrogationResult(
  state: ChaosState,
  groupVotedLie: boolean,
): ChaosState {
  if (state.modifier !== 'russisches_verhoer') return state
  return {
    ...state,
    interrogationTriggered: true,
    votingRightRevokedId: groupVotedLie ? state.suspectId : undefined,
  }
}

/**
 * Check whether a player is allowed to vote in the main voting phase.
 * Considers the russisches_verhoer revocation.
 */
export function canPlayerVote(
  playerId: string,
  chaosState: ChaosState,
): boolean {
  if (chaosState.modifier === 'russisches_verhoer' && chaosState.votingRightRevokedId === playerId) {
    return false
  }
  return true
}

/**
 * Get the chaos modifier info for display, or null if no modifier active.
 */
export function getActiveChaosInfo(state: ChaosState): ChaosModifierInfo | null {
  if (state.modifier === 'none') return null
  return CHAOS_MODIFIERS[state.modifier] ?? null
}

/**
 * Determine if a chaos modifier should skip the normal voting phase entirely.
 * (Heiße Kartoffel eliminates via bomb timer, no vote needed.)
 */
export function skipsVotingPhase(state: ChaosState): boolean {
  return state.modifier === 'heisse_kartoffel'
}
