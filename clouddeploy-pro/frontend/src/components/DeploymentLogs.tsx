import '../styles/design-system.css'

export const DeploymentLogs = () => {
  // Simulated logs
  const logs = [
    { timestamp: new Date().toISOString(), level: 'INFO', message: 'Deployment started' },
    { timestamp: new Date(Date.now() - 10000).toISOString(), level: 'INFO', message: 'Building Docker image' },
    { timestamp: new Date(Date.now() - 20000).toISOString(), level: 'INFO', message: 'Running tests' },
    { timestamp: new Date(Date.now() - 30000).toISOString(), level: 'WARN', message: 'Minor vulnerability found' },
    { timestamp: new Date(Date.now() - 40000).toISOString(), level: 'INFO', message: 'Pushing image to registry' },
    { timestamp: new Date(Date.now() - 50000).toISOString(), level: 'INFO', message: 'Deploying to EC2' },
    { timestamp: new Date(Date.now() - 60000).toISOString(), level: 'INFO', message: 'Deployment successful' },
  ];

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