import * as React from 'react'
import { cn } from '../../lib/utils'

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('block text-[13px] font-medium text-foreground/90', className)}
      {...props}
    />
  )
}

export function FieldDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-[12.5px] leading-relaxed text-muted-2', className)} {...props} />
}

export function FieldError({
  className,
  children,
  id,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & { id?: string }) {
  if (!children) return null
  return (
    <p
      id={id}
      role="alert"
      className={cn('flex items-start gap-1.5 text-[12.5px] font-medium text-danger', className)}
      {...props}
    >
      <span aria-hidden="true" className="mt-[1px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
      <span>{children}</span>
    </p>
  )
}

interface FieldProps {
  id: string
  label: React.ReactNode
  description?: React.ReactNode
  error?: React.ReactNode
  required?: boolean
  children: React.ReactNode
  className?: string
}

/** Label + control + description + error, wired together with aria attributes. */
export function Field({ id, label, description, error, required, children, className }: FieldProps) {
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id}>
          {label}
          {required && (
            <span aria-hidden="true" className="ml-1 text-danger">
              *
            </span>
          )}
        </Label>
      </div>
      {children}
      {description && (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      )}
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  )
}
