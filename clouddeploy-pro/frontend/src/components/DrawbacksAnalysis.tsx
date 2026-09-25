import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldAlert,
} from 'lucide-react'
import './DrawbacksAnalysis.css'

interface DrawbackItem {
  id: string
  title: string
  category: string
  severity: 'critical' | 'warning' | 'moderate'
  drawback: string
  impact: string
  missing_data: string
  mitigation: string
}

interface DrawbacksResponse {
  summary: {
    total_drawbacks: number
    critical_count: number
    warning_count: number
    moderate_count: number
    system_resilience_score: string
    last_audited: string
  }
  drawbacks: DrawbackItem[]
}

export const DrawbacksAnalysis = () => {
  const [data, setData] = useState<DrawbacksResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'moderate'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchDrawbacks = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    try {
      const response = await fetch('/api/drawbacks', { signal })
      if (!response.ok) throw new Error(`Drawbacks service returned HTTP ${response.status}.`)
      const payload: DrawbacksResponse = await response.json()
      setData(payload)
      setError(null)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Unable to load architectural drawbacks.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void fetchDrawbacks(controller.signal)
    return () => controller.abort()
  }, [fetchDrawbacks])

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const filteredDrawbacks = (data?.drawbacks || []).filter((item) =>
    filter === 'all' ? true : item.severity === filter
  )

  return (
    <div className="control-panel drawbacks-panel">
      <div className="component-heading">
        <div>
          <p className="eyebrow eyebrow-danger">Architectural Audit</p>
          <h2 className="topic-title">Operational Limitations & Trade-offs</h2>
          <p className="topic-description">
            Transparent analysis of single points of failure, persistence gaps, and recommended production mitigations.
          </p>
        </div>
        <div className="resilience-badge-wrapper">
          <span className="resilience-label">Resilience Score</span>
          <span className="resilience-score">
            {data?.summary.system_resilience_score || '78/100'}
          </span>
        </div>
      </div>

      {error && (
        <div className="drawbacks-unavailable error-state" role="alert">
          <AlertCircle size={18} />
          <p>{error}</p>
        </div>
      )}

      {loading && !data && !error && (
        <p className="empty-state">Loading architectural risk audit…</p>
      )}

      {data && (
        <>
          <div className="drawbacks-summary-bar">
            <button
              className={`summary-pill total ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              <Info size={16} />
              <span className="pill-count">{data.summary.total_drawbacks}</span>
              <span className="pill-label">Total Audited</span>
            </button>
            <button
              className={`summary-pill critical ${filter === 'critical' ? 'active' : ''}`}
              onClick={() => setFilter('critical')}
            >
              <ShieldAlert size={16} />
              <span className="pill-count">{data.summary.critical_count}</span>
              <span className="pill-label">Critical SPOF</span>
            </button>
            <button
              className={`summary-pill warning ${filter === 'warning' ? 'active' : ''}`}
              onClick={() => setFilter('warning')}
            >
              <AlertTriangle size={16} />
              <span className="pill-count">{data.summary.warning_count}</span>
              <span className="pill-label">Warnings</span>
            </button>
            <button
              className={`summary-pill moderate ${filter === 'moderate' ? 'active' : ''}`}
              onClick={() => setFilter('moderate')}
            >
              <CheckCircle size={16} />
              <span className="pill-count">{data.summary.moderate_count}</span>
              <span className="pill-label">Moderate</span>
            </button>
          </div>

          <div className="drawback-cards-list">
            {filteredDrawbacks.map((item) => {
              const isExpanded = expandedId === item.id
              return (
                <article className={`drawback-card ${item.severity}`} key={item.id}>
                  <header className="drawback-card-header" onClick={() => toggleExpand(item.id)}>
                    <div className="drawback-header-left">
                      <span className={`drawback-severity-badge ${item.severity}`}>
                        {item.severity}
                      </span>
                      <code className="drawback-id">{item.id}</code>
                      <strong className="drawback-title">{item.title}</strong>
                    </div>
                    <div className="drawback-header-right">
                      <span className="drawback-category">{item.category}</span>
                      <button
                        className="toggle-button"
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                        type="button"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </header>

                  <div className="drawback-body">
                    <p className="drawback-detail-text">
                      <strong>Finding:</strong> {item.drawback}
                    </p>
                    <p className="drawback-impact-text">
                      <strong>Impact:</strong> {item.impact}
                    </p>

                    {isExpanded && (
                      <div className="drawback-expanded-content">
                        <div className="drawback-missing-data">
                          <span className="expand-label">Telemetry Blindspot</span>
                          <p>{item.missing_data}</p>
                        </div>
                        <div className="drawback-mitigation">
                          <span className="expand-label">Production Mitigation</span>
                          <p>{item.mitigation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default DrawbacksAnalysis
