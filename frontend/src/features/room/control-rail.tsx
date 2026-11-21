import * as React from 'react'
import {
  Captions,
  Gauge,
  Mic,
  MicOff,
  MonitorSpeaker,
  SlidersHorizontal,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Alert } from '../../components/ui/alert'
import { Switch } from '../../components/ui/switch'
import { Select } from '../../components/ui/select'
import { LiveWaveform } from '../../components/waveform'
import { LanguageSelect } from './language-select'
import { speechSupported } from '../../lib/speech'
import { cn } from '../../lib/utils'

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="px-4 py-4">
      <h2 className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-muted-2">
        {icon}
        {title}
      </h2>
      <div className="mt-3.5 space-y-3.5">{children}</div>
    </section>
  )
}

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
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[13px] leading-snug text-foreground">{label}</p>
        {hint && <p className="mt-0.5 text-[11.5px] leading-snug text-muted-2">{hint}</p>}
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  )
}

export interface ControlRailProps {
  /* microphone */
  micEnabled: boolean
  onToggleMic: () => void
  micLevel: number
  micLive: boolean
  micPermission: 'unknown' | 'granted' | 'denied'
  micError: string | null
  microphoneId: string
  onMicrophoneChange: (id: string) => void
  microphones: { deviceId: string; label: string }[]
  onRequestDeviceAccess: () => void

  /* playback */
  speakerEnabled: boolean
  onToggleSpeaker: () => void
  volume: number
  onVolumeChange: (value: number) => void
  playOriginal: boolean
  playTranslated: boolean
  onTogglePlayOriginal: () => void
  onTogglePlayTranslated: () => void

  /* subtitles */
  showOriginal: boolean
  showTranslated: boolean
  onToggleShowOriginal: () => void
  onToggleShowTranslated: () => void

  /* languages */
  inputLanguage: string
  outputLanguage: string
  onLanguagesChange: (input: string, output: string) => void
  languageBusy: boolean
  languageError: string | null

  /**
   * True while the LiveKit/Gnani providers are not connected (preview mode).
   * Defaults to true so existing preview callers keep the honest disclosure.
   */
  providersOffline?: boolean
}

