'use client'

import { cn } from '@/lib/utils'

interface IconRendererProps {
  /** Emoji character OR data:image base64 URL */
  icon: string
  /** Size in px — applied to BOTH the wrapper and the img. Default 40. */
  size?: number
  /** Shape of the container */
  shape?: 'circle' | 'rounded' | 'square'
  /** Extra className for the wrapper */
  className?: string
}

/**
 * IconRenderer
 * ------------
 * Renders either an emoji or an uploaded image inside a FIXED-SIZE wrapper.
 *
 * The wrapper is a div with explicit width/height in pixels.
 * - For images: the img is position:absolute inset:0 object-cover — fills the wrapper exactly.
 * - For emojis: a centered span with line-height:1.
 *
 * The wrapper clips with overflow-hidden + border-radius based on shape.
 * This guarantees the image stays inside its container, no matter what
 * flex/parent layout surrounds it.
 */
export function IconRenderer({
  icon,
  size = 40,
  shape = 'circle',
  className,
}: IconRendererProps) {
  if (!icon || typeof icon !== 'string') return null

  const radius = shape === 'circle' ? '50%' : shape === 'rounded' ? '28%' : '0%'
  const fontSize = Math.round(size * 0.6)

  const isImage = icon.startsWith('data:image')

  return (
    <div
      className={cn('relative shrink-0 overflow-hidden', className)}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: radius,
      }}
    >
      {isImage ? (
        <img
          src={icon}
          alt="Icon"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: radius,
          }}
        />
      ) : (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            fontSize: `${fontSize}px`,
            lineHeight: '1',
          }}
        >
          {icon}
        </span>
      )}
    </div>
  )
}
