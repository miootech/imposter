/**
 * Haptics (§43, §78)
 * ------------------
 * Lightweight wrapper around navigator.vibrate.
 * Respects user preferences (can be disabled in Settings).
 *
 * No haptic spam (§43): each pattern is short and meaningful.
 */

import { loadPreferences } from '../../preferences/preferences'

export type HapticPattern =
  | 'light'         // 10ms — soft tap, button press
  | 'medium'        // 20ms — toggle, selection
  | 'heavy'         // 40ms — confirmation
  | 'success'       // [10, 30, 30] — vote confirmed, victory
  | 'warning'       // [15, 50, 15] — timer warning
  | 'error'         // [30, 50, 30] — elimination, invalid
  | 'tick'          // 5ms — countdown tick

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 40,
  success: [10, 30, 30],
  warning: [15, 50, 15],
  error: [30, 50, 30],
  tick: 5,
}

export function haptic(pattern: HapticPattern): void {
  if (typeof window === 'undefined') return
  if (!('vibrate' in navigator)) return
  const prefs = loadPreferences()
  if (!prefs.hapticsEnabled) return
  try {
    navigator.vibrate(PATTERNS[pattern])
  } catch {
    // Silently ignore
  }
}
