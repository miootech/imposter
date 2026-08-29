'use client'

import { motion } from 'framer-motion'
import { Home, Users, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGameStore, type Tab } from '@/stores/gameStore'
import { haptic } from '@/lib/game/services/haptics'
import { playSound } from '@/lib/game/services/sound'

const TABS: Array<{ id: Tab; label: string; icon: typeof Home }> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'groups', label: 'Gruppen', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function BottomNav() {
  const activeTab = useGameStore(s => s.activeTab)
  const setActiveTab = useGameStore(s => s.setActiveTab)
  const gameScreen = useGameStore(s => s.gameScreen)

  // Hide bottom nav during active game play (preserve immersion)
  const inGame = gameScreen !== 'none'

  if (inGame) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur-md"
      role="navigation"
      aria-label="Hauptnavigation"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              className="relative flex flex-1 flex-col items-center gap-1 py-3 px-2"
              onClick={() => {
                if (active) return
                haptic('light')
                playSound('tap')
                setActiveTab(id)
              }}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute top-0 h-1 w-10 rounded-b-full bg-primary"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div
                animate={{
                  scale: active ? 1.1 : 1,
                  y: active ? -2 : 0,
                  color: active ? 'var(--primary)' : 'var(--muted-foreground)',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              </motion.div>
              <span
                className={cn(
                  'text-[11px] font-medium',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
