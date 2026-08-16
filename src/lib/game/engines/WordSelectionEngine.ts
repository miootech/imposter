/**
 * WordSelectionEngine (§11, §12)
 * ------------------------------
 * Pure functions for selecting words.
 *
 * Rules:
 *   - Main word is randomly selected from the chosen category, uniform probability (§11).
 *   - Jester word comes from a DIFFERENT category and must be != main word (§12).
 *
 * Uses RNG injection for deterministic tests.
 */

import type { Category } from '../models'
import { getOtherCategories } from '../content/catalog'

export interface WordSelectionResult {
  mainWord: string
  mainHint: string
  jesterWord: string
  jesterCategoryId: string
}

/**
 * Pick a random element from an array using the provided RNG.
 */
export function pickRandom<T>(arr: readonly T[], rng: () => number = Math.random): T {
  if (arr.length === 0) throw new Error('Cannot pick from empty array.')
  return arr[Math.floor(rng() * arr.length)]
}

/**
 * Select main word + jester word per spec §11, §12.
 *
 * Invariants enforced:
 *   - mainWord comes from `category`
 *   - jesterWord comes from a different category
 *   - jesterWord != mainWord (guaranteed because categories differ, but double-check)
 *
 * Note: jesterWord has NO hint per spec §12. The jester only sees the word.
 */
export function selectWords(
  category: Category,
  rng: () => number = Math.random,
): WordSelectionResult {
  const mainWordEntry = pickRandom(category.words, rng)
  const otherCats = getOtherCategories(category.id)
  if (otherCats.length === 0) {
    throw new Error('Cannot select jester word: no other categories exist.')
  }
  const jesterCategory = pickRandom(otherCats, rng)
  const jesterWordEntry = pickRandom(jesterCategory.words, rng)

  // Defensive: if somehow the same word, retry once from a different category.
  let jesterWord = jesterWordEntry.text
  let jesterCategoryId = jesterCategory.id
  if (jesterWord === mainWordEntry.text) {
    const altCat = pickRandom(otherCats.filter(c => c.id !== jesterCategory.id), rng)
    if (altCat) {
      jesterWord = pickRandom(altCat.words, rng).text
      jesterCategoryId = altCat.id
    }
  }

  return {
    mainWord: mainWordEntry.text,
    mainHint: mainWordEntry.hint,
    jesterWord,
    jesterCategoryId,
  }
}

/**
 * Probability check helper (for tests): given N words, each should have
 * approximately 1/N selection probability over many trials.
 */
export function computeSelectionFrequencies(
  category: Category,
  trials: number,
  rng: () => number = Math.random,
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const w of category.words) counts[w.text] = 0
  for (let i = 0; i < trials; i++) {
    const r = selectWords(category, rng)
    counts[r.mainWord] = (counts[r.mainWord] ?? 0) + 1
  }
  return counts
}
