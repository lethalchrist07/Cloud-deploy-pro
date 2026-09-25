import { ExternalLink, Settings2 } from 'lucide-react'
import { APISandbox } from '../components/APISandbox'
import { Card } from '../components/Card'

export const Settings = () => {
  return (
    <div className="page-container settings-page">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div className="page-title">
          <div className="page-icon">
            <Settings2 size={22} />
          </div>
          <h2>Platform Settings & Developer Sandbox</h2>
        </div>
        <p className="page-description">
          FastAPI control plane parameters, OpenAPI schema endpoints, and live interactive API inspector.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* 1. API Configuration */}
        <Card title="Control Plane & API Configuration">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                FastAPI Gateway Proxy
              </span>
              <div style={{ marginTop: '0.25rem' }}>
                <code style={{ fontSize: '0.9rem', color: 'var(--accent-mint)' }}>http://localhost:8000 (Proxy: /api)</code>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                Interactive Swagger UI
              </span>
              <div style={{ marginTop: '0.25rem' }}>
                <a
                  href="/api/docs"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--accent-mint)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}
                >
                  <code>/api/docs</code>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                ReDoc Documentation
              </span>
              <div style={{ marginTop: '0.25rem' }}>
                <a
                  href="/api/redoc"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--accent-mint)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}
                >
                  <code>/api/redoc</code>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                OpenAPI Specification
              </span>
              <div style={{ marginTop: '0.25rem' }}>
                <a
                  href="/api/openapi.json"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--accent-mint)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}
                >
                  <code>/api/openapi.json</code>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </div>
        </Card>

        {/* 2. Interactive API Sandbox */}
        <APISandbox />
      </div>
    </div>
  )
}

export default Settings
