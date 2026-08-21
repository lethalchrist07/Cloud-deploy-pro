import { useState } from 'react';
import { Server, Globe, HardDrive, ShieldCheck, Scale, TrendingUp } from 'lucide-react';

export const AWSInfrastructureGrid = () => {
  const [items] = useState([
    { id: 1, title: 'EC2 INSTANCE', value: 'i-0a1b2c3d4e5f6g7h', icon: Server, status: 'HEALTHY' },
    { id: 2, title: 'VPC NETWORK', value: 'vpc-0a1b2c3d', icon: Globe, status: 'HEALTHY' },
    { id: 3, title: 'S3 STORAGE BUCKET', value: 'clouddeploy-pro-bucket', icon: HardDrive, status: 'HEALTHY' },
    { id: 4, title: 'SECURITY GROUP', value: 'sg-0a1b2c3d', icon: ShieldCheck, status: 'HEALTHY' },
    { id: 5, title: 'LOAD BALANCER', value: 'app/my-alb/50', icon: Scale, status: 'HEALTHY' },
    { id: 6, title: 'AUTO SCALING', value: 'GROUP', icon: TrendingUp, status: 'HEALTHY' },
  ]);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">AWS Infrastructure Topology</h3>
      </div>
      <div className="card-content">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.6rem'
        }}>
          {items.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.55rem 0.75rem',
                  backgroundColor: '#161430',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(139, 92, 246, 0.2)'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '0.375rem',
                  backgroundColor: 'rgba(0, 242, 254, 0.1)',
                  color: '#00F2FE',
                  flexShrink: 0
                }}>
                  <IconComponent size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 700, letterSpacing: '0.04em' }}>
                    {item.title}
                  </div>
                  <div style={{
                    fontSize: '0.78rem',
                    color: '#00F2FE',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.value}
                  </div>
                </div>
                <div style={{
                  padding: '0.15rem 0.45rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  color: '#10B981',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  letterSpacing: '0.04em'
                }}>
                  {item.status}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};