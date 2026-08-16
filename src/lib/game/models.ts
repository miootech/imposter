/**
 * Domain Models — Framework-Agnostic
 * Pure TypeScript types. No React, no DOM, no Compose.
 * Mirrors the data model section of the spec (§6) and role definitions (§16–22).
 *
 * When porting to Kotlin, each type maps cleanly to a data class.
 */

// ============================================================================
// FACTIONS & ROLES
// ============================================================================

export type Faction = 'crew' | 'traitor' | 'neutral'

/**
 * The five canonical roles. Color coding is global (§16):
 *   Crewmate    🟢 #A8DADC
 *   Detective   🔵 #457B9D
 *   Impostor    🔴 #E07A5F
 *   Accomplice  🟠 #F4A261
 *   Jester      🟣 #B8C0EC
 */
export type RoleId = 'crewmate' | 'detective' | 'impostor' | 'accomplice' | 'jester'

export interface RoleInfo {
  id: RoleId
  displayName: string
  faction: Faction
  /** Default emoji, user can override in settings (§17) */
  defaultEmoji: string
  /** CSS var name without -- prefix, e.g. 'crewmate' */
  colorVar: string
  description: string
}

export const ROLES: Record<RoleId, RoleInfo> = {
  crewmate: {
    id: 'crewmate',
    displayName: 'Crewmate',
    faction: 'crew',
    defaultEmoji: '🛡️',
    colorVar: 'crewmate',
    description: 'Sieht das echte Wort. Erkenne die Impostoren.',
  },
  detective: {
    id: 'detective',
    displayName: 'Detektiv',
    faction: 'crew',
    defaultEmoji: '🔎',
    colorVar: 'detective',
    description: 'Sieht das echte Wort + den Impostor-Hinweis. Nur NORMAL Mode.',
  },
  impostor: {
    id: 'impostor',
    displayName: 'Impostor',
    faction: 'traitor',
    defaultEmoji: '👤',
    colorVar: 'impostor',
    description: 'Kennt andere Impostoren und den Komplizen. NORMAL: Kategorie-Hint.',
  },
  accomplice: {
    id: 'accomplice',
    displayName: 'Komplize',
    faction: 'traitor',
    defaultEmoji: '⭐',
    colorVar: 'accomplice',
    description: 'Max 1. Kennt alle Impostoren. NORMAL: echtes Wort. HARD: Kategorie-Hint.',
  },
  jester: {
    id: 'jester',
    displayName: 'Jester',
    faction: 'neutral',
    defaultEmoji: '🤡',
    colorVar: 'jester',
    description: 'Neutral. Eigenes anderes Wort. Ziel: eliminiert werden.',
  },
}

// ============================================================================
// GAME MODES
// ============================================================================

export type GameMode = 'normal' | 'hard'

// ============================================================================
// CONTENT MODEL — Categories & Words (§6, §7, §8, §9, §10)
// ============================================================================

export interface Word {
  text: string
  hint: string
}

export interface Category {
  id: string
  displayName: string
  /** Emoji or short visual identifier */
  icon: string
  words: Word[]
}

// ============================================================================
// PLAYER MODEL (§26)
// ============================================================================

export interface PlayerStats {
  gamesPlayed: number
  wins: number
  losses: number
  totalPoints: number
  eliminations: number
  survived: number
  jesterSuccess: number
  roleCount: Record<RoleId, number>
}

export interface Player {
  id: string
  displayName: string
  /** Player-specific color shown in group cards / detail */
  color: string
  points: number
  stats: PlayerStats
}

export function emptyPlayerStats(): PlayerStats {
  return {
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    totalPoints: 0,
    eliminations: 0,
    survived: 0,
    jesterSuccess: 0,
    roleCount: {
      crewmate: 0,
      detective: 0,
      impostor: 0,
      accomplice: 0,
      jester: 0,
    },
  }
}

// ============================================================================
// GROUP MODEL (§25, §27)
// ============================================================================

export interface Group {
  id: string
  name: string
  icon: string
  color: string
  players: Player[]
  createdAt: number
}

// ============================================================================
// GAME SETUP CONFIG (§49, §50)
// ============================================================================

