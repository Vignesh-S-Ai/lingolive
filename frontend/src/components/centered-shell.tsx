import * as React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '../lib/utils'

export interface CenteredShellProps {
  eyebrow: string
  title: React.ReactNode
  description?: React.ReactNode
  backTo?: string
  backLabel?: string
  children: React.ReactNode
  /** Extra element pinned to the right of the back link (e.g. a status pill). */
  aside?: React.ReactNode
  className?: string
}

/**
 * Single-column stage used by the create / join flows: a back link, a tight
 * header, and one refined panel — not a bare form dumped on a page.
 */
export function CenteredShell({
  eyebrow,
  title,
  description,
  backTo = '/',
  backLabel = 'Back',
  children,
  aside,
  className,
}: CenteredShellProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-260px] h-[460px] w-[860px] -translate-x-1/2 rounded-full bg-primary/18 blur-[140px]" />
        <div className="absolute inset-0 bg-grid opacity-40" />
      </div>

      <div className="mx-auto w-full max-w-xl px-5 pb-20 pt-8 sm:px-8 sm:pt-12">
        <div className="flex items-center justify-between gap-4">
          <Link
            to={backTo}
            className="group inline-flex items-center gap-1.5 rounded-md text-[13px] font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft
              aria-hidden="true"
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            {backLabel}
          </Link>
          {aside}
        </div>

        <header className="mt-9">
          <p className="font-mono text-[11.5px] font-semibold uppercase tracking-[0.16em] text-primary-bright">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-display text-[clamp(1.65rem,4vw,2.25rem)] font-extrabold leading-[1.15] tracking-[-0.03em] text-balance">
            {title}
          </h1>
          {description && (
            <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{description}</p>
          )}
        </header>

        <div className="mt-8">{children}</div>
      </div>
    </div>
  )
}
