'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { haptic } from '@/lib/game/services/haptics'
import { playSound } from '@/lib/game/services/sound'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg' | 'xl'

interface GameButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  hapticPattern?: 'light' | 'medium' | 'heavy' | 'success'
  soundType?: 'tap' | 'select' | 'vote' | 'reveal'
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'bg-transparent text-foreground hover:bg-muted',
  danger: 'bg-destructive text-destructive-foreground shadow-lg shadow-destructive/25',
  success: 'bg-success text-success-foreground shadow-lg shadow-success/25',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm rounded-xl',
  md: 'h-12 px-6 text-base rounded-2xl',
  lg: 'h-14 px-8 text-lg rounded-2xl',
  xl: 'h-16 px-10 text-xl rounded-3xl',
}

export const GameButton = forwardRef<HTMLButtonElement, GameButtonProps>(
  function GameButton(
    {
      variant = 'primary',
      size = 'md',
      fullWidth,
      hapticPattern = 'light',
      soundType = 'tap',
      leftIcon,
      rightIcon,
      loading,
      className,
      children,
      onClick,
      disabled,
      ...rest
    },
    ref,
  ) {
    return (
      <motion.button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 font-semibold select-none',
          'transition-shadow duration-200 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className,
        )}
        whileTap={{ scale: disabled ? 1 : 0.96 }}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        onClick={(e) => {
          if (disabled || loading) return
          haptic(hapticPattern)
          playSound(soundType)
          onClick?.(e)
        }}
        disabled={disabled || loading}
        {...rest}
      >
        {loading ? (
          <motion.span
            className="inline-block h-5 w-5 rounded-full border-2 border-current border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
        ) : (
          <>
            {leftIcon && <span className="-ml-0.5 inline-flex">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="-mr-0.5 inline-flex">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    )
  },
)
