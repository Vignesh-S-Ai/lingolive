import * as React from 'react'
import { cn } from '../../lib/utils'

interface TabsProps {
  tabs: { id: string; label: React.ReactNode; icon?: React.ReactNode }[]
  value: string
  onChange: (id: string) => void
  className?: string
  'aria-label'?: string
}

export function Tabs({ tabs, value, onChange, className, ...aria }: TabsProps) {
  const refs = React.useRef<Record<string, HTMLButtonElement | null>>({})

  const onKeyDown = (e: React.KeyboardEvent) => {
    const idx = tabs.findIndex((t) => t.id === value)
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const delta = e.key === 'ArrowRight' ? 1 : -1
      const next = tabs[(idx + delta + tabs.length) % tabs.length]
      if (next) {
        onChange(next.id)
        refs.current[next.id]?.focus()
      }
    }
  }

  return (
    <div
      role="tablist"
      onKeyDown={onKeyDown}
      aria-label={aria['aria-label']}
      className={cn(
        'inline-flex items-center gap-1 rounded-lg border border-white/[0.09] bg-surface p-1',
        className
      )}
    >
      {tabs.map((tab) => {
        const active = tab.id === value
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[tab.id] = el
            }}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={active}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex h-9 items-center gap-2 rounded-md px-3.5 text-[13px] font-medium transition-colors duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'bg-elevated-2 text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]'
                : 'text-muted hover:text-foreground hover:bg-white/[0.04]'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
