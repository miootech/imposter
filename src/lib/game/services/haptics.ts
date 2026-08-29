/**
 * Haptics (§43, §78)
 * ------------------
 * Hybrid haptic system:
 *  - Native Android: uses Capacitor Haptics plugin
 *  - Web fallback: navigator.vibrate
 *
 * Respects user preferences (can be disabled in Settings).
 */

import { loadPreferences } from '../../preferences/preferences'

export type HapticPattern =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'tick'

const WEB_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 40,
  success: [10, 30, 30],
  warning: [15, 50, 15],
  error: [30, 50, 30],
  tick: 5,
}

function webVibrate(pattern: HapticPattern): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return
  try {
    navigator.vibrate(WEB_PATTERNS[pattern])
  } catch {
    // silently ignore
  }
}

// Check if we're in a Capacitor native app (not web)
function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false
  // Capacitor injects this on native platforms
  return !!(window as any).Capacitor?.isNativePlatform?.()
}

let capacitorHapticsModule: any | null = null
let capacitorChecked = false

async function getCapacitorHaptics(): Promise<any | null> {
  if (capacitorChecked) return capacitorHapticsModule
  capacitorChecked = true
  // Only try to load Capacitor Haptics if we're in a native app
  if (!isNativeApp()) return null
  try {
    const mod = await import('@capacitor/haptics')
    capacitorHapticsModule = mod.Haptics
    return capacitorHapticsModule
  } catch {
    return null
  }
}

export function haptic(pattern: HapticPattern): void {
  if (typeof window === 'undefined') return
  const prefs = loadPreferences()
  if (!prefs.hapticsEnabled) return

  // Try Capacitor first (only on native app)
  getCapacitorHaptics().then((Haptics) => {
    if (Haptics && isNativeApp()) {
      // Use Capacitor — wrap each call to catch async rejections
      try {
        let promise: Promise<void> | undefined
        if (pattern === 'light' || pattern === 'medium' || pattern === 'heavy') {
          promise = Haptics.impact({ style: pattern.toUpperCase() })
        } else if (pattern === 'success') {
          promise = Haptics.notification({ type: 'SUCCESS' })
        } else if (pattern === 'warning') {
          promise = Haptics.notification({ type: 'WARNING' })
        } else if (pattern === 'error') {
          promise = Haptics.notification({ type: 'ERROR' })
        } else if (pattern === 'tick') {
          promise = Haptics.impact({ style: 'LIGHT' })
        }
        if (promise) {
          promise.catch(() => webVibrate(pattern))
          return
        }
        return
      } catch {
        // fall through to web
      }
    }
    // Web fallback
    webVibrate(pattern)
  }).catch(() => {
    webVibrate(pattern)
  })
}
