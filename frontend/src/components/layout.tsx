import * as React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import { Button } from './ui/button'
import { LogoMark } from './logo'
import { cn } from '../lib/utils'

/** Wraps routed content with a subtle page entrance transition. */
export function PageTransition({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Scroll position + hash target manager for anchor navigation across routes. */
export function ScrollManager() {
  const { pathname, hash } = useLocation()

  React.useEffect(() => {
    if (hash) {
      const id = hash.slice(1)
      // Wait one frame so lazily-rendered sections exist in the DOM.
      const raf = requestAnimationFrame(() => {
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          return
        }
        window.scrollTo({ top: 0 })
      })
      return () => cancelAnimationFrame(raf)
    }
    window.scrollTo({ top: 0, left: 0 })
  }, [pathname, hash])

  return null
}

interface ErrorFallbackProps {
  error?: Error
  resetErrorBoundary?: () => void
}

/** Route-level error UI used as react-router's `errorElement`. */
export function RouteErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-20 text-center">
      <LogoMark size="lg" />
      <p className="mt-6 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-danger">
        Something went wrong
      </p>
      <h1 className="mt-3 max-w-lg font-display text-3xl font-bold tracking-tight text-foreground">
        This page hit an unexpected error
      </h1>
      <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-muted">
        The rest of the application is unaffected. Try reloading, or head back to the home page.
      </p>
      {error?.message && (
        <p className="mt-5 max-w-lg overflow-x-auto rounded-md border border-white/[0.1] bg-surface px-4 py-3 text-left font-mono text-[11.5px] text-muted-2">
          {error.message}
        </p>
      )}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={() => {
            resetErrorBoundary?.()
            window.location.reload()
          }}
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Reload
        </Button>
        <Button variant="secondary" onClick={() => window.location.assign('/')}>
          <Home className="h-4 w-4" aria-hidden="true" />
          Back to home
        </Button>
      </div>
    </div>
  )
}

/** Client-side 404. */
export function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-24 text-center">
      <div className="flex items-center gap-3 text-warning">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        <span className="text-[11.5px] font-semibold uppercase tracking-[0.16em]">404</span>
      </div>
      <h1 className="mt-4 max-w-md font-display text-4xl font-bold tracking-tight text-foreground">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-4 max-w-sm text-[14.5px] leading-relaxed text-muted">
        The link may be out of date, or the page may have moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={() => window.location.assign('/')}>Go home</Button>
        <Button variant="secondary" onClick={() => window.history.back()}>
          Go back
        </Button>
      </div>
    </div>
  )
}

/** Suspense fallback shown while a lazy route chunk loads. */
export function RouteFallback() {
  return (
    <div className="min-h-dvh px-5 pt-28 sm:px-8">
      <div className="mx-auto max-w-6xl" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading page</span>
        <div className={cn('h-3 w-40 rounded-full bg-white/[0.07] skeleton-shimmer')} />
        <div className="mt-6 h-12 w-full max-w-2xl rounded-lg bg-white/[0.05] skeleton-shimmer" />
        <div className="mt-4 h-5 w-full max-w-xl rounded-md bg-white/[0.05] skeleton-shimmer" />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-56 rounded-xl border border-white/[0.06] bg-white/[0.03] skeleton-shimmer"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
