import type { ReactNode } from 'react'
import {
  Activity,
  AudioLines,
  Captions,
  Globe2,
  Languages,
  Users,
} from 'lucide-react'
import { SectionHeading } from '../../components/section-heading'
import { Avatar } from '../../components/ui/avatar'
import { Waveform } from '../../components/waveform'
import { Badge } from '../../components/ui/badge'
import { cn } from '../../lib/utils'

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  visual: ReactNode
  className?: string
}

function FeatureCard({ icon, title, description, visual, className }: FeatureCardProps) {
  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-white/[0.09] bg-surface/70 p-6 transition-all duration-300',
        'hover:border-white/[0.16] hover:bg-surface shadow-card hover:shadow-card-hover',
        className
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] bg-elevated-2 text-primary-bright">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-[16.5px] font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-2.5 flex-1 text-[13.5px] leading-relaxed text-muted">{description}</p>
      <div className="mt-5">{visual}</div>
    </article>
  )
}

const pipeline = [
  { step: 'Mic', tone: 'text-muted' },
  { step: 'Prisma STT', tone: 'text-primary-bright' },
  { step: 'Translate', tone: 'text-secondary-bright' },
  { step: 'Timbre TTS', tone: 'text-primary-bright' },
]

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-24 py-20 sm:py-24">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[380px] w-[700px] -translate-x-1/2 rounded-full bg-secondary/10 blur-[130px]" />
      </div>

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Capabilities"
          title="Everything a multilingual conversation needs"
          description="Six capabilities working as one pipeline — from the moment someone speaks to the moment everyone hears it in their own language."
        />

        <div className="mt-12 grid gap-4 lg:grid-cols-6">
          {/* 1 — Real-time speech translation (wide) */}
          <FeatureCard
            className="lg:col-span-4"
            icon={<Languages className="h-[18px] w-[18px]" aria-hidden="true" />}
            title="Real-Time Speech Translation"
            description="Speech is recognised, translated and returned while the sentence is still being finished. Partial results stream in as you talk, so nobody waits for a pause."
            visual={
              <div className="rounded-lg border border-white/[0.08] bg-background/50 p-4">
                <ol className="flex flex-wrap items-center gap-x-2 gap-y-3">
                  {pipeline.map((s, i) => (
                    <li key={s.step} className="flex items-center gap-2">
                      <span
                        className={cn(
                          'rounded-md border border-white/[0.09] bg-elevated px-2.5 py-1.5 text-[11.5px] font-medium',
                          s.tone
                        )}
                      >
                        {s.step}
                      </span>
                      {i < pipeline.length - 1 && (
                        <span aria-hidden="true" className="h-px w-4 bg-white/15" />
                      )}
                    </li>
                  ))}
                </ol>
                <div className="mt-4 flex h-8 items-center gap-3 text-primary-bright">
                  <Waveform bars={40} active intensity={1} />
                  <span className="shrink-0 font-mono text-[11px] text-secondary">~1.24s</span>
                </div>
              </div>
            }
          />

          {/* 2 — Natural AI voice */}
          <FeatureCard
            className="lg:col-span-2"
            icon={<AudioLines className="h-[18px] w-[18px]" aria-hidden="true" />}
            title="Natural AI Voice"
            description="Translated speech is synthesised with Gnani Timbre so it sounds like a person, not a robot."
            visual={
              <div className="flex items-end gap-3 rounded-lg border border-white/[0.08] bg-background/50 p-4">
                <div className="flex h-14 flex-1 items-center text-secondary">
                  <Waveform bars={22} active intensity={1.25} />
                </div>
                <div className="shrink-0 text-right">
                  <Badge variant="secondary" size="sm">
                    Timbre v2.5
                  </Badge>
                  <p className="mt-1.5 font-mono text-[10.5px] text-muted-2">48 kHz · mono</p>
                </div>
              </div>
            }
          />

          {/* 3 — Group conversations */}
          <FeatureCard
            className="lg:col-span-2"
            icon={<Users className="h-[18px] w-[18px]" aria-hidden="true" />}
            title="Multilingual Group Conversations"
            description="Three people, three mother tongues, one room. Each participant keeps their own input and output language."
            visual={
              <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-background/50 px-4 py-3.5">
                <div className="flex -space-x-2.5">
                  <Avatar name="Arjun Kumar" languageCode="ta" size="md" />
                  <Avatar name="Rahul Verma" languageCode="hi" size="md" />
                  <Avatar name="Kiran Rao" languageCode="te" size="md" />
                </div>
                <span className="text-right text-[11.5px] leading-tight text-muted-2">
                  <span className="block text-[12.5px] font-medium text-foreground">3 languages</span>
                  one conversation
                </span>
              </div>
            }
          />

          {/* 4 — Live subtitles (wide) */}
          <FeatureCard
            className="lg:col-span-4"
            icon={<Captions className="h-[18px] w-[18px]" aria-hidden="true" />}
            title="Live Translated Subtitles"
            description="Original transcript and every translation render side by side, so participants can read along in their own script while the audio plays."
            visual={
              <div className="space-y-2.5 rounded-lg border border-white/[0.08] bg-background/50 p-4">
                <div className="flex items-start gap-3">
                  <Badge variant="primary" size="sm" className="mt-0.5">
                    TA
                  </Badge>
                  <p lang="ta" className="text-[14.5px] leading-relaxed text-foreground/90">
                    நீங்கள் எப்படி இருக்கிறீர்கள்?
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" size="sm" className="mt-0.5">
                    HI
                  </Badge>
                  <p lang="hi" className="text-[14.5px] leading-relaxed text-secondary-bright/95">
                    आप कैसे हैं?
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" size="sm" className="mt-0.5">
                    TE
                  </Badge>
                  <p lang="te" className="text-[14.5px] leading-relaxed text-secondary-bright/95">
                    మీరు ఎలా ఉన్నారు?
                  </p>
                </div>
              </div>
            }
          />

          {/* 5 — Language detection */}
          <FeatureCard
            className="lg:col-span-3"
            icon={<Globe2 className="h-[18px] w-[18px]" aria-hidden="true" />}
            title="Automatic Language Detection"
            description="Set it once and the recogniser follows the speaker. Switch languages mid-sentence without touching a setting."
            visual={
              <div className="flex flex-wrap gap-2 rounded-lg border border-white/[0.08] bg-background/50 p-4">
                {[
                  { code: 'ta', label: 'தமிழ்', on: true },
                  { code: 'hi', label: 'हिन्दी', on: false },
                  { code: 'te', label: 'తెలుగు', on: false },
                  { code: 'en', label: 'English', on: false },
                ].map((l) => (
                  <span
                    key={l.code}
                    lang={l.code}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-[12.5px] transition-colors',
                      l.on
                        ? 'border-secondary/50 bg-secondary/12 text-secondary-bright'
                        : 'border-white/[0.1] text-muted-2'
                    )}
                  >
                    {l.label}
                  </span>
                ))}
                <span className="w-full pt-1 text-[11px] text-muted-2">
                  Detected: Tamil · confidence 0.96
                </span>
              </div>
            }
          />

          {/* 6 — Low latency */}
          <FeatureCard
            className="lg:col-span-3"
            icon={<Activity className="h-[18px] w-[18px]" aria-hidden="true" />}
            title="Low-Latency Audio Streaming"
            description="Audio travels over LiveKit while text and voice are processed in parallel, keeping end-of-phrase to playback under a second and a half."
            visual={
              <div className="rounded-lg border border-white/[0.08] bg-background/50 p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11.5px] text-muted-2">End-of-phrase → playback</span>
                  <span className="font-mono text-[15px] font-semibold text-secondary">1.24s</span>
                </div>
                <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-white/[0.07]">
                  <span className="h-full w-[28%] rounded-full bg-primary" />
                  <span className="h-full w-[22%] rounded-full bg-secondary" />
                  <span className="h-full w-[18%] rounded-full bg-success/80" />
                </div>
                <div className="mt-2.5 flex justify-between font-mono text-[10px] text-muted-2">
                  <span>capture 90ms</span>
                  <span>translate 300ms</span>
                  <span>voice 250ms</span>
                </div>
              </div>
            }
          />
        </div>
      </div>
    </section>
  )
}
