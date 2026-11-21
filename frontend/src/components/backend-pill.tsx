import { Badge, StatusDot } from './ui/badge'
import { useBackendHealth } from '../hooks/use-backend-health'
import { cn } from '../lib/utils'

/** Compact platform-status pill derived from `GET /v1/health`. */
export function BackendPill({ className, pollMs = 30000 }: { className?: string; pollMs?: number }) {
  const { status, refresh } = useBackendHealth(pollMs)

  const label =
    status === 'online'
      ? 'Service online'
      : status === 'checking'
        ? 'Checking service'
        : 'Service offline'

  return (
    <button
      type="button"
      onClick={refresh}
      title="Re-check the translation service"
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11.5px] font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        status === 'online' && 'border-success/35 bg-success/10 text-success hover:bg-success/15',
        status === 'checking' &&
          'border-white/[0.12] bg-white/[0.04] text-muted hover:border-white/[0.2]',
        status === 'offline' && 'border-warning/35 bg-warning/10 text-warning hover:bg-warning/15',
        className
      )}
    >
      <StatusDot
        tone={status === 'online' ? 'success' : status === 'checking' ? 'muted' : 'warning'}
        pulse={status === 'online'}
      />
      {label}
    </button>
  )
}

/** Longer, explanatory variant used inside error states. */
export function BackendStatusText({ className }: { className?: string }) {
  const { status, detail } = useBackendHealth()
  return (
    <Badge variant={status === 'online' ? 'success' : status === 'offline' ? 'warning' : 'neutral'} className={cn(className)}>
      <StatusDot tone={status === 'online' ? 'success' : status === 'checking' ? 'muted' : 'warning'} />
      {status === 'online'
        ? 'Translation service online'
        : status === 'checking'
          ? 'Checking translation service…'
          : (detail ?? 'Translation service unavailable')}
    </Badge>
  )
}
