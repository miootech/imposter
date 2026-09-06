'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Instagram, Globe, Heart, Download } from 'lucide-react'
import { haptic } from '@/lib/game/services/haptics'

const INSTAGRAM_URL = 'https://instagram.com/malikali065'
const WEBSITE_URL = 'https://arche-website.pages.dev'
const ANDROID_APK_URL = '/imposter.apk'

function AndroidIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0002s.4482-1.0001.9993-1.0001c.552 0 .9997.4485.9997 1.0001s-.4477 1.0002-.9997 1.0002m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0002s.4482-1.0001.9993-1.0001c.552 0 .9997.4485.9997 1.0001s-.4477 1.0002-.9997 1.0002m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5802 8.4116 13.847 8.0834 12 8.0834c-1.847 0-3.5802.3282-5.1368.8663L4.8409 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396" />
    </svg>
  )
}

/**
 * SettingsFooter
 * --------------
 * Footer section in the Settings screen with:
 *  - Animated Instagram icon → links to @malikali065
 *  - Animated Website icon → links to arche-website.pages.dev
 *  - Download on Android! button (web only)
 *  - Author credit: "Ali Malik"
 *  - Copyright notice: "All rights reserved"
 */
export function SettingsFooter() {
  const [isWeb, setIsWeb] = useState(false)

  useEffect(() => {
    const isNative = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.()
    setIsWeb(!isNative)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 flex flex-col items-center gap-4 border-t border-border pt-6"
    >
      {/* Social links — animated smooth icons */}
      <div className="flex items-center gap-4">
        {/* Instagram */}
        <motion.a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => haptic('light')}
          whileHover={{ scale: 1.12, y: -2 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCB045] text-white shadow-lg"
          aria-label="Instagram @malikali065"
          title="@malikali065 auf Instagram"
        >
          <motion.div
            animate={{
              rotate: [0, -8, 8, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Instagram className="h-6 w-6" strokeWidth={2.2} />
          </motion.div>
          {/* Pulsing ring */}
          <motion.div
            className="absolute inset-0 rounded-2xl ring-2 ring-[#FD1D1D]/40"
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />
        </motion.a>

        {/* Website */}
        <motion.a
          href={WEBSITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => haptic('light')}
          whileHover={{ scale: 1.12, y: -2 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#457B9D] to-[#2A9D8F] text-white shadow-lg"
          aria-label="Website"
          title="arche-website.pages.dev"
        >
          <motion.div
            animate={{
              rotate: [0, 360],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            <Globe className="h-6 w-6" strokeWidth={2.2} />
          </motion.div>
          {/* Subtle glow ring */}
          <motion.div
            className="absolute inset-0 rounded-2xl ring-2 ring-[#457B9D]/40"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
          />
        </motion.a>
      </div>

      {/* Username handles */}
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-xs font-medium text-muted-foreground">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            @malikali065
          </a>
          {' · '}
          <a
            href={WEBSITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            arche-website.pages.dev
          </a>
        </p>
      </div>

      {/* Web-only Android APK Download Button */}
      {isWeb && (
        <motion.a
          href={ANDROID_APK_URL}
          download="imposter.apk"
          onClick={() => haptic('medium')}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="group relative my-1 flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-950/40 hover:shadow-emerald-600/30 transition-all border border-emerald-400/20"
          aria-label="Download on Android!"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-black/20 text-white">
            <AndroidIcon className="h-3.5 w-3.5 fill-current" />
          </div>
          <span>Download on Android!</span>
          <Download className="h-3.5 w-3.5 text-emerald-100 group-hover:translate-y-0.5 transition-transform" />
        </motion.a>
      )}

      {/* Author + Copyright */}
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="flex items-center gap-1 text-sm font-semibold text-foreground">
          Entwickelt mit
          <motion.span
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-block"
            style={{ color: 'var(--impostor)' }}
          >
            <Heart className="h-3.5 w-3.5 fill-current" />
          </motion.span>
          von Ali Malik
        </p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          © {new Date().getFullYear()} Ali Malik · All rights reserved
        </p>
        <p className="text-[10px] text-muted-foreground/70">
          Imposter v2.4.0
        </p>
      </div>
    </motion.div>
  )
}
