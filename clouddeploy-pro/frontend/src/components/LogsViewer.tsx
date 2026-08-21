import '../styles/design-system.css'

interface LogsViewerProps {
  logs: Array<{ timestamp: string; level: string; message: string }>
}

export const LogsViewer = ({ logs }: LogsViewerProps) => {
  if (logs.length === 0) {
    return <div className="placeholder">No logs available</div>
  }

  return (
    <div className="logs-viewer">
      {logs.map((log, index) => (
        <div key={index} className={`log-entry log-${log.level.toLowerCase()}`}>
          <div className="log-timestamp">{new Date(log.timestamp).toLocaleTimeString()}</div>
          <div className="log-level">{log.level}</div>
          <div className="log-message">{log.message}</div>
        </div>
      ))}
    </div>
  )
}