import ReactDOM from 'react-dom/client'
import App from './App'

// In production on Render/Vercel, dynamically route /api requests to the deployed backend if configured
const apiBase = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
if (apiBase) {
  const originalFetch = window.fetch
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      input = `${apiBase}${input}`
    }
    return originalFetch(input, init)
  }
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Application root element was not found.')
}

ReactDOM.createRoot(rootElement).render(<App />)
