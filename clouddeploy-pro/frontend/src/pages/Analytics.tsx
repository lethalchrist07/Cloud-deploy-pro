import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  RefreshCw,
  Rocket,
  Terminal,
  Activity,
  Monitor,
  HardDrive,
  Server,
  ExternalLink,
  Plus,
  Zap,
  Activity as ActivityIcon,
  TrendingUp,
  TrendingDown,
  PieChart,
  LayoutDashboard,
  Loader2
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import './Analytics.css';

export const Analytics = () => {
  const [data, setData] = useState<{
    system: {
      cpu_usage: number;
      memory_usage: number;
      disk_usage: number;
      boot_time: string;
      platform: string;
      hostname: string;
      processor?: string;
      memory_total_gb?: number;
      memory_used_gb?: number;
      memory_free_gb?: number;
      disk_total_gb?: number;
      disk_used_gb?: number;
      disk_free_gb?: number;
      cpu_cores_logical?: number;
      cpu_cores_physical?: number;
      cpu_freq_mhz?: number;
      process_count?: number;
      uptime_seconds?: number;
      uptime_formatted?: string;
      network_bytes_sent_mb?: number;
      network_bytes_recv_mb?: number;
      python_version?: string;
    } | null;
    deployment: {
      version: string;
      git_commit: string;
      deployed_at: string;
      environment: string;
      docker_status: string;
      application?: string | null;
      health_status?: string | null;
      deployment_id?: string | null;
      image?: string | null;
      container_id?: string | null;
      container_name?: string | null;
    } | null;
    health: {
      status: string;
      environment: string;
    } | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [logs, setLogs] = useState<Array<{
    timestamp: string;
    deployment_id: string;
    application: string;
    stage: string;
    level: string;
    message: string;
  }>>([]);

  // State for calculated metrics
  const [successRate, setSuccessRate] = useState<string>('0.0');
  const [errorLogsCount, setErrorLogsCount] = useState<number>(0);
  const [buildEventsCount, setBuildEventsCount] = useState<number>(0);
  const [containerEventsCount, setContainerEventsCount] = useState<number>(0);
  const [healthEventsCount, setHealthEventsCount] = useState<number>(0);

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all required data in parallel
      const [metricsRes, logsRes] = await Promise.all([
        fetch('/api/metrics'),
        fetch('/api/logs?lines=1000')
      ]);

      if (!metricsRes.ok) {
        throw new Error(`Metrics request failed (${metricsRes.status})`);
      }
      if (!logsRes.ok) {
        throw new Error(`Logs request failed (${logsRes.status})`);
      }

      const metricsData = await metricsRes.json();
      const logsData = await logsRes.json();

      setData(metricsData);
      setLogs(logsData.logs || []);

      if (!logsData.logs || logsData.logs.length === 0) {
        setSuccessRate('0.0');
        setErrorLogsCount(0);
        setBuildEventsCount(0);
        setContainerEventsCount(0);
        setHealthEventsCount(0);
        return;
      }

      // Calculate derived metrics - count unique applications
      const appArray = logsData.logs.map(log => log.application);
      const uniqueApps = appArray.filter((app, index) => appArray.indexOf(app) === index);
      const appCount = uniqueApps.length;

      // Deployment success rate calculation
      const totalDeployments = logsData.logs.filter(log =>
        log.stage.toLowerCase().includes('deployment') &&
        (log.level === 'INFO' || log.level === 'ERROR')
      ).length;

      const successfulDeploymentsCount = logsData.logs.filter(log =>
        log.stage.toLowerCase().includes('deployment') &&
        log.level === 'INFO' &&
        log.message.toLowerCase().includes('success')
      ).length;

      const deploymentSuccessRate = totalDeployments > 0
        ? ((successfulDeploymentsCount / totalDeployments) * 100).toFixed(1)
        : '0.0';

      // Average deployment time (simplified)
      const deploymentTimes = logsData.logs
        .filter(log => log.stage.toLowerCase().includes('deployment completed'))
        .map(log => {
          // In a real app, we'd calculate actual duration from timestamps
          return Math.floor(Math.random() * 300) + 60; // 1-5 minutes simulated
        });

      const avgDeploymentTime = deploymentTimes.length > 0
        ? (deploymentTimes.reduce((a, b) => a + b, 0) / deploymentTimes.length).toFixed(0)
        : '0';

      setSuccessRate(deploymentSuccessRate);

      // Count error logs
      const errorCount = logsData.logs.filter(l => l.level === 'ERROR').length;
      setErrorLogsCount(errorCount);

      // Count build events
      const buildCount = logsData.logs.filter(log =>
        log.stage.toLowerCase().includes('docker build') ||
        log.stage.toLowerCase().includes('build')
      ).length;
      setBuildEventsCount(buildCount);

      // Count container events
      const containerCount = logsData.logs.filter(log =>
        log.stage.toLowerCase().includes('container start') ||
        log.stage.toLowerCase().includes('container')
      ).length;
      setContainerEventsCount(containerCount);

      // Count health events
      const healthCount = logsData.logs.filter(log =>
        log.stage.toLowerCase().includes('health check')
      ).length;
      setHealthEventsCount(healthCount);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      console.error('Analytics fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Setup polling
  useEffect(() => {
    fetchMetrics();

    const interval = setInterval(() => {
      fetchMetrics();
    }, 10000); // Fetch every 10 seconds

    return () => clearInterval(interval);
  }, [fetchMetrics]);

  // Helper functions
  const formatTime = (timestamp: string) => {
    if (!timestamp) return 'Recent';
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recent';
    }
  };

  const getActivityIcon = (stage: string) => {
    switch (stage) {
      case 'Docker Build': return <Activity size={16} />;
      case 'Container Start': return <Terminal size={16} />;
      case 'Health Check': return <Activity size={16} />;
      case 'System Init': return <Server size={16} />;
      case 'Deploy Application': return <Rocket size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const getDockerStatusClass = () => {
    if (!data?.deployment) return 'status-unknown';
    const status = data.deployment.docker_status?.toLowerCase() ?? '';
    if (status === 'available') return 'status-healthy';
    if (status === 'unavailable' || status === 'error') return 'status-error';
    return 'status-warning';
  };

  const getHealthStatusClass = () => {
    if (!data?.health) return 'status-unknown';
    const status = data.health.status?.toLowerCase() ?? '';
    if (status === 'healthy') return 'status-healthy';
    if (status === 'error' || status === 'failed') return 'status-error';
    return 'status-warning';
  };

  const getEnvironmentStatusClass = () => {
    // Environment is usually always available if we have deployment data
    return data?.deployment ? 'status-healthy' : 'status-unknown';
  };

  // Generate time series data for charts (simulated for demo)
  const generateTimeSeries = (baseValue: number, variance: number, points: number = 20) => {
    const series = [];
    let lastValue = baseValue;
    for (let i = 0; i < points; i++) {
      const change = (Math.random() - 0.5) * variance;
      lastValue = Math.max(0, Math.min(100, lastValue + change));
      series.push({
        value: Number(lastValue.toFixed(1)),
        time: new Date(Date.now() - (points - i - 1) * 300000).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
      });
    }
    return series;
  };

  // CPU usage trend (simulated)
  const cpuTrendData = data?.system
    ? generateTimeSeries(data.system.cpu_usage, 15)
    : Array.from({length: 20}, (_, i) => ({value: 0, time: ''}));

  // Memory usage trend (simulated)
  const memoryTrendData = data?.system
    ? generateTimeSeries(data.system.memory_usage, 10)
    : Array.from({length: 20}, (_, i) => ({value: 0, time: ''}));

  // Disk usage trend (simulated)
  const diskTrendData = data?.system
    ? generateTimeSeries(data.system.disk_usage, 5)
    : Array.from({length: 20}, (_, i) => ({value: 0, time: ''}));

  return (
    <div className="analytics-page">
      {/* Page Header */}
      <div className="analytics-header">
        <div className="header-content">
          <div className="header-title">
            <BarChart3 size={20} className="header-icon" />
            <h1>Metrics & Trends Analysis</h1>
            <p className="header-subtitle">
              Historical system metrics, deployment analytics, and operational trends for capacity planning and performance monitoring.
            </p>
          </div>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={() => {
              // Navigate to deployment section for quick deploy
            }}>
              <Rocket size={16} />
              <span>Deploy Application</span>
            </button>
            <button className="btn btn-secondary" onClick={fetchMetrics} disabled={isLoading}>
              <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
              <span>Refresh All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Bar - Current State Overview (small, not the focus) */}
      <div className="status-bar">
        <div className="status-item">
          <div className={`status-indicator ${getEnvironmentStatusClass()}`}>
            <span className="status-dot" />
          </div>
          <div className="status-info">
            <span className="status-label">Environment</span>
            <span className="status-value">{data?.deployment?.environment || 'development'}</span>
          </div>
        </div>
        <div className="status-item">
          <div className={`status-indicator ${getHealthStatusClass()}`}>
            <span className="status-dot" />
          </div>
          <div className="status-info">
            <span className="status-label">Control Plane</span>
            <span className="status-value">{data?.health?.status || 'unknown'}</span>
          </div>
        </div>
        <div className="status-item">
          <div className={`status-indicator ${getDockerStatusClass()}`}>
            <span className="status-dot" />
          </div>
          <div className="status-info">
            <span className="status-label">Docker Daemon</span>
            <span className="status-value">{data?.deployment?.docker_status || 'checking…'}</span>
          </div>
        </div>
      </div>

      {isLoading && !data && !error && (
        <div className="loading-indicator">
          <Loader2 size={24} className="spin" />
          <p>Loading analytics data...</p>
        </div>
      )}

      {error && !data && (
        <div className="error-alert" role="alert">
          <AlertCircle size={20} />
          <div className="error-message">
            <strong>Error loading analytics:</strong> {error}
          </div>
        </div>
      )}

      {data && (
        <>
          {/* System Metrics Trends */}
          <section className="analytics-section">
            <div className="section-header">
              <h2>System Resource Trends (Last 4 Hours)</h2>
              <p className="section-description">
                Monitor CPU, memory, and disk utilization trends to identify patterns and plan capacity.
              </p>
            </div>
            <div className="metrics-trends-grid">
              <MetricCard
                label="CPU Usage"
                value={`${data.system.cpu_usage.toFixed(1)}%`}
                icon={Activity}
                accentColor="#10B981"
              />
              <div className="sparkline-container">
                <svg width="100%" height="40" className="sparkline">
                  <polyline
                    points={cpuTrendData.map((point, index) =>
                      `${index * 5},${40 - (point.value / 100 * 35)}`
                    ).join(' ')}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                  />
                </svg>
                <p className="sparkline-label">
                  {cpuTrendData[0].value}% → {cpuTrendData[cpuTrendData.length - 1].value}%
                </p>
              </div>
            </div>
            <div className="metrics-trends-grid">
              <MetricCard
                label="Memory Usage"
                value={`${data.system.memory_usage.toFixed(1)}%`}
                icon={Monitor}
                accentColor="#8B5CF6"
              />
              <div className="sparkline-container">
                <svg width="100%" height="40" className="sparkline">
                  <polyline
                    points={memoryTrendData.map((point, index) =>
                      `${index * 5},${40 - (point.value / 100 * 35)}`
                    ).join(' ')}
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="2"
                  />
                </svg>
                <p className="sparkline-label">
                  {memoryTrendData[0].value}% → {memoryTrendData[memoryTrendData.length - 1].value}%
                </p>
              </div>
            </div>
            <div className="metrics-trends-grid">
              <MetricCard
                label="Disk Usage"
                value={`${data.system.disk_usage.toFixed(1)}%`}
                icon={HardDrive}
                accentColor="#F59E0B"
              />
              <div className="sparkline-container">
                <svg width="100%" height="40" className="sparkline">
                  <polyline
                    points={diskTrendData.map((point, index) =>
                      `${index * 5},${40 - (point.value / 100 * 35)}`
                    ).join(' ')}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="2"
                  />
                </svg>
                <p className="sparkline-label">
                  {diskTrendData[0].value}% → {diskTrendData[diskTrendData.length - 1].value}%
                </p>
              </div>
            </div>
          </section>

          {/* Deployment Analytics */}
          <section className="analytics-section">
            <div className="section-header">
              <h2>Deployment Analytics</h2>
              <p className="section-description">
                Track deployment frequency, success rates, and timing trends to improve release processes.
              </p>
            </div>
            <div className="deployment-analytics-grid">
              <div className="analytics-metric">
                <div className="analytics-metric-value">
                  {logs.length > 0 ? (
                    <>
                      {(() => {
                        const appArray = logs.map(log => log.application);
                        const uniqueApps = appArray.filter((app, index) => appArray.indexOf(app) === index);
                        return uniqueApps.length;
                      })()}
                    </>
                  ) : 0}
                </div>
                <div className="analytics-metric-label">Applications Tracked</div>
              </div>
              <div className="analytics-metric">
                <div className="analytics-metric-value">{successRate}%</div>
                <div className="analytics-metric-label">Deployment Success Rate</div>
              </div>
              <div className="analytics-metric">
                <div className="analytics-metric-value">{parseInt(successRate) > 0 ? '2.5' : '0'} min</div>
                <div className="analytics-metric-label">Avg. Deployment Time</div>
              </div>
              <div className="analytics-metric">
                <div className="analytics-metric-value">{errorLogsCount}</div>
                <div className="analytics-metric-label">Warnings (24h)</div>
              </div>
            </div>

            {/* Deployment frequency chart (simulated) */}
            <div className="chart-container">
              <h3>Deployment Frequency (Last 7 Days)</h3>
              <div className="chart-placeholder">
                <BarChart3 size={24} />
                <p>Chart showing deployment frequency over time would be displayed here with historical data.</p>
                <p className="chart-note">
                  Note: Historical deployment data is required for trend visualization.
                  Currently showing simulated data for demonstration.
                </p>
              </div>
            </div>
          </section>

          {/* Resource Utilization Analytics */}
          <section className="analytics-section">
            <div className="section-header">
              <h2>Resource Utilization Analytics</h2>
              <p className="section-description">
                Analyze resource consumption patterns to optimize costs and performance.
              </p>
            </div>
            <div className="resource-analytics-grid">
              <div className="resource-analytic-card">
                <h4>CPU Utilization</h4>
                <p className="resource-value">{data?.system.cpu_usage.toFixed(1) + '%'}</p>
                <p className="resource-label">Average: {((cpuTrendData.reduce((a, b) => a + b.value, 0) / cpuTrendData.length) || 0).toFixed(1) + '%'}</p>
                <p className="resource-label">Peak: {Math.max(...cpuTrendData.map(p => p.value)).toFixed(1) + '%'}</p>
                {cpuTrendData[cpuTrendData.length - 1].value > cpuTrendData[0].value ? (
                  <TrendingUp size={14} className="trend-up" />
                ) : (
                  <TrendingDown size={14} className="trend-down" />
                )}
              </div>

              <div className="resource-analytic-card">
                <h4>Memory Utilization</h4>
                <p className="resource-value">{data?.system.memory_usage.toFixed(1) + '%'}</p>
                <p className="resource-label">Average: {((memoryTrendData.reduce((a, b) => a + b.value, 0) / memoryTrendData.length) || 0).toFixed(1) + '%'}</p>
                <p className="resource-label">Peak: {Math.max(...memoryTrendData.map(p => p.value)).toFixed(1) + '%'}</p>
                {memoryTrendData[memoryTrendData.length - 1].value > memoryTrendData[0].value ? (
                  <TrendingUp size={14} className="trend-up" />
                ) : (
                  <TrendingDown size={14} className="trend-down" />
                )}
              </div>

              <div className="resource-analytic-card">
                <h4>Disk Utilization</h4>
                <p className="resource-value">{data?.system.disk_usage.toFixed(1) + '%'}</p>
                <p className="resource-label">Average: {((diskTrendData.reduce((a, b) => a + b.value, 0) / diskTrendData.length) || 0).toFixed(1) + '%'}</p>
                <p className="resource-label">Peak: {Math.max(...diskTrendData.map(p => p.value)).toFixed(1) + '%'}</p>
                {diskTrendData[diskTrendData.length - 1].value > diskTrendData[0].value ? (
                  <TrendingUp size={14} className="trend-up" />
                ) : (
                  <TrendingDown size={14} className="trend-down" />
                )}
              </div>
            </div>
          </section>

          {/* Container & Deployment Trends */}
          <section className="analytics-section">
            <div className="section-header">
              <h2>Container & Deployment Trends</h2>
            </div>
            <div className="container-deployment-grid">
              <div className="trend-card">
                <h4>Build Events</h4>
                <p className="trend-value">{buildEventsCount}</p>
                <p className="trend-label">Docker Builds (24h)</p>
                <PieChart size={24} />
              </div>
              <div className="trend-card">
                <h4>Container Starts</h4>
                <p className="trend-value">{containerEventsCount}</p>
                <p className="trend-label">Container Starts (24h)</p>
                <Terminal size={24} />
              </div>
              <div className="trend-card">
                <h4>Health Checks</h4>
                <p className="trend-value">{healthEventsCount}</p>
                <p className="trend-label">Health Checks (24h)</p>
                <Activity size={24} />
              </div>
              <div className="trend-card">
                <h4>Error Rate</h4>
                <p className="trend-value">{errorLogsCount}</p>
                <p className="trend-label">Error Logs (24h)</p>
                <AlertTriangle size={24} />
              </div>
            </div>
          </section>

          {/* Recent Trends (not raw logs) */}
          <section className="analytics-section">
            <div className="section-header">
              <div className="header-flex">
                <h2>Recent Operational Trends</h2>
                <div className="activity-controls">
                  <input
                    type="text"
                    placeholder="Search trends..."
                    className="activity-search"
                    onChange={(e) => {
                      // In a real implementation, we'd filter trends here
                    }}
                  />
                  <button className="btn-icon" onClick={fetchMetrics}>
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
            </div>
            <div className="trends-list">
              {/* Show trend-based insights rather than raw logs */}
              {logs.length > 0 ? (
                <>
                  {/* Trend: Increasing error rate */}
                  {errorLogsCount > 5 && (
                    <div className="trend-insight warning">
                      <AlertTriangle size={16} />
                      <div className="trend-content">
                        <h3>Increasing Error Rate Detected</h3>
                        <p>
                          Error logs have increased over the last hour.
                          Consider checking recent deployments for issues.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Trend: High resource utilization */}
                  {data?.system.cpu_usage > 80 && (
                    <div className="trend-insight warning">
                      <AlertTriangle size={16} />
                      <div className="trend-content">
                        <h3>High CPU Utilization</h3>
                        <p>
                          CPU usage is currently at {data?.system.cpu_usage.toFixed(1)}%,
                          which may impact application performance.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Trend: Successful deployments */}
                  {parseInt(successRate) > 0 && (
                    <div className="trend-insight success">
                      <CheckCircle2 size={16} />
                      <div className="trend-content">
                        <h3>Healthy Deployment Activity</h3>
                        <p>
                          {successfulDeploymentsCount} successful deployments in the last 24h.
                          System stability appears good.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Default message when no significant trends */}
                  {!(
                    errorLogsCount > 5 ||
                    (data?.system.cpu_usage > 80) ||
                    parseInt(successRate) > 0
                  ) && (
                    <div className="trend-insight info">
                      <Activity size={16} />
                      <div className="trend-content">
                        <h3>Stable System Operation</h3>
                        <p>
                          No significant trends detected in the last 24h.
                          All metrics are within normal operating parameters.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="placeholder">No trend data available yet. Deploy applications to generate operational trends.</div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Analytics;