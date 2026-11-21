import { ArrowRight, ShieldCheck } from 'lucide-react'
import { LinkButton } from '../../components/ui/link-button'
import { StatusDot } from '../../components/ui/badge'
import { useBackendHealth } from '../../hooks/use-backend-health'
import { cn } from '../../lib/utils'

export function FinalCta() {
  const { status } = useBackendHealth()

  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-surface/70 px-6 py-16 text-center shadow-[0_40px_100px_-50px_rgba(0,0,0,0.9)] sm:px-12">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-x-0 top-0 h-full stage-light opacity-90" />
            <div className="absolute inset-0 bg-grid opacity-50" />
            <div className="absolute left-1/2 top-0 h-56 w-[560px] -translate-x-1/2 rounded-full bg-primary/25 blur-[110px]" />
          </div>

          <h2 className="mx-auto max-w-3xl font-display text-[clamp(1.9rem,4.2vw,3rem)] font-extrabold leading-[1.1] tracking-[-0.035em] text-balance">
            Language should never limit a conversation.
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-[15.5px] leading-relaxed text-muted">
            Create a room in seconds, share the code, and start talking. Your participants keep
            their own language — the platform handles the rest.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <LinkButton to="/create-conversation" size="lg">
              Start Your First Conversation
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </LinkButton>
            <LinkButton to="/join-conversation" variant="secondary" size="lg">
              Join with a room code
            </LinkButton>
          </div>

          <p
            className={cn(
              'mt-8 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12.5px]',
              status === 'online'
                ? 'border-success/35 bg-success/10 text-success'
                : status === 'checking'
                  ? 'border-white/[0.12] bg-white/[0.04] text-muted'
                  : 'border-warning/35 bg-warning/10 text-warning'
            )}
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <StatusDot
              tone={status === 'online' ? 'success' : status === 'checking' ? 'muted' : 'warning'}
            />
            {status === 'online'
              ? 'Translation service online'
              : status === 'checking'
                ? 'Checking translation service…'
                : 'Translation service unavailable — rooms can still be previewed'}
          </p>
        </div>
      </div>
    </section>
  )
}
