import { ArrowRight, AudioWaveform, Sparkles, Volume2 } from 'lucide-react'
import { SectionHeading } from '../../components/section-heading'
import { Waveform } from '../../components/waveform'
import { cn } from '../../lib/utils'

const steps = [
  {
    n: '01',
    title: 'Speak naturally',
    body: 'Talk in the language you think in. No commands, no switching modes — the microphone simply follows you.',
    icon: AudioWaveform,
    tone: 'text-primary-bright border-primary/40 bg-primary/10',
    visual: (
      <div className="flex h-12 items-center gap-3 px-1 text-primary-bright">
        <Waveform bars={26} active intensity={1.1} />
      </div>
    ),
  },
  {
    n: '02',
    title: 'AI translates your speech',
    body: 'Gnani Prisma recognises the utterance, the translation engine rewrites it for each listener, and Timbre gives it a voice.',
    icon: Sparkles,
    tone: 'text-secondary-bright border-secondary/40 bg-secondary/10',
    visual: (
      <div className="space-y-2 px-1 py-1.5">
        <p lang="ta" className="text-[13.5px] text-foreground/85">
          நன்றி
        </p>
        <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.14em] text-secondary">
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
          translated
        </div>
        <div className="grid grid-cols-2 gap-2">
          <p lang="hi" className="rounded border border-white/[0.08] bg-background/60 px-2 py-1.5 text-[13px]">
            धन्यवाद
          </p>
          <p lang="te" className="rounded border border-white/[0.08] bg-background/60 px-2 py-1.5 text-[13px]">
            ధన్యవాదాలు
          </p>
        </div>
      </div>
    ),
  },
  {
    n: '03',
    title: 'Everyone hears their language',
    body: 'Each participant receives translated audio and subtitles in the language they chose — at the same time, in the same room.',
    icon: Volume2,
    tone: 'text-success border-success/40 bg-success/10',
    visual: (
      <ul className="space-y-2 px-1">
        {[
          { name: 'Arjun', lang: 'ta', text: 'தமிழ்' },
          { name: 'Rahul', lang: 'hi', text: 'हिन्दी' },
          { name: 'Kiran', lang: 'te', text: 'తెలుగు' },
        ].map((p) => (
          <li
            key={p.name}
            className="flex items-center justify-between rounded border border-white/[0.08] bg-background/60 px-2.5 py-1.5"
          >
            <span className="text-[12.5px] text-muted">{p.name}</span>
            <span lang={p.lang} className="text-[12.5px] font-medium text-foreground/90">
              {p.text}
            </span>
          </li>
        ))}
      </ul>
    ),
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative scroll-mt-24 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          align="center"
          eyebrow="How it works"
          title="Three steps. One natural conversation."
          description="The pipeline runs continuously while you talk — there is no “translate” button to press."
        />

        <ol className="relative mt-14 grid gap-6 lg:grid-cols-3">
          {/* Connecting rail (desktop) */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-[16%] right-[16%] top-[46px] hidden h-px bg-gradient-to-r from-primary/50 via-secondary/45 to-success/40 lg:block"
          />

          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <li key={step.n} className="relative">
                <div className="rounded-xl border border-white/[0.09] bg-surface/70 p-6 shadow-card transition-all duration-300 hover:border-white/[0.16] hover:bg-surface">
                  <div className="flex items-center gap-3.5">
                    <span
                      className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border',
                        step.tone
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-[12px] font-semibold tracking-[0.14em] text-muted-2">
                      {step.n}
                    </span>
                  </div>

                  <h3 className="mt-5 font-display text-[17.5px] font-semibold tracking-tight text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted">{step.body}</p>

                  <div className="mt-5 border-t border-white/[0.07] pt-4">{step.visual}</div>
                </div>

                {i < steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-4 left-1/2 hidden -translate-x-1/2 text-muted-2 lg:hidden"
                  >
                    <ArrowRight className="h-4 w-4 rotate-90" />
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
