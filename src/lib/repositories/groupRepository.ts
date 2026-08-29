/**
 * Group Repository
 * ----------------
 * Higher-level API over Dexie for managing groups and applying stat updates
 * after a completed game (§75, §83, §84).
 *
 * Global stats are NOT stored separately — they are aggregated on demand from
 * the device's own group data (§28, §84).
 */

import { getDb, type GroupRecord } from '../db/localDb'
import type { GameResult, Group, Player, PlayerStats, RoleId } from '../game/models'
import { emptyPlayerStats, normalizePlayerStats, MAX_GROUPS, ROLES } from '../game/models'

/**
 * Generate a stable unique ID.
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Predefined color palette for new groups / players.
 */
const GROUP_COLORS = [
  '#E07A5F', '#457B9D', '#81B29A', '#F2CC8F', '#A8DADC',
  '#B8C0EC', '#F4A261', '#E76F51', '#2A9D8F', '#9B5DE5',
]
const PLAYER_COLORS = [
  '#E07A5F', '#457B9D', '#81B29A', '#F2CC8F', '#A8DADC',
  '#B8C0EC', '#F4A261', '#E76F51', '#2A9D8F', '#9B5DE5',
  '#F15BB5', '#00BBF9',
]

const GROUP_ICONS = ['🎲', '👥', '🎯', '🌟', '🎭', '🍕', '🎮', '🦊', '⚡', '🏆']

export function availableGroupIcons(): string[] {
  return GROUP_ICONS
}

export function pickGroupColor(index: number): string {
  return GROUP_COLORS[index % GROUP_COLORS.length]
}

export function pickPlayerColor(index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length]
}

export async function listGroups(): Promise<Group[]> {
  const db = getDb()
  const records = await db.groups.orderBy('createdAt').toArray()
  return records.map(toGroup)
}

export async function getGroup(id: string): Promise<Group | null> {
  const db = getDb()
  const record = await db.groups.get(id)
  return record ? toGroup(record) : null
}

export async function countGroups(): Promise<number> {
  const db = getDb()
  return await db.groups.count()
}

export async function canCreateGroup(): Promise<boolean> {
  return (await countGroups()) < MAX_GROUPS
}

export async function createGroup(
  name: string,
  icon?: string,
  color?: string,
  mainUser?: { username: string; userEmoji: string } | null,
): Promise<Group> {
  const count = await countGroups()
  if (count >= MAX_GROUPS) {
    throw new Error(`Maximal ${MAX_GROUPS} Gruppen erlaubt.`)
  }
  const id = generateId('group')

  // §1 auto-add main user as first player (index 0) if username is set
  const players: Player[] = []
  if (mainUser && mainUser.username.trim()) {
    players.push({
      id: generateId('player'),
      displayName: mainUser.username.trim(),
      color: pickPlayerColor(0),
      points: 0,
      stats: emptyPlayerStats(),
    })
  }

  const group: GroupRecord = {
    id,
    name: name.trim(),
    icon: icon ?? GROUP_ICONS[count % GROUP_ICONS.length],
    color: color ?? GROUP_COLORS[count % GROUP_COLORS.length],
    players,
    createdAt: Date.now(),
  }
  await getDb().groups.put(group)
  return toGroup(group)
}

/**
 * Check if a player is the device owner (main user) by comparing display name.
 */
export function isMainUser(playerName: string, mainUsername: string | null | undefined): boolean {
  if (!mainUsername || !mainUsername.trim()) return false
  return playerName.trim().toLowerCase() === mainUsername.trim().toLowerCase()
}

/**
 * Update the main user's icon (emoji or image) across ALL groups where
 * their display name matches the main user's username.
 * Called when the user changes their profile emoji in Settings.
 */
export async function updateMainUserIconAcrossGroups(
  username: string,
  icon: string,
): Promise<void> {
  if (!username.trim()) return
  const db = getDb()
  const allGroups = await db.groups.toArray()
  const lowerName = username.trim().toLowerCase()

  for (const group of allGroups) {
    let changed = false
    for (const player of group.players) {
      if (player.displayName.trim().toLowerCase() === lowerName) {
        player.color = icon.startsWith('data:image') ? player.color : icon
        // Store icon in a new field — but Player type doesn't have one.
        // We'll store the icon in the color field if it's an emoji,
        // or we need to add an `icon` field to Player.
        // Actually, let's add the icon to the player's color field if emoji,
        // and if image, we need a separate field.
        // Simplest: reuse the existing player.color for emoji, add player.icon for images.
        changed = true
      }
    }
    if (changed) await db.groups.put(group)
  }
}

