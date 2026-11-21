import * as React from 'react'
import { Check, Moon, RotateCcw, Sun, Trash2 } from 'lucide-react'
import { CenteredShell } from '../components/centered-shell'
import { FormPanel, FormSection } from '../components/form-panel'
import { BackendPill } from '../components/backend-pill'
import { Alert } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Field } from '../components/ui/field'
import { Switch } from '../components/ui/switch'
import { Select } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { LanguageSelect } from '../features/room/language-select'
import { useSettingsStore, type ThemePreference } from '../store/settingsStore'
import { useHistoryStore } from '../store/historyStore'
import { useMediaDevices } from '../hooks/use-devices'
import { speechSupported } from '../lib/speech'
import { getLanguage, languageNativeLabel } from '../lib/languages'
import { cn } from '../lib/utils'

const VOICE_OPTIONS = [
  {
    value: 'default',
    label: 'Provider default',
    description: 'Best voice for each target language',
  },
  {
    value: 'Nalini',
    label: 'Nalini',
    description: 'Backend default · female · hi-IN',
  },
]

function SettingRow({
  label,
  hint,
  children,
}: {
  label: React.ReactNode
  hint?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[13.5px] leading-snug text-foreground">{label}</p>
        {hint && <p className="mt-0.5 text-[12px] leading-snug text-muted-2">{hint}</p>}
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  )
}

function ThemeChoice({
  value,
  onChange,
}: {
  value: ThemePreference
  onChange: (v: ThemePreference) => void
}) {
  const options: { id: ThemePreference; label: string; icon: React.ElementType }[] = [
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'light', label: 'Light', icon: Sun },
  ]
  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      className="inline-flex rounded-lg border border-white/[0.1] bg-background/60 p-1"
    >
      {options.map((opt) => {
        const active = value === opt.id
        const Icon = opt.icon
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.id)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12.5px] font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'bg-elevated-2 text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]'
                : 'text-muted hover:text-foreground'
            )}
          >
            <Icon aria-hidden="true" className="h-3.5 w-3.5" />
            {opt.label}
            {active && <Check aria-hidden="true" className="h-3 w-3 text-secondary" />}
          </button>
        )
      })}
    </div>
  )
}

