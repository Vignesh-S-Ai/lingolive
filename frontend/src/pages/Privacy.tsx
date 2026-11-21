import { ArticleList, ArticleNote, ArticleSection, ArticleShell, InlineCode } from '../components/article-shell'

const STORAGE_KEYS: { key: string; purpose: string }[] = [
  {
    key: 'lingolive-settings',
    purpose:
      'Your display name, language preferences, subtitle and audio toggles, selected devices, voice choice and theme. Stored only in this browser.',
  },
]

export default function Privacy() {
  return (
    <ArticleShell
      eyebrow="Privacy"
      title="What LingoLive stores, and what it doesn’t"
      lede="A plain account of the data this application handles — including the parts that are deliberately kept on your own device."
      updated="November 2026"
    >
      <ArticleSection title="The short version">
        <p>
          Your conversation content is not sold, not used for advertising, and not written to any
          analytics service — this build ships with no analytics or tracking at all. Preferences
          live in your browser’s local storage. Room and participant records live in the backend
          database for as long as the room exists.
        </p>
      </ArticleSection>

      <ArticleSection title="What the backend stores">
        <ArticleList
          items={[
            <>
              <strong className="font-semibold text-foreground">Rooms</strong> — the room code, the
              name you gave it, and its status, with creation and update timestamps.
            </>,
            <>
              <strong className="font-semibold text-foreground">Participants</strong> — the display
              name you chose, your input and output language, a connection status, and a timestamp.
            </>,
            <>
              <strong className="font-semibold text-foreground">Translation requests</strong> — text
              submitted to the translation endpoint is processed to produce a response; this build
              has no transcript-persistence endpoint, so conversation history is not written to the
              server by the frontend.
            </>,
          ]}
        />
      </ArticleSection>

      <ArticleSection title="What stays on your device">
        <div className="overflow-x-auto rounded-lg border border-white/[0.09]">
          <table className="w-full min-w-[480px] border-collapse text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-white/[0.09] bg-white/[0.03]">
                <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-2">
                  Storage key
                </th>
                <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-2">
                  Purpose
                </th>
              </tr>
            </thead>
            <tbody>
              {STORAGE_KEYS.map((row) => (
                <tr key={row.key}>
                  <td className="whitespace-nowrap px-4 py-3 align-top font-mono text-[12.5px] text-primary-bright">
                    {row.key}
                  </td>
                  <td className="px-4 py-3 text-muted">{row.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ArticleList
          items={[
            <>
              <strong className="font-semibold text-foreground">Session transcript</strong> — the
              lines shown in a conversation live in memory for the duration of the session and are
              discarded when you leave the room.
            </>,
            <>
              <strong className="font-semibold text-foreground">Media device labels</strong> — read
              only after you grant microphone permission, and only to populate the device pickers
              in Settings.
            </>,
          ]}
        />
      </ArticleSection>

      <ArticleSection title="Audio and microphone">
        <p>
          This build does not record, upload or persist audio. Microphone access is requested only
          when you ask to enumerate devices, the stream is stopped immediately, and no samples are
          retained. Real-time audio transport requires a LiveKit server, which is not provisioned
          in this deployment — see the <a href="/docs" className="text-primary-bright underline-offset-4 hover:underline">documentation</a> for
          the current integration status.
        </p>
      </ArticleSection>

      <ArticleSection title="Third parties">
        <ArticleList
          items={[
            <>
              <strong className="font-semibold text-foreground">LiveKit</strong> — intended for
              real-time media. Not connected in this deployment, so no audio leaves the browser.
            </>,
            <>
              <strong className="font-semibold text-foreground">Gnani (Prisma STT / Timbre TTS)</strong>{" "}
              — intended for recognition and voice. Not connected in this deployment; text sent to
              the translation endpoint is handled by whatever provider the backend is configured
              with.
            </>,
            <>
              <strong className="font-semibold text-foreground">Fonts</strong> — Inter, Manrope and
              the Noto families are loaded from Google Fonts. If you need fully offline rendering,
              self-host them and remove the links from <InlineCode>index.html</InlineCode>.
            </>,
          ]}
        />
      </ArticleSection>

      <ArticleSection title="Your choices">
        <ArticleList
          items={[
            <>
              Clear site data (or just <InlineCode>lingolive-settings</InlineCode>) to erase every
              preference this app saved.
            </>,
            <>
              Deny microphone access — everything except the device pickers continues to work.
            </>,
            <>
              Delete a room on the server to remove its participant records; the frontend has no
              delete endpoint, so this is an administrative action on the backend.
            </>,
          ]}
        />
        <ArticleNote>
          This page describes the behaviour of the current codebase. If you change what the
          application collects, update this page in the same change.
        </ArticleNote>
      </ArticleSection>
    </ArticleShell>
  )
}
