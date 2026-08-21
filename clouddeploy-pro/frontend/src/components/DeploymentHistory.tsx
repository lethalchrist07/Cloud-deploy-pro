export const DeploymentHistory = () => {
  // Simulated deployment history
  const history = [
    { version: '1.0.0', commit: 'a1b2c3d', environment: 'production', timestamp: '2026-08-05 14:30:00', status: 'Success' },
    { version: '0.9.0', commit: 'd4e5f6a', environment: 'staging', timestamp: '2026-08-04 09:15:00', status: 'Success' },
    { version: '0.8.0', commit: 'g7h8i9j', environment: 'development', timestamp: '2026-08-03 16:45:00', status: 'Success' },
    { version: '0.7.0', commit: 'k0l1m2n', environment: 'production', timestamp: '2026-08-02 11:20:00', status: 'Failed' },
    { version: '0.6.0', commit: 'p3q4r5s', environment: 'staging', timestamp: '2026-08-01 18:05:00', status: 'Success' },
  ];

  return (
    <div className="history-table">
      <table>
        <thead>
          <tr>
            <th>Version</th>
            <th>Commit</th>
            <th>Environment</th>
            <th>Timestamp</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {history.map((deploy, index) => (
            <tr key={index} className={deploy.status.toLowerCase()}>
              <td>{deploy.version}</td>
              <td>{deploy.commit}</td>
              <td>{deploy.environment}</td>
              <td>{deploy.timestamp}</td>
              <td>{deploy.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}