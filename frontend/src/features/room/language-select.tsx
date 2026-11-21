import * as React from 'react'
import type { SelectOption } from '../../components/ui/select'
import { Select, type SelectProps } from '../../components/ui/select'
import { languages, getLanguage } from '../../lib/languages'
import { cn } from '../../lib/utils'

function LanguageGlyph({ code, disabled }: { code: string; disabled?: boolean }) {
  const lang = getLanguage(code)
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex h-6 min-w-[30px] shrink-0 items-center justify-center rounded border px-1.5 font-mono text-[10.5px] font-semibold tracking-[0.08em]',
        disabled
          ? 'border-white/[0.1] bg-white/[0.03] text-muted-2'
          : 'border-primary/35 bg-primary/12 text-primary-bright'
      )}
    >
      {lang?.short ?? code.slice(0, 2).toUpperCase()}
    </span>
  )
}

/** Options for every language in the registry; roadmap languages are disabled. */
export function languageOptions(): SelectOption[] {
  return languages.map((l) => ({
    value: l.code,
    label: l.nativeName,
    description: l.available ? `${l.name} · ${l.code}` : `${l.name} · not yet available`,
    disabled: !l.available,
    icon: <LanguageGlyph code={l.code} disabled={!l.available} />,
  }))
}

export interface LanguageSelectProps
  extends Omit<SelectProps, 'options' | 'onChange'> {
  value: string
  onChange: (value: string) => void
  /** Language codes to leave out of the list (e.g. the opposite side of a pair). */
  exclude?: string[]
}

export function LanguageSelect({ value, onChange, exclude, ...props }: LanguageSelectProps) {
  const options = React.useMemo(() => {
    const all = languageOptions()
    return exclude?.length ? all.filter((o) => !exclude.includes(o.value)) : all
  }, [exclude])

  return <Select {...props} value={value} onChange={onChange} options={options} searchable />
}
