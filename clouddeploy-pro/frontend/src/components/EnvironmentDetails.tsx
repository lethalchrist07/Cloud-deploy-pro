interface EnvironmentData {
  environment: string;
  version?: string;
  debug?: boolean;
  backend_port?: number;
  frontend_port?: number;
  region?: string;
  status?: string;
}

interface EnvironmentDetailsProps {
  data: EnvironmentData | null;
}

export const EnvironmentDetails = ({ data }: EnvironmentDetailsProps) => {
  if (!data) return <div>Loading environment details...</div>

  return (
    <div className="env-details">
      <div className="env-item">
        <span className="env-label">Environment:</span>
        <span className="env-value">{data.environment}</span>
      </div>
      <div className="env-item">
        <span className="env-label">Version:</span>
        <span className="env-value">{data.version || '1.0.0'}</span>
      </div>
      <div className="env-item">
        <span className="env-label">Debug Mode:</span>
        <span className="env-value">{data.debug ? 'Enabled' : 'Disabled'}</span>
      </div>
    </div>
  )
}