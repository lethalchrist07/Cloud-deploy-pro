import './SystemHealthChart.css'

interface SystemData {
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  memory_total_gb?: number
  memory_used_gb?: number
  memory_free_gb?: number
  disk_total_gb?: number
  disk_used_gb?: number
  disk_free_gb?: number
  cpu_cores_logical?: number
  cpu_cores_physical?: number
  cpu_freq_mhz?: number
}

const statusFor = (value: number) => (value >= 90 ? 'Critical' : value >= 75 ? 'Elevated' : 'Healthy')

export const SystemHealthChart = ({ data, error = false }: { data: SystemData | null; error?: boolean }) => {
  if (!data) {
    return (
      <div className="control-panel health-panel">
        <div className="component-heading">
          <div>
            <p className="eyebrow">Host Telemetry</p>
            <h2 className="topic-title">System Health & Resource Capacity</h2>
          </div>
        </div>
        <p className="empty-state">{error ? 'System telemetry is unavailable.' : 'Loading system telemetry…'}</p>
      </div>
    )
  }

  const memoryDetail = data.memory_total_gb
    ? `${data.memory_used_gb?.toFixed(1) || '0'} GB of ${data.memory_total_gb.toFixed(1)} GB used (${data.memory_free_gb?.toFixed(1) || '0'} GB free)`
    : 'System virtual memory pool'

  const diskDetail = data.disk_total_gb
    ? `${data.disk_used_gb?.toFixed(1) || '0'} GB of ${data.disk_total_gb.toFixed(1)} GB used (${data.disk_free_gb?.toFixed(1) || '0'} GB available)`
    : 'Root volume storage space'

  const cpuDetail = data.cpu_cores_logical
    ? `${data.cpu_cores_logical} Logical Cores (${data.cpu_cores_physical || 0} Physical)${data.cpu_freq_mhz ? ` @ ${(data.cpu_freq_mhz / 1000).toFixed(2)} GHz` : ''}`
    : 'Host processor utilization'

  const metrics = [
    {
      label: 'CPU Load',
      value: data.cpu_usage,
      detail: cpuDetail,
      status: statusFor(data.cpu_usage),
    },
    {
      label: 'Memory Usage',
      value: data.memory_usage,
      detail: memoryDetail,
      status: statusFor(data.memory_usage),
    },
    {
      label: 'Storage Capacity',
      value: data.disk_usage,
      detail: diskDetail,
      status: statusFor(data.disk_usage),
    },
  ]

  return (
    <div className="control-panel health-panel">
      <div className="component-heading">
        <div>
          <p className="eyebrow">Host Health & Telemetry</p>
          <h2 className="topic-title">System Health & Resource Capacity</h2>
          <p className="topic-description">
            CPU, memory, and disk utilization reported by the backend host.
          </p>
        </div>
        <span className="telemetry-badge">Backend host telemetry</span>
      </div>

      <div className="health-cards-grid">
        {metrics.map((metric) => (
          <div className="health-card" key={metric.label}>
            <div className="health-card-header">
              <span className="metric-name">{metric.label}</span>
              <span className={`inline-status-badge ${metric.status.toLowerCase()}`}>
                <span className="status-dot" />
                {metric.status}
              </span>
            </div>

            <div className="health-card-metric">
              <span className="big-metric-num">{metric.value.toFixed(1)}</span>
              <span className="metric-unit">%</span>
            </div>

            <div className="usage-track-bar">
              <div
                className={`usage-fill ${metric.status.toLowerCase()}`}
                style={{ width: `${Math.min(Math.max(metric.value, 0), 100)}%` }}
              />
            </div>

            <p className="metric-subdetail">{metric.detail}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
