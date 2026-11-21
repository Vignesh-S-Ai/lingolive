import { availableLanguages, upcomingLanguages } from '../../lib/languages'
import { Badge } from '../../components/ui/badge'
import { SectionHeading } from '../../components/section-heading'

export function LanguageStrip() {
  return (
    <section id="languages" className="relative scroll-mt-24 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          align="center"
          eyebrow="Supported languages"
          title={
            <>
              Built for the languages people{' '}
              <span className="text-secondary">actually speak at home</span>
            </>
          }
          description="Tamil, Hindi and Telugu are first-class citizens of this platform — not an afterthought. Every stage of the pipeline (recognition, translation, voice) is tuned for Indian languages."
        />

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {availableLanguages.map((lang) => (
            <li
              key={lang.code}
              className="group relative overflow-hidden rounded-xl border border-white/[0.09] bg-surface/70 p-5 transition-all duration-300 hover:border-primary/40 hover:bg-surface shadow-card hover:shadow-card-hover"
            >
              <div
                aria-hidden="true"
                className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/15 blur-2xl transition-opacity duration-300 group-hover:opacity-100 sm:opacity-60"
              />
              <p
                lang={lang.code.split('-')[0]}
                className="relative font-display text-[26px] font-bold leading-none tracking-tight text-foreground"
              >
                {lang.nativeName}
              </p>
              <p className="relative mt-2.5 text-[13.5px] text-muted">{lang.name}</p>
              <div className="relative mt-4 flex items-center justify-between">
                <span className="font-mono text-[11.5px] text-muted-2">{lang.code}</span>
                <Badge variant="success" size="sm">
                  Live
                </Badge>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col items-center gap-4 rounded-xl border border-dashed border-white/[0.12] px-5 py-6 sm:flex-row sm:justify-between">
          <div>
            <p className="text-[13.5px] font-medium text-foreground/90">Expanding next</p>
            <p className="mt-1 text-[13px] text-muted-2">
              Roadmap languages are not yet wired to a provider and are disabled throughout the
              app.
            </p>
          </div>
          <ul className="flex flex-wrap justify-center gap-2">
            {upcomingLanguages.map((lang) => (
              <li
                key={lang.code}
                title={`${lang.name} — not yet available`}
                className="cursor-not-allowed rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[12.5px] text-muted-2 opacity-70"
              >
                <span lang={lang.code.split('-')[0]}>{lang.nativeName}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
