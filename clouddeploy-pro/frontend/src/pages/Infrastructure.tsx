import { useCallback } from 'react'
import { AlertCircle, Cloud, Container, RefreshCw } from 'lucide-react'
import { AWSInfrastructureGrid } from '../components/AWSInfrastructureGrid'
import { DrawbacksAnalysis } from '../components/DrawbacksAnalysis'
import './Infrastructure.css'

interface RuntimeDeploymentState {
  version: string
  git_commit: string
  deployed_at: string
  environment: string
  docker_status: string
  application?: string | null
  deployment_id?: string | null
  image?: string | null
  container_id?: string | null
  container_name?: string | null
  health_status?: string | null
}

interface InfrastructureProps {
  data: RuntimeDeploymentState | null
  error: string | null
  isLoading: boolean
  fetchInfrastructure: () => Promise<void>
}

export const Infrastructure = ({ data, error, isLoading, fetchInfrastructure }: InfrastructureProps) => {
  const handleRefresh = useCallback(async () => {
    await fetchInfrastructure()
  }, [fetchInfrastructure])

  return (
    <div className="page-container infrastructure-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="page-title">
            <div className="page-icon">
              <Cloud size={24} />
            </div>
            <h2>Infrastructure & Cloud Architecture</h2>
          </div>
          <p className="page-description">
            Terraform AWS module resources, local Docker container execution state, and architectural resilience analysis.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="error-alert" role="alert">
          <AlertCircle size={17} />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Local Container Runtime Environment */}
      <section className="section infra-container-section">
        <div className="section-header">
          <div className="header-with-badge">
            <Container size={18} />
            <h3>Local Docker & Container Runtime</h3>
          </div>
          <span className={`status-badge status-${data?.docker_status === 'available' ? 'healthy' : 'warning'}`}>
            Docker Daemon: {data?.docker_status || 'Checking…'}
          </span>
        </div>
        <div className="section-content">
          <div className="container-state-grid">
            <div className="container-meta-card">
              <span className="card-kicker">Container ID</span>
              <code className="container-val">{data?.container_id || 'No active container'}</code>
              <small className="card-sub">{data?.container_name || 'Standby'}</small>
            </div>
            <div className="container-meta-card">
              <span className="card-kicker">Deployed Image</span>
              <code className="container-val">{data?.image || 'Pending build'}</code>
              <small className="card-sub">Tag: {data?.version || 'N/A'}</small>
            </div>
            <div className="container-meta-card">
              <span className="card-kicker">Container Health</span>
              <strong className={`container-health-val ${(data?.health_status || '').toLowerCase()}`}>
                {data?.health_status || 'STANDBY'}
              </strong>
              <small className="card-sub">Verified via HTTP /health probe</small>
            </div>
            <div className="container-meta-card">
              <span className="card-kicker">Active Application</span>
              <strong className="container-val">{data?.application || 'None deployed'}</strong>
              <small className="card-sub">Environment: {data?.environment || 'development'}</small>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Terraform AWS Cloud Resources */}
      <section className="section">
        <div className="section-content">
          <AWSInfrastructureGrid />
        </div>
      </section>

      {/* 3. Architectural Limitations & Trade-offs */}
      <section className="section">
        <div className="section-content">
          <DrawbacksAnalysis />
        </div>
      </section>
    </div>
  )
}

export default Infrastructure