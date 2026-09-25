import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  Plus,
  RefreshCw,
  Rocket,
  Terminal,
  Play,
  Pause,
  Search,
  X,
  Cloud,
  Container,
  BarChart3,
  Layers,
  Network,
  Clock,
  Activity,
  Boxes,
  ChevronDown,
  Database,
  FileText,
  LayoutDashboard,
  Settings2,
  Sliders,
  Workflow,
  Lamp,
  Zap,
  Monitor,
  HardDrive
} from 'lucide-react'
import { MetricsGrid } from '../components/MetricsGrid'
import { ApplicationCard } from '../components/ApplicationCard'
import { AddApplicationModal } from '../components/AddApplicationModal'
import { RefreshButton } from '../components/RefreshButton'
import './Dashboard.css'

interface SystemData {
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  boot_time: string
  platform: string
  hostname: string
  processor?: string
  memory_total_gb?: number
  memory_used_gb?: number
  memory_free_gb?: number
  disk_total_gb?: number
  disk_used_gb?: number
  disk_free_gb?: number
  cpu_cores_logical?: number
  cpu_cores_physical?: number
  cpu_freq_mhz?: number
  process_count?: number
  uptime_seconds?: number
  uptime_formatted?: string
  network_bytes_sent_mb?: number
  network_bytes_recv_mb?: number
  python_version?: string
}

interface DeploymentData {
  version: string
  git_commit: string
  deployed_at: string
  environment: string
  docker_status: string
  application?: string | null
  health_status?: string | null
  deployment_id?: string | null
  image?: string | null
  container_id?: string | null
  container_name?: string | null
}

interface HealthData {
  status: string
  environment: string
}

interface MetricsResponse {
  system: SystemData
  deployment: DeploymentData
  health: HealthData
}

interface ApplicationSummary {
  id: string
  name: string
  repository_url: string
  branch: string
  environment: string
  dockerfile_path: string
  terraform_path: string
  status: string
  created_at: string
  updated_at: string
}

interface RuntimeLog {
  timestamp: string
  deployment_id: string
  application: string
  stage: string
  level: string
  message: string
}

