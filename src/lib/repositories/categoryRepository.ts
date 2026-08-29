/**
 * Custom Category Repository
 * --------------------------
 * Manages user-created categories stored in IndexedDB (Dexie).
 * Users can create up to 5 custom categories, each with up to 100 words.
 * Every word must have an individual hint.
 *
 * These merge with the built-in CATALOG at runtime.
 */

import { getDb, type CustomCategoryRecord } from '../db/localDb'
import type { Category } from '../game/models'
import { CATALOG } from '../game/content/catalog'

const MAX_CUSTOM_CATEGORIES = 5
const MAX_WORDS_PER_CATEGORY = 100

export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export async function listCustomCategories(): Promise<CustomCategoryRecord[]> {
  const db = getDb()
  return await db.customCategories.orderBy('createdAt').toArray()
}

export async function countCustomCategories(): Promise<number> {
  const db = getDb()
  return await db.customCategories.count()
}

export async function canCreateCustomCategory(): Promise<boolean> {
  return (await countCustomCategories()) < MAX_CUSTOM_CATEGORIES
}

export async function createCustomCategory(
  displayName: string,
  icon: string,
  words: Array<{ text: string; hint: string }>,
): Promise<CustomCategoryRecord> {
  const count = await countCustomCategories()
  if (count >= MAX_CUSTOM_CATEGORIES) {
    throw new Error(`Maximal ${MAX_CUSTOM_CATEGORIES} eigene Kategorien erlaubt.`)
  }
  if (words.length > MAX_WORDS_PER_CATEGORY) {
    throw new Error(`Maximal ${MAX_WORDS_PER_CATEGORY} Wörter pro Kategorie.`)
  }
  // Validate: every word must have text + hint
  for (const w of words) {
    if (!w.text.trim() || !w.hint.trim()) {
      throw new Error('Jedes Wort muss einen Text und einen Hinweis haben.')
    }
  }
  const record: CustomCategoryRecord = {
    id: generateId('cat'),
    displayName: displayName.trim(),
    icon: icon || '📦',
    words: words.map(w => ({ text: w.text.trim(), hint: w.hint.trim() })),
    createdAt: Date.now(),
  }
  await getDb().customCategories.put(record)
  return record
}

export async function updateCustomCategory(
  id: string,
  patch: Partial<Pick<CustomCategoryRecord, 'displayName' | 'icon' | 'words'>>,
): Promise<void> {
  const db = getDb()
  const existing = await db.customCategories.get(id)
  if (!existing) throw new Error('Kategorie nicht gefunden.')
  if (patch.words) {
    if (patch.words.length > MAX_WORDS_PER_CATEGORY) {
      throw new Error(`Maximal ${MAX_WORDS_PER_CATEGORY} Wörter pro Kategorie.`)
    }
    for (const w of patch.words) {
      if (!w.text.trim() || !w.hint.trim()) {
        throw new Error('Jedes Wort muss einen Text und einen Hinweis haben.')
      }
    }
  }
  await db.customCategories.put({ ...existing, ...patch })
}

export async function deleteCustomCategory(id: string): Promise<void> {
  await getDb().customCategories.delete(id)
}

/**
 * Get ALL categories: built-in + user-created.
 * Used by the game engine to pick words.
 */
export async function getAllCategories(): Promise<Category[]> {
  const custom = await listCustomCategories()
  return [...CATALOG, ...custom.map(toCategory)]
}

function toCategory(record: CustomCategoryRecord): Category {
  return {
    id: record.id,
    displayName: record.displayName,
    icon: record.icon,
    words: record.words,
  }
}

export const MAX_CUSTOM_CATS = MAX_CUSTOM_CATEGORIES
export const MAX_WORDS = MAX_WORDS_PER_CATEGORY
