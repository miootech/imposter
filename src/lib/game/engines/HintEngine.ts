/**
 * HintEngine (§10, §14, §15)
 * --------------------------
 * Determines what word/hint each role sees based on mode.
 *
 * NORMAL Mode (§14):
 *   Crewmate    → main word
 *   Detective   → main word + main hint (the impostor hint)
 *   Impostor    → main hint (Kategorie-Hint)
 *   Accomplice  → main word
 *   Jester      → jester word (no hint)
 *
 * HARD Mode (§15):
 *   Crewmate    → main word
 *   Detective   → does not exist
 *   Impostor    → no word, no hint (völlig im Dunkeln)
 *   Accomplice  → main hint (Kategorie-Hint)
 *   Jester      → jester word (no hint)
 *
 * Pure function: takes a PlayerRoleAssignment list + selection result, returns
 * updated assignments with `word` and `hint` filled in.
 */

import type { PlayerRoleAssignment, GameMode } from '../models'
import type { WordSelectionResult } from './WordSelectionEngine'

export function applyHints(
  assignments: PlayerRoleAssignment[],
  selection: WordSelectionResult,
  mode: GameMode,
): PlayerRoleAssignment[] {
  return assignments.map(a => {
    switch (a.role) {
      case 'crewmate':
        return { ...a, word: selection.mainWord, hint: undefined }

      case 'detective':
        // Detective only exists in NORMAL; HARD validation prevents creation.
        // If somehow present in HARD, treat as crewmate (defensive).
        if (mode === 'normal') {
          return { ...a, word: selection.mainWord, hint: selection.mainHint }
        }
        return { ...a, word: selection.mainWord, hint: undefined }

      case 'impostor':
        if (mode === 'normal') {
          // Kategorie-Hint only, no word
          return { ...a, word: undefined, hint: selection.mainHint }
        }
        // HARD: nothing
        return { ...a, word: undefined, hint: undefined }

      case 'accomplice':
        if (mode === 'normal') {
          return { ...a, word: selection.mainWord, hint: undefined }
        }
        // HARD: Kategorie-Hint
        return { ...a, word: undefined, hint: selection.mainHint }

      case 'jester':
        // Always: own word, no hint
        return { ...a, word: selection.jesterWord, hint: undefined }
    }
  })
}
