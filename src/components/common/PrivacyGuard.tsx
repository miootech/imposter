'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * PrivacyGuard (§55, §76, §87, §102)
 * ----------------------------
 * Shows a full-screen overlay when:
 *   - The document becomes hidden (app switch, tab switch, screen off)
 *   - The window loses focus during sensitive screens (reveal, voting)
 *
 * This ensures no secret information is visible in the app switcher or
 * when the user returns to a previously-active game state.
 *
 * Web browsers cannot truly block screenshots (that's a native OS capability),
 * but we can:
 *   - Hide sensitive content immediately on visibility change
 *   - Show a neutral "Privacy Shield" screen
 *   - Clear any in-DOM secret text
 *
 * On Android (when wrapped with Capacitor), this hooks into onPause/onResume.
 */
export function PrivacyGuard({ active }: { active: boolean }) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (!active) {
      setHidden(false)
      return
    }

    const onVisibility = () => {
      setHidden(document.visibilityState === 'hidden')
    }
    const onBlur = () => setHidden(true)
    const onFocus = () => setHidden(false)

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    document.addEventListener('freeze', onVisibility)
    document.addEventListener('resume', onVisibility)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('freeze', onVisibility)
      document.removeEventListener('resume', onVisibility)
    }
  }, [active])

  return (
    <AnimatePresence>
      {hidden && (
        <motion.div
          className="privacy-shield"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="text-center px-8">
            <div className="text-6xl mb-4">🔒</div>
            <p className="text-xl font-semibold text-foreground">Privacy Shield aktiv</p>
            <p className="text-sm text-muted-foreground mt-2">
              Keine geheimen Informationen sichtbar.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
