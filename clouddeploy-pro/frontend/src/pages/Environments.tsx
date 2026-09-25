import { useCallback } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  RefreshCw,
  Sliders,
  Server,
  Database,
  Terminal,
  Activity,
  Monitor,
  HardDrive,
  Activity as ActivityIcon,
  Zap,
  Settings2
} from 'lucide-react';
import './Environment.css';

interface EnvironmentData {
  environment?: string;
  version?: string;
  debug?: boolean;
}

interface ApplicationSummary {
  id: string;
  name: string;
  repository_url: string;
  branch: string;
  environment: string;
  dockerfile_path: string;
  terraform_path: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface DeploymentSummary {
  deployment_id: string;
  application: string;
  environment: string;
  status: string;
  deployed_at: string;
  health_status?: string | null;
}

interface InfrastructureResource {
  id: string;
  name: string;
  type: string;
  status: string;
  details: string;
}

interface EnvironmentProps {
  data: EnvironmentData | null;
  error: string | null;
  isLoading: boolean;
  fetchInfrastructure: () => Promise<void>;
  // Additional data that would be ideal to have (simulated for now)
  applications?: ApplicationSummary[];
  deployments?: DeploymentSummary[];
  infrastructure?: InfrastructureResource[];
}

export const Environment = ({
  data,
  error,
  isLoading,
  fetchInfrastructure,
  // These would come from props in a real implementation with multi-env support
  applications = [],
  deployments = [],
  infrastructure = []
}: EnvironmentProps) => {
  const handleRefresh = useCallback(async () => {
    await fetchInfrastructure();
  }, [fetchInfrastructure]);

  const currentEnvironment = data?.environment || 'development';

  // Filter data for current environment (in a real app, this would be done on backend)
  const currentEnvApplications = applications.filter(
    app => app.environment === currentEnvironment
  );

  const currentEnvDeployments = deployments.filter(
    dep => dep.environment === currentEnvironment
  );

  // Group applications by status
  const appsByStatus = currentEnvApplications.reduce((acc, app) => {
    const status = app.status.toLowerCase();
    if (!acc[status]) acc[status] = [];
    acc[status].push(app);
    return acc;
  }, {} as Record<string, ApplicationSummary[]>);

  // Get recent deployments
  const recentDeployments = [...currentEnvDeployments]
    .sort((a, b) => new Date(b.deployed_at).getTime() - new Date(a.deployed_at).getTime())
    .slice(0, 5);

  // Get infrastructure resources for current environment
  const currentEnvInfrastructure = infrastructure.filter(
    resource => resource.id.includes(currentEnvironment) || !resource.id.includes('-') // Simple filter
  );

  return (
    <div className="page-container environment-page">
      <div className="page-header environment-header">
        <div>
          <div className="page-title">
            <div className="page-icon">
              <Sliders size={22} />
            </div>
            <h2>Environment Management</h2>
          </div>
          <p className="page-description">
            Monitor and manage the status of your Development, Staging, and Production environments.
            View application deployment status, infrastructure health, and configuration details.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="error-alert" role="alert">
          <AlertCircle size={17} />
          {error}
        </div>
      )}

      {isLoading && !data && !error && (
        <div className="loading-indicator">
          <Loader2 size={24} className="spin" />
          <p>Loading environment configuration…</p>
        </div>
      )}

