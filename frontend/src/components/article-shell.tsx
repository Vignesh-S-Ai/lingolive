import * as React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '../lib/utils'

export interface ArticleShellProps {
  eyebrow: string
  title: string
  lede: string
  updated?: string
  children: React.ReactNode
}

/** Prose layout used by /docs and /privacy. */
export function ArticleShell({ eyebrow, title, lede, updated, children }: ArticleShellProps) {
  return (
    <div className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-280px] h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-primary/14 blur-[150px]" />
        <div className="absolute inset-0 bg-grid opacity-30" />
      </div>

      <div className="mx-auto w-full max-w-3xl px-5 pb-24 pt-8 sm:px-8 sm:pt-12">
        <Link
          to="/"
          className="group inline-flex items-center gap-1.5 rounded-md text-[13px] font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft
            aria-hidden="true"
            className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5"
          />
          Home
        </Link>

        <header className="mt-9 border-b border-white/[0.09] pb-8">
          <p className="font-mono text-[11.5px] font-semibold uppercase tracking-[0.16em] text-primary-bright">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-display text-[clamp(1.75rem,4.5vw,2.5rem)] font-extrabold leading-[1.12] tracking-[-0.03em]">
            {title}
          </h1>
          <p className="mt-4 text-[15.5px] leading-relaxed text-muted">{lede}</p>
          {updated && (
            <p className="mt-4 font-mono text-[11.5px] text-muted-2">Last updated · {updated}</p>
          )}
        </header>

        <div className="mt-10 space-y-12">{children}</div>
      </div>
    </div>
  )
}

export function ArticleSection({
  id,
  title,
  children,
}: {
  id?: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-display text-[20px] font-bold tracking-tight text-foreground">{title}</h2>
      <div className="mt-4 space-y-3.5 text-[14.5px] leading-relaxed text-muted">{children}</div>
    </section>
  )
}

export function ArticleList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span
            aria-hidden="true"
            className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary-bright/70"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded border border-white/[0.1] bg-white/[0.05] px-1.5 py-0.5 font-mono text-[12.5px] text-primary-bright">
      {children}
    </code>
  )
}

export function ArticleNote({
  children,
  tone = 'info',
  className,
}: {
  children: React.ReactNode
  tone?: 'info' | 'warning'
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-lg border px-4 py-3.5 text-[13.5px] leading-relaxed',
        tone === 'info'
          ? 'border-primary/30 bg-primary/[0.07] text-foreground/85'
          : 'border-warning/30 bg-warning/[0.07] text-foreground/85',
        className
      )}
    >
      {children}
    </div>
  )
}
