import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Circle, Loader2 } from 'lucide-react'
import './PipelineTimeline.css'

interface PipelineStage {
  id: number
  name: string
  status: string
  details?: string
}

interface PipelineData {
  pipeline_id?: string | null
  deployment_id?: string | null
  application?: string
  status: string
  branch?: string
  commit?: string | null
  version?: string | null
  total_duration?: string | null
  last_run?: string
  error?: string | null
  message?: string
  stages: PipelineStage[]
}

const statusIcon = (status: string) => {
  const normalized = status.toLowerCase()
  if (['success', 'healthy'].includes(normalized)) return <CheckCircle2 size={17} className="stage-status-icon passed" />
  if (normalized === 'failed' || normalized === 'unhealthy') return <AlertCircle size={17} className="stage-status-icon failed" />
  if (['building', 'starting', 'health_check'].includes(normalized)) return <Loader2 size={17} className="stage-status-icon loading spin" />
  return <Circle size={17} className="stage-status-icon pending" />
}

export const PipelineTimeline = () => {
  const [pipeline, setPipeline] = useState<PipelineData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch('/api/pipeline', { signal })
      if (!response.ok) throw new Error(`Pipeline status returned HTTP ${response.status}.`)
      setPipeline(await response.json())
      setError(null)
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return
      setError(requestError instanceof Error ? requestError.message : 'Pipeline status is unavailable.')
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void refresh(controller.signal)
    const interval = window.setInterval(() => void refresh(controller.signal), 3000)
    return () => {
      controller.abort()
      window.clearInterval(interval)
    }
  }, [refresh])

  const pipelineStatus = pipeline?.status?.toUpperCase() || 'PENDING'
  const statusClass = pipelineStatus.toLowerCase().replace(/[^a-z0-9_-]/g, '-')

  return (
    <div className="control-panel pipeline-panel">
      <div className="component-heading">
        <div>
          <p className="eyebrow">Local Docker Delivery</p>
          <h2 className="topic-title">Deployment Pipeline</h2>
          <p className="topic-description">Real repository build, container startup, and application health status.</p>
        </div>
        {pipeline?.deployment_id && <span className={`pipeline-status-pill ${statusClass}`}>{pipelineStatus.replace(/_/g, ' ')}</span>}
      </div>

      {error && <div className="pipeline-unavailable" role="alert"><AlertCircle size={18} /><p>{error}</p></div>}
      {!error && pipeline && pipeline.stages.length === 0 && (
        <div className="pipeline-unavailable" role="status"><Circle size={18} /><p>{pipeline.message || 'No Docker deployment has been started. Deploy a registered application to begin.'}</p></div>
      )}
      {pipeline && pipeline.stages.length > 0 && (
        <>
          <div className="pipeline-context-bar">
            <div className="context-item"><span>Application</span><strong>{pipeline.application || 'Unavailable'}</strong></div>
            <div className="context-item"><span>Branch</span><strong>{pipeline.branch || 'Unavailable'}</strong></div>
            <div className="context-item"><span>Commit</span><code>{pipeline.commit || 'Pending'}</code></div>
            {pipeline.total_duration && <div className="context-item"><span>Duration</span><strong>{pipeline.total_duration}</strong></div>}
          </div>
          {pipeline.error && <div className="pipeline-unavailable pipeline-error" role="alert"><AlertCircle size={18} /><p>{pipeline.error}</p></div>}
          <div className="pipeline-flow-container">
            {pipeline.stages.map(stage => (
              <article className="pipeline-stage-card" key={stage.id}>
                <div className="stage-card-header"><span className="stage-num">STAGE 0{stage.id}</span><span className={`stage-state ${stage.status.toLowerCase()}`}>{stage.status.replace(/_/g, ' ')}</span></div>
                <div className="stage-name-row">{statusIcon(stage.status)}<strong className="stage-name">{stage.name}</strong></div>
                <p className="stage-details">{stage.details || 'Waiting for this stage to run.'}</p>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
