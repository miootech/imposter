'use client'

import { motion } from 'framer-motion'
import { useMemo, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export interface DonutSegment {
  /** Stable key for React */
  id: string
  /** Value used to compute proportional arc length */
  value: number
  /** CSS color string (theme tokens, hex, var(...)) */
  color: string
  /** Emoji or short icon to render at the segment midpoint */
  icon: string
  /** Optional accessible label */
  label?: string
}

interface DonutStatsRingProps {
  segments: DonutSegment[]
  /** Large metric shown in the center (e.g. total games played) */
  centerValue: number
  /** Subtitle under the center value */
  centerLabel?: string
  /** Diameter in pixels (default 220) */
  size?: number
  /** Stroke thickness of the ring (default 26) */
  strokeWidth?: number
  /** Gap between segments in degrees (default 12) */
  gapDegrees?: number
  className?: string
  /** Animate the draw-in on mount (default true) */
  animateIn?: boolean
}

/**
 * DonutStatsRing
 * --------------
 * A segmented, broken-ring chart inspired by rounded health-score rings.
 *  - Each segment is a thick arc with rounded line caps
 *  - Defined angular gaps between segments (default 12° for clear separation)
 *  - Center shows a large bold metric
 *  - Each segment has its own icon anchored ON the ring stroke via a
 *    fixed-size circular container (no floating)
 *
 * Pure SVG + Framer Motion. No external chart lib.
 *
 * Proportional scaling: a segment with 70% of total value occupies exactly
 * 70% of the available ring circumference (after subtracting gaps).
 */
export function DonutStatsRing({
  segments,
  centerValue,
  centerLabel,
  size = 220,
  strokeWidth = 28,
  gapDegrees = 12,
  className,
  animateIn = true,
}: DonutStatsRingProps) {
  const radius = (size - strokeWidth) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * radius

  // Total gap = number of segments * gapDegrees
  const totalGap = segments.length * gapDegrees
  // Available degrees for arcs = 360 - totalGap
  const availableDegrees = Math.max(0, 360 - totalGap)
  const totalValue = segments.reduce((s, seg) => s + Math.max(0, seg.value), 0)

  // Compute each segment's arc degrees and start angle (in degrees, 0 = top, clockwise)
  const layout = useMemo(() => {
    let cursor = 0  // degrees from top, going clockwise
    return segments.map(seg => {
      const proportion = totalValue > 0 ? Math.max(0, seg.value) / totalValue : 0
      const arcDegrees = proportion * availableDegrees
      const startDeg = cursor
      const endDeg = cursor + arcDegrees
      // Midpoint for icon placement
      const midDeg = startDeg + arcDegrees / 2
      cursor = endDeg + gapDegrees
      return {
        ...seg,
        proportion,
        arcDegrees,
        startDeg,
        endDeg,
        midDeg,
      }
    })
  }, [segments, totalValue, availableDegrees, gapDegrees])

  // Animated draw-in: start at 0% and grow to full
  const [progress, setProgress] = useState(animateIn ? 0 : 1)
  useEffect(() => {
    if (!animateIn) {
      setProgress(1)
      return
    }
    const t = setTimeout(() => setProgress(1), 50)
    return () => clearTimeout(t)
  }, [animateIn])

  // Icon container size — slightly larger than stroke for visual presence
  const iconContainerSize = strokeWidth + 8

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={centerLabel ?? `${centerValue}`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background ring */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={strokeWidth}
          opacity={0.35}
        />
        {/* Segments */}
        {layout.map((seg, idx) => {
          const dashLength = (seg.arcDegrees / 360) * circumference * progress
          // Subtract a small visual padding from each dash so the rounded cap
          // doesn't overshoot into the gap
          const visualPadding = (gapDegrees / 360) * circumference * 0.5
          const effectiveDash = Math.max(0, dashLength - visualPadding)
          const dashOffset = -(seg.startDeg / 360) * circumference
          return (
            <motion.circle
              key={seg.id}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${effectiveDash} ${circumference}`}
              strokeDashoffset={dashOffset}
              initial={animateIn ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 + idx * 0.08, duration: 0.3 }}
            />
          )
        })}
      </svg>

      {/* Segment icons — anchored ON the ring stroke via fixed-size containers */}
      {layout.map((seg, idx) => {
        if (seg.arcDegrees < 10) return null  // too narrow for an icon
        // Convert "0=top, clockwise" to standard math coords (0=right, CCW)
        const midRad = (seg.midDeg - 90) * (Math.PI / 180)
        const x = cx + radius * Math.cos(midRad)
        const y = cy + radius * Math.sin(midRad)
        return (
          <motion.div
            key={`icon-${seg.id}`}
            className="pointer-events-none absolute flex items-center justify-center"
            style={{
              left: x,
              top: y,
              width: iconContainerSize,
              height: iconContainerSize,
              marginLeft: -iconContainerSize / 2,
              marginTop: -iconContainerSize / 2,
              lineHeight: 1,
            }}
            initial={animateIn ? { opacity: 0, scale: 0.3 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.4 + idx * 0.08,
              type: 'spring',
              stiffness: 300,
              damping: 18,
            }}
          >
            {/* Anchor circle: segment-colored background to tie icon to its arc */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                backgroundColor: 'var(--card)',
                boxShadow: `0 0 0 2px ${seg.color}`,
              }}
            />
            {/* Emoji icon centered with no line-height padding */}
            <span
              className="relative flex items-center justify-center"
              style={{
                fontSize: Math.max(11, strokeWidth * 0.5),
                lineHeight: 1,
              }}
            >
              {seg.icon}
            </span>
          </motion.div>
        )
      })}

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={animateIn ? { scale: 0.6, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 18 }}
          className="text-4xl font-bold tabular-nums text-foreground"
        >
          {centerValue}
        </motion.div>
        {centerLabel && (
          <motion.div
            initial={animateIn ? { opacity: 0, y: 4 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            {centerLabel}
          </motion.div>
        )}
      </div>
    </div>
  )
}
