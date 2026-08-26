import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './index.css'

const APP_VERSION = '5'

async function ensureFreshShell() {
  const key = 'local-browser-ai-version'
  const prev = localStorage.getItem(key)
  if (prev === APP_VERSION) return

  localStorage.setItem(key, APP_VERSION)
  if (prev && 'caches' in window) {
    const keys = await caches.keys()
    await Promise.all(keys.map((k) => caches.delete(k)))
    location.reload()
  }
}

void ensureFreshShell()

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
