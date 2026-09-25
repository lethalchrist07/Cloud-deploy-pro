import { useCallback } from 'react'
import { AlertCircle, Pause, Play, RefreshCw, Search, Terminal, X } from 'lucide-react'
import './Logs.css'

interface RuntimeLog {
  timestamp: string
  deployment_id: string
  application: string
  stage: string
  level: string
  message: string
}

interface LogsProps {
  logs: RuntimeLog[]
  error: string | null
  isLoading: boolean
  fetchLogs: () => Promise<void>
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedLevel: 'ALL' | 'INFO' | 'WARNING' | 'ERROR'
  setSelectedLevel: (level: 'ALL' | 'INFO' | 'WARNING' | 'ERROR') => void
  isLive: boolean
  setIsLive: (live: boolean) => void
}

export const Logs = ({
  logs,
  error,
  isLoading,
  fetchLogs,
  searchQuery,
  setSearchQuery,
  selectedLevel,
  setSelectedLevel,
  isLive,
  setIsLive
}: LogsProps) => {
  const handleRefresh = useCallback(async () => {
    await fetchLogs()
  }, [fetchLogs])

  const handleToggleLive = useCallback(() => {
    setIsLive(!isLive)
  }, [isLive, setIsLive])

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

  return (
    <div className="page-container logs-page">
      <div className="page-header">
        <div className="page-title">
          <div className="page-icon">
            <Terminal size={22} />
          </div>
          <h2>System & Deployment Logs</h2>
        </div>
        <p className="page-description">
          Real-time event stream for local Docker builds, container initialization, and health check probes.
        </p>
      </div>

      {error && (
        <div className="error-alert" role="alert">
          <AlertCircle size={17} />
          {error}
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="logs-controls-bar">
        <div className="logs-search-box">
          <Search size={15} />
          <input
            type="text"
            className="logs-search-input"
            placeholder="Search by keyword, app, stage, or deployment ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="logs-filter-group">
          {(['ALL', 'INFO', 'WARNING', 'ERROR'] as const).map((level) => (
            <button
              key={level}
              className={`filter-pill ${selectedLevel === level ? 'active' : ''} ${level.toLowerCase()}`}
              onClick={() => setSelectedLevel(level)}
            >
              {level}
            </button>
          ))}
        </div>

        <div className="logs-actions">
          <button
            className={`filter-pill ${isLive ? 'active' : ''}`}
            onClick={handleToggleLive}
            title={isLive ? 'Pause live stream polling' : 'Resume live stream polling'}
          >
            {isLive ? <Pause size={12} /> : <Play size={12} />}
            <span>{isLive ? 'Live Streaming' : 'Paused'}</span>
          </button>

          <button
            className="filter-pill"
            onClick={handleRefresh}
            disabled={isLoading}
            title="Refresh logs immediately"
          >
            <RefreshCw size={12} className={isLoading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <section className="section">
        <div className="section-header">
          <h3>Event Stream</h3>
          <span className="status-badge">
            Showing {filteredLogs.length} of {logs.length} recorded event{logs.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="section-content">
          {logs.length === 0 && !error ? (
            <div className="logs-unavailable" role="status">
              <Terminal size={18} />
              <p>No Docker deployment events have been recorded yet. Deploy an application to stream logs.</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="logs-unavailable" role="status">
              <Terminal size={18} />
              <p>No log events match the current filter or search query.</p>
            </div>
          ) : (
            <div className="runtime-log-list" aria-live="polite">
              {filteredLogs.map((entry, index) => (
                <article className="runtime-log-entry" key={`${entry.timestamp}-${index}`}>
                  <time dateTime={entry.timestamp}>{entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : 'Recent'}</time>
                  <span className={`runtime-log-level ${(entry.level || 'info').toLowerCase()}`}>{entry.level || 'INFO'}</span>
                  <span className="runtime-log-app">{entry.application || 'System'}</span>
                  <span className="runtime-log-stage">{entry.stage || 'General'}</span>
                  <code className="runtime-log-deployment">{(entry.deployment_id || 'system').slice(0, 12)}</code>
                  <p>{entry.message || ''}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Logs