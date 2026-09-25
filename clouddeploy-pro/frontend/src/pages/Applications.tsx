import { useCallback, useState } from 'react';
import {
  Plus,
  RefreshCw,
  Trash2,
  Loader2,
  ExternalLink,
  Settings as SettingsIcon,
  Clock,
  Zap,
  Activity,
  Terminal,
  GitBranch
} from 'lucide-react';
import { ApplicationCard } from '../components/ApplicationCard';
import { AddApplicationModal } from '../components/AddApplicationModal';
import './Applications.css';

interface Application {
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
  // Additional fields we might want to show
  last_deployment?: string;
  health_status?: string;
  version?: string;
}

interface ApplicationsProps {
  applications: Application[];
  isLoading: boolean;
  error: string | null;
  fetchApplications: () => Promise<void>;
  selectedAppId: string;
  setSelectedAppId: (id: string) => void;
  isDeploying: boolean;
  deployingId: string | null;
  handleTriggerDeploy: () => Promise<void>;
  createApplication: (applicationData: Omit<Application, 'id' | 'status' | 'created_at' | 'updated_at'>) => Promise<Application>;
  deleteApplication: (id: string) => Promise<void>;
  deployApplication: (id: string) => Promise<void>;
  handleQuickDeploy: (appId: string) => Promise<void>;
  showAddModal: boolean;
  setShowAddModal: (show: boolean) => void;
}

