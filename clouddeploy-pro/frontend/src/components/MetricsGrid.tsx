import { Activity, Clock, Cpu, HardDrive, Network, Terminal } from 'lucide-react'
import './MetricsGrid.css'

interface SystemData {
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  hostname: string
  platform: string
  processor?: string
  boot_time: string
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
  uptime_formatted?: string
  network_bytes_sent_mb?: number
  network_bytes_recv_mb?: number
  python_version?: string
}

interface MetricItem {
  icon: React.ReactNode
  label: string
  value: string
  isCode: boolean
  meta: string
}

export const MetricsGrid = ({ data, error = false }: { data: SystemData | null; error?: boolean }) => {
  if (!data) {
    return (
      <div className="control-panel host-metrics-panel">
        <div className="component-heading">
          <div><p className="eyebrow">Host Telemetry</p><h2 className="topic-title">System Metrics</h2></div>
        </div>
        <p className="empty-state">{error ? 'Host hardware details are unavailable.' : 'Loading hardware details…'}</p>
      </div>
    )
  }

  const metrics: MetricItem[] = [
    { icon: <Terminal size={17} />, label: 'Hostname', value: data.hostname || 'Unavailable', isCode: true, meta: 'Reported by host' },
    { icon: <Cpu size={17} />, label: 'Operating system', value: data.platform || 'Unavailable', isCode: false, meta: data.python_version ? `Python ${data.python_version}` : 'Runtime version unavailable' },
    {
      icon: <Cpu size={17} />, label: 'Processor', value: data.processor || 'Unavailable', isCode: false,
      meta: data.cpu_cores_logical !== undefined
        ? `${data.cpu_cores_logical} logical cores${data.cpu_cores_physical !== undefined ? ` (${data.cpu_cores_physical} physical)` : ''}${data.cpu_freq_mhz ? ` @ ${(data.cpu_freq_mhz / 1000).toFixed(2)} GHz` : ''}`
        : 'Core count unavailable',
    },
    { icon: <Clock size={17} />, label: 'Uptime', value: data.uptime_formatted || 'Unavailable', isCode: true, meta: data.boot_time ? `Booted ${new Date(data.boot_time).toLocaleString()}` : 'Boot time unavailable' },
    { icon: <Activity size={17} />, label: 'Processes', value: data.process_count !== undefined ? `${data.process_count}` : 'Unavailable', isCode: true, meta: 'Host process count' },
    {
      icon: <Network size={17} />, label: 'Network I/O',
      value: data.network_bytes_sent_mb !== undefined && data.network_bytes_recv_mb !== undefined
        ? `↑ ${data.network_bytes_sent_mb} MB  ↓ ${data.network_bytes_recv_mb} MB`
        : 'Unavailable',
      isCode: true, meta: 'Cumulative host totals',
    },
    {
      icon: <HardDrive size={17} />, label: 'Memory',
      value: data.memory_total_gb !== undefined ? `${data.memory_used_gb?.toFixed(1) ?? 'Unavailable'} / ${data.memory_total_gb.toFixed(1)} GB` : `${data.memory_usage.toFixed(1)}%`,
      isCode: true, meta: data.memory_free_gb !== undefined ? `${data.memory_free_gb.toFixed(1)} GB free` : 'Free memory unavailable',
    },
    {
      icon: <HardDrive size={17} />, label: 'Disk',
      value: data.disk_total_gb !== undefined ? `${data.disk_used_gb?.toFixed(1) ?? 'Unavailable'} / ${data.disk_total_gb.toFixed(1)} GB` : `${data.disk_usage.toFixed(1)}%`,
      isCode: true, meta: data.disk_free_gb !== undefined ? `${data.disk_free_gb.toFixed(1)} GB free` : 'Free disk space unavailable',
    },
  ]

  return (
    <div className="control-panel host-metrics-panel">
      <div className="component-heading">
        <div>
          <p className="eyebrow">Host Specifications</p>
          <h2 className="topic-title">System Metrics</h2>
          <p className="topic-description">Host details reported by the backend metrics API.</p>
        </div>
        <span className="telemetry-badge">Backend host</span>
      </div>
      <div className="host-details-grid">
        {metrics.map((metric) => (
          <div className="host-detail-card" key={metric.label}>
            <div className="detail-card-top"><span className="detail-icon">{metric.icon}</span><span className="detail-label">{metric.label}</span></div>
            <div className="detail-card-value">{metric.isCode ? <code>{metric.value}</code> : <strong>{metric.value}</strong>}</div>
            <span className="detail-meta">{metric.meta}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
