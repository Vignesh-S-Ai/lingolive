import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, RefreshCw, Hash, UserRound } from 'lucide-react'
import { CenteredShell } from '../components/centered-shell'
import { FormPanel, FormSection } from '../components/form-panel'
import { BackendPill } from '../components/backend-pill'
import { Alert } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Field } from '../components/ui/field'
import { LanguageSelect } from '../features/room/language-select'
import { api, ApiError } from '../services/api'
import { useSettingsStore } from '../store/settingsStore'
import { generateRoomCode, isValidRoomCode, normalizeRoomCode } from '../lib/room-code'
import { getLanguage } from '../lib/languages'
import { samplePhrase } from '../lib/sample-phrases'
import { cn } from '../lib/utils'

function LanguageSide({
  code,
  caption,
  align = 'left',
}: {
  code: string
  caption: string
  align?: 'left' | 'right'
}) {
  const lang = getLanguage(code)
  const phrase = samplePhrase(code)
  return (
    <div className={cn('min-w-0', align === 'right' && 'text-right')}>
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">{caption}</p>
      <p
        lang={lang?.code.split('-')[0]}
        className="mt-1.5 truncate text-[15px] font-medium text-foreground"
      >
        {lang?.nativeName ?? code}
      </p>
      <p className="mt-0.5 font-mono text-[11px] text-muted-2">{lang?.name ?? code}</p>
      <p
        lang={lang?.code.split('-')[0]}
        className={cn(
          'mt-3 rounded-md border border-white/[0.08] bg-background/60 px-2.5 py-2 text-[13px] leading-snug text-foreground/85',
          align === 'right' && 'text-right'
        )}
      >
        {phrase.text}
      </p>
    </div>
  )
}