export const Applications = ({
  applications,
  isLoading,
  error,
  fetchApplications,
  selectedAppId,
  setSelectedAppId,
  isDeploying,
  deployingId,
  handleTriggerDeploy,
  createApplication,
  deleteApplication,
  deployApplication,
  handleQuickDeploy,
  showAddModal,
  setShowAddModal
}: ApplicationsProps) => {
  const handleRefresh = useCallback(async () => {
    await fetchApplications();
  }, [fetchApplications]);

  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const handleViewApplication = (app: Application) => {
    setSelectedApplication(app);
    // In a real implementation, this might navigate to a detailed view
    // For now, we'll just select it in the UI
  };

  const handleShowLogs = (appId: string) => {
    // Navigate to logs page with filtering for this application
    // This would be implemented with proper routing/query params
  };

  const handleRestartApplication = async (appId: string) => {
    // In a real implementation, this would stop and restart the container
    // For now, we'll simulate by redeploying
    try {
      await deployApplication(appId);
    } catch (err) {
      // Error handling would be done by the deployApplication function
    }
  };

  const getStatusBadgeClass = (status: string): string => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'connected' || lowerStatus === 'active') return 'status-badge status-healthy';
    if (lowerStatus === 'disconnected' || lowerStatus === 'inactive' || lowerStatus === 'error') return 'status-badge status-error';
    return 'status-badge status-warning';
  };

  const getDeploymentStatusText = (app: Application): string => {
    // This would ideally come from deployment data
    // For now, we'll return a placeholder based on app status
    return app.status.toLowerCase() === 'connected' ? 'Ready for Deployment' : 'Not Connected';
  };

  return (
    <div className="applications-page">
      <div className="page-header">
        <div className="page-title">
          <div className="page-icon">
            <Database size={22} />
          </div>
          <h2>Application Management</h2>
          <p className="page-description">
            Manage your deployed applications, monitor their status, and control deployments.
          </p>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={20} /> New Application
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw size={20} /> Refresh Applications
          </button>
        </div>
      </div>

      {error && (
        <div className="error-alert" role="alert">
          <AlertCircle size={20} />
          <div className="error-message">
            <strong>Error loading applications:</strong> {error}
          </div>
        </div>
      )}

      {isLoading && !applications.length && !error ? (
        <div className="loading-indicator">
          <Loader2 size={24} className="spin" />
          <p>Loading applications...</p>
        </div>
      ) : !applications.length && error ? (
        <div className="error-alert" role="alert">
          <AlertCircle size={20} />
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        </div>
      ) : (
        <div className="applications-container">
          {/* Applications Statistics */}
          <div className="applications-stats">
            <div className="stat-item">
              <h3>{applications.length}</h3>
              <p>Total Applications</p>
            </div>
            <div className="stat-item">
              <h3>{applications.filter(app => app.status.toLowerCase() === 'connected').length}</h3>
              <p>Connected</p>
            </div>
            <div className="stat-item">
              <h3>{isDeploying ? '1' : '0'}</h3>
              <p>Currently Deploying</p>
            </div>
          </div>

          {/* Applications List */}
          <div className="applications-list">
            {applications.length > 0 ? (
              applications.map(app => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  onDelete={deleteApplication}
                  onDeploy={deployApplication}
                  deploying={deployingId === app.id}
                  onView={() => handleViewApplication(app)}
                  onLogs={() => handleShowLogs(app.id)}
                  onRestart={() => handleRestartApplication(app.id)}
                />
              ))
            ) : (
              <div className="empty-state-large">
                <div className="empty-state-icon">
                  <Database size={48} />
                </div>
                <h3>No Applications Configured</h3>
                <p className="empty-state-description">
                  Get started by connecting your first repository. CloudDeploy Pro will
                  inspect your GitHub repository, build Docker images, and manage deployments.
                </p>
                <div className="empty-state-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowAddModal(true)}
                  >
                    <Plus size={20} /> Add First Application
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => {/* Navigate to docs or help */}}
                  >
                    <ExternalLink size={16} />
                    <span>Learn More</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Application Detail View */}
      {selectedApplication && (
        <div className="application-detail-panel">
          <div className="application-detail-header">
            <h3>{selectedApplication.name}</h3>
            <button
              className="btn btn-icon"
              onClick={() => setSelectedApplication(null)}
              title="Close Details"
            >
              <X size={20} />
            </button>
          </div>
          <div className="application-detail-content">
            <div className="detail-section">
              <h4>Repository Information</h4>
              <div className="detail-item">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{selectedApplication.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Repository:</span>
                <a
                  href={selectedApplication.repository_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="detail-value repo-link"
                >
                  {selectedApplication.repository_url}
                </a>
              </div>
              <div className="detail-item">
                <span className="detail-label">Branch:</span>
                <span className="detail-value">
                  <GitBranch size={16} /> {selectedApplication.branch}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Environment:</span>
                <span className="detail-value">
                  <span className={getStatusBadgeClass(selectedApplication.environment)}>
                    {selectedApplication.environment}
                  </span>
                </span>
              </div>
            </div>

            <div className="detail-section">
              <h4>Deployment Information</h4>
              <div className="detail-item">
                <span className="detail-label">Dockerfile Path:</span>
                <span className="detail-value">{selectedApplication.dockerfile_path}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Terraform Path:</span>
                <span className="detail-value">{selectedApplication.terraform_path}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className="detail-value">
                  <span className={getStatusBadgeClass(selectedApplication.status)}>
                    {selectedApplication.status}
                  </span>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Last Updated:</span>
                <span className="detail-value">
                  {new Date(selectedApplication.updated_at).toLocaleString()}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Created:</span>
                <span className="detail-value">
                  {new Date(selectedApplication.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="detail-section">
              <h4>Actions</h4>
              <div className="actions-group">
                <button
                  className="btn btn-success"
                  onClick={() => deployApplication(selectedApplication.id)}
                  disabled={isDeploying}
                >
                  {isDeploying ? <Loader2 size={16} className="spin" /> : <Rocket size={16} />}
                  Deploy Application
                </button>

                <button
                  className="btn btn-warning"
                  onClick={() => handleRestartApplication(selectedApplication.id)}
                  disabled={isDeploying}
                >
                  <Zap size={16} />
                  Restart Application
                </button>

                <button
                  className="btn btn-info"
                  onClick={() => handleShowLogs(selectedApplication.id)}
                >
                  <Terminal size={16} />
                  View Logs
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => {/* Navigate to settings for this app */}}
                >
                  <SettingsIcon size={16} />
                  Application Settings
                </button>

                <button
                  className="btn btn-danger"
                  onClick={() => {
                    if (window.confirm(`Delete application "${selectedApplication.name}"?`)) {
                      deleteApplication(selectedApplication.id);
                      setSelectedApplication(null);
                    }
                  }}
                >
                  <Trash2 size={16} />
                  Delete Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Application Modal */}
      <AddApplicationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreate={createApplication}
      />
    </div>
  );
};

export default Applications;