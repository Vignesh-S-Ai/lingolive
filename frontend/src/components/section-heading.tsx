import * as React from 'react'
import { cn } from '../lib/utils'

interface SectionHeadingProps {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  align?: 'left' | 'center'
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' && 'mx-auto max-w-3xl text-center',
        className
      )}
    >
      {eyebrow && (
        <p className="mb-3.5 inline-flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-secondary">
          <span aria-hidden="true" className="h-px w-6 bg-secondary/50" />
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-[clamp(1.75rem,3.4vw,2.6rem)] font-bold leading-[1.12] tracking-[-0.03em] text-foreground text-balance">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-[15.5px] leading-relaxed text-muted text-pretty">{description}</p>
      )}
    </div>
  )
}
