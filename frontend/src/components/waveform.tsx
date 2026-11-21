import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

/**
 * Animated audio waveform. Purely decorative — it never claims to represent
 * real captured audio unless `live` is explicitly set by the caller.
 */
export function Waveform({
  bars = 28,
  active = false,
  className,
  barClassName,
  intensity = 1,
}: {
  bars?: number
  active?: boolean
  className?: string
  barClassName?: string
  intensity?: number
}) {
  const seeds = React.useMemo(
    () => Array.from({ length: bars }, (_, i) => 0.25 + Math.abs(Math.sin(i * 1.7)) * 0.75),
    [bars]
  )

  return (
    <span
      aria-hidden="true"
      className={cn('flex h-full w-full items-center gap-[3px]', className)}
    >
      {seeds.map((seed, i) => (
        <motion.span
          key={i}
          className={cn('w-[3px] flex-1 rounded-full bg-current', barClassName)}
          style={{ transformOrigin: 'center', minHeight: 3 }}
          animate={
            active
              ? {
                  scaleY: [seed * 0.35, seed * intensity, seed * 0.45, seed * intensity * 0.8, seed * 0.35],
                }
              : { scaleY: seed * 0.28 }
          }
          transition={
            active
              ? {
                  duration: 0.9 + (i % 5) * 0.14,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: (i % 7) * 0.06,
                }
              : { duration: 0.4, ease: 'easeOut' }
          }
        />
      ))}
    </span>
  )
}

/** Three-dot speaking indicator used on participant cards. */
export function SpeakingBars({ active, className }: { active: boolean; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('inline-flex h-3.5 items-end gap-[2px]', className)}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            'w-[3px] rounded-full bg-current transition-all duration-300',
            active ? 'animate-wave-bar' : 'opacity-35'
          )}
          style={{
            height: '100%',
            animationDelay: `${i * 0.14}s`,
            transformOrigin: 'bottom',
            transform: active ? undefined : 'scaleY(0.3)',
          }}
        />
      ))}
    </span>
  )
}

/**
 * Waveform driven by a real captured amplitude (0…1). Bar heights track the
 * live microphone level rather than a decorative animation.
 */
export function LiveWaveform({
  level,
  bars = 32,
  className,
  barClassName,
  floor = 0.06,
}: {
  level: number
  bars?: number
  className?: string
  barClassName?: string
  floor?: number
}) {
  const seeds = React.useMemo(
    () => Array.from({ length: bars }, (_, i) => 0.35 + Math.abs(Math.sin(i * 2.3)) * 0.65),
    [bars]
  )
  const amplitude = Math.min(1, Math.max(0, level))

  return (
    <span
      aria-hidden="true"
      className={cn('flex h-full w-full items-center gap-[3px]', className)}
    >
      {seeds.map((seed, i) => {
        const height = Math.max(floor, Math.min(1, seed * (floor + amplitude * 1.05)))
        return (
          <span
            key={i}
            className={cn('w-[3px] flex-1 rounded-full bg-current transition-all', barClassName)}
            style={{
              height: `${Math.round(height * 100)}%`,
              minHeight: 3,
              transitionDuration: `${70 + (i % 5) * 18}ms`,
            }}
          />
        )
      })}
    </span>
  )
}
