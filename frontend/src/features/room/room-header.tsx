import * as React from 'react'
import { Check, Copy, LogOut, Settings2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LogoMark } from '../../components/logo'
import { Badge, StatusDot } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Tooltip } from '../../components/ui/tooltip'
import { cn } from '../../lib/utils'

export type RoomStatus = 'connecting' | 'live' | 'preview' | 'not-found' | 'error'

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

export function RoomHeader({
  roomName,
  roomCode,
  status,
  durationMs,
  onLeave,
}: {
  roomName: string
  roomCode: string
  status: RoomStatus
  durationMs: number
  onLeave: () => void
}) {
  const [copied, setCopied] = React.useState(false)

  const copy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard unavailable — the code is visible in the header anyway */
    }
  }, [roomCode])

  const statusLabel =
    status === 'live'
      ? 'Room live'
      : status === 'preview'
        ? 'Preview session'
        : status === 'connecting'
          ? 'Joining…'
          : 'Not connected'

  const statusTone =
    status === 'live' ? 'success' : status === 'preview' ? 'warning' : 'muted'

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-background/85 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <Link
          to="/"
          aria-label="LingoLive home"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.1] bg-elevated transition-colors hover:border-white/[0.2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LogoMark className="h-5 w-5" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-[14.5px] font-semibold tracking-tight text-foreground">
              {roomName || 'Untitled conversation'}
            </h1>
            {status === 'preview' && (
              <Badge variant="secondary" size="sm" className="hidden sm:inline-flex">
                Simulated media
              </Badge>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <button
              type="button"
              onClick={copy}
              className="group inline-flex max-w-full items-center gap-1.5 rounded font-mono text-[11.5px] text-muted-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title="Copy room code"
            >
              <span className="truncate">{roomCode || '—'}</span>
              {copied ? (
                <Check aria-hidden="true" className="h-3 w-3 text-success" />
              ) : (
                <Copy
                  aria-hidden="true"
                  className="h-3 w-3 opacity-60 transition-opacity group-hover:opacity-100"
                />
              )}
            </button>
            {copied && <span className="text-[11px] text-success">Copied</span>}
          </div>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <Badge variant={statusTone === 'success' ? 'success' : statusTone === 'warning' ? 'warning' : 'neutral'}>
            <StatusDot tone={statusTone === 'success' ? 'success' : statusTone === 'warning' ? 'warning' : 'muted'} />
            {statusLabel}
          </Badge>
          <span className="font-mono text-[12.5px] tabular-nums text-muted-2">
            {formatDuration(durationMs)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Tooltip content="Settings">
            <Link
              to="/settings"
              aria-label="Open settings"
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-muted transition-colors',
                'hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
            >
              <Settings2 className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Tooltip>
          <Button variant="danger" size="sm" onClick={onLeave}>
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Leave</span>
          </Button>
        </div>
      </div>

      {/* Compact status strip on small screens */}
      <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-4 py-1.5 sm:hidden">
        <Badge variant={statusTone === 'success' ? 'success' : statusTone === 'warning' ? 'warning' : 'neutral'}>
          <StatusDot tone={statusTone === 'success' ? 'success' : statusTone === 'warning' ? 'warning' : 'muted'} />
          {statusLabel}
        </Badge>
        <span className="font-mono text-[11.5px] tabular-nums text-muted-2">
          {formatDuration(durationMs)}
        </span>
      </div>
    </header>
  )
}
