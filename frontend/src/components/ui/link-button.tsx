import * as React from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { type VariantProps } from 'class-variance-authority'
import { buttonVariants } from './button'
import { cn } from '../../lib/utils'

export type LinkButtonProps = LinkProps &
  VariantProps<typeof buttonVariants> & {
    children: React.ReactNode
  }

/**
 * Router link that looks like a Button.
 * Used instead of nesting <Link> inside <button>, which is invalid HTML
 * and silently breaks navigation.
 */
export function LinkButton({ className, variant, size, ...props }: LinkButtonProps) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