export default function Settings() {
  const settings = useSettingsStore()
  const history = useHistoryStore()
  const devices = useMediaDevices()

  const [confirmClear, setConfirmClear] = React.useState(false)

  const inputLang = getLanguage(settings.inputLanguage)
  const outputLang = getLanguage(settings.outputLanguage)

  const speakerOptions = React.useMemo(
    () => [
      { value: '', label: 'System default', description: 'Let the OS choose' },
      ...devices.speakers.map((d) => ({ value: d.deviceId, label: d.label, description: 'Output' })),
    ],
    [devices.speakers]
  )

  return (
    <CenteredShell
      eyebrow="Settings"
      title="Tune the conversation to you."
      description="These preferences are stored in this browser only and applied everywhere — including the next room you open."
      backTo="/"
      backLabel="Home"
      aside={<BackendPill />}
    >
      <FormPanel
        footer={
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] text-muted-2">
              {history.entries.length} conversation
              {history.entries.length === 1 ? '' : 's'} in history
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => settings.reset()}
                title="Restore every preference to its default"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reset preferences
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setConfirmClear(true)}
                disabled={history.entries.length === 0}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Clear history
              </Button>
            </div>
          </div>
        }
      >
        {/* 01 — profile */}
        <FormSection
          index="01"
          title="Profile"
          hint="The name shown beside everything you say."
        >
          <Field id="settings-name" label="Display name">
            <Input
              id="settings-name"
              value={settings.displayName}
              autoComplete="nickname"
              placeholder="e.g. Arjun"
              onChange={(e) => settings.update({ displayName: e.target.value })}
            />
          </Field>
        </FormSection>

        {/* 02 — languages */}
        <FormSection
          index="02"
          title="Language preferences"
          hint="Used as your defaults whenever you create or join a room."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="settings-input" label="I speak">
              <LanguageSelect
                id="settings-input"
                aria-label="Language you speak"
                value={settings.inputLanguage}
                onChange={(v) => settings.update({ inputLanguage: v })}
              />
            </Field>
            <Field id="settings-output" label="I want to hear">
              <LanguageSelect
                id="settings-output"
                aria-label="Language you want to hear"
                value={settings.outputLanguage}
                onChange={(v) => settings.update({ outputLanguage: v })}
              />
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-[12.5px] text-muted-2">
            <span>Currently:</span>
            <Badge variant="primary" size="sm">
              {inputLang?.short} → {outputLang?.short}
            </Badge>
            <span lang={inputLang?.code.split('-')[0]}>{languageNativeLabel(settings.inputLanguage)}</span>
            <span aria-hidden="true">→</span>
            <span lang={outputLang?.code.split('-')[0]}>{languageNativeLabel(settings.outputLanguage)}</span>
          </div>
        </FormSection>

        {/* 03 — voice */}
        <FormSection
          index="03"
          title="Voice preferences"
          hint="Controls how translated speech is spoken back to you."
        >
          <Field
            id="settings-voice"
            label="Voice"
            description="The voice catalogue belongs to the configured provider, and the API does not expose a list yet — these are the entries the backend contract references."
          >
            <Select
              id="settings-voice"
              aria-label="Voice"
              value={settings.voice}
              onChange={(v) => settings.update({ voice: v })}
              options={VOICE_OPTIONS}
            />
          </Field>

          <div className="mt-4 space-y-3.5 border-t border-white/[0.07] pt-4">
            <SettingRow
              label="Speak translations aloud"
              hint={
                speechSupported
                  ? 'Uses your system voices while Gnani Timbre is offline'
                  : 'No speech engine is available in this browser'
              }
            >
              <Switch
                checked={settings.playTranslatedAudio}
                onChange={(v) => settings.update({ playTranslatedAudio: v })}
                aria-label="Speak translations aloud"
                disabled={!speechSupported}
              />
            </SettingRow>
            <SettingRow label="Read the original line too" hint="Queued ahead of the translation">
              <Switch
                checked={settings.playOriginalAudio}
                onChange={(v) => settings.update({ playOriginalAudio: v })}
                aria-label="Read the original line"
                disabled={!speechSupported}
              />
            </SettingRow>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="settings-volume" className="text-[12px] text-muted-2">
                  Playback volume
                </label>
                <span className="font-mono text-[12px] tabular-nums text-muted">
                  {settings.volume}%
                </span>
              </div>
              <input
                id="settings-volume"
                type="range"
                min={0}
                max={100}
                step={5}
                value={settings.volume}
                onChange={(e) => settings.update({ volume: Number(e.target.value) })}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/[0.1] accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Playback volume"
              />
            </div>
          </div>
        </FormSection>

        {/* 04 — audio devices */}
        <FormSection
          index="04"
          title="Audio preferences"
          hint="Device labels are only revealed by the browser after you grant microphone access."
        >
          <div className="space-y-3.5">
            <SettingRow label="Microphone enabled" hint="Applies as soon as you enter a room">
              <Switch
                checked={settings.micEnabled}
                onChange={(v) => settings.update({ micEnabled: v })}
                aria-label="Microphone enabled"
              />
            </SettingRow>

            <div>
              <label htmlFor="settings-mic" className="mb-1.5 block text-[12.5px] text-muted-2">
                Microphone
              </label>
              <Select
                id="settings-mic"
                aria-label="Microphone"
                value={settings.microphoneId}
                onChange={(v) => settings.update({ microphoneId: v })}
                options={[
                  { value: '', label: 'System default', description: 'Let the OS choose' },
                  ...devices.microphones.map((d) => ({
                    value: d.deviceId,
                    label: d.label,
                    description: 'Input',
                  })),
                ]}
                disabled={devices.microphones.length === 0}
                placeholder={devices.microphones.length === 0 ? 'No devices listed yet' : 'Select'}
              />
            </div>

            <div>
              <label htmlFor="settings-speaker" className="mb-1.5 block text-[12.5px] text-muted-2">
                Speaker
              </label>
              <Select
                id="settings-speaker"
                aria-label="Speaker"
                value={settings.speakerId}
                onChange={(v) => settings.update({ speakerId: v })}
                options={speakerOptions}
                disabled={devices.speakers.length === 0}
                placeholder={devices.speakers.length === 0 ? 'No devices listed yet' : 'Select'}
              />
              <p className="mt-1.5 text-[11.5px] leading-snug text-muted-2">
                Stored for later — browsers do not currently expose output routing for speech
                synthesis, so playback follows the system default.
              </p>
            </div>

            {devices.permission !== 'granted' && (
              <Alert variant="info" title="Device selection is off">
                {devices.permission === 'denied'
                  ? 'Microphone access was blocked. Allow it in your browser settings, then try again.'
                  : 'Grant microphone access to list your inputs and outputs.'}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-2.5"
                  onClick={() => void devices.requestAccess()}
                >
                  {devices.permission === 'denied' ? 'Try again' : 'Enable device selection'}
                </Button>
              </Alert>
            )}

            {devices.permission === 'granted' && (
              <p className="text-[11.5px] text-success">
                {devices.microphones.length} microphone
                {devices.microphones.length === 1 ? '' : 's'} · {devices.speakers.length} speaker
                {devices.speakers.length === 1 ? '' : 's'} available
              </p>
            )}
          </div>
        </FormSection>

        {/* 05 — subtitles */}
        <FormSection
          index="05"
          title="Subtitle preferences"
          hint="What you see in the stage and the transcript."
        >
          <div className="space-y-3.5">
            <SettingRow label="Show original speech" hint="In the speaker's own language">
              <Switch
                checked={settings.showOriginal}
                onChange={(v) => settings.update({ showOriginal: v })}
                aria-label="Show original speech"
              />
            </SettingRow>
            <SettingRow label="Show translation" hint="In your preferred language">
              <Switch
                checked={settings.showTranslated}
                onChange={(v) => settings.update({ showTranslated: v })}
                aria-label="Show translation"
              />
            </SettingRow>
            {!settings.showOriginal && !settings.showTranslated && (
              <Alert variant="warning" title="Both subtitle lines are hidden">
                You will only hear the conversation. Turn one back on to read along.
              </Alert>
            )}
          </div>
        </FormSection>

        {/* 06 — appearance */}
        <FormSection index="06" title="Appearance" hint="Applies immediately and is remembered.">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[13.5px] text-foreground">Theme</p>
              <p className="mt-0.5 text-[12px] text-muted-2">
                Dark is the product default; light is available for bright rooms.
              </p>
            </div>
            <ThemeChoice value={settings.theme} onChange={(v) => settings.update({ theme: v })} />
          </div>
        </FormSection>
      </FormPanel>

      {confirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5">
          <div className="w-full max-w-sm rounded-xl border border-white/[0.12] bg-surface p-5 shadow-pop">
            <h2 className="font-display text-[16px] font-bold">Clear conversation history?</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              This removes all {history.entries.length} saved conversation
              {history.entries.length === 1 ? '' : 's'} from this browser. Preferences are kept.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" size="sm" onClick={() => setConfirmClear(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  history.clear()
                  setConfirmClear(false)
                }}
              >
                Clear history
              </Button>
            </div>
          </div>
        </div>
      )}
    </CenteredShell>
  )
}
