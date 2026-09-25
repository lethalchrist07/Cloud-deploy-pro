import { MetricCard } from './MetricCard'

interface DeploymentData {
  version: string;
  git_commit: string;
  deployed_at: string;
  environment: string;
  docker_status: string;
}

interface DeploymentInfoProps {
  data: DeploymentData | null;
}

export const DeploymentInfo = ({ data }: DeploymentInfoProps) => {
  if (!data) return <div>Loading deployment info...</div>

  return (
    <div className="metrics-grid">
      <MetricCard label="Version" value={data.version} />
      <MetricCard label="Git Commit" value={data.git_commit.slice(0, 7)} />
      <MetricCard label="Deployed At" value={new Date(data.deployed_at).toLocaleString()} />
      <MetricCard label="Environment" value={data.environment} />
      <MetricCard label="Docker Status" value={data.docker_status} />
    </div>
  )
}
