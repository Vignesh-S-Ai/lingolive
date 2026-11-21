import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Play, Zap } from 'lucide-react'
import { LinkButton } from '../../components/ui/link-button'
import { Badge, StatusDot } from '../../components/ui/badge'
import { HeroPreview } from './hero-preview'

export function Hero() {
  const reduced = useReducedMotion()

  const rise = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const, delay },
        }

  return (
    <section className="relative overflow-hidden pb-20 pt-32 sm:pt-36 lg:pb-28 lg:pt-40">
      {/* Stage lighting + technical grid */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[720px] stage-light" />
        <div className="absolute inset-x-0 top-0 h-[560px] bg-grid opacity-60 mask-fade-b" />
        <div className="absolute left-1/2 top-[-160px] h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-primary/20 blur-[130px]" />
      </div>

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div {...rise(0)}>
            <Badge variant="secondary" size="lg" className="mx-auto">
              <StatusDot tone="primary" />
              Real-time multilingual communication
            </Badge>
          </motion.div>

          <motion.h1
            {...rise(0.08)}
            className="mt-7 font-display text-[clamp(2.5rem,7vw,4.5rem)] font-extrabold leading-[1.03] tracking-[-0.045em] text-balance"
          >
            Every Language.
            <br />
            <span className="gradient-text">One Conversation.</span>
          </motion.h1>

          <motion.p
            {...rise(0.16)}
            className="mx-auto mt-6 max-w-2xl text-[clamp(1rem,1.6vw,1.15rem)] leading-relaxed text-muted text-pretty"
          >
            Break language barriers with real-time AI voice translation. Speak naturally in
            Tamil, Hindi, Telugu, and more — everyone hears the language they understand.
          </motion.p>

          <motion.div
            {...rise(0.24)}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <LinkButton to="/create-conversation" size="lg" className="w-full sm:w-auto">
              Start a Conversation
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </LinkButton>
            <LinkButton to="/join-conversation" variant="secondary" size="lg" className="w-full sm:w-auto">
              <Play className="h-4 w-4" aria-hidden="true" />
              Join a Room
            </LinkButton>
          </motion.div>

          <motion.p
            {...rise(0.32)}
            className="mt-7 inline-flex items-center gap-2 text-[12.5px] text-muted-2"
          >
            <Zap className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />
            Gnani Prisma STT → translation → Gnani Timbre TTS, streamed over LiveKit
          </motion.p>
        </div>

        <motion.div
          initial={reduced ? undefined : { opacity: 0, y: 34, scale: 0.985 }}
          animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
          className="mt-16 lg:mt-20"
        >
          <HeroPreview />
          <p className="mt-4 text-center text-[12px] text-muted-2">
            Illustrated above is a simulated preview of the product interface — it is not
            connected to live audio processing.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
