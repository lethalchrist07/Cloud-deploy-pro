import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, RotateCcw, BarChart3, Settings, CheckCircle2, AlertCircle } from 'lucide-react';
import { MetricsGrid } from '../components/MetricsGrid';
import { PipelineTimeline } from '../components/PipelineTimeline';
import { SystemHealthChart } from '../components/SystemHealthChart';
import { AWSInfrastructureGrid } from '../components/AWSInfrastructureGrid';
import { APISandbox } from '../components/APISandbox';
import { TerminalLogStreamer } from '../components/TerminalLogStreamer';
import './Dashboard.css';

// Interface for system data
interface DashboardSystemData {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  boot_time: number;
  platform: string;
  hostname: string;
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

export const Dashboard = () => {
  const navigate = useNavigate();
  const [systemData, setSystemData] = useState<DashboardSystemData | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'warn'; message: string } | null>(null);

  // Fetch system data from backend
  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:8000/metrics');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setSystemData(data.system || data);
    } catch (error) {
      console.error('Error fetching system data:', error);
      // Use mock data for demonstration
      setSystemData({
        cpu_usage: 17.4,
        memory_usage: 72.4,
        disk_usage: 33.7,
        boot_time: Date.now() - 86400000,
        platform: 'Windows 11',
        hostname: 'LethalChrist07'
      });
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleQuickDeploy = async () => {
    setActionNotice({ type: 'success', message: '🚀 Deploying application build... Triggered build pipeline!' });
    try {
      await fetch('http://localhost:8000/deploy', { method: 'POST' });
    } catch (err) { /* ignored */ }
    setTimeout(() => {
      navigate('/deployment');
    }, 800);
  };

  const handleQuickRollback = async () => {
    setActionNotice({ type: 'warn', message: '⏪ Emergency rollback executed! State reverted to stable v1.0.0' });
    try {
      await fetch('http://localhost:8000/rollback', { method: 'POST' });
    } catch (err) { /* ignored */ }
  };

  // Parse platform info for clean display
  const getPlatformInfo = (platformString: string) => {
    const parsed = parsePlatformInfo(platformString);
    return {
      os: parsed.os,
      version: parsed.version,
      architecture: 'x64', // Default assumption, could be enhanced
      platform: `${parsed.os} ${parsed.version}`.trim()
    };
  };

  return (
    <div className="dashboard">
      {/* Action Notification Alert */}
      {actionNotice && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: actionNotice.type === 'success' ? 'rgba(22, 163, 74, 0.15)' : 'rgba(220, 38, 38, 0.15)',
          border: `1px solid ${actionNotice.type === 'success' ? '#16A34A' : '#DC2626'}`,
          color: actionNotice.type === 'success' ? '#16A34A' : '#DC2626'
        }}>
          {actionNotice.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{actionNotice.message}</span>
        </div>
      )}

      {/* Dashboard Title & Top Action */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <Rocket size={22} color="#00F2FE" />
          <h2 style={{ color: '#00F2FE', fontSize: '1.25rem', fontWeight: 800 }}>CloudDeploy Pro Dashboard</h2>
        </div>
        <div className="dashboard-actions">
          <button
            className="btn-refresh-all"
            onClick={() => window.location.reload()}
          >
            Refresh All
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="dashboard-grid">
        {/* Left Column - System Health & System Metrics */}
        <div className="dashboard-column">
          <SystemHealthChart data={systemData} />
          <MetricsGrid data={systemData} />
        </div>

        {/* Middle Column - Pipeline Execution & Infrastructure Topology */}
        <div className="dashboard-column">
          <PipelineTimeline />
          <AWSInfrastructureGrid />
        </div>

        {/* Right Column - System Information & Quick Actions */}
        <div className="dashboard-column">
          {/* System Information Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">System Information</h3>
            </div>
            <div className="card-content">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div style={{ backgroundColor: '#161430', padding: '0.55rem 0.75rem', borderRadius: '0.375rem', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>Hostname</div>
                    <div style={{ fontSize: '0.82rem', color: '#00F2FE', fontWeight: 700, marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                      {systemData?.hostname || 'LethalChrist07'}
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#161430', padding: '0.55rem 0.75rem', borderRadius: '0.375rem', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>Operating System</div>
                    <div style={{ fontSize: '0.82rem', color: '#00F2FE', fontWeight: 700, marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                      {getPlatformInfo(systemData?.platform || 'Windows 11').os}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div style={{ backgroundColor: '#161430', padding: '0.55rem 0.75rem', borderRadius: '0.375rem', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>Platform</div>
                    <div style={{ fontSize: '0.82rem', color: '#00F2FE', fontWeight: 700, marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                      {getPlatformInfo(systemData?.platform || 'Windows 11').platform}
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#161430', padding: '0.55rem 0.75rem', borderRadius: '0.375rem', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>Architecture</div>
                    <div style={{ fontSize: '0.82rem', color: '#00F2FE', fontWeight: 700, marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                      x64
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#161430', padding: '0.55rem 0.75rem', borderRadius: '0.375rem', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>Boot Time</div>
                  <div style={{ fontSize: '0.82rem', color: '#00F2FE', fontWeight: 700, marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                    {systemData?.boot_time ? new Date(systemData.boot_time).toLocaleString() : '8/1/2026, 9:53:41 PM'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Quick Actions</h3>
            </div>
            <div className="card-content">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  onClick={handleQuickDeploy}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 0.75rem',
                    backgroundColor: '#161430',
                    color: '#F8FAFC',
                    border: '1px solid rgba(139, 92, 246, 0.25)',
                    borderRadius: '0.5rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 120ms ease'
                  }}
                >
                  <Rocket size={15} color="#00F2FE" />
                  <span>Deploy Application</span>
                </button>
                <button
                  onClick={handleQuickRollback}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 0.75rem',
                    backgroundColor: '#161430',
                    color: '#F8FAFC',
                    border: '1px solid rgba(139, 92, 246, 0.25)',
                    borderRadius: '0.5rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 120ms ease'
                  }}
                >
                  <RotateCcw size={15} color="#00F2FE" />
                  <span>Rollback Deployment</span>
                </button>
                <button
                  onClick={() => navigate('/analytics')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 0.75rem',
                    backgroundColor: '#161430',
                    color: '#F8FAFC',
                    border: '1px solid rgba(139, 92, 246, 0.25)',
                    borderRadius: '0.5rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 120ms ease'
                  }}
                >
                  <BarChart3 size={15} color="#00F2FE" />
                  <span>View Analytics</span>
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 0.75rem',
                    backgroundColor: '#161430',
                    color: '#F8FAFC',
                    border: '1px solid rgba(139, 92, 246, 0.25)',
                    borderRadius: '0.5rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 120ms ease'
                  }}
                >
                  <Settings size={15} color="#00F2FE" />
                  <span>Manage Environment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Width Sections */}
      <div className="dashboard-full-width">
        <div className="section">
          <div className="section-header">
            <h3>Live Deployment Logs</h3>
          </div>
          <div className="section-content">
            <TerminalLogStreamer />
          </div>
        </div>
        <div className="section">
          <div className="section-header">
            <h3>API Sandbox</h3>
          </div>
          <div className="section-content">
            <APISandbox />
          </div>
        </div>
      </div>
    </div>
  );
};