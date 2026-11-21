import * as React from 'react'
import { Play, ScrollText } from 'lucide-react'
import { Avatar } from '../../components/ui/avatar'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { getLanguage } from '../../lib/languages'
import { cn } from '../../lib/utils'
import type { LivePartial, TranscriptEntry } from '../../types'

function timeOf(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function TranscriptFeed({
  entries,
  partial,
  localId,
  localOutputLanguage,
  showOriginal,
  showTranslated,
  onSpeak,
  className,
}: {
  entries: TranscriptEntry[]
  /** In-flight recognition line shown under the committed entries (live sessions). */
  partial?: LivePartial | null
  localId: string
  localOutputLanguage: string
  showOriginal: boolean
  showTranslated: boolean
  onSpeak: (text: string, lang: string) => void
  className?: string
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const pinnedRef = React.useRef(true)

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48
  }

  React.useEffect(() => {
    const el = scrollRef.current
    if (!el || !pinnedRef.current) return
    el.scrollTop = el.scrollHeight
  }, [entries.length])

  const outputLang = getLanguage(localOutputLanguage)

  return (
    <section className={cn('flex min-h-0 flex-col', className)}>
      <header className="flex items-center justify-between gap-3 px-1 pb-3">
        <h2 className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-muted-2">
          <ScrollText aria-hidden="true" className="h-3.5 w-3.5" />
          Transcript
        </h2>
        <span className="font-mono text-[11.5px] text-muted-2">{entries.length}</span>
      </header>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1"
        tabIndex={0}
        aria-label="Conversation transcript"
      >
        {entries.length === 0 && !partial ? (
          <div className="flex h-full min-h-[160px] flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.1] px-6 py-8 text-center">
            <p className="text-[13.5px] font-medium text-foreground">Nothing said yet</p>
            <p className="mt-1.5 max-w-xs text-[12.5px] leading-relaxed text-muted-2">
              Lines will appear here as participants speak — original first, then your translation.
            </p>
          </div>
        ) : (
          <ol className="space-y-3">
            {entries.map((entry) => {
              const translation = entry.translations[localId]
              const isLocal = entry.participantId === localId
              return (
                <li
                  key={entry.id}
                  className={cn(
                    'rounded-lg border p-3.5 transition-colors',
                    isLocal
                      ? 'border-primary/30 bg-primary/[0.05]'
                      : 'border-white/[0.08] bg-surface/70'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar name={entry.participantName} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                      {entry.participantName}
                    </span>
                    <Badge variant="neutral" size="sm">
                      {getLanguage(entry.language)?.short ?? '—'}
                    </Badge>
                    {entry.simulated && (
                      <Badge variant="warning" size="sm">
                        Simulated
                      </Badge>
                    )}
                    <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-2">
                      {timeOf(entry.timestamp)}
                    </span>
                  </div>

                  {showOriginal && (
                    <p
                      lang={getLanguage(entry.language)?.code.split('-')[0]}
                      className="mt-2.5 break-words text-[14.5px] leading-relaxed text-foreground/85"
                    >
                      {entry.originalText}
                    </p>
                  )}

                  {showTranslated && translation && (
                    <div className="mt-2.5 flex items-start gap-3 border-t border-white/[0.07] pt-2.5">
                      <p
                        lang={getLanguage(translation.language)?.code.split('-')[0]}
                        className="min-w-0 flex-1 break-words text-[14.5px] leading-relaxed text-secondary-bright/95"
                      >
                        {translation.text}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0"
                        aria-label={`Play the ${outputLang?.name ?? 'translated'} version`}
                        onClick={() => onSpeak(translation.text, translation.language)}
                      >
                        <Play className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  )}
                </li>
              )
            })}
            {partial && (
              <li
                key="live-partial"
                aria-live="polite"
                className="rounded-lg border border-dashed border-primary/30 bg-primary/[0.03] p-3.5"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={partial.participantName} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground/80">
                    {partial.participantName}
                  </span>
                  <Badge variant="neutral" size="sm">
                    {getLanguage(partial.language)?.short ?? '—'}
                  </Badge>
                  <span className="shrink-0 text-[11px] italic text-muted-2">speaking…</span>
                </div>
                <p
                  lang={getLanguage(partial.language)?.code.split('-')[0]}
                  className="mt-2.5 break-words text-[14.5px] leading-relaxed text-foreground/55"
                >
                  {partial.text}
                  <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-[2px] animate-pulse bg-primary-bright" />
                </p>
              </li>
            )}
          </ol>
        )}
      </div>
    </section>
  )
}
