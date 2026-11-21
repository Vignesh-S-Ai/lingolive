import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Hash, SearchX, UserRound } from 'lucide-react'
import { CenteredShell } from '../components/centered-shell'
import { FormPanel, FormSection } from '../components/form-panel'
import { BackendPill } from '../components/backend-pill'
import { Alert } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { LinkButton } from '../components/ui/link-button'
import { Input } from '../components/ui/input'
import { Field } from '../components/ui/field'
import { Badge } from '../components/ui/badge'
import { LanguageSelect } from '../features/room/language-select'
import { api, ApiError } from '../services/api'
import { useSettingsStore } from '../store/settingsStore'
import { isValidRoomCode, normalizeRoomCode } from '../lib/room-code'
import { getLanguage } from '../lib/languages'
import { samplePhrase } from '../lib/sample-phrases'

type Phase = 'form' | 'checking' | 'not-found'

export default function JoinConversation() {
  const navigate = useNavigate()
  const settings = useSettingsStore()

  const [roomCode, setRoomCode] = React.useState('')
  const [displayName, setDisplayName] = React.useState(settings.displayName)
  const [outputLanguage, setOutputLanguage] = React.useState(settings.outputLanguage)
  const [phase, setPhase] = React.useState<Phase>('form')
  const [touched, setTouched] = React.useState<Record<string, boolean>>({})
  const [error, setError] = React.useState<string | null>(null)
  const [offline, setOffline] = React.useState(false)

  const normalized = normalizeRoomCode(roomCode)
  const codeError =
    roomCode.trim().length === 0
      ? 'Enter the room code you were given.'
      : !isValidRoomCode(normalized)
        ? 'That does not look like a room code. Codes look like “lotus-4f2a”.'
        : undefined
  const nameError =
    displayName.trim().length < 2
      ? 'Enter the name other participants will see (at least 2 characters).'
      : undefined

  const preview = samplePhrase(outputLanguage)
  const previewLang = getLanguage(outputLanguage)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setTouched({ roomCode: true, displayName: true })
    setError(null)
    setOffline(false)
    if (codeError || nameError) return

    setPhase('checking')
    try {
      // 1. Validate the room exists before navigating.
      const room = await api.getRoom(normalized)

      // 2. Actually join through the backend contract.
      const participant = await api.joinRoom(normalized, {
        name: displayName.trim(),
        input_language: settings.inputLanguage,
        output_language: outputLanguage,
      })

      settings.update({ displayName: displayName.trim(), outputLanguage })
      navigate(`/room/${room.code}`, { state: { room, participant }, replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setPhase('not-found')
        return
      }
      if (err instanceof ApiError && err.isUnavailable) {
        setOffline(true)
        setError(err.message)
        setPhase('form')
        return
      }
      setError(err instanceof ApiError ? err.message : 'Could not join that room.')
      setPhase('form')
    }
  }

  const openPreview = () => {
    settings.update({ displayName: displayName.trim() || 'Guest', outputLanguage })
    navigate(`/room/${normalized}`)
  }

  /* ------------------------------------------------------------------ */
  /* Room not found — in-flow state, not a separate page                 */
  /* ------------------------------------------------------------------ */
  if (phase === 'not-found') {
    return (
      <CenteredShell
        eyebrow="Room not found"
        title="We couldn’t find that room."
        description="The code may have expired, been deleted, or been typed incorrectly."
        backTo="/"
        backLabel="Home"
        aside={<BackendPill />}
      >
        <div className="rounded-xl border border-white/[0.1] bg-surface/80 p-6 text-center shadow-card">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-warning/35 bg-warning/10 text-warning">
            <SearchX className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 font-mono text-[15px] font-semibold tracking-[0.04em] text-foreground">
            {normalized}
          </p>
          <p className="mx-auto mt-3 max-w-sm text-[13.5px] leading-relaxed text-muted">
            Nothing is listening on this code right now. Check with whoever invited you, or start
            a fresh conversation of your own.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row">
            <Button variant="secondary" onClick={() => setPhase('form')}>
              Try another code
            </Button>
            <LinkButton to="/create-conversation">Create a new room</LinkButton>
          </div>
        </div>

        <p className="mt-5 text-center text-[12.5px] text-muted-2">
          Looking for a room you created earlier?{' '}
          <Link to="/history" className="text-primary-bright underline-offset-4 hover:underline">
            Open your history
          </Link>
          .
        </p>
      </CenteredShell>
    )
  }

  return (
    <CenteredShell
      eyebrow="Join a conversation"
      title="Enter the code. Pick your language. Start listening."
      description="You’ll be recognised by the name you choose here, and everything you hear will be translated into your preferred language."
      backTo="/"
      backLabel="Home"
      aside={<BackendPill />}
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        <FormPanel
          footer={
            <div className="space-y-3">
              {error && !offline && (
                <Alert variant="danger" title="Could not join the room">
                  {error}
                </Alert>
              )}
              {offline && (
                <Alert
                  variant="warning"
                  title="Translation service unavailable"
                  action={
                    <Button type="button" variant="secondary" size="sm" onClick={openPreview}>
                      Open preview
                    </Button>
                  }
                >
                  The room could not be verified because the backend did not respond. Nothing has
                  been joined yet — you can open a clearly-labelled preview session instead.
                </Alert>
              )}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={phase === 'checking'}
                disabled={phase === 'checking'}
              >
                {phase === 'checking' ? 'Checking room…' : 'Join room'}
                {phase !== 'checking' && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
              </Button>
            </div>
          }
        >
          {/* 01 — code */}
          <FormSection
            index="01"
            title="Room code"
            hint="The host shares this after creating the conversation."
          >
            <Field
              id="room-code"
              label="Room code"
              required
              error={touched.roomCode ? codeError : undefined}
            >
              <div className="relative">
                <Hash
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2"
                />
                <Input
                  id="room-code"
                  value={roomCode}
                  placeholder="lotus-4f2a"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  inputMode="text"
                  className="pl-10 font-mono text-[15px] tracking-[0.06em]"
                  aria-invalid={touched.roomCode && !!codeError}
                  onChange={(e) => setRoomCode(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, roomCode: true }))}
                />
              </div>
            </Field>
          </FormSection>

          {/* 02 — identity */}
          <FormSection index="02" title="Your name" hint="Shown beside everything you say.">
            <Field
              id="join-name"
              label="Display name"
              required
              error={touched.displayName ? nameError : undefined}
            >
              <div className="relative">
                <UserRound
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2"
                />
                <Input
                  id="join-name"
                  value={displayName}
                  autoComplete="nickname"
                  placeholder="e.g. Kiran"
                  className="pl-10"
                  aria-invalid={touched.displayName && !!nameError}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, displayName: true }))}
                />
              </div>
            </Field>
          </FormSection>

          {/* 03 — language */}
          <FormSection
            index="03"
            title="What should you hear?"
            hint="Other participants keep their own language — this only controls yours."
          >
            <Field id="join-language" label="Preferred language" required>
              <LanguageSelect
                id="join-language"
                aria-label="Preferred language"
                value={outputLanguage}
                onChange={setOutputLanguage}
                disabled={phase === 'checking'}
              />
            </Field>

            <div className="mt-4 rounded-lg border border-white/[0.08] bg-background/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
                  Incoming speech will appear as
                </p>
                <Badge variant="secondary" size="sm">
                  {previewLang?.short ?? 'EN'}
                </Badge>
              </div>
              <p
                lang={previewLang?.code.split('-')[0]}
                className="mt-2.5 text-[14.5px] leading-relaxed text-foreground/90"
              >
                {preview.text}
              </p>
              <p className="mt-1.5 text-[12px] text-muted-2">{preview.gloss}</p>
            </div>
          </FormSection>
        </FormPanel>
      </form>

      <p className="mt-5 text-center text-[12.5px] text-muted-2">
        Don’t have a code?{' '}
        <Link
          to="/create-conversation"
          className="text-primary-bright underline-offset-4 hover:underline"
        >
          Create a conversation
        </Link>{' '}
        and share it instead.
      </p>
    </CenteredShell>
  )
}
