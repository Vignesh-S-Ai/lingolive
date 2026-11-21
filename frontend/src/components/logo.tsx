import { Link } from 'react-router-dom'
import { cn } from '../lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showWordmark?: boolean
  className?: string
}

const markSizes = {
  sm: 'h-7 w-7 rounded-[7px]',
  md: 'h-8 w-8 rounded-lg',
  lg: 'h-10 w-10 rounded-[11px]',
}

const wordSizes = {
  sm: 'text-[15px]',
  md: 'text-[17px]',
  lg: 'text-xl',
}

export function LogoMark({ className, size = 'md' }: { className?: string; size?: LogoProps['size'] }) {
  return (
    <span
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden border border-white/[0.12] bg-elevated shadow-[inset_0_1px_0_rgb(255_255_255/0.07)]',
        markSizes[size ?? 'md'],
        className
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[62%] w-[62%]">
        <defs>
          <linearGradient id="logo-g" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgb(var(--primary-bright))" />
            <stop offset="1" stopColor="rgb(var(--secondary))" />
          </linearGradient>
        </defs>
        <path
          d="M5 16V8M9.5 19V5M14 17V7M18.5 20V4"
          stroke="url(#logo-g)"
          strokeWidth="2.3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}

export function Logo({ size = 'md', showWordmark = true, className }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      {showWordmark && (
        <span
          className={cn(
            'font-display font-extrabold tracking-[-0.03em] text-foreground',
            wordSizes[size]
          )}
        >
          Lingo<span className="text-primary-bright">Live</span>
        </span>
      )}
    </span>
  )
}

/** Logo as a router link. */
export function LogoLink(props: LogoProps) {
  return (
    <Link to="/" aria-label="LingoLive home" className="rounded-md transition-opacity hover:opacity-85">
      <Logo {...props} />
    </Link>
  )
}