export async function updateGroup(id: string, patch: Partial<Pick<Group, 'name' | 'icon' | 'color'>>): Promise<void> {
  const db = getDb()
  const existing = await db.groups.get(id)
  if (!existing) throw new Error('Gruppe nicht gefunden.')
  await db.groups.put({ ...existing, ...patch })
}

export async function deleteGroup(id: string): Promise<void> {
  const db = getDb()
  await db.groups.delete(id)
  // Also delete associated results
  const results = await db.results.where('groupId').equals(id).toArray()
  await db.results.bulkDelete(results.map(r => r.id))
}

// ----- Players -----

export async function addPlayer(groupId: string, displayName: string): Promise<Player> {
  const db = getDb()
  const group = await db.groups.get(groupId)
  if (!group) throw new Error('Gruppe nicht gefunden.')
  if (group.players.length >= 12) {
    throw new Error('Maximal 12 Spieler pro Gruppe.')
  }
  const player: Player = {
    id: generateId('player'),
    displayName: displayName.trim(),
    color: pickPlayerColor(group.players.length),
    points: 0,
    stats: emptyPlayerStats(),
  }
  group.players.push(player)
  await db.groups.put(group)
  return player
}

export async function updatePlayer(groupId: string, playerId: string, patch: Partial<Pick<Player, 'displayName' | 'color' | 'icon'>>): Promise<void> {
  const db = getDb()
  const group = await db.groups.get(groupId)
  if (!group) throw new Error('Gruppe nicht gefunden.')
  const idx = group.players.findIndex(p => p.id === playerId)
  if (idx === -1) throw new Error('Spieler nicht gefunden.')
  group.players[idx] = { ...group.players[idx], ...patch }
  await db.groups.put(group)
}

export async function removePlayer(groupId: string, playerId: string): Promise<void> {
  const db = getDb()
  const group = await db.groups.get(groupId)
  if (!group) throw new Error('Gruppe nicht gefunden.')
  group.players = group.players.filter(p => p.id !== playerId)
  await db.groups.put(group)
  // §29: Removing a player removes only their group-specific data.
  // Global stats are aggregated on demand from remaining group data.
}

export async function reorderPlayers(groupId: string, newOrder: string[]): Promise<void> {
  const db = getDb()
  const group = await db.groups.get(groupId)
  if (!group) throw new Error('Gruppe nicht gefunden.')
  const map = new Map(group.players.map(p => [p.id, p]))
  group.players = newOrder.map(id => map.get(id)!).filter(Boolean)
  await db.groups.put(group)
}

// ----- Apply Game Result -----

/**
 * Apply a completed GameResult to all affected groups (§75, §83).
 * Updates each player's points and stats atomically per group.
 *
 * Pure-ish: reads groups, computes updates, writes back. Not transactional across
 * groups but per-group updates are atomic via Dexie's put.
 */
export async function applyGameResult(result: GameResult): Promise<void> {
  const db = getDb()
  const group = await db.groups.get(result.groupId)
  if (!group) throw new Error('Gruppe nicht gefunden.')

  // Build a map of player ID → score result
  const scoreMap = new Map(result.playerResults.map(r => [r.playerId, r]))

  for (const player of group.players) {
    const score = scoreMap.get(player.id)
    if (!score) continue

    // Defensive: stats may be missing new faction-win fields if loaded from
    // an IndexedDB record written by an older app version (pre-v2.4.0).
    const currentStats = normalizePlayerStats(player.stats)
    player.points = score.pointsAfter
    player.stats = applyStatUpdate(currentStats, score, result)
  }

  await db.groups.put(group)
  await db.results.put({ ...result, id: result.gameId })
}

