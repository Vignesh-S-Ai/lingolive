import { Info, RefreshCw, TriangleAlert } from 'lucide-react'
import { Alert } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import type { RoomStatus } from './room-header'

/**
 * Persistent, honest disclosure: the room UI works, but the media and
 * intelligence providers behind it are not connected in this deployment.
 */
export function MediaNotice() {
  return (
    <div
      role="note"
      className="flex items-start gap-2.5 border-b border-white/[0.07] bg-warning/[0.06] px-4 py-2.5 sm:px-6"
    >
      <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
      <p className="text-[12px] leading-relaxed text-warning/95">
        LiveKit and Gnani are not connected in this deployment — speech, translation and voice in
        this room are <strong className="font-semibold">simulated</strong>, and marked as such
        wherever they appear.
      </p>
    </div>
  )
}

/** Stronger, actionable state when the backend itself could not be reached. */
export function RoomStatusBanner({
  status,
  message,
  onRetry,
}: {
  status: RoomStatus
  message: string | null
  onRetry: () => void
}) {
  if (status === 'preview') {
    return (
      <div className="px-4 pt-4 sm:px-6">
        <Alert
          variant="warning"
          title="Running as a preview session"
          action={
            <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Retry
            </Button>
          }
        >
          {message ??
            'The translation service did not respond, so nothing has been joined on the server. Everything below is a clearly-labelled simulation.'}
        </Alert>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="px-4 pt-4 sm:px-6">
        <Alert
          variant="danger"
          title="Could not open this room"
          action={
            <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Retry
            </Button>
          }
        >
          {message ?? 'Something went wrong while opening the room.'}
        </Alert>
      </div>
    )
  }

  return null
}

export function OfflineStrip() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-[12px] text-muted-2 sm:px-6">
      <TriangleAlert aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      Reconnecting is handled automatically — use Retry in the banner above when you are ready.
    </div>
  )
}
