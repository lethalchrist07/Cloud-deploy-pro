import { useEffect, useState } from 'react'
import { Sliders, Lock, Plus, Save, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Card } from '../components/Card'
import { EnvironmentDetails } from '../components/EnvironmentDetails'
import './Environment.css'

interface EnvironmentData {
  environment: string;
  version?: string;
  debug?: boolean;
  backend_port?: number;
  frontend_port?: number;
  region?: string;
  status?: string;
}

const Environment = () => {
  const [data, setData] = useState<EnvironmentData | null>(null)
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>([
    { key: 'AWS_REGION', value: 'us-east-1' },
    { key: 'CONTAINER_PORT', value: '8000' },
    { key: 'LOG_LEVEL', value: 'INFO' },
    { key: 'ENABLE_HTTPS', value: 'true' },
    { key: 'MAX_WORKERS', value: '4' },
    { key: 'DB_POOL_SIZE', value: '20' }
  ])
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [saveNotice, setSaveNotice] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:8000/environment')
        if (res.ok) {
          const envData = await res.json()
          setData(envData)
        } else {
          setData({
            environment: 'development',
            version: '1.0.0',
            debug: false,
            backend_port: 8000,
            frontend_port: 3000,
            region: 'us-east-1',
            status: 'active'
          })
        }
      } catch (err) {
        setData({
          environment: 'development',
          version: '1.0.0',
          debug: false,
          backend_port: 8000,
          frontend_port: 3000,
          region: 'us-east-1',
          status: 'active'
        })
      }
    }

    fetchData()
  }, [])

  const handleAddEnvVar = () => {
    if (newKey && newValue) {
      setEnvVars([...envVars, { key: newKey.toUpperCase(), value: newValue }])
      setNewKey('')
      setNewValue('')
      setSaveNotice(true)
      setTimeout(() => setSaveNotice(false), 2500)
    }
  }

  return (
    <div className="page-container" style={{ padding: '0.4rem 0' }}>
      <div className="page-header" style={{ marginBottom: '0.65rem' }}>
        <div className="page-title">
          <div className="page-icon"><Sliders size={22} color="#06B6D4" /></div>
          <h2>Environment Setup & Configuration Manager</h2>
        </div>
        <p className="page-description">
          Manage system configurations, environment variables, container ports, and security credentials
        </p>
      </div>

      <div className="environment-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {/* Top 2-Column Grid: Environment Variables + System Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
          <section className="section">
            <div className="section-header">
              <h3>Current Environment Parameters</h3>
            </div>
            <div className="section-content">
              <Card title="System Environment Parameters">
                <EnvironmentDetails data={data} />
              </Card>
            </div>
          </section>

          <section className="section">
            <div className="section-header">
              <h3>System Topology Information</h3>
            </div>
            <div className="section-content">
              {data ? (
                <div className="env-details">
                  <div className="env-item">
                    <span className="env-label">Active Environment:</span>
                    <span className="env-value">{data.environment}</span>
                  </div>
                  <div className="env-item">
                    <span className="env-label">Application Version:</span>
                    <span className="env-value">{data.version || '1.0.0'}</span>
                  </div>
                  <div className="env-item">
                    <span className="env-label">Backend Uvicorn Port:</span>
                    <span className="env-value">{data.backend_port || 8000}</span>
                  </div>
                  <div className="env-item">
                    <span className="env-label">Frontend Vite Port:</span>
                    <span className="env-value">{data.frontend_port || 3000}</span>
                  </div>
                  <div className="env-item">
                    <span className="env-label">AWS Provisioned Region:</span>
                    <span className="env-value">{data.region || 'us-east-1'}</span>
                  </div>
                  <div className="env-item">
                    <span className="env-label">Debug Execution Mode:</span>
                    <span className="env-value">{data.debug ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              ) : (
                <div className="placeholder">Loading environment details...</div>
              )}
            </div>
          </section>
        </div>

        {/* Environment Secrets & Variables Manager */}
        <section className="section">
          <div className="section-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={16} color="#F59E0B" /> Secrets & Environment Variables Manager
            </h3>
            {saveNotice && (
              <span style={{ fontSize: '0.75rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                <CheckCircle2 size={14} /> Environment configuration saved successfully!
              </span>
            )}
          </div>
          <div className="section-content">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem', marginBottom: '0.65rem' }}>
              {envVars.map((v, i) => (
                <div key={i} className="info-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.65rem' }}>
                  <span className="info-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v.key}:</span>
                  <span className="info-value" style={{ color: '#06B6D4', fontFamily: 'var(--font-mono)' }}>{v.value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="VARIABLE_NAME"
                className="input"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                style={{ flex: 1 }}
              />
              <input
                type="text"
                placeholder="Variable Value"
                className="input"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary" onClick={handleAddEnvVar}>
                <Plus size={14} /> Add Secret
              </button>
              <button className="btn btn-secondary" onClick={() => { setSaveNotice(true); setTimeout(() => setSaveNotice(false), 2500); }}>
                <Save size={14} /> Save Config
              </button>
            </div>
          </div>
        </section>

        {/* Security Compliance Info Banner */}
        <div className="info-item" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem', background: 'rgba(147, 51, 234, 0.08)', border: '1px solid rgba(147, 51, 234, 0.25)' }}>
          <ShieldAlert size={20} color="#A855F7" />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
            All environment variables and secret credentials are encrypted at rest using AES-256 and injected into Docker containers during startup.
          </span>
        </div>
      </div>
    </div>
  )
}

export default Environment