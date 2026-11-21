import * as React from 'react'

export interface MediaDeviceInfoLite {
  deviceId: string
  label: string
  kind: 'audioinput' | 'audiooutput'
}

export interface UseMediaDevices {
  microphones: MediaDeviceInfoLite[]
  speakers: MediaDeviceInfoLite[]
  permission: 'granted' | 'denied' | 'unknown'
  supported: boolean
  /** Enumerate whatever the browser will reveal without a permission prompt. */
  refresh: () => Promise<void>
  /** Ask for microphone access so device labels become available. */
  requestAccess: () => Promise<boolean>
}

/**
 * Real device enumeration via the MediaDevices API.
 * Labels are only exposed after a permission grant, so the UI offers an
 * explicit "enable device selection" action instead of prompting on load.
 */
export function useMediaDevices(): UseMediaDevices {
  const supported =
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.enumerateDevices

  const [microphones, setMicrophones] = React.useState<MediaDeviceInfoLite[]>([])
  const [speakers, setSpeakers] = React.useState<MediaDeviceInfoLite[]>([])
  const [permission, setPermission] = React.useState<'granted' | 'denied' | 'unknown'>('unknown')

  const apply = React.useCallback((list: MediaDeviceInfo[]) => {
    const map = (kind: MediaDeviceInfo['kind']) =>
      list
        .filter((d) => d.kind === kind)
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || (kind === 'audioinput' ? `Microphone ${i + 1}` : `Speaker ${i + 1}`),
          kind: kind === 'audioinput' ? ('audioinput' as const) : ('audiooutput' as const),
        }))
    setMicrophones(map('audioinput'))
    setSpeakers(map('audiooutput'))
  }, [])

  const refresh = React.useCallback(async () => {
    if (!supported) return
    try {
      const list = await navigator.mediaDevices.enumerateDevices()
      apply(list)
      const hasLabel = list.some((d) => d.label)
      if (hasLabel) setPermission('granted')
    } catch {
      /* device enumeration unavailable — leave lists empty */
    }
  }, [supported, apply])

  const requestAccess = React.useCallback(async () => {
    if (!supported) return false
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
      setPermission('granted')
      await refresh()
      return true
    } catch {
      setPermission('denied')
      return false
    }
  }, [supported, refresh])

  React.useEffect(() => {
    void refresh()
    if (!supported) return
    const onChange = () => void refresh()
    navigator.mediaDevices.addEventListener?.('devicechange', onChange)
    return () => navigator.mediaDevices.removeEventListener?.('devicechange', onChange)
  }, [refresh, supported])

  return { microphones, speakers, permission, supported, refresh, requestAccess }
}
