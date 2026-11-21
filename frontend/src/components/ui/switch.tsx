import * as React from 'react'
import { cn } from '../../lib/utils'

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  id?: string
  disabled?: boolean
  'aria-label'?: string
  'aria-describedby'?: string
  className?: string
}

export function Switch({
  checked,
  onChange,
  id,
  disabled,
  className,
  ...aria
}: SwitchProps) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'border-primary/50 bg-primary/70' : 'border-white/[0.14] bg-white/[0.08]',
        className
      )}
      {...aria}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none block h-5 w-5 translate-x-0.5 rounded-full bg-foreground shadow-md transition-transform duration-200 ease-out',
          checked && 'translate-x-[22px]'
        )}
      />
    </button>
  )
}
