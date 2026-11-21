import * as React from 'react'
import { cn } from '../../lib/utils'

const palette = [
  'from-primary/70 to-secondary/60',
  'from-secondary/70 to-primary/50',
  'from-primary-bright/70 to-danger/50',
  'from-warning/60 to-primary/60',
  'from-success/60 to-secondary/60',
  'from-danger/60 to-warning/50',
]

function hash(input: string) {
  let h = 0
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0
  return Math.abs(h)
}

export interface AvatarProps {
  name: string
  /** ISO-639-1 style code — rendered as a small script badge when given. */
  languageCode?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  speaking?: boolean
  className?: string
}

const sizes = {
  sm: 'h-8 w-8 text-[12px]',
  md: 'h-10 w-10 text-[13.5px]',
  lg: 'h-12 w-12 text-[15px]',
  xl: 'h-16 w-16 text-xl',
}

export function Avatar({ name, languageCode, size = 'md', speaking = false, className }: AvatarProps) {
  const initials = React.useMemo(() => {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (!parts.length) return '?'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }, [name])

  const gradient = palette[hash(name) % palette.length]

  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <span
        aria-hidden="true"
        className={cn(
          'flex items-center justify-center rounded-full bg-gradient-to-br font-semibold uppercase text-white/95 ring-1 ring-white/15',
          sizes[size],
          gradient,
          speaking && 'ring-2 ring-secondary/80 shadow-[0_0_0_4px_rgb(var(--secondary)/0.18)]'
        )}
      >
        {initials}
      </span>
      {languageCode && (
        <span
          aria-hidden="true"
          className="absolute -bottom-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-background bg-elevated-2 px-1 text-[8.5px] font-bold uppercase tracking-wide text-muted"
        >
          {languageCode.split('-')[0]}
        </span>
      )}
    </span>
  )
}
