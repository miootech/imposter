'use client'

import { motion } from 'framer-motion'
import { ChevronRight, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Group } from '@/lib/game/models'
import { haptic } from '@/lib/game/services/haptics'

interface GroupCardProps {
  group: Group
  onClick?: () => void
  compact?: boolean
  className?: string
}

export function GroupCard({ group, onClick, compact, className }: GroupCardProps) {
  return (
    <motion.button
      className={cn(
        'group relative w-full overflow-hidden rounded-2xl bg-card text-left shadow-sm ring-1 ring-border',
        'transition-shadow hover:shadow-md',
        className,
      )}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        haptic('light')
        onClick?.()
      }}
    >
      {/* Color stripe */}
      <div
        className="absolute left-0 top-0 h-full w-1.5"
        style={{ backgroundColor: group.color }}
      />

      <div className={cn('flex items-center gap-4 p-4 pl-6', compact && 'p-4 pl-6')}>
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl"
          style={{ backgroundColor: `${group.color}20` }}
        >
          {group.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-bold text-foreground">{group.name}</h3>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{group.players.length} Spieler</span>
            {group.players.length > 0 && (
              <>
                <span>·</span>
                <span className="truncate">{group.players.reduce((s, p) => s + p.points, 0)} Punkte</span>
              </>
            )}
          </div>

          {/* Player avatars */}
          {!compact && group.players.length > 0 && (
            <div className="mt-3 flex -space-x-1.5">
              {group.players.slice(0, 6).map(p => (
                <div
                  key={p.id}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white ring-2 ring-card"
                  style={{ backgroundColor: p.color }}
                  title={p.displayName}
                >
                  {p.displayName.slice(0, 1).toUpperCase()}
                </div>
              ))}
              {group.players.length > 6 && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground ring-2 ring-card">
                  +{group.players.length - 6}
                </div>
              )}
            </div>
          )}
        </div>

        <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </motion.button>
  )
}
