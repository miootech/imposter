'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import type { Category } from '@/lib/game/models'
import { getCategoryById } from '@/lib/game/content/catalog'
import { haptic } from '@/lib/game/services/haptics'
import { playSound } from '@/lib/game/services/sound'

interface CompactCategoryCardProps {
  categoryId: string
  onChange: () => void
}

/**
 * CompactCategoryCard
 * -------------------
 * Compact trigger button that shows the currently selected category.
 * Tapping it opens the CategorySelectorSheet (handled by parent).
 *
 * Layout:
 *  - Icon tile on the left with subtle pulse animation
 *  - "Kategorie" label (muted, uppercase) + category name (bold)
 *  - Word count (muted)
 *  - Chevron-down on the right that rotates when sheet opens (parent-controlled)
 *
 * Replaces the old 3-column grid of all categories. Scales to 100+ categories
 * because the sheet handles the long list with search.
 */
export function CompactCategoryCard({ categoryId, onChange }: CompactCategoryCardProps) {
  const cat: Category = getCategoryById(categoryId)

  return (
    <motion.button
      onClick={() => {
        haptic('medium')
        playSound('tap')
        onChange()
      }}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.005 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="group relative w-full overflow-hidden rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border hover:ring-primary/30 transition-all"
      aria-label={`Kategorie: ${cat.displayName}. Tippen zum Wechseln.`}
    >
      <div className="flex items-center gap-4">
        {/* Icon tile with subtle pulse + crossfade on category change */}
        <motion.div
          className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)',
          }}
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={cat.id}
              initial={{ scale: 0.4, opacity: 0, rotate: -30 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.4, opacity: 0, rotate: 30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            >
              {cat.icon}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        {/* Category info */}
        <div className="min-w-0 flex-1 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Kategorie
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={cat.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="truncate text-lg font-bold text-foreground"
            >
              {cat.displayName}
            </motion.p>
          </AnimatePresence>
          <p className="text-xs text-muted-foreground">
            {cat.words.length} Wörter verfügbar
          </p>
        </div>

        {/* Chevron-down — rotates on hover, indicates "openable" */}
        <motion.div
          animate={{ rotate: 0 }}
          whileHover={{ rotate: 180 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </div>
    </motion.button>
  )
}
