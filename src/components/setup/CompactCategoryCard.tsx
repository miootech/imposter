'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Shuffle } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { Category } from '@/lib/game/models'
import { IconRenderer } from '@/components/common/IconRenderer'
import { CATALOG, getCategoryByIdAsync, RANDOM_CATEGORY_ID, getTotalWordCount } from '@/lib/game/content/catalog'
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
 * Special handling for RANDOM_CATEGORY_ID ('__random__'):
 *  - Shows "Zufall" as the name with a shuffle icon
 *  - Shows the TOTAL word count across all categories
 *  - The actual category is picked randomly at game start (not shown)
 */
export function CompactCategoryCard({ categoryId, onChange }: CompactCategoryCardProps) {
  const isRandom = categoryId === RANDOM_CATEGORY_ID
  const builtinCat = !isRandom ? CATALOG.find(c => c.id === categoryId) : null
  const [cat, setCat] = useState<Category | null>(builtinCat ?? null)

  useEffect(() => {
    if (isRandom || cat) return
    getCategoryByIdAsync(categoryId).then(setCat).catch(() => {})
  }, [categoryId, cat, isRandom])

  // Random category display
  if (isRandom) {
    const totalWords = getTotalWordCount()
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
        className="group relative w-full overflow-hidden rounded-2xl bg-card p-4 shadow-sm ring-2 ring-primary hover:ring-primary/40 transition-all"
        aria-label="Kategorie: Zufall. Tippen zum Wechseln."
      >
        <div className="flex items-center gap-4">
          {/* Animated shuffle icon */}
          <motion.div
            className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)',
            }}
            animate={{ rotate: [0, -8, 8, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
          >
            <Shuffle className="h-7 w-7 text-primary" />
          </motion.div>

          {/* Category info */}
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Kategorie
            </p>
            <p className="text-lg font-bold text-primary">
              Zufall 🎲
            </p>
            <p className="text-xs text-muted-foreground">
              {totalWords} Wörter aus allen Kategorien
            </p>
          </div>

          {/* Chevron-down */}
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

  if (!cat) {
    return (
      <motion.button
        onClick={() => { haptic('medium'); playSound('tap'); onChange() }}
        className="group relative w-full overflow-hidden rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border"
      >
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 animate-pulse rounded-2xl bg-muted" />
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Kategorie</p>
            <p className="text-lg font-bold text-muted">Lädt…</p>
          </div>
        </div>
      </motion.button>
    )
  }

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
              <IconRenderer icon={cat.icon} />
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
