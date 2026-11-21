import * as React from 'react'
import { cn } from '../../lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'flex h-11 w-full rounded-md border border-white/[0.12] bg-surface px-3.5 text-sm text-foreground placeholder:text-muted-2 transition-colors',
      'hover:border-white/[0.2]',
      'focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/15',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  />
))
Input.displayName = 'Input'
