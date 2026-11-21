import * as React from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger'

const variants: Record<
  AlertVariant,
  { wrapper: string; icon: React.ElementType; iconClass: string }
> = {
  info: {
    wrapper: 'border-primary/30 bg-primary/[0.08]',
    icon: Info,
    iconClass: 'text-primary-bright',
  },
  success: {
    wrapper: 'border-success/30 bg-success/[0.08]',
    icon: CheckCircle2,
    iconClass: 'text-success',
  },
  warning: {
    wrapper: 'border-warning/30 bg-warning/[0.08]',
    icon: AlertTriangle,
    iconClass: 'text-warning',
  },
  danger: {
    wrapper: 'border-danger/30 bg-danger/[0.08]',
    icon: XCircle,
    iconClass: 'text-danger',
  },
}

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: AlertVariant
  title?: React.ReactNode
  /** Rendered on the right — typically a retry button. */
  action?: React.ReactNode
}

export function Alert({
  variant = 'info',
  title,
  action,
  children,
  className,
  ...props
}: AlertProps) {
  const { wrapper, icon: Icon, iconClass } = variants[variant]
  return (
    <div
      role={variant === 'danger' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-lg border px-4 py-3.5', wrapper, className)}
      {...props}
    >
      <Icon aria-hidden="true" className={cn('mt-0.5 h-4 w-4 shrink-0', iconClass)} />
      <div className="min-w-0 flex-1">
        {title && <p className="text-[13.5px] font-semibold text-foreground">{title}</p>}
        {children && (
          <div
            className={cn(
              'text-[13px] leading-relaxed text-muted',
              title && 'mt-1'
            )}
          >
            {children}
          </div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
