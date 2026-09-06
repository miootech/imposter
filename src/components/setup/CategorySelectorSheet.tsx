'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo, useEffect, useRef } from 'react'
import { Search, X, Check, Shuffle } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { getCatalog, getTotalWordCount, RANDOM_CATEGORY_ID } from '@/lib/game/content/catalog'
import { listCustomCategories } from '@/lib/repositories/categoryRepository'
import type { Category } from '@/lib/game/models'
import type { CustomCategoryRecord } from '@/lib/db/localDb'
import { IconRenderer } from '@/components/common/IconRenderer'
import { haptic } from '@/lib/game/services/haptics'
import { playSound } from '@/lib/game/services/sound'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { usePreferencesStore } from '@/stores/preferencesStore'

interface CategorySelectorSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedId: string | null
  onSelect: (categoryId: string) => void
}

export function CategorySelectorSheet({
  open,
  onOpenChange,
  selectedId,
  onSelect,
}: CategorySelectorSheetProps) {
  const { t } = useTranslation()
  const wordLanguage = usePreferencesStore((s) => s.wordLanguage)
  const [query, setQuery] = useState('')
  const [customCats, setCustomCats] = useState<CustomCategoryRecord[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Load custom categories when sheet opens
  useEffect(() => {
    if (open) {
      listCustomCategories().then(cats => setCustomCats(cats))
    }
  }, [open])

  // Build merged category list: custom FIRST, then built-in in selected wordLanguage
  const allCategories = useMemo(() => {
    const custom = customCats.map(c => ({ ...c, isCustom: true }))
    const builtIn = getCatalog(wordLanguage).map(c => ({ ...c, isCustom: false }))
    return [...custom, ...builtIn]
  }, [customCats, wordLanguage])

  // Reset search when sheet closes; focus input when it opens
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setQuery(''), 200)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => inputRef.current?.focus(), 250)
    return () => clearTimeout(t)
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allCategories
    return allCategories.filter(c =>
      c.displayName.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.words.some(w => w.text.toLowerCase().includes(q)),
    )
  }, [query, allCategories])

  const handleSelect = (cat: Category & { isCustom?: boolean }) => {
    haptic('success')
    playSound('select')
    onSelect(cat.id)
    setTimeout(() => onOpenChange(false), 200)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] max-h-[700px] p-0 flex flex-col"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader className="px-5 pb-2">
          <SheetTitle className="text-xl">{t('selectCategory')}</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {filtered.length} / {allCategories.length} {t('category')}
          </SheetDescription>
        </SheetHeader>

        {/* Search bar */}
        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t('searchCategories')}
              className="h-11 w-full rounded-2xl border border-border bg-card pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {query && (
              <button
                onClick={() => {
                  haptic('light')
                  setQuery('')
                  inputRef.current?.focus()
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Random category pill — always at the top */}
        <div className="px-3 pb-2">
          <motion.button
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={() => {
              haptic('success')
              playSound('select')
              onSelect(RANDOM_CATEGORY_ID)
              setTimeout(() => onOpenChange(false), 200)
            }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors',
              selectedId === RANDOM_CATEGORY_ID
                ? 'bg-primary/10 ring-2 ring-primary shadow-sm'
                : 'bg-card ring-1 ring-border hover:bg-muted/40',
            )}
          >
            {/* Shuffle icon tile */}
            <div
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors',
                selectedId === RANDOM_CATEGORY_ID ? 'bg-primary/15' : 'bg-muted/60',
              )}
            >
              <Shuffle className={cn(
                'h-6 w-6 transition-colors',
                selectedId === RANDOM_CATEGORY_ID ? 'text-primary' : 'text-muted-foreground',
              )} />
            </div>

            {/* Name + total word count */}
            <div className="min-w-0 flex-1">
              <p className={cn(
                'truncate font-semibold',
                selectedId === RANDOM_CATEGORY_ID ? 'text-primary' : 'text-foreground',
              )}>
                {t('randomCategory')} 🎲
              </p>
              <p className="text-xs text-muted-foreground">
                {getTotalWordCount(wordLanguage)} {t('wordsCount')}
              </p>
            </div>

            {/* Selected check */}
            <AnimatePresence>
              {selectedId === RANDOM_CATEGORY_ID && (
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Divider */}
        <div className="mx-5 mb-1 h-px bg-border" />

        {/* List */}
        <div className="flex-1 overflow-y-auto px-3 pb-6 pt-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 text-4xl opacity-50">🔍</div>
              <p className="font-semibold text-foreground">{t('error')}</p>
            </div>
          ) : (
            <motion.div layout className="space-y-1.5">
              <AnimatePresence mode="popLayout">
                {filtered.map((cat, idx) => {
                  const isSelected = cat.id === selectedId
                  return (
                    <motion.button
                      key={cat.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{
                        delay: Math.min(idx * 0.025, 0.25),
                        type: 'spring',
                        stiffness: 320,
                        damping: 28,
                      }}
                      onClick={() => handleSelect(cat)}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors',
                        isSelected
                          ? 'bg-primary/10 ring-2 ring-primary shadow-sm'
                          : cat.isCustom
                          ? 'bg-accomplice/5 ring-1 ring-accomplice/20'
                          : 'bg-card ring-1 ring-border hover:bg-muted/40',
                      )}
                      style={cat.isCustom && !isSelected ? {
                        backgroundColor: 'color-mix(in srgb, var(--accomplice) 5%, transparent)',
                        borderColor: 'color-mix(in srgb, var(--accomplice) 20%, transparent)',
                      } : undefined}
                    >
                      {/* Icon tile — supports image icons */}
                      <div
                        className={cn(
                          'flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl transition-colors',
                          isSelected ? 'bg-primary/15' : 'bg-muted/60',
                        )}
                      >
                        <IconRenderer icon={cat.icon} size={48} />
                      </div>

                      {/* Name + dynamic word counter (no word preview) */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className={cn(
                            'truncate font-semibold',
                            isSelected ? 'text-primary' : 'text-foreground',
                          )}>
                            {cat.displayName}
                          </p>
                          {cat.isCustom && (
                            <span
                              className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase"
                              style={{
                                backgroundColor: 'color-mix(in srgb, var(--accomplice) 15%, transparent)',
                                color: 'var(--accomplice)',
                              }}
                            >
                              Eigen
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {cat.words.length} {cat.words.length === 1 ? 'Wort' : 'Wörter'}
                        </p>
                      </div>

                      {/* Selected check */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 90 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md"
                          >
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
