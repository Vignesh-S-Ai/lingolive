import * as React from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowDown, Languages, Radio, Sparkles, Wifi } from 'lucide-react'
import { Avatar } from '../../components/ui/avatar'
import { Badge, StatusDot } from '../../components/ui/badge'
import { Waveform } from '../../components/waveform'
import { cn } from '../../lib/utils'

/* ------------------------------------------------------------------ */
/* SIMULATED CONTENT — this panel is a scripted product preview.        */
/* It is not connected to the backend, LiveKit, or any AI provider.     */
/* Every instance is labelled "Simulated preview" in the UI.            */
/* ------------------------------------------------------------------ */

type SpeakerId = 'arjun' | 'rahul' | 'kiran'

const participants: Record<
  SpeakerId,
  { name: string; language: string; lang: 'ta' | 'hi' | 'te'; native: string }
> = {
  arjun: { name: 'Arjun', language: 'ta-IN', lang: 'ta', native: 'தமிழ்' },
  rahul: { name: 'Rahul', language: 'hi-IN', lang: 'hi', native: 'हिन्दी' },
  kiran: { name: 'Kiran', language: 'te-IN', lang: 'te', native: 'తెలుగు' },
}

interface DemoTurn {
  speaker: SpeakerId
  original: string
  /** Translations delivered to the other two participants. */
  translations: { to: SpeakerId; text: string }[]
}

const demoScript: DemoTurn[] = [
  {
    speaker: 'arjun',
    original: 'நீங்கள் எப்படி இருக்கிறீர்கள்?',
    translations: [
      { to: 'rahul', text: 'आप कैसे हैं?' },
      { to: 'kiran', text: 'మీరు ఎలా ఉన్నారు?' },
    ],
  },
  {
    speaker: 'rahul',
    original: 'मैं ठीक हूँ, धन्यवाद।',
    translations: [
      { to: 'arjun', text: 'நான் நன்றாக இருக்கிறேன், நன்றி.' },
      { to: 'kiran', text: 'నేను బాగున్నాను, ధన్యవాదాలు.' },
    ],
  },
  {
    speaker: 'kiran',
    original: 'ఈ చర్చ మిక్కిలి ప్రయోజనకరంగా ఉంది.',
    translations: [
      { to: 'arjun', text: 'இந்த உரையாடல் மிகவும் பயனுள்ளதாக உள்ளது.' },
      { to: 'rahul', text: 'यह चर्चा बहुत उपयोगी है।' },
    ],
  },
]

const pipelineStages = [
  { id: 'listening', label: 'Listening', icon: Radio },
  { id: 'recognizing', label: 'Recognizing', icon: Languages },
  { id: 'translating', label: 'Translating', icon: Sparkles },
  { id: 'speaking', label: 'Playing translation', icon: Wifi },
] as const

function useDemoTimeline(active: boolean) {
  const reduced = useReducedMotion()
  const [stage, setStage] = React.useState(0)
  const [turn, setTurn] = React.useState(0)

  React.useEffect(() => {
    if (!active || reduced) return
    const stageTimer = window.setInterval(() => {
      setStage((s) => {
        const next = (s + 1) % (pipelineStages.length + 1)
        if (next === 0) setTurn((t) => (t + 1) % demoScript.length)
        return next
      })
    }, 1600)
    return () => window.clearInterval(stageTimer)
  }, [active, reduced])

  return { stage, turn, reduced }
}

