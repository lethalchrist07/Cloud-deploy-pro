import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Boxes,
  Cloud,
  Database,
  FileText,
  Globe,
  HardDrive,
  RefreshCw,
  Server,
  Share2,
  Shield,
} from 'lucide-react'
import './AWSInfrastructureGrid.css'

interface InfraResource {
  id: string
  name: string
  type: string
  status: string
  details: string
  cost_estimate: string
}

interface InfraInventory {
  environment: string
  cloud_provider: string
  region: string
  vpc_cidr: string
  state_backend: string
  resources: InfraResource[]
  monthly_total_cost: string
}

const getResourceIcon = (type: string) => {
  const lower = type.toLowerCase()
  if (lower.includes('ec2') || lower.includes('instance')) return <Server size={17} />
  if (lower.includes('vpc') || lower.includes('subnet')) return <Boxes size={17} />
  if (lower.includes('gateway')) return <Globe size={17} />
  if (lower.includes('load balancer') || lower.includes('alb')) return <Share2 size={17} />
  if (lower.includes('s3') || lower.includes('bucket')) return <Database size={17} />
  if (lower.includes('rds') || lower.includes('database') || lower.includes('postgresql')) return <HardDrive size={17} />
  if (lower.includes('log')) return <FileText size={17} />
  if (lower.includes('alarm')) return <AlertTriangle size={17} />
  if (lower.includes('iam') || lower.includes('role')) return <Shield size={17} />
  return <Cloud size={17} />
}

export const AWSInfrastructureGrid = () => {
  const [data, setData] = useState<InfraInventory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInventory = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    try {
      const response = await fetch('/api/infrastructure/inventory', { signal })
      if (!response.ok) throw new Error(`Infrastructure service returned HTTP ${response.status}.`)
      const payload: InfraInventory = await response.json()
      setData(payload)
      setError(null)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Unable to load cloud infrastructure inventory.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void fetchInventory(controller.signal)
    return () => controller.abort()
  }, [fetchInventory])

  return (
    <div className="control-panel infrastructure-panel">
      <div className="component-heading">
        <div>
          <p className="eyebrow">Cloud Architecture</p>
          <h2 className="topic-title">Terraform AWS Resources</h2>
          <p className="topic-description">
            Infrastructure modules defined in Terraform for VPC, compute, storage, routing, and observability.
          </p>
        </div>
        <div className="infra-header-meta">
          {data?.monthly_total_cost && (
            <span className="cost-tag">Est. {data.monthly_total_cost}</span>
          )}
          <button
            className="text-button"
            onClick={() => void fetchInventory()}
            disabled={loading}
            title="Refresh infrastructure state"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="infrastructure-unavailable error-state" role="alert">
          <AlertCircle size={18} />
          <p>{error}</p>
        </div>
      )}

      {loading && !data && !error && (
        <p className="empty-state">Loading Terraform resource inventory…</p>
      )}

      {data && (
        <>
          <div className="infra-state-bar">
            <div className="state-item">
              <span className="state-label">Provider</span>
              <strong className="state-value">{data.cloud_provider}</strong>
            </div>
            <div className="state-item">
              <span className="state-label">Region</span>
              <strong className="state-value">{data.region}</strong>
            </div>
            <div className="state-item">
              <span className="state-label">VPC CIDR</span>
              <code className="state-value">{data.vpc_cidr}</code>
            </div>
            <div className="state-item state-backend-item">
              <span className="state-label">State Storage</span>
              <code className="state-value">{data.state_backend}</code>
            </div>
          </div>

          <div className="infra-resource-grid">
            {data.resources.map((res) => (
              <article className="infra-resource-card" key={res.id}>
                <div className="resource-card-top">
                  <div className="resource-icon">{getResourceIcon(res.type)}</div>
                  <div className="resource-id-wrap">
                    <span className="resource-type">{res.type}</span>
                    <strong className="resource-name">{res.name}</strong>
                  </div>
                  <span className={`resource-status-pill ${res.status.toLowerCase()}`}>
                    {res.status}
                  </span>
                </div>
                <p className="resource-details">{res.details}</p>
                <div className="resource-card-footer">
                  <code className="resource-arn">{res.id}</code>
                  <span className="resource-cost">{res.cost_estimate}</span>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default AWSInfrastructureGrid
