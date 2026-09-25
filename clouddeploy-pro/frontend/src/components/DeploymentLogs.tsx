interface DeploymentLog {
  timestamp: string
  deployment_id: string
  application: string
  stage: string
  level: 'INFO' | 'WARNING' | 'ERROR' | string
  message: string
}

interface DeploymentLogsProps {
  logs: DeploymentLog[]
}

export const DeploymentLogs = ({ logs }: DeploymentLogsProps) => {
  if (logs.length === 0) {
    return <p className="deployment-log-empty">Docker output will appear here when the deployment starts.</p>
  }

  return (
    <div className="deployment-log-list" aria-live="polite">
      {logs.map((entry, index) => (
        <div className="deployment-log-entry" key={`${entry.timestamp}-${index}`}>
          <time dateTime={entry.timestamp}>{new Date(entry.timestamp).toLocaleTimeString()}</time>
          <span className={`deployment-log-level ${entry.level.toLowerCase()}`}>{entry.level}</span>
          <span className="deployment-log-stage">{entry.stage}</span>
          <span className="deployment-log-message">{entry.message}</span>
        </div>
      ))}
    </div>
  )
}
