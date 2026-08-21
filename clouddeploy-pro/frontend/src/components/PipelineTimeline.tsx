import { useState } from 'react';

export const PipelineTimeline = () => {
  const [steps] = useState([
    { id: 1, label: 'Lint & Test', duration: '37s', status: 'RUNNING', color: '#00F2FE' },
    { id: 2, label: 'Build Docker Image', duration: '45s', status: 'SUCCESS', color: '#10B981' },
    { id: 3, label: 'Terraform Plan', duration: '8s', status: 'SUCCESS', color: '#10B981' },
    { id: 4, label: 'Deploy EC2', duration: '0s', status: 'RUNNING', color: '#00F2FE' },
    { id: 5, label: 'Post-deployment Checks', duration: '0s', status: 'PENDING', color: '#94A3B8' },
  ]);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Pipeline Execution Timeline</h3>
      </div>
      <div className="card-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        {steps.map((step) => {
          const isRunning = step.status === 'RUNNING';
          const isSuccess = step.status === 'SUCCESS';
          const borderColor = isRunning ? 'rgba(0, 242, 254, 0.4)' : isSuccess ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.08)';

          return (
            <div
              key={step.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.6rem 0.85rem',
                backgroundColor: '#161430',
                borderRadius: '0.5rem',
                border: `1px solid ${borderColor}`,
                boxShadow: isRunning ? '0 0 10px rgba(0, 242, 254, 0.15)' : 'none'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#F8FAFC' }}>{step.label}</div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                  {step.duration}
                </div>
              </div>

              {/* Status Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: step.color,
                  letterSpacing: '0.04em',
                  border: `1px solid ${step.color}40`,
                  backgroundColor: `${step.color}10`
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: step.color,
                    boxShadow: `0 0 6px ${step.color}`
                  }}
                />
                {step.status}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};