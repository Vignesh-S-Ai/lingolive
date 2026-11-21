import { Link } from 'react-router-dom'
import { Logo } from './logo'
import { availableLanguages } from '../lib/languages'

const featureLinks = [
  { label: 'Real-time translation', to: '/#features' },
  { label: 'How it works', to: '/#how-it-works' },
  { label: 'Create a conversation', to: '/create-conversation' },
  { label: 'Join a room', to: '/join-conversation' },
]

const resourceLinks = [
  { label: 'Documentation', to: '/docs' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Conversation history', to: '/history' },
  { label: 'Settings', to: '/settings' },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative border-t border-white/[0.07] bg-surface/40">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
          <div className="max-w-sm">
            <Logo size="md" />
            <p className="mt-4 text-[13.5px] leading-relaxed text-muted">
              Real-time multilingual voice communication. Speak naturally in your own
              language — everyone hears the language they understand.
            </p>
            <p className="mt-4 font-display text-[11.5px] font-semibold uppercase tracking-[0.16em] text-secondary">
              Speak your language. Understand everyone.
            </p>
          </div>

          <nav aria-label="Product">
            <h3 className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-foreground/70">
              Product
            </h3>
            <ul className="mt-4 space-y-2.5">
              {featureLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-[13.5px] text-muted transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Resources">
            <h3 className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-foreground/70">
              Resources
            </h3>
            <ul className="mt-4 space-y-2.5">
              {resourceLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-[13.5px] text-muted transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-foreground/70">
              Supported languages
            </h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {availableLanguages.map((lang) => (
                <li
                  key={lang.code}
                  className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-[12px] text-muted"
                >
                  <span className="text-foreground/90">{lang.nativeName}</span>
                  <span className="ml-1.5 text-muted-2">{lang.short}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12px] leading-relaxed text-muted-2">
              Kannada, Malayalam, Bengali, Marathi, Gujarati and Punjabi are on the roadmap.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12.5px] text-muted-2">
            © {year} LingoLive. All rights reserved.
          </p>
          <p className="text-[12.5px] text-muted-2">
            Gnani Prisma STT · Gnani Timbre TTS · LiveKit · FastAPI
          </p>
        </div>
      </div>
    </footer>
  )
}