export default function CreateConversation() {
  const navigate = useNavigate()
  const settings = useSettingsStore()

  const [displayName, setDisplayName] = React.useState(settings.displayName)
  const [roomName, setRoomName] = React.useState('')
  const [roomCode, setRoomCode] = React.useState(() => generateRoomCode())
  const [inputLanguage, setInputLanguage] = React.useState(settings.inputLanguage)
  const [outputLanguage, setOutputLanguage] = React.useState(settings.outputLanguage)

  const [touched, setTouched] = React.useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [offline, setOffline] = React.useState(false)

  const nameError =
    displayName.trim().length < 2
      ? 'Enter the name other participants will see (at least 2 characters).'
      : undefined
  const roomError =
    roomName.trim().length < 2 ? 'Give this conversation a name (at least 2 characters).' : undefined

  const regenerate = () => {
    setRoomCode(generateRoomCode())
    setSubmitError(null)
  }

  const persistSettings = () =>
    settings.update({
      displayName: displayName.trim(),
      inputLanguage,
      outputLanguage,
    })

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setTouched({ displayName: true, roomName: true })
    setSubmitError(null)
    setOffline(false)
    if (nameError || roomError) return

    persistSettings()

    const code = normalizeRoomCode(roomCode)
    if (!isValidRoomCode(code)) {
      setSubmitError('That room code is not valid. Generate a new one and try again.')
      return
    }

    setSubmitting(true)
    try {
      const room = await api.createRoom({ code, name: roomName.trim() })
      navigate(`/room/${room.code}`)
      return
    } catch (error) {
      // Code already taken — regenerate once and retry automatically.
      if (error instanceof ApiError && error.status === 409) {
        const next = generateRoomCode()
        setRoomCode(next)
        try {
          const room = await api.createRoom({ code: next, name: roomName.trim() })
          navigate(`/room/${room.code}`)
          return
        } catch (retryError) {
          handleFailure(retryError)
          return
        }
      }
      handleFailure(error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleFailure = (error: unknown) => {
    if (error instanceof ApiError && error.isUnavailable) {
      setOffline(true)
      setSubmitError(error.message)
      return
    }
    setSubmitError(error instanceof ApiError ? error.message : 'Could not create the room.')
  }

  const openPreview = () => {
    persistSettings()
    navigate(`/room/${normalizeRoomCode(roomCode)}`)
  }

  return (
    <CenteredShell
      eyebrow="New conversation"
      title="Create a room and invite anyone in."
      description="Pick the language you speak and the language you want to receive. Participants choose their own when they join."
      backTo="/"
      backLabel="Home"
      aside={<BackendPill />}
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        <FormPanel
          footer={
            <div className="space-y-3">
              {submitError && !offline && (
                <Alert variant="danger" title="Could not create the room">
                  {submitError}
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
                  The room was <strong className="font-semibold text-foreground">not created</strong>{' '}
                  because the backend did not respond. You can open a clearly-labelled preview
                  session instead, or retry once the service is back.
                </Alert>
              )}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={submitting}
                disabled={submitting}
              >
                Create room
                {!submitting && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
              </Button>
            </div>
          }
        >
          {/* 01 — identity */}
          <FormSection
            index="01"
            title="Who are you?"
            hint="This is the name shown next to your translated speech."
          >
            <Field
              id="display-name"
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
                  id="display-name"
                  value={displayName}
                  autoComplete="nickname"
                  placeholder="e.g. Arjun"
                  className="pl-10"
                  aria-invalid={touched.displayName && !!nameError}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, displayName: true }))}
                />
              </div>
            </Field>
          </FormSection>

          {/* 02 — room */}
          <FormSection
            index="02"
            title="Name the conversation"
            hint="The code is what participants type to join you."
          >
            <div className="space-y-4">
              <Field
                id="room-name"
                label="Room name"
                required
                error={touched.roomName ? roomError : undefined}
              >
                <Input
                  id="room-name"
                  value={roomName}
                  placeholder="e.g. Sunday study group"
                  aria-invalid={touched.roomName && !!roomError}
                  onChange={(e) => setRoomName(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, roomName: true }))}
                />
              </Field>

              <div className="rounded-lg border border-white/[0.08] bg-background/60 px-4 py-3.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Hash aria-hidden="true" className="h-4 w-4 shrink-0 text-primary-bright" />
                    <span className="font-mono text-[15px] font-semibold tracking-[0.02em] text-foreground">
                      {normalizeRoomCode(roomCode)}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={regenerate}
                    disabled={submitting}
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    Regenerate
                  </Button>
                </div>
                <p className="mt-2 text-[12px] text-muted-2">
                  3–32 characters · letters, numbers and hyphens
                </p>
              </div>
            </div>
          </FormSection>

          {/* 03 — languages */}
          <FormSection
            index="03"
            title="Your languages"
            hint="You can change these later in Settings, or any time from inside the room."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="speak-language" label="I speak" required>
                <LanguageSelect
                  id="speak-language"
                  aria-label="Language you speak"
                  value={inputLanguage}
                  onChange={setInputLanguage}
                  disabled={submitting}
                />
              </Field>
              <Field id="listen-language" label="I want to hear" required>
                <LanguageSelect
                  id="listen-language"
                  aria-label="Language you want to hear"
                  value={outputLanguage}
                  onChange={setOutputLanguage}
                  disabled={submitting}
                />
              </Field>
            </div>

            <div className="mt-5 rounded-lg border border-white/[0.08] bg-background/60 p-4">
              <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 sm:gap-4">
                <LanguageSide code={inputLanguage} caption="You say" />
                <ArrowRight
                  aria-hidden="true"
                  className="mt-8 h-4 w-4 shrink-0 text-secondary"
                />
                <LanguageSide code={outputLanguage} caption="You hear" align="right" />
              </div>
              {inputLanguage === outputLanguage && (
                <p className="mt-3 border-t border-white/[0.07] pt-3 text-[12px] text-muted-2">
                  Same language on both sides — speech will be passed through without translation.
                </p>
              )}
            </div>
          </FormSection>
        </FormPanel>
      </form>
    </CenteredShell>
  )
}
