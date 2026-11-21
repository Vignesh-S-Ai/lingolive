import * as React from 'react'
import { AudioLines, Ear, Languages, MicOff, Sparkles, Volume2 } from 'lucide-react'
import { Avatar } from '../../components/ui/avatar'
import { Badge, StatusDot } from '../../components/ui/badge'
import { LiveWaveform, Waveform } from '../../components/waveform'
import { getLanguage, languageNativeLabel } from '../../lib/languages'
import { cn } from '../../lib/utils'
import type { ParticipantView, TranscriptEntry, TranslationPhase } from '../../types'

const STEPS = [
  { key: 'recognizing', label: 'Listen', icon: Ear },
  { key: 'translating', label: 'Translate', icon: Languages },
  { key: 'generating-voice', label: 'Voice', icon: Sparkles },
  { key: 'playing', label: 'Play', icon: Volume2 },
] as const

const PHASE_INDEX: Record<string, number> = {
  recognizing: 0,
  translating: 1,
  'generating-voice': 2,
  playing: 3,
}

const STATUS_TEXT: Record<TranslationPhase, string> = {
  idle: 'Ready when you are',
  listening: 'Listening',
  waiting: 'Listening for the next speaker',
  recognizing: 'Recognising speech',
  translating: 'Translating for each listener',
  'generating-voice': 'Generating translated voice',
  playing: 'Playing the translation',
}

export function Stage({
  phase,
  speaker,
  latest,
  localId,
  localOutputLanguage,
  showOriginal,
  showTranslated,
  micLevel,
  micEnabled,
  micLive,
  micError,
  simulated = true,
}: {
  phase: TranslationPhase
  speaker: ParticipantView | null
  latest: TranscriptEntry | null
  localId: string
  localOutputLanguage: string
  showOriginal: boolean
  showTranslated: boolean
  micLevel: number
  micEnabled: boolean
  micLive: boolean
  micError: string | null
  /** False in live sessions — only affects fallback copy, never real data. */
  simulated?: boolean
}) {
  const activeIndex = PHASE_INDEX[phase] ?? -1
  const outputLang = getLanguage(localOutputLanguage)
  const translation = latest?.translations[localId]

  const localSpeaker = speaker?.isLocal === true
  const showLiveWave = localSpeaker && micEnabled && micLive

  return (
    <div className="flex h-full flex-col">
      {/* Pipeline */}
      <ol className="flex flex-wrap items-center gap-1.5">
        {STEPS.map((step, i) => {
          const state = activeIndex < 0 ? 'idle' : i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'idle'
          const Icon = step.icon
          return (
            <li key={step.key}>
              <span
                className={cn(
                  'inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11.5px] font-medium transition-all duration-300',
                  state === 'active' &&
                    'border-secondary/50 bg-secondary/12 text-secondary-bright shadow-[0_0_18px_-6px_rgb(var(--secondary)/0.8)]',
                  state === 'done' && 'border-white/[0.1] bg-white/[0.04] text-foreground/75',
                  state === 'idle' && 'border-white/[0.07] bg-transparent text-muted-2'
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn('h-3 w-3', state === 'active' && 'animate-pulse')}
                />
                {step.label}
              </span>
            </li>
          )
        })}
        <li className="ml-auto">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-2">
            {phase === 'waiting' || phase === 'idle' ? 'standby' : 'in progress'}
          </span>
        </li>
      </ol>

      {/* Speaker hero */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-6">
        <div className="relative">
          <Avatar
            name={speaker?.name ?? 'You'}
            languageCode={speaker?.inputLanguage ?? localOutputLanguage}
            size="xl"
            speaking={!!speaker?.isSpeaking}
          />
          {micEnabled && !micLive && localSpeaker && (
            <span
              aria-label="Microphone unavailable"
              className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-danger text-white"
            >
              <MicOff aria-hidden="true" className="h-3 w-3" />
            </span>
          )}
        </div>

        <p className="mt-4 text-center text-[15px] font-semibold text-foreground">
          {speaker?.name ?? 'Nobody is speaking'}
        </p>
        <p
          aria-live="polite"
          className={cn(
            'mt-1 flex items-center gap-1.5 text-center text-[12.5px]',
            phase === 'waiting' || phase === 'idle' ? 'text-muted-2' : 'text-secondary-bright'
          )}
        >
          {(phase === 'waiting' || phase === 'idle') && <StatusDot tone="muted" pulse={false} />}
          {STATUS_TEXT[phase]}
        </p>

        <div className="mt-5 h-10 w-full max-w-md text-primary-bright">
          {showLiveWave ? (
            <LiveWaveform level={micLevel} bars={44} />
          ) : (
            <Waveform
              bars={44}
              active={!!speaker?.isSpeaking}
              intensity={speaker?.isSpeaking ? 1 : 0}
            />
          )}
        </div>
        <p className="mt-2 text-center text-[11.5px] text-muted-2">
          {showLiveWave
            ? 'Live microphone level'
            : micEnabled && !micLive && localSpeaker && micError
              ? micError
              : simulated
                ? 'Simulated speech waveform'
                : micEnabled
                  ? 'Connecting microphone…'
                  : 'Microphone muted'}
        </p>
      </div>

      {/* Subtitles */}
      <div className="grid gap-3 sm:grid-cols-2">
        {showOriginal && latest && (
          <figure className="rounded-xl border border-white/[0.09] bg-surface/70 p-4">
            <figcaption className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 truncate text-[12px] text-muted">
                <AudioLines aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{latest.participantName}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Badge variant="neutral" size="sm">
                  {getLanguage(latest.language)?.short ?? '—'}
                </Badge>
                {latest.simulated && (
                  <Badge variant="warning" size="sm">
                    Simulated
                  </Badge>
                )}
              </span>
            </figcaption>
            <p
              lang={getLanguage(latest.language)?.code.split('-')[0]}
              className="mt-2.5 break-words text-[16.5px] leading-relaxed text-foreground/90"
            >
              {latest.originalText}
            </p>
          </figure>
        )}

        {showTranslated && latest && translation && (
          <figure className="relative overflow-hidden rounded-xl border border-secondary/30 bg-secondary/[0.06] p-4">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/70 to-transparent"
            />
            <figcaption className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-[12px] text-secondary-bright">
                <Volume2 aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                Translated for you
              </span>
              <Badge variant="secondary" size="sm">
                {outputLang?.short ?? '—'}
              </Badge>
            </figcaption>
            <p
              lang={outputLang?.code.split('-')[0]}
              className="mt-2.5 break-words text-[17.5px] font-medium leading-relaxed text-foreground"
            >
              {translation.text}
            </p>
          </figure>
        )}

        {showTranslated && latest && !translation && (
          <figure className="rounded-xl border border-white/[0.09] bg-surface/70 p-4">
            <figcaption className="text-[12px] text-muted">Translated for you</figcaption>
            <p className="mt-2.5 text-[15px] text-muted-2">
              {languageNativeLabel(localOutputLanguage)} translation will appear here.
            </p>
          </figure>
        )}
      </div>
    </div>
  )
}
