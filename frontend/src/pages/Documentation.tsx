import { Link } from 'react-router-dom'
import {
  ArticleList,
  ArticleNote,
  ArticleSection,
  ArticleShell,
  InlineCode,
} from '../components/article-shell'
import { LinkButton } from '../components/ui/link-button'
import { availableLanguages, upcomingLanguages } from '../lib/languages'

const ENDPOINTS: { method: string; path: string; purpose: string }[] = [
  { method: 'GET', path: '/v1/health', purpose: 'Service liveness — drives every status pill.' },
  { method: 'POST', path: '/v1/rooms/', purpose: 'Create a room from a client-generated code.' },
  { method: 'GET', path: '/v1/rooms/{code}', purpose: 'Look up a room; 404 when it does not exist.' },
  { method: 'POST', path: '/v1/rooms/{code}/join', purpose: 'Join as a participant with your languages.' },
  { method: 'PUT', path: '/v1/participants/{id}/language', purpose: 'Change languages mid-conversation.' },
  { method: 'POST', path: '/v1/translation/translate', purpose: 'Translate one utterance.' },
  { method: 'POST', path: '/v1/tts/synthesize', purpose: 'Synthesise translated speech.' },
]

function EndpointTable() {
  return (
    <div className="overflow-x-auto rounded-lg border border-white/[0.09]">
      <table className="w-full min-w-[560px] border-collapse text-left text-[13.5px]">
        <thead>
          <tr className="border-b border-white/[0.09] bg-white/[0.03]">
            <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-2">
              Method
            </th>
            <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-2">
              Path
            </th>
            <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-2">
              Purpose
            </th>
          </tr>
        </thead>
        <tbody>
          {ENDPOINTS.map((e) => (
            <tr key={e.method + e.path} className="border-b border-white/[0.06] last:border-0">
              <td className="px-4 py-3">
                <span
                  className={
                    e.method === 'GET'
                      ? 'font-mono text-[12px] font-semibold text-secondary'
                      : e.method === 'POST'
                        ? 'font-mono text-[12px] font-semibold text-primary-bright'
                        : 'font-mono text-[12px] font-semibold text-warning'
                  }
                >
                  {e.method}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-[12.5px] text-foreground/90">{e.path}</td>
              <td className="px-4 py-3 text-muted">{e.purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LanguageTable() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-success/25 bg-success/[0.05] p-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-success">
          Available today
        </p>
        <ul className="mt-3 space-y-2">
          {availableLanguages.map((l) => (
            <li key={l.code} className="flex items-baseline justify-between gap-3">
              <span lang={l.code.split('-')[0]} className="text-[14.5px] text-foreground">
                {l.nativeName}
              </span>
              <span className="font-mono text-[11.5px] text-muted-2">{l.code}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-lg border border-white/[0.09] bg-white/[0.02] p-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-2">
          On the roadmap
        </p>
        <ul className="mt-3 space-y-2 opacity-70">
          {upcomingLanguages.map((l) => (
            <li key={l.code} className="flex items-baseline justify-between gap-3">
              <span lang={l.code.split('-')[0]} className="text-[14.5px] text-foreground/80">
                {l.nativeName}
              </span>
              <span className="font-mono text-[11.5px] text-muted-2">{l.code}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] text-muted-2">
          Roadmap languages are shown disabled everywhere in the product — never as working.
        </p>
      </div>
    </div>
  )
}

export default function Documentation() {
  return (
    <ArticleShell
      eyebrow="Documentation"
      title="How LingoLive works"
      lede="A practical guide to starting conversations, joining them, and understanding exactly which parts of the platform are connected today."
      updated="November 2026"
    >
      <ArticleSection title="The short version">
        <p>
          LingoLive lets people speak in different languages inside the same conversation. Each
          participant picks a language they speak and a language they want to hear; the platform
          recognises the speech, translates it per listener, and plays it back while subtitles run
          underneath.
        </p>
        <div className="flex flex-wrap gap-2.5 pt-1">
          <LinkButton to="/create-conversation" size="sm">
            Create a conversation
          </LinkButton>
          <LinkButton to="/join-conversation" variant="secondary" size="sm">
            Join with a code
          </LinkButton>
        </div>
      </ArticleSection>

      <ArticleSection title="Starting a conversation">
        <ArticleList
          items={[
            <>
              Open <strong className="font-semibold text-foreground">Create a conversation</strong>{' '}
              and give the room a name.
            </>,
            <>
              The room code is generated for you — for example <InlineCode>lotus-4f2a</InlineCode>.
              Use <strong className="font-semibold text-foreground">Regenerate</strong> if you want
              a different one.
            </>,
            <>
              Choose the language you <em>Speak</em> and the language you want to{' '}
              <em>hear</em>. These are saved as your defaults for next time.
            </>,
            <>
              Select <strong className="font-semibold text-foreground">Create room</strong>. The
              room is persisted through the backend and you land inside it with your code ready to
              share.
            </>,
          ]}
        />
        <ArticleNote tone="warning">
          If the translation service is unreachable, the room is <strong>not</strong> created. The
          form says so explicitly and offers a clearly-labelled preview session instead — it never
          pretends the room exists.
        </ArticleNote>
      </ArticleSection>

      <ArticleSection title="Joining a conversation">
        <ArticleList
          items={[
            <>Paste the room code you were given — codes are case-insensitive.</>,
            <>Pick the display name other participants will see beside your speech.</>,
            <>
              Choose your preferred language: everything you hear will arrive in it, whatever language it was spoken in.
            </>,
            <>
              The room is verified with the backend before you navigate, so a wrong code shows an
              in-page <strong className="font-semibold text-foreground">Room not found</strong>{' '}
              state instead of an empty session.
            </>,
          ]}
        />
      </ArticleSection>

      <ArticleSection id="languages" title="Languages">
        <LanguageTable />
      </ArticleSection>

      <ArticleSection title="Room codes">
        <p>
          Codes are lowercase, URL-safe, and follow the pattern{' '}
          <InlineCode>word-4chars</InlineCode> — between 3 and 32 characters of letters, numbers and
          hyphens. They are generated on the client because <InlineCode>POST /v1/rooms/</InlineCode>{' '}
          takes the code in the request body. If a code is already taken the client regenerates and
          retries once automatically.
        </p>
      </ArticleSection>

      <ArticleSection title="What is connected today">
        <ArticleList
          items={[
            <>
              <strong className="font-semibold text-foreground">Room lifecycle</strong> — create,
              look up, join and leave are real calls against the FastAPI backend.
            </>,
            <>
              <strong className="font-semibold text-foreground">Translation &amp; speech</strong> —
              the HTTP endpoints for translation and text-to-speech are wired, but the provider
              behind them must be configured on the server.
            </>,
            <>
              <strong className="font-semibold text-foreground">LiveKit audio</strong> — the client
              layer exists, but no LiveKit server is provisioned yet, so media transport is not
              live.
            </>,
            <>
              <strong className="font-semibold text-foreground">Gnani Prisma / Timbre</strong> —
              the integration surface is in place; provider credentials are not yet supplied by the
              deployment.
            </>,
          ]}
        />
        <ArticleNote>
          Every surface that depends on an unavailable integration shows an explicit state — an
          offline pill, a “preview session” banner, or a disabled control. Nothing reports success
          it did not have.
        </ArticleNote>
      </ArticleSection>

      <ArticleSection title="HTTP API">
        <p>
          The frontend talks to a single base URL (<InlineCode>http://localhost:8000</InlineCode> by
          default, override with <InlineCode>VITE_API_BASE_URL</InlineCode>). Every call carries an
          8-second timeout so a hung backend degrades into a visible error rather than a spinner.
        </p>
        <EndpointTable />
        <ArticleNote tone="warning">
          Known backend issue: the FastAPI routers are mounted under a duplicated{' '}
          <InlineCode>/v1/v1/…</InlineCode> prefix. The frontend targets the canonical{' '}
          <InlineCode>/v1/…</InlineCode> paths above, so the backend mounting must be corrected
          before live calls succeed.
        </ArticleNote>
      </ArticleSection>

      <ArticleSection title="Troubleshooting">
        <ArticleList
          items={[
            <>
              <strong className="font-semibold text-foreground">“Service offline” pill</strong> —{' '}
              <InlineCode>GET /v1/health</InlineCode> failed. Start the backend, then click
              the pill to re-check.
            </>,
            <>
              <strong className="font-semibold text-foreground">Room not found</strong> — the code
              does not exist on the server, or the backend restarted and lost its store.
            </>,
            <>
              <strong className="font-semibold text-foreground">Device lists are empty</strong> —
              browsers only reveal microphone and speaker labels after you grant microphone access.
              Open <Link to="/settings" className="text-primary-bright underline-offset-4 hover:underline">Settings</Link> and
              use <strong className="font-semibold text-foreground">Enable device selection</strong>.
            </>,
          ]}
        />
      </ArticleSection>
    </ArticleShell>
  )
}
