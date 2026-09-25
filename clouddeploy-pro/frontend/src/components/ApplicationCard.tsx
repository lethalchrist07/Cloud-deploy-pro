import { AlertTriangle, CheckCircle2, Loader2, Rocket, Trash2 } from 'lucide-react'

interface Application {
  id: string
  name: string
  repository_url: string
  branch: string
  environment: string
  dockerfile_path: string
  terraform_path: string
  status: string
  created_at: string
  updated_at: string
}

interface ApplicationCardProps {
  app: Application
  onDelete: (id: string) => Promise<void>
  onDeploy: (id: string) => Promise<void>
  deploying: boolean
}

const formatDate = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Unavailable' : date.toLocaleString()
}

export const ApplicationCard = ({ app, onDelete, onDeploy, deploying }: ApplicationCardProps) => {
  const handleDelete = async () => {
    if (window.confirm(`Delete application "${app.name}"?`)) {
      try {
        await onDelete(app.id)
      } catch {
        return
      }
    }
  }

  const isRegistered = app.status.toLowerCase() === 'connected'

  return (
    <article className="application-card">
      <div className="card-header">
        <div className="card-title">
          <h3>{app.name}</h3>
          <div className="app-meta">
            <span className="badge">{app.branch || 'Branch unavailable'}</span>
            <span className={`badge badge-${app.environment}`}>{app.environment}</span>
          </div>
        </div>
        <div className="card-actions">
          <button className="btn-icon" type="button" onClick={() => void onDeploy(app.id)} disabled={deploying} title={`Build and run ${app.name} locally with Docker`} aria-label={`Deploy ${app.name}`}>
            {deploying ? <Loader2 size={16} className="spin" /> : <Rocket size={16} />}
          </button>
          <button className="btn-icon" type="button" onClick={() => void handleDelete()} title="Delete application" aria-label={`Delete ${app.name}`}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="card-body">
        <div className="info-row"><div className="info-label">Repository</div><div className="info-value"><a href={app.repository_url} target="_blank" rel="noopener noreferrer" className="repo-link">{app.repository_url}</a></div></div>
        <div className="info-row"><div className="info-label">Dockerfile</div><div className="info-value">{app.dockerfile_path || 'Unavailable'}</div></div>
        <div className="info-row"><div className="info-label">Terraform path</div><div className="info-value">{app.terraform_path || 'Unavailable'}</div></div>
        <div className="info-row"><div className="info-label">Status</div><div className={`info-value status-${isRegistered ? 'connected' : 'disconnected'}`}>{isRegistered ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}{isRegistered ? 'Registered' : app.status || 'Unavailable'}</div></div>
        <div className="info-row"><div className="info-label">Created</div><div className="info-value">{formatDate(app.created_at)}</div></div>
        <div className="info-row"><div className="info-label">Updated</div><div className="info-value">{formatDate(app.updated_at)}</div></div>
      </div>
    </article>
  )
}
