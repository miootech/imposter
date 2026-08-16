/**
 * Preferences (§3, §77)
 * ---------------------
 * LocalStorage-based preference storage. Replaces DataStore from the native spec.
 *
 * Stores:
 *   - theme: 'light' | 'dark'
 *   - soundEnabled: boolean
 *   - hapticsEnabled: boolean
 *   - roleEmojis: Record<RoleId, string>  (user-customized role icons, §17)
 *   - lastUsedGroupId: string | null  (for setup default)
 *   - lastUsedCategoryId: string | null
 *   - lastUsedMode: 'normal' | 'hard'
 */

import type { GameMode, RoleId } from '../game/models'
import { ROLES } from '../game/models'

const STORAGE_KEY = 'secretrole_prefs_v1'

export interface Preferences {
  theme: 'light' | 'dark'
  soundEnabled: boolean
  hapticsEnabled: boolean
  roleEmojis: Record<RoleId, string>
  lastUsedGroupId: string | null
  lastUsedCategoryId: string | null
  lastUsedMode: GameMode
  /** Display name of the device owner (main user). Used for auto-add to groups + crown badge. */
  username: string
  /** Profile emoji chosen by the device owner. */
  userEmoji: string
}

export function defaultPreferences(): Preferences {
  return {
    theme: 'light',
    soundEnabled: true,
    hapticsEnabled: true,
    roleEmojis: {
      crewmate: ROLES.crewmate.defaultEmoji,
      detective: ROLES.detective.defaultEmoji,
      impostor: ROLES.impostor.defaultEmoji,
      accomplice: ROLES.accomplice.defaultEmoji,
      jester: ROLES.jester.defaultEmoji,
    },
    lastUsedGroupId: null,
    lastUsedCategoryId: null,
    lastUsedMode: 'normal',
    username: '',
    userEmoji: '🦊',
  }
}

export function loadPreferences(): Preferences {
  if (typeof window === 'undefined') return defaultPreferences()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultPreferences()
    const parsed = JSON.parse(raw)
    return { ...defaultPreferences(), ...parsed }
  } catch {
    return defaultPreferences()
  }
}

export function savePreferences(prefs: Preferences): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // Silently fail — preferences are non-critical
  }
}
