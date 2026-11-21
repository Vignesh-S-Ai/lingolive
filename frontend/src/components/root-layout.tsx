import * as React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Navbar } from './navbar'
import { Footer } from './footer'
import { ScrollManager, RouteFallback } from './layout'
import { ErrorBoundary } from './error-boundary'
import { useSettingsStore } from '../store/settingsStore'

export function RootLayout() {
  const { pathname } = useLocation()
  const isRoom = pathname.startsWith('/room/')
  const theme = useSettingsStore((s) => s.theme)

  React.useEffect(() => {
    document.documentElement.classList.toggle('room-route', isRoom)
  }, [isRoom])

  React.useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  return (
    <div className="relative flex min-h-dvh flex-col">
      <ScrollManager />
      {!isRoom && <Navbar />}

      <main id="main" className="flex-1">
        <React.Suspense fallback={<RouteFallback />}>
          <ErrorBoundary resetKey={pathname}>
            <Outlet />
          </ErrorBoundary>
        </React.Suspense>
      </main>

      {!isRoom && <Footer />}

      <Toaster
        position="bottom-right"
        offset={16}
        toastOptions={{
          style: theme === 'light'
            ? {
                background: 'rgb(255 255 255 / 0.96)',
                backdropFilter: 'blur(14px)',
                border: '1px solid rgb(15 23 42 / 0.12)',
                color: 'rgb(10 13 22)',
                borderRadius: '12px',
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: '13.5px',
                boxShadow: '0 24px 60px -24px rgb(15 23 42 / 0.35)',
              }
            : {
                background: 'rgb(18 26 43 / 0.95)',
                backdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgb(245 247 255)',
                borderRadius: '12px',
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: '13.5px',
                boxShadow: '0 24px 60px -24px rgba(0,0,0,0.85)',
              },
        }}
      />
    </div>
  )
}
