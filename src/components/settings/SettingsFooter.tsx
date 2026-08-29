'use client'

import { motion } from 'framer-motion'
import { Instagram, Globe, Heart } from 'lucide-react'
import { haptic } from '@/lib/game/services/haptics'

const INSTAGRAM_URL = 'https://instagram.com/malikali065'
const WEBSITE_URL = 'https://arche-website.pages.dev'

/**
 * SettingsFooter
 * --------------
 * Footer section in the Settings screen with:
 *  - Animated Instagram icon → links to @malikali065
 *  - Animated Website icon → links to arche-website.pages.dev
 *  - Author credit: "Ali Malik"
 *  - Copyright notice: "All rights reserved"
 */
export function SettingsFooter() {
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
