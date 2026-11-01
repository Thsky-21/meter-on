import { lazy, Suspense } from 'react'
import { RidePage } from './pages/RidePage'

const TranscriptPage = lazy(() => import('./pages/TranscriptPage'))
const LabPage = lazy(() => import('./pages/LabPage'))

/** Tiny pathname router: /, /lab, /transcript */
export function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  if (path === '/transcript') return <Suspense fallback={null}><TranscriptPage /></Suspense>
  if (path === '/lab') return <Suspense fallback={null}><LabPage /></Suspense>
  return <RidePage />
}
