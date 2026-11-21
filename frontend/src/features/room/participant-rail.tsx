import { MicOff } from 'lucide-react'
import { Avatar } from '../../components/ui/avatar'
import { Badge } from '../../components/ui/badge'
import { SpeakingBars } from '../../components/waveform'
import { getLanguage, languageNativeLabel } from '../../lib/languages'
import type { ParticipantView } from '../../types'
import { cn } from '../../lib/utils'

function Pair({ code, prefix }: { code: string; prefix: string }) {
  const lang = getLanguage(code)
  return (
    <span className="flex items-baseline gap-1 text-[11.5px] leading-tight">
      <span className="uppercase tracking-[0.08em] text-muted-2">{prefix}</span>
      <span
        lang={lang?.code.split('-')[0]}
        className="truncate font-medium text-muted"
        title={languageNativeLabel(code)}
      >
        {languageNativeLabel(code)}
      </span>
    </span>
  )
}

export function ParticipantRail({
  participants,
  localQuality,
}: {
  participants: ParticipantView[]
  localQuality: ParticipantView['quality']
}) {
  const hasDemo = participants.some((p) => p.id.startsWith('demo-'))

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-2 px-4 pb-3 pt-4">
        <h2 className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-muted-2">
          Participants
        </h2>
        <span className="font-mono text-[11.5px] text-muted-2">{participants.length}</span>
      </header>

      <ul className="flex-1 space-y-1 overflow-y-auto px-2 pb-2">
        {participants.map((p) => (
          <li
            key={p.id}
            className={cn(
              'rounded-lg px-2.5 py-2.5 transition-colors',
              p.isSpeaking ? 'bg-secondary/[0.08]' : 'hover:bg-white/[0.03]'
            )}
          >
            <div className="flex items-start gap-2.5">
              <Avatar
                name={p.name}
                languageCode={p.inputLanguage}
                size="md"
                speaking={p.isSpeaking}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[13.5px] font-medium text-foreground">
                    {p.name}
                  </span>
                  {p.isLocal && (
                    <Badge variant="primary" size="sm" className="shrink-0">
                      You
                    </Badge>
                  )}
                </div>

                <div className="mt-1.5 space-y-0.5">
                  <Pair code={p.inputLanguage} prefix="says" />
                  <Pair code={p.outputLanguage} prefix="hears" />
                </div>
              </div>

              <div className="flex h-8 shrink-0 items-center gap-2 pr-0.5">
                {p.micEnabled ? (
                  <SpeakingBars
                    active={p.isSpeaking}
                    className={cn('h-3', p.isSpeaking ? 'text-secondary' : 'text-muted-2')}
                  />
                ) : (
                  <MicOff aria-label="Microphone muted" className="h-3.5 w-3.5 text-danger" />
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="border-t border-white/[0.07] px-4 py-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2 text-[11.5px]">
          <span className="text-muted-2">Your connection</span>
          <span
            className={cn(
              'font-medium',
              localQuality === 'good'
                ? 'text-success'
                : localQuality === 'fair'
                  ? 'text-warning'
                  : localQuality === 'poor'
                    ? 'text-danger'
                    : 'text-muted'
            )}
          >
            {localQuality === 'unknown' ? '—' : localQuality}
          </span>
        </div>
        {hasDemo && (
          <p className="text-[11.5px] leading-relaxed text-muted-2">
            Other participants are simulated until a LiveKit room is connected.
          </p>
        )}
      </div>
    </div>
  )
}
