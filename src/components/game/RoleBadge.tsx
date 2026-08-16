'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ROLES, type RoleId } from '@/lib/game/models'
import { usePreferencesStore } from '@/stores/preferencesStore'

interface RoleBadgeProps {
  role: RoleId
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showLabel?: boolean
  className?: string
}

const sizeClasses = {
  sm: { container: 'h-7 px-2 text-xs gap-1', icon: 'text-sm' },
  md: { container: 'h-9 px-3 text-sm gap-1.5', icon: 'text-base' },
  lg: { container: 'h-12 px-5 text-base gap-2', icon: 'text-xl' },
  xl: { container: 'h-16 px-8 text-xl gap-3', icon: 'text-3xl' },
}

export function RoleBadge({ role, size = 'md', showLabel = true, className }: RoleBadgeProps) {
  const info = ROLES[role]
  const emoji = usePreferencesStore(s => s.roleEmojis[role])
  const sizes = sizeClasses[size]

  return (
    <motion.div
      className={cn(
        'inline-flex items-center rounded-full font-semibold',
        'bg-[var(--color-${info.colorVar}-soft)] text-[var(--color-${info.colorVar})]',
        sizes.container,
        className,
      )}
      style={{
        // Use CSS vars for role colors
        backgroundColor: `var(--${info.colorVar}-soft)`,
        color: `var(--${info.colorVar})`,
      }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <span className={sizes.icon}>{emoji}</span>
      {showLabel && <span>{info.displayName}</span>}
    </motion.div>
  )
}

interface RoleIconProps {
  role: RoleId
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'huge'
  className?: string
}

const iconSizes = {
  sm: 'text-base',
  md: 'text-2xl',
  lg: 'text-4xl',
  xl: 'text-6xl',
  huge: 'text-8xl',
}

export function RoleIcon({ role, size = 'md', className }: RoleIconProps) {
  const info = ROLES[role]
  const emoji = usePreferencesStore(s => s.roleEmojis[role])
  return (
    <span
      className={cn('inline-block leading-none', iconSizes[size], className)}
      role="img"
      aria-label={info.displayName}
      style={{ color: `var(--${info.colorVar})` }}
    >
      {emoji}
    </span>
  )
}
