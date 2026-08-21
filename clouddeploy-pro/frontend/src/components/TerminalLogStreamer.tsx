import { useEffect, useState } from 'react';

export const TerminalLogStreamer = () => {
  const [logs, setLogs] = useState<Array<{
    id: number;
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
  }>>([]);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    // Simulate log streaming
    const logLevels: ('info' | 'warn' | 'error')[] = ['info', 'info', 'warn', 'info', 'error'];
    let idCounter = logs.length > 0 ? Math.max(...logs.map(l => l.id)) + 1 : 1;

    const interval = setInterval(() => {
      const level = logLevels[Math.floor(Math.random() * logLevels.length)];
      const messages = {
        info: [
          'Application started successfully',
          'Health check passed',
          'Metrics collected',
          'Deployment initiated',
          'Pipeline step completed'
        ],
        warn: [
          'High memory usage detected',
          'Deployment taking longer than expected',
          'Network latency increased'
        ],
        error: [
          'Failed to connect to database',
          'Deployment failed: Health check unsuccessful',
          'Terraform apply error: Resource already exists'
        ]
      };

      const message =
        messages[level][Math.floor(Math.random() * messages[level].length)];

      setLogs(prev => [
        ...prev,
        {
          id: idCounter++,
          timestamp: new Date().toISOString(),
          level,
          message,
        },
      ]);

      // Keep only last 100 logs
      if (logs.length > 100) {
        setLogs(logs.slice(logs.length - 100));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [logs]);

  // Scroll to bottom when autoScroll is enabled and logs change
  useEffect(() => {
    if (autoScroll) {
      const logContainer = document.querySelector('.logs-stream');
      if (logContainer) {
        logContainer.scrollTop = logContainer.scrollHeight;
      }
    }
  }, [logs, autoScroll]);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Live Deployment Logs</h3>
        <div className="log-controls">
          <label>
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            Auto-scroll
          </label>
        </div>
      </div>
      <div className="card-content">
        <div className="logs-stream">
          {logs.map(log => (
            <div key={log.id} className={`log-entry log-${log.level}`}>
              <div className="log-timestamp">
                {new Date(log.timestamp).toLocaleTimeString()}
              </div>
              <div className="log-level">{log.level.toUpperCase()}</div>
              <div className="log-message">{log.message}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};