export function HeroPreview() {
  const { stage, turn, reduced } = useDemoTimeline(true)
  const current = demoScript[turn]
  const speaker = participants[current.speaker]
  const isSpeakingStage = stage === 0 || stage === 1
  const latency = (1.1 + ((turn * 7 + stage * 13) % 40) / 100).toFixed(2)

  return (
    <div
      className="relative"
      role="img"
      aria-label="Simulated product preview: Arjun speaking Tamil, with his sentence translated live into Hindi for Rahul and Telugu for Kiran."
    >
      {/* Ambient glow behind the panel */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-8 -z-10 rounded-[32px] bg-[radial-gradient(60%_60%_at_50%_40%,rgb(var(--primary)/0.28),transparent_70%)] blur-2xl"
      />

      <div className="overflow-hidden rounded-2xl border border-white/[0.1] bg-surface/90 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.95)] backdrop-blur-xl">
        {/* Window chrome */}
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] bg-elevated/70 px-4 py-2.5">
          <div className="flex items-center gap-2" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          </div>
          <div className="hidden min-w-0 flex-1 items-center justify-center sm:flex">
            <span className="truncate rounded-md border border-white/[0.08] bg-background/60 px-3 py-1 font-mono text-[11px] text-muted-2">
              lingolive.app / room / <span className="text-muted">kolam-4f2a</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm">
              <StatusDot tone="success" />
              Live
            </Badge>
            <Badge variant="warning" size="sm" className="hidden sm:inline-flex">
              Simulated preview
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr]">
          {/* ---------- Participants ---------- */}
          <div className="border-b border-white/[0.07] p-4 lg:border-b-0 lg:border-r">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-2">
                Participants
              </span>
              <span className="text-[10.5px] font-medium text-muted-2">3 / 3</span>
            </div>

            <ul className="space-y-2.5">
              {(Object.keys(participants) as SpeakerId[]).map((id) => {
                const p = participants[id]
                const isActive = current.speaker === id && isSpeakingStage
                return (
                  <li
                    key={id}
                    className={cn(
                      'relative overflow-hidden rounded-lg border p-3 transition-all duration-500',
                      isActive
                        ? 'border-secondary/45 bg-secondary/[0.07]'
                        : 'border-white/[0.08] bg-white/[0.02]'
                    )}
                  >
                    {isActive && (
                      <motion.span
                        aria-hidden="true"
                        layoutId="speaker-ring"
                        className="absolute inset-0 rounded-lg ring-1 ring-secondary/40"
                        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                      />
                    )}
                    <div className="relative flex items-center gap-3">
                      <Avatar name={p.name} languageCode={p.lang} speaking={isActive} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-semibold text-foreground">
                          {p.name}
                        </p>
                        <p className="truncate text-[11.5px] text-muted-2">
                          <span lang={p.lang}>{p.native}</span> · {p.language}
                        </p>
                      </div>
                    </div>

                    <div className="relative mt-2.5 flex h-6 items-center gap-2">
                      {isActive ? (
                        <>
                          <span className="text-secondary">
                            <Waveform bars={16} active intensity={1.15} />
                          </span>
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-secondary">
                            Speaking
                          </span>
                        </>
                      ) : (
                        <>
                          <span aria-hidden="true" className="h-px flex-1 bg-white/[0.09]" />
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-2">
                            Listening
                          </span>
                        </>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* ---------- Conversation ---------- */}
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-2.5 sm:px-5">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-2">
                Live transcript
              </span>
              <Badge variant="warning" size="sm" className="sm:hidden">
                Simulated
              </Badge>
              <span className="hidden items-center gap-1.5 text-[11px] text-muted-2 sm:flex">
                <StatusDot tone="primary" />
                end-to-end <span className="font-mono text-secondary">{latency}s</span>
              </span>
            </div>

            <div className="min-h-[318px] flex-1 px-4 py-5 sm:px-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={turn}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-4"
                >
                  {/* Original utterance */}
                  <div>
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="text-[12.5px] font-semibold text-foreground">
                        {speaker.name}
                      </span>
                      <span className="text-[11.5px] text-muted-2">·</span>
                      <span className="text-[11.5px] text-muted">
                        {speaker.name === 'Arjun' ? 'Tamil' : speaker.name === 'Rahul' ? 'Hindi' : 'Telugu'}
                      </span>
                      <Badge variant="primary" size="sm">
                        {speaker.lang}
                      </Badge>
                      <span className="ml-auto font-mono text-[10.5px] text-muted-2">10:42:0{turn + 3}</span>
                    </div>
                    <p
                      lang={speaker.lang}
                      className="rounded-lg rounded-tl-sm border border-white/[0.09] bg-elevated px-4 py-3 text-[16.5px] leading-relaxed text-foreground"
                    >
                      {current.original}
                    </p>
                  </div>

                  {/* Translation arrows + targets */}
                  <div className="flex items-center gap-2 pl-1">
                    <ArrowDown className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-secondary">
                      Translated for everyone
                    </span>
                    <span aria-hidden="true" className="h-px flex-1 bg-secondary/25" />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {current.translations.map((t, i) => {
                      const target = participants[t.to]
                      return (
                        <motion.div
                          key={t.to}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.12 + i * 0.1, duration: 0.35 }}
                          className="rounded-lg border border-secondary/25 bg-secondary/[0.06] p-3.5"
                        >
                          <div className="mb-1.5 flex items-center gap-2">
                            <Avatar name={target.name} size="sm" />
                            <span className="text-[11.5px] font-medium text-secondary-bright">
                              {target.name} · {target.lang}
                            </span>
                          </div>
                          <p
                            lang={target.lang}
                            className="text-[15px] leading-relaxed text-foreground/95"
                          >
                            {t.text}
                          </p>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ---------- Pipeline status ---------- */}
            <div className="border-t border-white/[0.07] bg-background/40 px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <ol className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                  {pipelineStages.map((s, i) => {
                    const active = stage === i
                    const done = stage > i && stage <= pipelineStages.length
                    const Icon = s.icon
                    return (
                      <li key={s.id} className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10.5px] font-medium transition-colors duration-300',
                            active
                              ? 'border-primary/50 bg-primary/15 text-primary-bright'
                              : done
                                ? 'border-secondary/35 bg-secondary/10 text-secondary-bright'
                                : 'border-white/[0.08] text-muted-2'
                          )}
                        >
                          <Icon className="h-3 w-3" aria-hidden="true" />
                          <span className="hidden sm:inline">{s.label}</span>
                          <span className="sm:hidden">{s.label.split(' ')[0]}</span>
                          {active && (
                            <span
                              aria-hidden="true"
                              className="ml-0.5 h-1.5 w-1.5 rounded-full bg-primary-bright animate-pulse-dot"
                            />
                          )}
                        </span>
                        {i < pipelineStages.length - 1 && (
                          <span aria-hidden="true" className="h-px w-3 bg-white/10 sm:w-4" />
                        )}
                      </li>
                    )
                  })}
                  {stage === pipelineStages.length && (
                    <li className="ml-1 flex items-center gap-1.5 text-[10.5px] font-medium text-muted-2">
                      <StatusDot tone="muted" pulse={false} />
                      Waiting for speech
                    </li>
                  )}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
