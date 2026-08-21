import { MetricCard } from './MetricCard';

interface SystemData {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  hostname: string;
  platform: string;
  boot_time: number;
}

interface MetricsGridProps {
  data: SystemData | null;
}

// Helper function to parse platform info
const parsePlatformInfo = (platformString: string) => {
  const parts = platformString.split(' ');
  return {
    os: parts[0] || 'Unknown',
    version: parts[1] || '',
    full: platformString
  };
};

export const MetricsGrid = ({ data }: MetricsGridProps) => {
  if (!data) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">System Metrics</h3>
        </div>
        <div className="card-content">
          <div className="placeholder">Loading metrics...</div>
        </div>
      </div>
    );
  }

  const formatPercent = (val: number | null | undefined) => {
    // Handle null, undefined, or non-numeric values gracefully
    if (val === null || val === undefined) return '0.0%';
    const num = typeof val === 'number' ? val : parseFloat(val as unknown as string);
    return isNaN(num) ? '0.0%' : `${num.toFixed(1)}%`;
  };

  const formatBootTime = (val: number | null | undefined) => {
    // Handle null, undefined, or invalid date values gracefully
    if (!val && val !== 0) return 'N/A';
    const date = new Date(val);
    return isNaN(date.getTime()) ? String(val) : date.toLocaleString();
  };

  // Parse platform info for clean display
  const getCleanPlatformInfo = (platformString: string) => {
    const parsed = parsePlatformInfo(platformString);
    // Return a clean format: OS Version (if available)
    return parsed.version ? `${parsed.os} ${parsed.version}` : parsed.os;
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">System Metrics</h3>
      </div>
      <div className="card-content">
        <div className="metrics-grid">
          <MetricCard label="CPU Usage" value={formatPercent(data.cpu_usage)} />
          <MetricCard label="Memory Usage" value={formatPercent(data.memory_usage)} />
          <MetricCard label="Disk Usage" value={formatPercent(data.disk_usage)} />
          <MetricCard label="Hostname" value={data.hostname || 'localhost'} />
          <MetricCard label="Platform" value={getCleanPlatformInfo(data.platform || 'Unknown System')} />
          <MetricCard label="Boot Time" value={formatBootTime(data.boot_time)} />
        </div>
      </div>
    </div>
  );
};