      {data && (
        <>
          {/* Environment Status Overview */}
          <section className="section">
            <div className="section-header">
              <h3>Environment Status Overview</h3>
            </div>
            <div className="environment-status-grid">
              {/* Development Environment */}
              <div className="environment-card">
                <div className="environment-header">
                  <h4>Development</h4>
                  <span className={`env-status ${currentEnvironment === 'development' ? 'active' : 'inactive'}`}>
                    {currentEnvironment === 'development' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="environment-body">
                  <div className="env-metric">
                    <span className="env-label">Status</span>
                    <span className="env-value">
                      {currentEnvironment === 'development' && data ? (
                        <span className={`status-${data.debug ? 'debug' : 'healthy'}`}>
                          {data.debug ? 'Debug Mode' : 'Healthy'}
                        </span>
                      ) : 'Not Active'}
                    </span>
                  </div>
                  <div className="env-metric">
                    <span className="env-label">Applications</span>
                    <span className="env-value">
                      {currentEnvironment === 'development' ? currentEnvApplications.length : 0}
                    </span>
                  </div>
                  <div className="env-metric">
                    <span className="env-label">Deployments (24h)</span>
                    <span className="env-value">
                      {currentEnvironment === 'development' ? currentEnvDeployments.length : 0}
                    </span>
                  </div>
                  <div className="env-metric">
                    <span className="env-label">Infrastructure</span>
                    <span className="env-value">
                      {currentEnvironment === 'development' ? (
                        currentEnvInfrastructure.length > 0 ?
                          `${currentEnvInfrastructure.length} Resources` :
                          'Provisioning'
                      ) : 'Not Active'}
                    </span>
                  </div>
                </div>
                {currentEnvironment === 'development' && (
                  <div className="environment-actions">
                    <button className="btn btn-outline">
                      <Terminal size={16} />
                      <span>Access CLI</span>
                    </button>
                    <button className="btn btn-secondary">
                      <Activity size={16} />
                      <span>View Logs</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Staging Environment */}
              <div className="environment-card">
                <div className="environment-header">
                  <h4>Staging</h4>
                  <span className="env-status inactive">Inactive</span>
                </div>
                <div className="environment-body">
                  <div className="env-metric">
                    <span className="env-label">Status</span>
                    <span className="env-value">Not Configured</span>
                  </div>
                  <div className="env-metric">
                    <span className="env-label">Applications</span>
                    <span className="env-value">0</span>
                  </div>
                  <div className="env-metric">
                    <span className="env-label">Deployments (24h)</span>
                    <span className="env-value">0</span>
                  </div>
                  <div className="env-metric">
                    <span className="env-label">Infrastructure</span>
                    <span className="env-value">Not Provisioned</span>
                  </div>
                </div>
                <div className="environment-actions">
                  <button className="btn btn-outline" disabled={true}>
                    <Sliders size={16} />
                    <span>Configure</span>
                  </button>
                </div>
              </div>

              {/* Production Environment */}
              <div className="environment-card">
                <div className="environment-header">
                  <h4>Production</h4>
                  <span className="env-status inactive">Inactive</span>
                </div>
                <div className="environment-body">
                  <div className="env-metric">
                    <span className="env-label">Status</span>
                    <span className="env-value">Not Configured</span>
                  </div>
                  <div className="env-metric">
                    <span className="env-label">Applications</span>
                    <span className="env-value">0</span>
                  </div>
                  <div className="env-metric">
                    <span className="env-label">Deployments (24h)</span>
                    <span className="env-value">0</span>
                  </div>
                  <div className="env-metric">
                    <span className="env-label">Infrastructure</span>
                    <span className="env-value">Not Provisioned</span>
                  </div>
                </div>
                <div className="environment-actions">
                  <button className="btn btn-outline" disabled={true}>
                    <Sliders size={16} />
                    <span>Configure</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Current Environment Details */}
          {data && (
            <>
              {/* Application Status */}
              <section className="section">
                <div className="section-header">
                  <h3>Application Status ({currentEnvironment})</h3>
                </div>
                <div className="section-content">
                  {currentEnvApplications.length > 0 ? (
                    <div className="applications-overview">
                      {Object.keys(appsByStatus).map(status => (
                        <div key={status} className="app-status-group">
                          <h4>{status.toUpperCase()} ({appsByStatus[status].length})</h4>
                          <div className="app-status-list">
                            {appsByStatus[status].slice(0, 3).map(app => (
                              <div key={app.id} className="app-status-item">
                                <div className="app-info">
                                  <strong>{app.name}</strong>
                                  <span className="app-detail">{app.branch}</span>
                                </div>
                                <span className={`status-dot status-${app.status.toLowerCase()}`} />
                              </div>
                            ))}
                            {appsByStatus[status].length > 3 && (
                              <div className="app-more">
                                +{appsByStatus[status].length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="placeholder">
                      <h3>No Applications Deployed</h3>
                      <p>
                        No applications are currently deployed to the {currentEnvironment} environment.
                        <br />
                        Go to the Applications page to add and deploy applications.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Recent Deployments */}
              <section className="section">
                <div className="section-header">
                  <h3>Recent Deployments ({currentEnvironment})</h3>
                </div>
                <div className="section-content">
                  {recentDeployments.length > 0 ? (
                    <div className="recent-deployments-list">
                      {recentDeployments.map(deployment => (
                        <div key={deployment.deployment_id} className="deployment-item">
                          <div className="deployment-info">
                            <div className="deploy-app">{deployment.application}</div>
                            <div className="deploy-status">
                              <span className={`status-dot ${deployment.status.toLowerCase() === 'success' ? 'healthy' : deployment.status.toLowerCase() === 'failed' ? 'error' : 'warning'}`} />
                              {deployment.status}
                            </div>
                          </div>
                          <div className="deployment-details">
                            <div className="deploy-detail">
                              <span className="deploy-label">Deployed:</span>
                              <span className="deploy-value">
                                {new Date(deployment.deployed_at).toLocaleString()}
                              </span>
                            </div>
                            {deployment.health_status && (
                              <div className="deploy-detail">
                                <span className="deploy-label">Health:</span>
                                <span className="deploy-value">
                                  {deployment.health_status}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="placeholder">
                      <h3>No Recent Deployments</h3>
                      <p>
                        No deployments have been made to the {currentEnvironment} environment recently.
                        <br />
                        Deploy an application to see deployment history here.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Infrastructure Status */}
              <section className="section">
                <div className="section-header">
                  <h3>Infrastructure Status ({currentEnvironment})</h3>
                </div>
                <div className="section-content">
                  {currentEnvInfrastructure.length > 0 ? (
                    <div className="infrastructure-overview">
                      <div className="infra-summary">
                        <div className="infra-metric">
                          <span className="infra-label">Total Resources</span>
                          <span className="infra-value">{currentEnvInfrastructure.length}</span>
                        </div>
                        <div className="infra-metric">
                          <span className="infra-label">Healthy Resources</span>
                          <span className="infra-value">
                            {currentEnvInfrastructure.filter(r => r.status.toLowerCase() === 'available' || r.status.toLowerCase() === 'active' || r.status.toLowerCase() === 'running').length}
                          </span>
                        </div>
                        <div className="infra-metric">
                          <span className="infra-label">Region</span>
                          <span className="infra-value">us-east-1</span>
                        </div>
                        <div className="infra-metric">
                          <span className="infra-label">Provider</span>
                          <span className="infra-value">AWS</span>
                        </div>
                      </div>
                      <div className="infra-resource-list">
                        {currentEnvInfrastructure.slice(0, 4).map(resource => (
                          <div key={resource.id} className="infra-resource-item">
                            <div className="infra-resource-icon">
                              {() => {
                                const type = resource.type.toLowerCase();
                                if (type.includes('ec2') || type.includes('instance')) return <Server size={14} />;
                                if (type.includes('vpc') || type.includes('subnet')) return <Database size={14} />;
                                if (type.includes('gateway')) return <Activity size={14} />;
                                if (type.includes('load balancer') || type.includes('alb')) return <Activity size={14} />;
                                if (type.includes('s3') || type.includes('bucket')) return <Database size={14} />;
                                if (type.includes('rds') || type.includes('database')) return <HardDrive size={14} />;
                                if (type.includes('log')) return <Terminal size={14} />;
                                if (type.includes('alarm')) return <AlertTriangle size={14} />;
                                if (type.includes('iam') || type.includes('role')) return <Settings2 size={14} />;
                                return <Activity size={14} />;
                              }}()
                            </div>
                            <div className="infra-resource-info">
                              <h4>{resource.name}</h4>
                              <p className="infra-resource-type">{resource.type}</p>
                              <p className="infra-resource-status">
                                <span className={`status-dot ${resource.status.toLowerCase()}`} />
                                {resource.status}
                              </p>
                            </div>
                          </div>
                        ))}
                        {currentEnvInfrastructure.length > 4 && (
                          <div className="infra-more">
                            +{currentEnvInfrastructure.length - 4} more resources
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="placeholder">
                      <h3>No Infrastructure Data</h3>
                      <p>
                        Infrastructure information is not available for the {currentEnvironment} environment.
                        <br />
                        This typically indicates that infrastructure has not been provisioned via Terraform.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Environment Configuration */}
              <section className="section">
                <div className="section-header">
                  <h3>Environment Configuration</h3>
                </div>
                <div className="section-content env-details">
                  <div className="env-item">
                    <span className="env-label">Active Environment</span>
                    <strong className="env-value">{data.environment || 'development'}</strong>
                  </div>
                  <div className="env-item">
                    <span className="env-label">Application Version</span>
                    <code className="env-value">v{data.version || '1.0.0'}</code>
                  </div>
                  <div className="env-item">
                    <span className="env-label">Debug Mode</span>
                    <span className="env-value">
                      {data.debug ? 'Enabled (Verbose)' : 'Disabled (Production)'}
                    </span>
                  </div>
                  <div className="env-item">
                    <span className="env-label">Config Source</span>
                    <code className="env-value">clouddeploy-pro/backend/.env</code>
                  </div>
                  <div className="env-item">
                    <span className="env-label">Container Runtime</span>
                    <span className="env-value">
                      {data ? (data.docker_status === 'available' ? 'Docker Daemon Available' : 'Docker Daemon Unavailable') : 'Unknown'}
                    </span>
                  </div>
                </div>
              </section>

              {/* Environment Management Help */}
              <section className="section environment-help-section">
                <div className="section-header">
                  <h3>Managing Multiple Environments</h3>
                </div>
                <div className="section-content">
                  <div className="help-content">
                    <p>
                      To manage multiple environments (Development, Staging, Production), you need to:
                    </p>
                    <ol className="help-steps">
                      <li>
                        <strong>Configure environment variables:</strong> Set the <code>ENVIRONMENT</code> variable in
                        <code>clouddeploy-pro/backend/.env</code> to switch between environments.
                      </li>
                      <li>
                        <strong>Provision infrastructure:</strong> Use Terraform to create separate infrastructure
                        for each environment (e.g., separate VPCs, subnets, resources).
                      </li>
                      <li>
                        <strong>Deploy applications:</strong> Deploy your applications to each environment
                        through the Applications or Deployments pages.
                      </li>
                      <li>
                        <strong>Monitor separately:</strong> Each environment maintains its own deployment
                        history, application status, and infrastructure state.
                      </li>
                    </ol>
                    <div className="help-note">
                      <p>
                        <strong>Note:</strong> This dashboard currently shows the status of the
                        <code>{currentEnvironment}</code> environment. To view other environments,
                        update the <code>ENVIRONMENT</code> variable and restart the backend service.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Environment;