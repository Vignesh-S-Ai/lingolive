import { lazy } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { RootLayout } from './components/root-layout'
import { NotFound, RouteErrorFallback } from './components/layout'

/* Route-level code splitting — one chunk per page. */
const LandingPage = lazy(() => import('./pages/LandingPage'))
const CreateConversation = lazy(() => import('./pages/CreateConversation'))
const JoinConversation = lazy(() => import('./pages/JoinConversation'))
const LiveConversationRoom = lazy(() => import('./pages/LiveConversationRoom'))
const Settings = lazy(() => import('./pages/Settings'))
const ConversationHistory = lazy(() => import('./pages/ConversationHistory'))
const Documentation = lazy(() => import('./pages/Documentation'))
const Privacy = lazy(() => import('./pages/Privacy'))

const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteErrorFallback />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/create-conversation', element: <CreateConversation /> },
      { path: '/join-conversation', element: <JoinConversation /> },
      { path: '/room/:roomId', element: <LiveConversationRoom /> },
      { path: '/settings', element: <Settings /> },
      { path: '/history', element: <ConversationHistory /> },
      { path: '/docs', element: <Documentation /> },
      { path: '/privacy', element: <Privacy /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]

const router = createBrowserRouter(routes)

export default router