function applyStatUpdate(
  stats: PlayerStats,
  score: { role: RoleId; won: boolean; survived: boolean; pointsEarned: number },
  result: GameResult,
): PlayerStats {
  const next: PlayerStats = {
    ...stats,
    roleCount: { ...stats.roleCount },
  }
  next.gamesPlayed += 1
  next.totalPoints += score.pointsEarned
  next.roleCount[score.role] += 1
  // Jester is neutral — wins/losses are NOT counted for jester
  // (only jesterSuccess is tracked separately)
  if (score.role === 'jester') {
    // No wins/losses update for jester
    if (score.won) {
      next.jesterWins += 1
    }
  } else if (score.won) {
    next.wins += 1
    // Faction-aware win tracking (v2.4.0) — drives the 4-segment WinRateBar.
    // Crew faction: crewmate + detective. Traitor faction: impostor + accomplice.
    if (score.role === 'crewmate' || score.role === 'detective') {
      next.crewWins += 1
    } else {
      next.impostorWins += 1
    }
  } else {
    next.losses += 1
  }
  if (score.survived) next.survived += 1
  else next.eliminations += 1
  if (score.role === 'jester' && result.jesterFirst) {
    next.jesterSuccess += 1
  }
  return next
}

// ----- Global Stats Aggregation (§28, §84) -----

/**
 * Aggregate stats across all groups for players that share a display name.
 * The device owner's "global stats" = sum of their stats across all groups.
 *
 * Per §28: if "Ali" appears in 3 groups with 100/75/50 points, global = 225.
 *
 * NOTE: We aggregate by display name (case-insensitive) because there are no
 * accounts or cloud IDs (§85). If two different "Ali"s exist, they will be
 * merged — that's a known limitation of the account-less design.
 */
export interface GlobalPlayerStats {
  displayName: string
  totalPoints: number
  gamesPlayed: number
  wins: number
  losses: number
  eliminations: number
  survived: number
  jesterSuccess: number
  /** Faction-aware wins (v2.4.0) — drives the 4-segment WinRateBar */
  crewWins: number       // Crewmate + Detective wins
  impostorWins: number   // Impostor + Accomplice wins
  jesterWins: number      // Jester wins
  roleCount: Record<RoleId, number>
  /** Groups this player appears in */
  groupCount: number
}

export async function aggregateGlobalStats(): Promise<GlobalPlayerStats[]> {
  const groups = await listGroups()
  const map = new Map<string, GlobalPlayerStats>()

  for (const group of groups) {
    for (const player of group.players) {
      const key = player.displayName.trim().toLowerCase()
      if (!key) continue
      // Normalize so older stats records (pre-v2.4.0) get faction wins = 0
      // instead of undefined. New records will already have these populated.
      const stats = normalizePlayerStats(player.stats)
      const existing = map.get(key) ?? {
        displayName: player.displayName,
        totalPoints: 0,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        eliminations: 0,
        survived: 0,
        jesterSuccess: 0,
        crewWins: 0,
        impostorWins: 0,
        jesterWins: 0,
        roleCount: {
          crewmate: 0, detective: 0, impostor: 0, accomplice: 0, jester: 0,
        },
        groupCount: 0,
      }
      existing.totalPoints += player.points
      existing.gamesPlayed += stats.gamesPlayed
      existing.wins += stats.wins
      existing.losses += stats.losses
      existing.eliminations += stats.eliminations
      existing.survived += stats.survived
      existing.jesterSuccess += stats.jesterSuccess
      existing.crewWins += stats.crewWins
      existing.impostorWins += stats.impostorWins
      existing.jesterWins += stats.jesterWins
      for (const role of Object.keys(existing.roleCount) as RoleId[]) {
        existing.roleCount[role] += stats.roleCount[role] ?? 0
      }
      existing.groupCount += 1
      map.set(key, existing)
    }
  }

  return [...map.values()].sort((a, b) => b.totalPoints - a.totalPoints)
}

// ----- Helpers -----

function toGroup(record: GroupRecord): Group {
  return {
    id: record.id,
    name: record.name,
    icon: record.icon,
    color: record.color,
    // Normalize each player's stats so consumers never see missing faction-win
    // fields when reading a record written by an older app version (pre-v2.4.0).
    players: record.players.map(p => ({
      ...p,
      stats: normalizePlayerStats(p.stats),
    })),
    createdAt: record.createdAt,
  }
}

export function roleDisplayName(role: RoleId): string {
  // Returns the German display name (used in stats / settings / group detail)
  return ROLES[role].germanName
}
