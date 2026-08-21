import { useEffect, useState } from 'react';

interface SystemData {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
}

export const SystemHealthChart = ({ data }: { data: SystemData | null }) => {
  const [metrics, setMetrics] = useState([
    { name: 'CPU', value: 17.4 },
    { name: 'Memory', value: 72.4 },
    { name: 'Disk', value: 33.7 },
  ]);

  useEffect(() => {
    if (data) {
      const cpu = typeof data.cpu_usage === 'number' ? data.cpu_usage : 17.4;
      const mem = typeof data.memory_usage === 'number' ? data.memory_usage : 72.4;
      const disk = typeof data.disk_usage === 'number' ? data.disk_usage : 33.7;
      setMetrics([
        { name: 'CPU', value: cpu },
        { name: 'Memory', value: mem },
        { name: 'Disk', value: disk },
      ]);
    }
  }, [data]);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">System Health</h3>
      </div>
      <div className="card-content">
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'flex-end',
          height: '180px',
          paddingTop: '1rem',
          paddingBottom: '0.5rem',
          gap: '1.5rem'
        }}>
          {metrics.map((item, index) => {
            const fillPercentage = Math.min(Math.max(item.value, 8), 100);
            return (
              <div key={index} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                height: '100%'
              }}>
                {/* Vertical Bar Container */}
                <div style={{
                  position: 'relative',
                  width: '42px',
                  flex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '6px 6px 0 0',
                  display: 'flex',
                  alignItems: 'flex-end',
                  overflow: 'hidden',
                  border: '1px solid rgba(139, 92, 246, 0.15)'
                }}>
                  {/* Animated Gradient Bar Fill */}
                  <div style={{
                    width: '100%',
                    height: `${fillPercentage}%`,
                    background: 'linear-gradient(180deg, #00F2FE 0%, #38BDF8 40%, #8B5CF6 80%, #4C1D95 100%)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 500ms ease-in-out',
                    boxShadow: '0 0 12px rgba(0, 242, 254, 0.3)'
                  }} />
                </div>
                {/* Labels */}
                <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#00F2FE', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {item.value.toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};