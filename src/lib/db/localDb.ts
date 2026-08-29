/**
 * Local Database (§3, §88)
 * ------------------------
 * IndexedDB via Dexie. Replaces Room from the native spec.
 * All persistent data lives here: groups, players, completed game results.
 *
 * IMPORTANT (§102): Active game sessions are NEVER persisted. Only completed
 * GameResults are stored (for stats history). Secrets (roles, words, votes)
 * are not persisted at all.
 */

import Dexie, { type Table } from 'dexie'
import type { Group, GameResult } from '../lib/game/models'

export interface GroupRecord extends Group {
  id: string
}

export interface GameResultRecord extends GameResult {
  id: string  // = gameId
}

export class LocalDatabase extends Dexie {
  groups!: Table<GroupRecord, string>
  results!: Table<GameResultRecord, string>
  customCategories!: Table<CustomCategoryRecord, string>

  constructor() {
    super('secretrole_db')
    this.version(2).stores({
      groups: 'id, name, createdAt',
      results: 'id, groupId, completedAt',
      customCategories: 'id, displayName, createdAt',
    })
  }
}

export interface CustomCategoryRecord {
  id: string
  displayName: string
  icon: string
  words: Array<{ text: string; hint: string }>
  createdAt: number
}

let dbInstance: LocalDatabase | null = null

/**
 * Get the singleton DB instance. Lazily created to avoid SSR issues.
 */
export function getDb(): LocalDatabase {
  if (typeof window === 'undefined') {
    throw new Error('Database is only available in the browser.')
  }
  if (!dbInstance) {
    dbInstance = new LocalDatabase()
  }
  return dbInstance
}
