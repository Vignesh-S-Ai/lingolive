import * as React from 'react'
import { Activity, Radio } from 'lucide-react'
import { useMetricsStore } from '../../store/metricsStore'
import { cn } from '../../lib/utils'

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[12px]">
      <span className="text-muted-2">{label}</span>
      <span className="font-mono tabular-nums text-foreground/90">{value}</span>
    </div>
  )
}

function StatusDot({ tone }: { tone: 'ok' | 'warn' | 'bad' | 'muted' }) {
  return (
    <span
      className={cn(
        'inline-block h-1.5 w-1.5 shrink-0 rounded-full',
        tone === 'ok' && 'bg-success',
        tone === 'warn' && 'bg-warning',
        tone === 'bad' && 'bg-danger',
        tone === 'muted' && 'bg-muted-2'
      )}
      aria-hidden="true"
    />
  )
}

const PIPELINE_TONE: Record<string, 'ok' | 'warn' | 'bad' | 'muted'> = {
  open: 'ok',
  connecting: 'warn',
  error: 'bad',
  closed: 'muted',
  idle: 'muted',
}

const LIVEKIT_TONE: Record<string, 'ok' | 'warn' | 'bad' | 'muted'> = {
  connected: 'ok',
  connecting: 'warn',
  error: 'bad',
  idle: 'muted',
}

/**
 * Live-mode observability panel: pipeline/voice connection state plus the
 * honest per-stage latencies reported by the backend for recent segments.
 */
export function LiveMetricsPanel() {
  const status = useMetricsStore((s) => s.status)
  const liveKitStatus = useMetricsStore((s) => s.liveKitStatus)
  const pingMs = useMetricsStore((s) => s.pingMs)
  const last = useMetricsStore((s) => s.last)
  const avg = useMetricsStore((s) => s.avg)
  const segments = useMetricsStore((s) => s.segments)
  const error = useMetricsStore((s) => s.error)
  const firstAudioMs = useMetricsStore((s) => s.firstAudioMs)

  const ms = (v: number | null | undefined) => (typeof v === 'number' ? `${v} ms` : '—')

  return (
    <section
      className="rounded-xl border border-white/[0.09] bg-surface/70 p-3.5"
      aria-label="Live connection metrics"
    >
      <header className="mb-2.5 flex items-center gap-2">
        <Activity className="h-3.5 w-3.5 text-primary-bright" aria-hidden="true" />
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-2">
          Live metrics
        </h3>
      </header>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-[12px]">
          <span className="flex items-center gap-1.5 text-muted-2">
            <StatusDot tone={PIPELINE_TONE[status] ?? 'muted'} />
            Pipeline
          </span>
          <span className="font-mono text-foreground/90">{status}</span>
        </div>
        <div className="flex items-center justify-between gap-2 text-[12px]">
          <span className="flex items-center gap-1.5 text-muted-2">
            <StatusDot tone={LIVEKIT_TONE[liveKitStatus] ?? 'muted'} />
            <Radio className="h-3 w-3" aria-hidden="true" />
            Voice
          </span>
          <span className="font-mono text-foreground/90">{liveKitStatus}</span>
        </div>

        <div className="my-2 border-t border-white/[0.07]" />

        <Row label="Round trip" value={pingMs !== null ? ms(pingMs) : '—'} />
        <Row label="Pause → final" value={ms(last?.endpoint_ms)} />
        <Row label="First audio" value={ms(last?.first_audio_ms ?? firstAudioMs)} />
        <Row label="Recognise (avg)" value={ms(avg?.stt_ms)} />
        <Row label="Translate (avg)" value={ms(avg?.translate_ms)} />
        <Row label="Voice (avg)" value={ms(avg?.tts_ms)} />
        <Row
          label="Last segment"
          value={
            last
              ? `${ms(last.stt_ms)} / ${ms(last.translate_ms)} / ${ms(last.tts_ms)}`
              : '—'
          }
        />
        <Row label="Segments" value={segments} />
      </div>

      {error && (
        <p className="mt-2.5 break-words rounded-lg border border-danger/30 bg-danger/10 px-2.5 py-2 text-[11.5px] leading-relaxed text-danger">
          {error}
        </p>
      )}
    </section>
  )
}
