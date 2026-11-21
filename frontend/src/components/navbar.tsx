import * as React from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Menu, X } from 'lucide-react'
import { LogoMark } from './logo'
import { LinkButton } from './ui/link-button'
import { useScrollY } from '../hooks'
import { cn } from '../lib/utils'

const navItems = [
  { label: 'Features', hash: '#features' },
  { label: 'How it works', hash: '#how-it-works' },
  { label: 'Languages', hash: '#languages' },
] as const

export function Navbar() {
  const scrolled = useScrollY() > 12
  const location = useLocation()
  const [menuOpen, setMenuOpen] = React.useState(false)

  React.useEffect(() => setMenuOpen(false), [location.pathname, location.hash])

  React.useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <div
        className={cn(
          'pointer-events-auto mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 rounded-xl border px-3.5 transition-all duration-300 ease-out sm:px-4',
          scrolled
            ? 'border-white/[0.1] bg-elevated/85 shadow-pop backdrop-blur-xl'
            : 'border-transparent bg-transparent'
        )}
      >
        <Link to="/" className="flex items-center gap-2.5 rounded-md" aria-label="LingoLive home">
          <LogoMark size="sm" />
          <span className="font-display text-[16px] font-extrabold tracking-[-0.03em]">
            Vign<span className="text-primary-bright">Trans</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.hash}
              to={{ pathname: '/', hash: item.hash }}
              className="rounded-md px-3 py-2 text-[13.5px] font-medium text-muted transition-colors duration-200 hover:bg-white/[0.05] hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <NavLink
            to="/history"
            className={({ isActive }) =>
              cn(
                'hidden rounded-md px-3 py-2 text-[13.5px] font-medium transition-colors duration-200 sm:block',
                isActive
                  ? 'text-foreground'
                  : 'text-muted hover:bg-white/[0.05] hover:text-foreground'
              )
            }
          >
            History
          </NavLink>

          <LinkButton
            to="/create-conversation"
            size="sm"
            className="hidden sm:inline-flex"
          >
            Start a conversation
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </LinkButton>

          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-white/[0.12] bg-surface text-foreground transition-colors hover:bg-white/[0.06] lg:hidden"
          >
            {menuOpen ? (
              <X className="h-[18px] w-[18px]" aria-hidden="true" />
            ) : (
              <Menu className="h-[18px] w-[18px]" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto mx-auto mt-2 max-w-6xl overflow-hidden rounded-xl border border-white/[0.1] bg-elevated/95 shadow-pop backdrop-blur-xl lg:hidden"
          >
            <nav aria-label="Mobile" className="flex flex-col p-2">
              {navItems.map((item) => (
                <Link
                  key={item.hash}
                  to={{ pathname: '/', hash: item.hash }}
                  className="rounded-md px-3.5 py-3 text-[14.5px] font-medium text-muted transition-colors hover:bg-white/[0.06] hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/history"
                className="rounded-md px-3.5 py-3 text-[14.5px] font-medium text-muted transition-colors hover:bg-white/[0.06] hover:text-foreground"
              >
                Conversation history
              </Link>
              <div className="mt-2 border-t border-white/[0.08] pt-3">
                <LinkButton to="/create-conversation" className="w-full">
                  Start a conversation
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </LinkButton>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
