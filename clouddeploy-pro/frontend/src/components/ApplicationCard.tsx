import { Trash2, Rocket, CheckCircle2, AlertTriangle } from 'lucide-react';

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
}

interface ApplicationCardProps {
  app: Application;
  onDelete: (id: string) => Promise<void>;
  onDeploy: (app: Application) => Promise<void>;
  onSelect: () => void;
  selected: boolean;
}

export const ApplicationCard = ({
  app,
  onDelete,
  onDeploy,
  onSelect,
  selected
}: ApplicationCardProps) => {
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${app.name}"?`)) {
      try {
        await onDelete(app.id);
      } catch (err) {
        alert('Failed to delete application. Please try again.');
      }
    }
  };

  const handleDeploy = async () => {
    try {
      await onDeploy(app);
    } catch (err) {
      alert('Failed to deploy application. Please try again.');
    }
  };

  return (
    <div className={`application-card ${selected ? 'selected' : ''}`} onClick={onSelect}>
      <div className="card-header">
        <div className="card-title">
          <h3>{app.name}</h3>
          <div className="app-meta">
            <span className="badge">{app.branch}</span>
            <span className="badge badge-{app.environment}">{app.environment}</span>
          </div>
        </div>
        <div className="card-actions">
          <button
            className="btn-icon"
            onClick={handleDeploy}
            title="Deploy Application"
          >
            <Rocket size={16} />
          </button>
          <button
            className="btn-icon"
            onClick={handleDelete}
            title="Delete Application"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="card-body">
        <div className="info-row">
          <div className="info-label">Repository</div>
          <div className="info-value">
            <a href={app.repository_url} target="_blank" rel="noopener noreferrer" className="repo-link">
              {app.repository_url}
            </a>
          </div>
        </div>

        <div className="info-row">
          <div className="info-label">Dockerfile Path</div>
          <div className="info-value">{app.dockerfile_path}</div>
        </div>

        <div className="info-row">
          <div className="info-label">Terraform Path</div>
          <div className="info-value">{app.terraform_path}</div>
        </div>

        <div className="info-row">
          <div className="info-label">Status</div>
          <div className="info-value status-{app.status.toLowerCase()}">
            {app.status === 'connected' ? (
              <>
                <CheckCircle2 size={12} className="status-icon" />
                <span>Connected</span>
              </>
            ) : (
              <>
                <AlertTriangle size={12} className="status-icon" />
                <span>Disconnected</span>
              </>
            )}
          </div>
        </div>

        <div className="info-row">
          <div className="info-label">Created</div>
          <div className="info-value">
            {new Date(app.created_at).toLocaleString()}
          </div>
        </div>

        <div className="info-row">
          <div className="info-label">Updated</div>
          <div className="info-value">
            {new Date(app.updated_at).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};