'use client'

import { useEffect, useRef } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { stopMusic, playMusicTrack } from '@/lib/game/services/music'

/**
 * AppLifecycleHandler
 * -------------------
 * Monitors app visibility changes (tab switch, app background, screen off)
 * and pauses music + discussion timer when the app goes to background.
 *
 * In a Capacitor native app, this hooks into the native onPause/onResume
 * lifecycle via the `visibilitychange` event (which Capacitor fires).
 *
 * Behavior:
 *  - When app goes hidden: stop music + pause discussion timer
 *  - When app comes back visible: resume music (if enabled) + resume timer
 */
export function AppLifecycleHandler() {
  const gameScreen = useGameStore(s => s.gameScreen)
  const bgMusicEnabled = usePreferencesStoreBgMusic()
  const timerRef = useRef<{ wasRunning: boolean; remaining: number } | null>(null)

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isHidden = document.visibilityState === 'hidden'

      if (isHidden) {
        // App went to background — stop music immediately
        stopMusic()

        // Pause discussion timer (if active)
        // We dispatch a custom event that the DiscussionScreen listens to
        window.dispatchEvent(new CustomEvent('app-pause'))
      } else {
        // App came back to foreground — resume music if enabled
        if (bgMusicEnabled) {
          // Small delay to let the WebView settle
          setTimeout(() => playMusicTrack('idle'), 300)
        }

        // Resume timer
        window.dispatchEvent(new CustomEvent('app-resume'))
      }
    }

    // Also handle window blur/focus (for browser + some Android WebViews)
    const handleBlur = () => {
      stopMusic()
      window.dispatchEvent(new CustomEvent('app-pause'))
    }
    const handleFocus = () => {
      if (bgMusicEnabled) {
        setTimeout(() => playMusicTrack('idle'), 300)
      }
      window.dispatchEvent(new CustomEvent('app-resume'))
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
    }
  }, [bgMusicEnabled])

  // Also use Capacitor App plugin if available (native Android)
  useEffect(() => {
    let cleanup: (() => void) | null = null

    ;(async () => {
      try {
        const { App } = await import('@capacitor/app')
        const listener = await App.addListener('appStateChange', ({ isActive }) => {
          if (!isActive) {
            // App went to background
            stopMusic()
            window.dispatchEvent(new CustomEvent('app-pause'))
          } else {
            // App came back to foreground
            if (bgMusicEnabled) {
              setTimeout(() => playMusicTrack('idle'), 300)
            }
            window.dispatchEvent(new CustomEvent('app-resume'))
          }
        })
        cleanup = () => { listener.remove() }
      } catch {
        // Not in Capacitor native app — web events above handle it
      }
    })()

    return () => { cleanup?.() }
  }, [bgMusicEnabled])

  return null
}

// Helper hook to avoid circular imports
import { usePreferencesStore } from '@/stores/preferencesStore'
function usePreferencesStoreBgMusic() {
  return usePreferencesStore(s => s.bgMusicEnabled)
}