export interface GameSetupConfig {
  groupId: string
  /** Number of impostors — constrained by GameRules */
  impostorCount: number
  includeDetective: boolean
  includeAccomplice: boolean
  includeJester: boolean
  categoryId: string
  mode: GameMode
  /** Optional chaos mode — picks a random modifier each round */
  chaosMode: boolean
}

// ============================================================================
// IN-GAME SESSION STATE (§51)
// ============================================================================

export interface PlayerRoleAssignment {
  playerId: string
  role: RoleId
  /** Word the player sees. May be undefined for HARD-mode impostor. */
  word?: string
  /** Hint shown to player. May be undefined in HARD mode. */
  hint?: string
  /** IDs of traitor teammates the player knows about */
  knownTraitors?: string[]
  /** Whether this player has revealed their role yet */
  revealed: boolean
  /** Whether this player has been eliminated */
  eliminated: boolean
  /** Order of elimination, 0-based. -1 if not eliminated. */
  eliminationOrder: number
}

export interface GameSession {
  id: string
  groupId: string
  config: GameSetupConfig
  /** Snapshot of player display names at game start (for results screen) */
  players: Array<{
    id: string
    displayName: string
    color: string
  }>
  assignments: PlayerRoleAssignment[]
  mainWord: string
  mainHint: string
  jesterWord: string
  jesterCategoryId: string
  startPlayerId: string
  /** Round number, 1-indexed */
  round: number
  /** Whether a real elimination happened last round (affects timer reduction §48) */
  lastRoundHadElimination: boolean
  /** Order of eliminated player IDs */
  eliminationOrder: string[]
  /** Winner faction, set when game ends */
  winnerFaction?: Faction
  /** Whether jester was the first elimination */
  jesterFirst: boolean
  /** Whether jester survived to the end */
  jesterSurvived: boolean
  /** Active chaos state for the current round (or 'none' if chaos mode off) */
  chaosState: import('../engines/ChaosEngine').ChaosState
  /** Whether the martyr was eliminated this game (for scoring bonus) */
  martyrEliminated: boolean
  startedAt: number
  endedAt?: number
}

// ============================================================================
// GAME RESULT (§74) — produced after game end, consumed by ScoreEngine
// ============================================================================

export interface PlayerScoreResult {
  playerId: string
  role: RoleId
  faction: Faction
  pointsEarned: number
  /** Points before this game */
  pointsBefore: number
  /** Points after this game */
  pointsAfter: number
  survived: boolean
  won: boolean
}

export interface GameResult {
  gameId: string
  groupId: string
  winnerFaction: Faction
  roundCount: number
  eliminationOrder: string[]
  firstEliminated: string | null
  roleOfFirstEliminated: RoleId | null
  jesterFirst: boolean
  jesterSurvived: boolean
  detectiveWasFirst: boolean
  impostorsRemaining: number
  traitorsReachedParity: boolean
  /** True if the martyr (chaos mode) was eliminated during this game */
  martyrEliminated: boolean
  playerResults: PlayerScoreResult[]
  completedAt: number
}

// ============================================================================
// VALIDATION TYPES (§50)
// ============================================================================

export interface ValidationResult {
  valid: boolean
  errors: string[]
  /** Helper reasons for disabled UI controls */
  disabledReasons: Record<string, string>
}

// ============================================================================
// TIMER MATRIX (§47)
// ============================================================================

/**
 * Timer matrix per spec §47.
 * Indexed by [playerBucket][roundIndex]. Buckets: 3-5, 6-8, 9-12.
 * Time values in seconds.
 */
export const TIMER_MATRIX: Record<'small' | 'medium' | 'large', number[]> = {
  small:  [120, 90, 60, 30],          // 3-5 players
  medium: [150, 120, 90, 60, 30],     // 6-8 players
  large:  [180, 150, 120, 60, 30],    // 9-12 players
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const MAX_GROUPS = 10
export const MIN_PLAYERS_PER_GROUP = 3
export const MAX_PLAYERS_PER_GROUP = 12
/**
 * New minimum crew rule (relaxed from spec §24):
 *   crew + 1 > impostors   (equivalent to: crew >= impostors for integers)
 *
 * This allows 3-player games (2 crew + 1 impostor).
 * The strict §24 rule (crew - impostors >= 2) was too restrictive for small groups.
 */
export const TIMER_WARNING_THRESHOLD_SECONDS = 10
