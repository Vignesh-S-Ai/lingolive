import * as React from 'react'
import { cn } from '../../lib/utils'

export interface PanelProps {
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
  /** Renders as a bare column (no card chrome) — used inside rails. */
  flush?: boolean
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  flush = false,
}: PanelProps) {
  if (flush) {
    return (
      <section className={className}>
        <header className="flex items-center justify-between gap-3 px-4 pb-3">
          <div className="min-w-0">
            <h2 className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-muted-2">
              {title}
            </h2>
            {description && <p className="mt-1 text-[12px] text-muted-2">{description}</p>}
          </div>
          {action}
        </header>
        <div className={bodyClassName}>{children}</div>
      </section>
    )
  }

  return (
    <section
      className={cn(
        'overflow-hidden rounded-xl border border-white/[0.09] bg-surface/70 shadow-card',
        className
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3.5">
        <div className="min-w-0">
          <h2 className="text-[12.5px] font-semibold tracking-tight text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-[12px] text-muted-2">{description}</p>}
        </div>
        {action}
      </header>
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </section>
  )
}
