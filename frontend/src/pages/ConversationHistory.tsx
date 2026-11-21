import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { ArrowRight, Plus, ScrollText, Trash2, Users } from 'lucide-react'
import { LinkButton } from '../components/ui/link-button'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Panel } from '../components/ui/panel'
import { useHistoryStore, type HistoryEntry } from '../store/historyStore'
import { getLanguage } from '../lib/languages'
import { cn } from '../lib/utils'

function LanguageChips({ codes }: { codes: string[] }) {
  const visible = codes.slice(0, 6)
  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((code) => {
        const lang = getLanguage(code)
        return (
          <Badge key={code} variant="neutral" size="sm">
            {lang?.short ?? code}
          </Badge>
        )
      })}
      {codes.length > visible.length && (
        <Badge variant="neutral" size="sm">
          +{codes.length - visible.length}
        </Badge>
      )}
    </div>
  )
}

function HistoryCard({
  entry,
  onOpen,
  onRemove,
}: {
  entry: HistoryEntry
  onOpen: () => void
  onRemove: () => void
}) {
  const started = new Date(entry.startedAt)
  const minutes = Math.max(1, Math.round(entry.durationMs / 60000))

  return (
    <li className="group rounded-xl border border-white/[0.09] bg-surface/70 p-5 shadow-card transition-all duration-300 hover:border-white/[0.16] hover:bg-surface">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-display text-[16px] font-semibold tracking-tight text-foreground">
              {entry.name}
            </h2>
            <Badge variant={entry.preview ? 'warning' : 'success'} size="sm">
              {entry.preview ? 'Preview' : 'Live'}
            </Badge>
          </div>
          <p className="mt-1 font-mono text-[12px] text-muted-2">{entry.code}</p>
        </div>

        <div className="text-right">
          <p className="text-[13px] text-muted">
            {formatDistanceToNow(started, { addSuffix: true })}
          </p>
          <p className="mt-0.5 font-mono text-[11.5px] text-muted-2">
            {minutes} min · {entry.transcriptCount} line{entry.transcriptCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <p className="mt-3.5 line-clamp-2 border-l-2 border-primary/50 pl-3 text-[13.5px] leading-relaxed text-muted">
        {entry.summary}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-[12px] text-muted-2">
            <Users aria-hidden="true" className="h-3.5 w-3.5" />
            {entry.participants.length}
          </span>
          <LanguageChips codes={entry.languages} />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            aria-label={`Delete ${entry.name} from history`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button variant="secondary" size="sm" onClick={onOpen}>
            Open conversation
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </li>
  )
}

export default function ConversationHistory() {
  const entries = useHistoryStore((s) => s.entries)
  const remove = useHistoryStore((s) => s.remove)
  const navigate = useNavigate()

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-240px] h-[380px] w-[760px] -translate-x-1/2 rounded-full bg-primary/14 blur-[140px]" />
        <div className="absolute inset-0 bg-grid opacity-30" />
      </div>

      <div className="mx-auto w-full max-w-3xl px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.09] pb-7">
          <div>
            <p className="font-mono text-[11.5px] font-semibold uppercase tracking-[0.16em] text-primary-bright">
              History
            </p>
            <h1 className="mt-3 font-display text-[clamp(1.65rem,4vw,2.25rem)] font-extrabold leading-[1.15] tracking-[-0.03em]">
              Conversations you’ve had
            </h1>
            <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-muted">
              Stored in this browser only. Opening one reattaches to the same room code — if the
              room has expired you’ll be told, not dropped into an empty screen.
            </p>
          </div>
          {entries.length > 0 && (
            <Badge variant="neutral">{entries.length} saved</Badge>
          )}
        </header>

        {entries.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-white/[0.12] bg-surface/50 px-6 py-16 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.1] bg-elevated text-primary-bright">
              <ScrollText className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mt-5 font-display text-[18px] font-bold tracking-tight">
              No conversations yet
            </h2>
            <p className="mx-auto mt-2.5 max-w-sm text-[13.5px] leading-relaxed text-muted">
              When you leave a room, it lands here with its code, participants and a line of what
              was last said — so you can pick it straight back up.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-2.5">
              <LinkButton to="/create-conversation" size="sm">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Start a conversation
              </LinkButton>
              <LinkButton to="/join-conversation" variant="secondary" size="sm">
                Join with a code
              </LinkButton>
            </div>
          </div>
        ) : (
          <>
            <ol className="mt-8 space-y-4">
              {entries.map((entry) => (
                <HistoryCard
                  key={entry.id}
                  entry={entry}
                  onOpen={() => navigate(`/room/${entry.code}`)}
                  onRemove={() => remove(entry.code)}
                />
              ))}
            </ol>

            <Panel
              title="Nothing else is kept"
              description="Audio is never recorded, and transcript lines live only for the length of a session."
              className="mt-8"
            >
              <p className="text-[13px] leading-relaxed text-muted">
                Each entry keeps the room code, timing, participant languages and a single summary
                line. Clear it any time from{' '}
                <span className="text-foreground">Settings → Clear history</span>.
              </p>
            </Panel>
          </>
        )}
      </div>
    </div>
  )
}
