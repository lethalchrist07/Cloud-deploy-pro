import { APISandbox } from '../components/APISandbox'
import { Card } from '../components/Card'

export const Settings = () => {
  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h2>Platform Settings & OpenAPI Documentation</h2>
        <p style={{ color: 'var(--text-muted)' }}>Configure API integrations and test live endpoints</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <APISandbox />

        <Card title="Backend API Configuration">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <strong>FastAPI Base URL:</strong> <code>http://localhost:8000</code>
            </div>
            <div>
              <strong>Interactive Swagger Docs:</strong>{' '}
              <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)' }}>
                http://localhost:8000/docs
              </a>
            </div>
            <div>
              <strong>OpenAPI JSON Schema:</strong>{' '}
              <a href="http://localhost:8000/openapi.json" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)' }}>
                http://localhost:8000/openapi.json
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Settings
