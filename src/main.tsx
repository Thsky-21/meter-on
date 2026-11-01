import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// dev/test hook (stripped from production builds)
if (import.meta.env.DEV) {
  void Promise.all([import('./engine/store'), import('./engine/clock')]).then(([store, clock]) => {
    Object.assign(window, { __ride: { store: store.useRide, ...clock } })
  })
}
