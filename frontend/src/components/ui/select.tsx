import * as React from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Search } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface SelectOption {
  value: string
  /** Primary label — always the native script name. */
  label: string
  /** Secondary line — English name + code. */
  description?: string
  disabled?: boolean
  /** Optional leading element (language flag glyph, badge, etc.). */
  icon?: React.ReactNode
}

export interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  id?: string
  placeholder?: string
  disabled?: boolean
  searchable?: boolean
  className?: string
  'aria-label'?: string
  'aria-describedby'?: string
}

/**
 * Accessible listbox trigger (button + popover).
 * Keyboard: ↑ ↓ Home End Enter Space Esc, plus type-ahead when not searchable.
 */
export function Select({
  value,
  onChange,
  options,
  id,
  placeholder = 'Select an option',
  disabled = false,
  searchable = false,
  className,
  ...aria
}: SelectProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [activeIndex, setActiveIndex] = React.useState(0)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const listRef = React.useRef<HTMLUListElement>(null)
  const searchRef = React.useRef<HTMLInputElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const typeAhead = React.useRef({ buffer: '', timer: 0 })

  // The panel is portalled to <body> so it is never clipped by an ancestor's
  // overflow (scroll rails, modals, sticky containers).
  const [position, setPosition] = React.useState<{
    left: number
    width: number
    top: number
    bottom: number
    up: boolean
  } | null>(null)

  const measure = React.useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const panelHeight = panelRef.current?.offsetHeight ?? 300
    const spaceBelow = window.innerHeight - r.bottom
    const up = spaceBelow < panelHeight + 16 && r.top > spaceBelow
    setPosition({
      left: r.left,
      width: r.width,
      top: r.bottom + 6,
      bottom: window.innerHeight - r.top + 6,
      up,
    })
  }, [])

  React.useEffect(() => {
    if (!open) {
      setPosition(null)
      return
    }
    measure()
    const onChange = () => measure()
    window.addEventListener('scroll', onChange, true)
    window.addEventListener('resize', onChange)
    return () => {
      window.removeEventListener('scroll', onChange, true)
      window.removeEventListener('resize', onChange)
    }
  }, [open, measure])

  const selected = options.find((o) => o.value === value)

  const filtered = React.useMemo(() => {
    if (!searchable || !query.trim()) return options
    const q = query.trim().toLowerCase()
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.description?.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q)
    )
  }, [options, query, searchable])

  React.useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (rootRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  React.useEffect(() => {
    if (open) {
      const idx = filtered.findIndex((o) => o.value === value)
      setActiveIndex(idx >= 0 ? idx : 0)
      setQuery('')
      const raf = requestAnimationFrame(() =>
        searchable ? searchRef.current?.focus() : listRef.current?.focus()
      )
      return () => cancelAnimationFrame(raf)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!open || activeIndex < 0) return
    const el = listRef.current?.querySelectorAll<HTMLElement>('[role="option"]')[activeIndex]
    el?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  const commit = (option: SelectOption) => {
    if (option.disabled) return
    onChange(option.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const move = (delta: number) => {
    if (!filtered.length) return
    setActiveIndex((i) => {
      let next = i
      for (let step = 0; step < filtered.length; step++) {
        next = (next + delta + filtered.length) % filtered.length
        if (!filtered[next]?.disabled) return next
      }
      return i
    })
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!open) setOpen(true)
        else move(1)
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!open) setOpen(true)
        else move(-1)
        break
      case 'Home':
        if (open) {
          e.preventDefault()
          setActiveIndex(0)
        }
        break
      case 'End':
        if (open) {
          e.preventDefault()
          setActiveIndex(filtered.length - 1)
        }
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (!open) setOpen(true)
        else if (filtered[activeIndex]) commit(filtered[activeIndex])
        break
      case 'Escape':
        if (open) {
          e.preventDefault()
          setOpen(false)
        }
        break
      case 'Tab':
        if (open) setOpen(false)
        break
      default:
        break
    }

    // Type-ahead (single printable character)
    if (!searchable && !e.metaKey && !e.ctrlKey && e.key.length === 1 && !e.altKey) {
      window.clearTimeout(typeAhead.current.timer)
      typeAhead.current.buffer += e.key.toLowerCase()
      typeAhead.current.timer = window.setTimeout(() => {
        typeAhead.current.buffer = ''
      }, 600)
      const match = filtered.findIndex((o) =>
        o.label.toLowerCase().startsWith(typeAhead.current.buffer)
      )
      if (match >= 0) setActiveIndex(match)
    }
  }

  return (
    <div ref={rootRef} className={cn('relative', className)} onKeyDown={onKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        role="combobox"
        aria-controls={`${id ?? 'select'}-listbox`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-activedescendant={open ? `${id ?? 'select'}-option-${activeIndex}` : undefined}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-11 w-full items-center justify-between gap-3 rounded-md border bg-surface px-3.5 text-left text-sm transition-colors',
          'hover:border-white/[0.2] focus:outline-none focus:ring-4 focus:ring-primary/15',
          disabled && 'cursor-not-allowed opacity-50',
          open ? 'border-primary/60' : 'border-white/[0.12]'
        )}
        {...aria}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {selected?.icon}
          <span className="truncate">
            {selected ? (
              <>
                <span className="text-foreground">{selected.label}</span>
                {selected.description && (
                  <span className="ml-2 text-[12.5px] text-muted-2">{selected.description}</span>
                )}
              </>
            ) : (
              <span className="text-muted-2">{placeholder}</span>
            )}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'h-4 w-4 shrink-0 text-muted-2 transition-transform duration-200',
            open && 'rotate-180 text-foreground'
          )}
        />
      </button>

      {open &&
        position &&
        createPortal(
          <AnimatePresence>
            <motion.div
              ref={panelRef}
              key="select-panel"
              initial={{ opacity: 0, y: -6, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: 'fixed',
                left: position.left,
                width: position.width,
                ...(position.up ? { bottom: position.bottom } : { top: position.top }),
                zIndex: 70,
              }}
              className="overflow-hidden rounded-lg border border-white/[0.12] bg-elevated shadow-pop"
            >
            {searchable && (
              <div className="flex items-center gap-2 border-b border-white/[0.08] px-3 py-2">
                <Search aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-muted-2" />
                <input
                  ref={searchRef}
                  type="text"
                  role="searchbox"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setActiveIndex(0)
                  }}
                  placeholder="Search languages"
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-2 focus:outline-none"
                />
              </div>
            )}

            <ul
              ref={listRef}
              id={`${id ?? 'select'}-listbox`}
              role="listbox"
              tabIndex={-1}
              aria-label={aria['aria-label']}
              className="max-h-64 overflow-y-auto p-1.5 focus:outline-none"
            >
              {filtered.length === 0 && (
                <li className="px-3 py-6 text-center text-[13px] text-muted-2">No matches found</li>
              )}
              {filtered.map((option, index) => {
                const isSelected = option.value === value
                const isActive = index === activeIndex
                return (
                  <li
                    key={option.value}
                    id={`${id ?? 'select'}-option-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled}
                    onMouseEnter={() => !option.disabled && setActiveIndex(index)}
                    onClick={() => commit(option)}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                      isActive && !option.disabled && 'bg-white/[0.07]',
                      option.disabled && 'cursor-not-allowed opacity-40'
                    )}
                  >
                    {option.icon}
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium text-foreground">{option.label}</span>
                      {option.description && (
                        <span className="truncate text-[12px] text-muted-2">{option.description}</span>
                      )}
                    </span>
                    {isSelected && (
                      <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-primary-bright" />
                    )}
                  </li>
                )
              })}
            </ul>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </div>
  )
}
