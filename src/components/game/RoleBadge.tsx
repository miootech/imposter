'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ROLES, type RoleId } from '@/lib/game/models'
import { IconRenderer } from '@/components/common/IconRenderer'
import { usePreferencesStore } from '@/stores/preferencesStore'

interface RoleBadgeProps {
  role: RoleId
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showLabel?: boolean
  german?: boolean
  className?: string
}

const badgeConfig = {
  sm: { container: 'h-7 px-2 text-xs gap-1', iconSize: 16 },
  md: { container: 'h-9 px-3 text-sm gap-1.5', iconSize: 24 },
  lg: { container: 'h-12 px-5 text-base gap-2', iconSize: 32 },
  xl: { container: 'h-16 px-8 text-xl gap-3', iconSize: 48 },
}

export function RoleBadge({ role, size = 'md', showLabel = true, german = false, className }: RoleBadgeProps) {
  const info = ROLES[role]
  const emoji = usePreferencesStore(s => s.roleEmojis[role])
  const config = badgeConfig[size]

  return (
    <motion.div
      className={cn('inline-flex items-center rounded-full font-semibold', config.container, className)}
      style={{
        backgroundColor: `var(--${info.colorVar}-soft)`,
        color: `var(--${info.colorVar})`,
      }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <IconRenderer icon={emoji} size={config.iconSize} shape="circle" />
      {showLabel && <span>{german ? info.germanName : info.displayName}</span>}
    </motion.div>
  )
}

interface RoleIconProps {
  role: RoleId
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'huge'
  className?: string
}

const iconConfig = {
  sm: 20,
  md: 32,
  lg: 48,
  xl: 80,
  huge: 128,
}

export function RoleIcon({ role, size = 'md', className }: RoleIconProps) {
  const info = ROLES[role]
  const emoji = usePreferencesStore(s => s.roleEmojis[role])

  return (
    <span className={cn('inline-flex items-center justify-center', className)} role="img" aria-label={info.displayName}>
      <IconRenderer icon={emoji} size={iconConfig[size]} shape="circle" />
    </span>
  )
}
