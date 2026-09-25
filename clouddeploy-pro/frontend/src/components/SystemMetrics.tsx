import { MetricCard } from './MetricCard'

interface SystemMetricsData {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  hostname: string;
  platform: string;
  boot_time: number;
}

interface SystemMetricsProps {
  data: SystemMetricsData | null;
}

export const SystemMetrics = ({ data }: SystemMetricsProps) => {
  if (!data) return <div>Loading system metrics...</div>

  return (
    <div className="metrics-grid">
      <MetricCard label="CPU Usage" value={`${data.cpu_usage.toFixed(1)}%`} />
      <MetricCard label="Memory Usage" value={`${data.memory_usage.toFixed(1)}%`} />
      <MetricCard label="Disk Usage" value={`${data.disk_usage.toFixed(1)}%`} />
      <MetricCard label="Hostname" value={data.hostname} />
      <MetricCard label="Platform" value={data.platform} />
      <MetricCard label="Boot Time" value={new Date(data.boot_time).toLocaleString()} />
    </div>
  )
}