export const Dashboard = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [data, setData] = useState<MetricsResponse | null>(null)
  const [logs, setLogs] = useState<RuntimeLog[]>([])
  const [applications, setApplications] = useState<ApplicationSummary[]>([])
  const [selectedAppId, setSelectedAppId] = useState<string>('')
  const [isDeploying, setIsDeploying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
  const [deployingId, setDeployingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<'ALL' | 'INFO' | 'WARNING' | 'ERROR'>('ALL')
  const [showAddModal, setShowAddModal] = useState(false)
  const [isLive, setIsLive] = useState(true)

  // Fetch main metrics
  const fetchMetrics = useCallback(async (signal?: AbortSignal) => {
    try {
      const [metricsRes, appsRes, logsRes] = await Promise.all([
        fetch('/api/metrics', { signal }),
        fetch('/api/applications', { signal }),
        fetch('/api/logs?lines=100', { signal }),
      ])
      if (!metricsRes.ok) throw new Error(`Metrics request failed (${metricsRes.status})`)
      const metricsData: MetricsResponse = await metricsRes.json()
      setData(metricsData)

      if (appsRes.ok) {
        const appsData: ApplicationSummary[] = await appsRes.json()
        setApplications(appsData)
        if (appsData.length > 0 && !selectedAppId) {
          setSelectedAppId(appsData[0].id)
        }
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json()
        setLogs(logsData.logs || [])
      }

      setNotice(null)
      setIsLoading(false)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setNotice({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to reach the control plane.',
      })
      setIsLoading(false)
    }
  }, [])

  // Create new application
  const createApplication = async (applicationData: Omit<ApplicationSummary, 'id' | 'status' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const newApp = await response.json()
      setApplications(prev => [...prev, newApp])
      setError(null)
      return newApp
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create application.')
      throw err
    }
  }

  // Delete application
  const deleteApplication = async (id: string) => {
    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      setApplications(prev => prev.filter(app => app.id !== id))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete application.')
      throw err
    }
  }

  // Deploy application
  const deployApplication = async (id: string) => {
    setDeployingId(id)
    setError(null)
    try {
      const response = await fetch(`/api/applications/${id}/deploy`, { method: 'POST' })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.detail || `Deployment request failed (HTTP ${response.status})`)
      }
      if (!result.deployment_id) throw new Error('The backend did not return a deployment ID.')
      navigate(`/deployment?deployment_id=${encodeURIComponent(result.deployment_id)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start the Docker deployment.')
    } finally {
      setDeployingId(null)
    }
  }

  // Handle quick deploy
  const handleQuickDeploy = async (appId: string) => {
    setDeployingId(appId)
    try {
      const response = await fetch(`/api/applications/${appId}/deploy`, { method: 'POST' })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.detail || `Deployment failed (HTTP ${response.status})`)
      }
      if (result.deployment_id) {
        navigate(`/deployment?deployment_id=${encodeURIComponent(result.deployment_id)}`)
      }
    } catch (err) {
      setNotice({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Unable to start deployment.',
      })
    } finally {
      setDeployingId(null)
    }
  }

  // Trigger deploy from dashboard
  const handleTriggerDeploy = async () => {
    if (!selectedAppId) return
    setIsDeploying(true)
    setError(null)
    try {
      const response = await fetch(`/api/applications/${selectedAppId}/deploy`, { method: 'POST' })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.detail || `Deployment failed (HTTP ${response.status})`)
      }
      if (result.deployment_id) {
        navigate(`/deployment?deployment_id=${encodeURIComponent(result.deployment_id)}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start Docker deployment.')
    } finally {
      setIsDeploying(false)
    }
  }

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await fetchMetrics()
  }, [fetchMetrics])

  // Setup polling intervals
  useEffect(() => {
    const controller = new AbortController()
    void fetchMetrics(controller.signal)

    // Set up intervals for different data types
    const metricsInterval = window.setInterval(() => void fetchMetrics(controller.signal), 10_000)
    const logsInterval = window.setInterval(() => void fetchLogs(controller.signal), 5_000)

    return () => {
      controller.abort()
      window.clearInterval(metricsInterval)
      window.clearInterval(logsInterval)
    }
  }, [fetchMetrics, fetchLogs])

  // Helper function to get status class
  const getStatusClass = (status: string | undefined | null) => {
    if (!status) return 'status-unknown'
    const lowerStatus = status.toLowerCase()
    if (lowerStatus === 'healthy' || lowerStatus === 'success' || lowerStatus === 'available') return 'status-healthy'
    if (lowerStatus === 'error' || lowerStatus === 'failed' || lowerStatus === 'unavailable') return 'status-error'
    return 'status-warning'
  }

  // Calculate derived metrics
  const systemData = data?.system ?? null
  const deploymentData = data?.deployment ?? null
  const healthData = data?.health ?? null

  const errorLogsCount = logs.filter((l) => l.level === 'ERROR').length
  const successRate = logs.length > 0 ? (((logs.length - errorLogsCount) / logs.length) * 100).toFixed(1) : '100.0'

  const filteredLogs = logs
    .slice()
    .reverse()
    .filter((entry) => {
      const level = (entry.level || 'INFO').toUpperCase()
      if (selectedLevel !== 'ALL' && level !== selectedLevel) return false
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      const msg = (entry.message || '').toLowerCase()
      const app = (entry.application || '').toLowerCase()
      const stg = (entry.stage || '').toLowerCase()
      const dep = (entry.deployment_id || '').toLowerCase()
      return msg.includes(query) || app.includes(query) || stg.includes(query) || dep.includes(query)
    })

  const deploymentStatus = deploymentData?.health_status?.toLowerCase() ?? 'unknown'

  const NavLinkto = ({ children, className, onClick }: { children: React.ReactNode; className: string; onClick: () => void }) => {
    return (
      <span
        className={className}
        onClick={(e) => {
          e.preventDefault()
          onClick()
        }}
      >
        {children}
      </span>
    )
  }

  return (
    <div className="dashboard-shell">
      {/* App Bar */}
      <header className="app-bar">
        <div className="app-bar-left">
          <nav className="product-mark" onClick={() => navigate('/dashboard')}>
            <span>CD</span>
            <strong>CloudDeploy Pro</strong>
          </nav>
        </div>

        <div className="app-bar-actions">
          <span className={navigator.onLine ? 'online' : 'offline'}>
            <i />
            {navigator.onLine ? 'Control plane online' : 'Control plane offline'}
          </span>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={18} /> Add Application
          </button>
          <details className="workspace-menu">
            <summary>
              Workspace <ChevronDown size={15} />
            </summary>
            <nav>
              <NavLinkto className="" onClick={() => navigate('/dashboard')}>
                <LayoutDashboard size={15} /> Overview
              </NavLinkto>
              <NavLinkto className="" onClick={() => navigate('/applications')}>
                <Database size={15} /> Applications
              </NavLinkto>
              <NavLinkto className="" onClick={() => navigate('/deployments')}>
                <Workflow size={15} /> Deployments
              </NavLinkto>
              <NavLinkto className="" onClick={() => navigate('/infrastructure')}>
                <Boxes size={15} /> Infrastructure
              </NavLinkto>
              <NavLinkto className="" onClick={() => navigate('/analytics')}>
                <Activity size={15} /> Analytics
              </NavLinkto>
              <NavLinkto className="" onClick={() => navigate('/logs')}>
                <FileText size={15} /> Logs
              </NavLinkto>
              <NavLinkto className="" onClick={() => navigate('/environment')}>
                <Sliders size={15} /> Environment
              </NavLinkto>
              <NavLinkto className="" onClick={() => navigate('/settings')}>
                <Settings2 size={15} /> Settings
              </NavLinkto>
            </nav>
          </details>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content-full">
        {/* Notice Banner */}
        {notice && (
          <div
            className={`dashboard-notice ${notice.tone}`}
            role={notice.tone === 'error' ? 'alert' : 'status'}
          >
            {notice.tone === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{notice.message}</span>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          {/* System Overview */}
          <section className="dashboard-card">
            <div className="card-header">
              <h3>System Overview</h3>
              <button className="btn-link" onClick={refreshAll}>
                <RefreshCw size={14} />
              </button>
            </div>
            <div className="card-content">
              {isLoading ? (
                <div className="placeholder">Loading system metrics...</div>
              ) : !systemData ? (
                <div className="placeholder">No system data available</div>
              ) : (
                <>
                  <div className="metric-row">
                    <span className="metric-label">CPU Usage</span>
                    <span className="metric-value">
                      {systemData.cpu_usage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Memory Usage</span>
                    <span className="metric-value">
                      {systemData.memory_usage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Disk Usage</span>
                    <span className="metric-value">
                      {systemData.disk_usage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Uptime</span>
                    <span className="metric-value">
                      {systemData.uptime_formatted || 'N/A'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Application Status */}
          <section className="dashboard-card">
            <div className="card-header">
              <h3>Applications</h3>
            </div>
            <div className="card-content">
              {isLoading ? (
                <div className="placeholder">Loading applications...</div>
              ) : applications.length === 0 ? (
                <div className="empty-state">
                  <h3>No applications configured</h3>
                  <p>Connect your first repository to begin managing deployments.</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowAddModal(true)}
                  >
                    <Plus size={16} /> Add Application
                  </button>
                </div>
              ) : (
                <>
                  <div className="metric-row">
                    <span className="metric-label">Total Applications</span>
                    <span className="metric-value">{applications.length}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Currently Deploying</span>
                    <span className="metric-value">
                      {isDeploying ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Last Deployment</span>
                    <span className="metric-value">
                      {data?.deployment?.deployed_at || 'None'}
                    </span>
                  </div>
                  <div className="applications-preview">
                    {applications.slice(0, 3).map(app => (
                      <div key={app.id} className="app-preview-item">
                        <div className="app-preview-info">
                          <strong>{app.name}</strong>
                          <span className="app-preview-meta">
                            {app.branch} • {app.environment}
                          </span>
                        </div>
                        <div className="app-preview-status">
                          <span className={`status-dot ${getStatusClass(app.status)}`} />
                        </div>
                      </div>
                    ))}
                    {applications.length > 3 && (
                      <div className="app-preview-more">
                        +{applications.length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Deployment Status */}
          <section className="dashboard-card">
            <div className="card-header">
              <h3>Deployment Status</h3>
            </div>
            <div className="card-content">
              {isLoading ? (
                <div className="placeholder">Loading deployment data...</div>
              ) : !deploymentData ? (
                <div className="placeholder">No deployment data available</div>
              ) : (
                <>
                  <div className="metric-row">
                    <span className="metric-label">Application</span>
                    <span className="metric-value">
                      {deploymentData.application || 'None'}
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Environment</span>
                    <span className="metric-value">
                      {deploymentData.environment}
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Docker Status</span>
                    <span className={`status-indicator ${getStatusClass(deploymentData.docker_status)}`}>
                      {deploymentData.docker_status}
                    </span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Health Status</span>
                    <span className={`status-indicator ${getStatusClass(deploymentData.health_status)}`}>
                      {deploymentData.health_status || 'N/A'}
                    </span>
                  </div>
                  <div className="deployment-actions">
                    <button
                      className="btn btn-outline"
                      onClick={handleTriggerDeploy}
                      disabled={isDeploying || !selectedAppId || applications.length === 0}
                    >
                      {isDeploying ? 'Deploying...' : 'Deploy Application'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Infrastructure Overview */}
          <section className="dashboard-card">
            <div className="card-header">
              <h3>Infrastructure</h3>
            </div>
            <div className="card-content">
              {/* Simplified infrastructure overview - would normally fetch from /infrastructure/inventory */}
              <div className="placeholder">
                <h3>Infrastructure Overview</h3>
                <p>View detailed infrastructure resources in the Infrastructure section.</p>
                <button
                  className="btn btn-link"
                  onClick={() => navigate('/infrastructure')}
                >
                  View Infrastructure Details <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="dashboard-card">
            <div className="card-header">
              <div>
                <h3>Recent Activity</h3>
                <button className="btn-link" onClick={() => navigate('/logs')}>
                  View All Logs <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
            <div className="card-content">
              {isLoading ? (
                <div className="placeholder">Loading activity...</div>
              ) : logs.length === 0 ? (
                <div className="placeholder">
                  <h3>No recent activity</h3>
                  <p>Deploy an application to see deployment and container activity here.</p>
                </div>
              ) : (
                <div className="activity-list">
                  {filteredLogs.slice(0, 5).map((entry, index) => (
                    <div key={`${entry.timestamp}-${index}`} className="activity-item">
                      <div className="activity-left">
                        <div className="activity-time">
                          {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : 'Recent'}
                        </div>
                        <div className="activity-icon">
                          {() => {
                            switch (entry.stage) {
                              case 'Docker Build': return <Activity size={14} />
                              case 'Container Start': return <Terminal size={14} />
                              case 'Health Check': return <Activity size={14} />
                              case 'System Init': return <Lamp size={14} />
                              default: return <Activity size={14} />
                            }
                          }}()
                        </div>
                      </div>
                      <div className="activity-content">
                        <div className="activity-message">
                          <strong>{entry.application || 'System'}</strong>
                          {entry.stage.replace(/_/g, ' ')}
                          {entry.level !== 'INFO' && (
                            <span className={`activity-level ${entry.level.toLowerCase()}`}>
                              {entry.level}
                            </span>
                          )}
                        </div>
                        <p className="activity-detail">{entry.message}</p>
                      </div>
                      <div className="activity-right">
                        <span className={`activity-status ${entry.level.toLowerCase()}`}>
                          {entry.level}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Add Application Modal */}
      <AddApplicationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreate={createApplication}
      />
    </div>
  )
}