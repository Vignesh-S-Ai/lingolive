import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        neutral: 'border-white/[0.12] bg-white/[0.05] text-muted',
        primary: 'border-primary/35 bg-primary/12 text-primary-bright',
        secondary: 'border-secondary/35 bg-secondary/12 text-secondary-bright',
        success: 'border-success/35 bg-success/12 text-success',
        warning: 'border-warning/35 bg-warning/12 text-warning',
        danger: 'border-danger/35 bg-danger/12 text-danger',
        outline: 'border-white/[0.16] bg-transparent text-foreground/85',
      },
      size: {
        sm: 'h-5 px-2 text-[10.5px] tracking-[0.06em] uppercase',
        md: 'h-[26px] px-2.5 text-[11.5px] tracking-[0.05em] uppercase',
        lg: 'h-8 px-3 text-[12.5px]',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
}

/** Small glowing dot used for live / connected indicators. */
export function StatusDot({
  className,
  tone = 'success',
  pulse = true,
}: {
  className?: string
  tone?: 'success' | 'warning' | 'danger' | 'primary' | 'muted'
  pulse?: boolean
}) {
  const tones: Record<string, string> = {
    success: 'bg-success shadow-[0_0_10px_rgb(var(--success)/0.9)]',
    warning: 'bg-warning shadow-[0_0_10px_rgb(var(--warning)/0.9)]',
    danger: 'bg-danger shadow-[0_0_10px_rgb(var(--danger)/0.9)]',
    primary: 'bg-primary-bright shadow-[0_0_10px_rgb(var(--primary)/0.9)]',
    muted: 'bg-muted-2',
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block h-1.5 w-1.5 shrink-0 rounded-full',
        tones[tone],
        pulse && 'animate-pulse-dot',
        className
      )}
    />
  )
}
