import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/design-system.css'
// Keep components.css for now to avoid breaking changes, but we will override
import './components.css'

console.log('Frontend JavaScript is loading...')

try {
  const rootElement = document.getElementById('root')
  console.log('Root element:', rootElement)

  if (!rootElement) {
    throw new Error('Could not find root element')
  }

  const root = ReactDOM.createRoot(rootElement)
  console.log('React root created')

  root.render(<App />)
  console.log('React app has been rendered')
} catch (error) {
  console.error('Error rendering React app:', error)
  // Show error on page as well
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : ''
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: monospace; color: red;">
      <h2>Error loading application</h2>
      <p>${message}</p>
      <pre>${stack}</pre>
    </div>
  `
}