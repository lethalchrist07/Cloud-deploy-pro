import { MetricCard } from './MetricCard'
import '../styles/design-system.css'

interface DeploymentData {
  version: string;
  git_commit: string;
  deployed_at: string;
  environment: string;
  docker_status: string;
  application?: string;
}

interface DeploymentDetailsProps {
  data: DeploymentData | null;
}

export const DeploymentDetails = ({ data }: DeploymentDetailsProps) => {
  if (!data) return <div className="placeholder">Loading deployment details...</div>

  return (
    <div className="metrics-grid">
      {data.application && (
        <MetricCard label="Application" value={data.application} />
      )}
      <MetricCard label="Version" value={data.version} />
      <MetricCard label="Git Commit" value={data.git_commit.slice(0, 7)} />
      <MetricCard label="Deployed At" value={new Date(data.deployed_at).toLocaleString()} />
      <MetricCard label="Environment" value={data.environment} />
      <MetricCard label="Docker Status" value={data.docker_status} />
    </div>
  )
}