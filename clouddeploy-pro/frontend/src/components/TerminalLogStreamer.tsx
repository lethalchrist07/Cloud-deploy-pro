import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Terminal } from 'lucide-react'
import './TerminalLogStreamer.css'

interface RuntimeLog {
  timestamp: string
  deployment_id: string
  application: string
  stage: string
  level: string
  message: string
}

export const TerminalLogStreamer = () => {
  const [logs, setLogs] = useState<RuntimeLog[]>([])
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch('/api/logs?lines=10', { signal })
      if (!response.ok) throw new Error(`Log service returned HTTP ${response.status}.`)
      const result = await response.json()
      setLogs(result.logs || [])
      setError(null)
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return
      setError(requestError instanceof Error ? requestError.message : 'Deployment logs are unavailable.')
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void refresh(controller.signal)
    const interval = window.setInterval(() => void refresh(controller.signal), 3000)
    return () => {
      controller.abort()
      window.clearInterval(interval)
    }
  }, [refresh])

  return (
    <div className="terminal-log-streamer">
      <div className="terminal-streamer-header">
        <div className="terminal-header-left">
          <div className="terminal-dots">
            <span className="terminal-dot red" />
            <span className="terminal-dot yellow" />
            <span className="terminal-dot green" />
          </div>
          <span className="terminal-title">
            <Terminal size={13} />
            clouddeploy-daemon :: docker-events.log
          </span>
        </div>
        <div className="terminal-header-right">
          <span className="terminal-live-pill">
            <span className="terminal-live-dot" />
            Live Stream
          </span>
        </div>
      </div>

      <div className="terminal-body" aria-live="polite">
        {error ? (
          <div className="terminal-empty" style={{ color: '#f87171' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="terminal-empty">
            <Terminal size={16} />
            <span>
              <span className="terminal-prompt-prefix">$</span>
              Listening on daemon stream. No Docker events recorded yet.
            </span>
          </div>
        ) : (
          logs.slice().reverse().map((entry, index) => (
            <div className="terminal-log-row" key={`${entry.timestamp}-${index}`}>
              <span className="terminal-timestamp">
                {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : '--:--:--'}
              </span>
              <span className={`terminal-level ${(entry.level || 'info').toLowerCase()}`}>
                {entry.level || 'INFO'}
              </span>
              <span
                className="terminal-context"
                title={`${entry.application || 'CloudDeploy'} / ${entry.stage || 'System'}`}
              >
                [{entry.application || 'CloudDeploy'}:{entry.stage || 'core'}]
              </span>
              <span className="terminal-message">
                {entry.message || ''}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
