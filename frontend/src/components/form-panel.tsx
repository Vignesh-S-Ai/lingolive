import * as React from 'react'
import { cn } from '../lib/utils'

export function FormPanel({
  children,
  footer,
  className,
}: {
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-white/[0.1] bg-surface/80 shadow-card backdrop-blur-xl',
        className
      )}
    >
      <div className="divide-y divide-white/[0.07]">{children}</div>
      {footer && (
        <div className="border-t border-white/[0.07] bg-white/[0.02] px-6 py-5">{footer}</div>
      )}
    </div>
  )
}

export function FormSection({
  index,
  title,
  hint,
  children,
  className,
}: {
  index: string
  title: React.ReactNode
  hint?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('px-6 py-6', className)}>
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="font-mono text-[10.5px] font-semibold tracking-[0.14em] text-primary-bright/80"
        >
          {index}
        </span>
        <h2 className="text-[13.5px] font-semibold tracking-tight text-foreground">{title}</h2>
      </div>
      {hint && <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-2">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}
