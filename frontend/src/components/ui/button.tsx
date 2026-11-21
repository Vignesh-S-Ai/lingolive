import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.985] [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground shadow-[0_10px_30px_-12px_rgb(var(--primary)/0.85)] hover:bg-primary-bright hover:shadow-[0_16px_40px_-12px_rgb(var(--primary)/0.95)]',
        secondary:
          'bg-elevated text-foreground border border-white/[0.12] hover:bg-elevated-2 hover:border-white/[0.2] shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]',
        outline:
          'border border-white/[0.14] bg-transparent text-foreground hover:bg-white/[0.05] hover:border-white/[0.24]',
        ghost: 'bg-transparent text-muted hover:bg-white/[0.06] hover:text-foreground',
        danger:
          'bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25 hover:border-danger/50',
        link: 'text-primary-bright underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-3.5 text-[13px] rounded-sm',
        md: 'h-11 px-5 text-sm',
        lg: 'h-12 px-7 text-[15px] rounded-lg',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading = false, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
)
Button.displayName = 'Button'

export { buttonVariants }