export function ControlRail(props: ControlRailProps) {
  const {
    micEnabled,
    onToggleMic,
    micLevel,
    micLive,
    micPermission,
    micError,
    microphoneId,
    onMicrophoneChange,
    microphones,
    onRequestDeviceAccess,
    speakerEnabled,
    onToggleSpeaker,
    volume,
    onVolumeChange,
    playOriginal,
    playTranslated,
    onTogglePlayOriginal,
    onTogglePlayTranslated,
    showOriginal,
    showTranslated,
    onToggleShowOriginal,
    onToggleShowTranslated,
    inputLanguage,
    outputLanguage,
    onLanguagesChange,
    languageBusy,
    languageError,
    providersOffline = true,
  } = props

  const micOptions = React.useMemo(
    () => [
      { value: '', label: 'System default', description: 'Let the OS choose' },
      ...microphones.map((d) => ({ value: d.deviceId, label: d.label, description: 'Microphone' })),
    ],
    [microphones]
  )

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 divide-y divide-white/[0.07] overflow-y-auto">
        {/* Microphone */}
        <Section title="Microphone" icon={<Mic aria-hidden="true" className="h-3 w-3" />}>
          <Button
            type="button"
            variant={micEnabled ? 'secondary' : 'danger'}
            className="w-full justify-between"
            onClick={onToggleMic}
            aria-pressed={micEnabled}
          >
            <span className="flex items-center gap-2">
              {micEnabled ? (
                <Mic aria-hidden="true" className="h-4 w-4" />
              ) : (
                <MicOff aria-hidden="true" className="h-4 w-4" />
              )}
              {micEnabled ? 'Mute microphone' : 'Unmute microphone'}
            </span>
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                micEnabled ? 'bg-success' : 'bg-danger'
              )}
              aria-hidden="true"
            />
          </Button>

          <div>
            <div className="h-6 text-secondary">
              <LiveWaveform level={micEnabled ? micLevel : 0} bars={36} floor={0.05} />
            </div>
            <p className="mt-1.5 flex items-center justify-between text-[11px] text-muted-2">
              <span>
                {micLive
                  ? 'Live input level'
                  : micPermission === 'denied'
                    ? 'Access blocked'
                    : micEnabled
                      ? 'Opening microphone…'
                      : 'Muted'}
              </span>
              <span className="font-mono">{Math.round((micEnabled ? micLevel : 0) * 100)}%</span>
            </p>
          </div>

          {micError && (
            <Alert variant="warning" title="Microphone">
              {micError}
              {micPermission !== 'granted' && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-2.5"
                  onClick={onRequestDeviceAccess}
                >
                  Enable device selection
                </Button>
              )}
            </Alert>
          )}

          {!micError && micPermission !== 'granted' && (
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={onRequestDeviceAccess}>
              Enable device selection
            </Button>
          )}

          {microphones.length > 0 && (
            <div>
              <label
                htmlFor="room-mic-device"
                className="mb-1.5 block text-[11.5px] text-muted-2"
              >
                Input device
              </label>
              <Select
                id="room-mic-device"
                aria-label="Input device"
                value={microphoneId}
                onChange={onMicrophoneChange}
                options={micOptions}
              />
            </div>
          )}
        </Section>

        {/* Playback */}
        <Section title="Playback" icon={<Volume2 aria-hidden="true" className="h-3 w-3" />}>
          <SettingRow label="Play translated speech" hint="Reads each translation aloud">
            <Switch
              checked={playTranslated}
              onChange={onTogglePlayTranslated}
              aria-label="Play translated speech"
            />
          </SettingRow>

          <SettingRow
            label="Read the original line too"
            hint="Queued before the translation"
          >
            <Switch
              checked={playOriginal}
              onChange={onTogglePlayOriginal}
              aria-label="Read the original line"
            />
          </SettingRow>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="room-volume" className="text-[11.5px] text-muted-2">
                Volume
              </label>
              <span className="font-mono text-[11.5px] tabular-nums text-muted">{volume}%</span>
            </div>
            <div className="flex items-center gap-2.5">
              {speakerEnabled ? (
                <VolumeX aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-muted-2" />
              ) : (
                <MonitorSpeaker aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-muted-2" />
              )}
              <input
                id="room-volume"
                type="range"
                min={0}
                max={100}
                step={5}
                value={volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/[0.1] accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Playback volume"
              />
            </div>
          </div>

          <SettingRow label="Speaker output" hint={speechSupported ? 'Using system voices' : 'No speech engine'}>
            <Switch
              checked={speakerEnabled}
              onChange={onToggleSpeaker}
              aria-label="Speaker output"
            />
          </SettingRow>

          {!speechSupported && (
            <p className="text-[11.5px] leading-snug text-muted-2">
              This browser has no speech synthesis engine, so audio playback is unavailable.
            </p>
          )}
        </Section>

        {/* Subtitles */}
        <Section title="Subtitles" icon={<Captions aria-hidden="true" className="h-3 w-3" />}>
          <SettingRow label="Show original speech">
            <Switch
              checked={showOriginal}
              onChange={onToggleShowOriginal}
              aria-label="Show original speech"
            />
          </SettingRow>
          <SettingRow label="Show translation">
            <Switch
              checked={showTranslated}
              onChange={onToggleShowTranslated}
              aria-label="Show translation"
            />
          </SettingRow>
        </Section>

        {/* Languages */}
        <Section title="Languages" icon={<SlidersHorizontal aria-hidden="true" className="h-3 w-3" />}>
          <div>
            <label htmlFor="room-input-language" className="mb-1.5 block text-[11.5px] text-muted-2">
              I speak
            </label>
            <LanguageSelect
              id="room-input-language"
              aria-label="Language you speak"
              value={inputLanguage}
              onChange={(v) => onLanguagesChange(v, outputLanguage)}
              disabled={languageBusy}
            />
          </div>
          <div>
            <label
              htmlFor="room-output-language"
              className="mb-1.5 block text-[11.5px] text-muted-2"
            >
              I want to hear
            </label>
            <LanguageSelect
              id="room-output-language"
              aria-label="Language you want to hear"
              value={outputLanguage}
              onChange={(v) => onLanguagesChange(inputLanguage, v)}
              disabled={languageBusy}
            />
          </div>
          {languageError && (
            <Alert variant="danger" title="Language change failed">
              {languageError}
            </Alert>
          )}
          {!languageError && (
            <p className="text-[11.5px] leading-snug text-muted-2">
              Saved for this session and as your default for next time.
            </p>
          )}
        </Section>

        {/* Audio status */}
        <Section title="Session audio" icon={<Gauge aria-hidden="true" className="h-3 w-3" />}>
          {providersOffline ? (
            <p className="text-[11.5px] leading-relaxed text-muted-2">
              Media transport runs on your browser's own microphone and speech engine while the
              LiveKit and Gnani integrations are offline. Nothing is recorded or uploaded.
            </p>
          ) : (
            <p className="text-[11.5px] leading-relaxed text-muted-2">
              Your microphone streams to the live translation pipeline while this room is open.
              Original voices arrive over LiveKit; translated voices are synthesised per listener
              and dropped when you leave.
            </p>
          )}
        </Section>
      </div>
    </div>
  )
}
