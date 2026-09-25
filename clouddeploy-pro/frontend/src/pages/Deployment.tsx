import { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  RefreshCw,
  Trash2,
  Loader2,
  ExternalLink,
  Clock,
  Zap,
  Activity,
  Terminal,
  GitBranch,
  CheckCircle2,
  X,
  Search
} from 'lucide-react';
import './Deployment.css';

interface DeploymentLog {
  timestamp: string;
  deployment_id: string;
  application: string;
  stage: string;
  level: string;
  message: string;
}

interface DeploymentSummary {
  deployment_id: string;
  application: string;
  environment: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  duration: string | null;
  trigger: string;
  git_commit: string;
}

interface PipelineStage {
  name: string;
  status: string;
  details?: string | null;
}

interface PipelineData {
  pipeline_id: string | null;
  deployment_id: string | null;
  application: string | null;
  status: string;
  branch: string | null;
  commit: string | null;
  total_duration: string | null;
  last_run: string | null;
  error: string | null;
  stages: Array<{id: number, name: string, status: string, details?: string | null}>;
}

interface DeploymentProps {
  // We'll fetch our own data, so we don't need the props from Dashboard
}

export const Deployment = () => {
  const [deployments, setDeployments] = useState<DeploymentSummary[]>([]);
  const [pipelineData, setPipelineData] = useState<PipelineData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeployment, setSelectedDeployment] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Fetch deployment history from logs
  const fetchDeploymentHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/logs?lines=1000');
      if (!response.ok) {
        throw new Error(`Failed to fetch deployment history: ${response.status}`);
      }
      const data = await response.json();
      const logs: DeploymentLog[] = data.logs || [];

      // Group logs by deployment_id to build deployment summaries
      const deploymentMap = new Map<string, DeploymentSummary>();

      logs.forEach(log => {
        const depId = log.deployment_id;
        if (!deploymentMap.has(depId)) {
          deploymentMap.set(depId, {
            deployment_id: depId,
            application: log.application,
            environment: 'unknown', // We'll need to get this from deployment details
            status: 'unknown',
            started_at: log.timestamp,
            ended_at: null,
            duration: null,
            trigger: 'Unknown',
            git_commit: 'unknown'
          });
        }

        const dep = deploymentMap.get(depId)!;
        // Update timestamps
        if (log.timestamp < dep.started_at) {
          dep.started_at = log.timestamp;
        }
        if (!dep.ended_at || log.timestamp > dep.ended_at) {
          dep.ended_at = log.timestamp;
        }

        // Update status based on stage
        const stageLower = log.stage.toLowerCase();
        if (stageLower.includes('success') || stageLower.includes('completed')) {
          dep.status = 'Success';
        } else if (stageLower.includes('failed') || stageLower.includes('error')) {
          dep.status = 'Failed';
        } else if (stageLower.includes('running') || stageLower.includes('started') || stageLower.includes('building')) {
          dep.status = 'Running';
        } else {
          dep.status = 'Queued';
        }

        // Extract git commit from message if possible
        if (log.message.includes('commit') || log.message.includes('git')) {
          const commitMatch = log.message.match(/[a-f0-9]{7,40}/);
          if (commitMatch) {
            dep.git_commit = commitMatch[0];
          }
        }
      });

      // Calculate durations and finalize
      const deploymentSummaries: DeploymentSummary[] = Array.from(deploymentMap.values()).map(dep => {
        // Calculate duration
        let duration: string | null = null;
        if (dep.ended_at) {
          const start = new Date(dep.started_at);
          const end = new Date(dep.ended_at);
          const diffMs = end.getTime() - start.getTime();
          const diffSec = Math.round(diffMs / 1000);
          const hours = Math.floor(diffSec / 3600);
          const minutes = Math.floor((diffSec % 3600) / 60);
          const seconds = diffSec % 60;

          if (hours > 0) {
            duration = `${hours}h ${minutes}m ${seconds}s`;
          } else if (minutes > 0) {
            duration = `${minutes}m ${seconds}s`;
          } else {
            duration = `${seconds}s`;
          }
        }

        // Try to get environment and more details from deployment endpoint (simplified for now)
        // In a full implementation, we'd fetch each deployment, but that's inefficient
        // For now, we'll use placeholder values or infer from logs

        return {
          ...dep,
          duration,
          environment: 'development' // Placeholder - would need to fetch from deployment details
        };
      }).sort((a, b) =>
        new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      );

      setDeployments(deploymentSummaries);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deployment history');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch pipeline data for latest deployment
  const fetchPipelineData = useCallback(async () => {
    try {
      const response = await fetch('/api/pipeline');
      if (!response.ok) {
        // Don't set error for pipeline as it's ok to have no pipeline
        setPipelineData(null);
        return;
      }
      const data = await response.json();
      setPipelineData(data);
    } catch (err) {
      console.warn('Could not load pipeline data:', err);
      setPipelineData(null);
    }
  }, []);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchDeploymentHistory(),
      fetchPipelineData()
    ]);
  }, [fetchDeploymentHistory, fetchPipelineData]);

  // Setup polling
  useEffect(() => {
    refreshAll();

    const interval = setInterval(() => {
      refreshAll();
    }, 15000); // Refresh every 15 seconds

    return () => clearInterval(interval);
  }, [refreshAll]);

  // Filter deployments based on search and status
  const filteredDeployments = deployments.filter(dep => {
    const matchesSearch = dep.application.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dep.deployment_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dep.git_commit.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'ALL' || dep.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  // Status badge class
  const getStatusClass = (status: string): string => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'success') return 'deployment-status success';
    if (lowerStatus === 'failed') return 'deployment-status failed';
    if (lowerStatus === 'running') return 'deployment-status running';
    return 'deployment-status queued';
  };

  // Duration formatter
  const formatDuration = (duration: string | null): string => {
    if (!duration) return 'Ongoing';
    return duration;
  };

  return (
    <div className="deployment-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <div className="page-icon">
            <Clock size={22} />
          </div>
          <h2>Deployment History & Operations</h2>
        </div>
        <p className="page-description">
          Monitor deployment operations, view pipeline stages, and inspect deployment history.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <div className="error-message">{error}</div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && deployments.length === 0 && pipelineData === null && (
        <div className="loading-indicator">
          <Loader2 size={24} className="spin" />
          <p>Loading deployment data...</p>
        </div>
      )}

      {/* Deployment Controls */}
      <div className="deployment-controls">
        <div className="controls-left">
          <button
            className="btn btn-primary"
            onClick={() => {/* Would trigger new deployment - handled elsewhere */}}
          >
            <Plus size={18} /> New Deployment
          </button>
        </div>

        <div className="controls-right">
          <div className="search-filters">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search deployments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="btn-icon"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="status-filter">
              <span>Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="status-select"
              >
                <option value="ALL">All Statuses</option>
                <option value="Queued">Queued</option>
                <option value="Running">Running</option>
                <option value="Success">Success</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            <button
              className="btn btn-secondary"
              onClick={refreshAll}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline Section */}
      {!isLoading && (
        <div className="pipeline-section">
          <div className="section-header">
            <h3>Current Deployment Pipeline</h3>
            {pipelineData ? (
              <button
                className="btn btn-link"
                onClick={() => {
                  if (pipelineData.deployment_id) {
                    // Would navigate to deployment details view
                  }
                }}
              >
                View Details <ExternalLink size={14} />
              </button>
            ) : null}
          </div>
          <div className="section-content">
            {pipelineData ? (
              <>
                <div className="pipeline-info">
                  <div className="pipeline-item">
                    <span className="pipeline-label">Application:</span>
                    <span className="pipeline-value">
                      {pipelineData.application || 'None'}
                    </span>
                  </div>
                  <div className="pipeline-item">
                    <span className="pipeline-label">Branch:</span>
                    <span className="pipeline-value">
                      {pipelineData.branch || 'None'}
                    </span>
                  </div>
                  <div className="pipeline-item">
                    <span className="pipeline-label">Commit:</span>
                    <span className="pipeline-value">
                      {pipelineData.commit || 'None'}
                    </span>
                  </div>
                  <div className="pipeline-item">
                    <span className="pipeline-label">Status:</span>
                    <span className={`pipeline-status ${pipelineData.status.toLowerCase()}`}>
                      {pipelineData.status}
                    </span>
                  </div>
                  <div className="pipeline-item">
                    <span className="pipeline-label">Duration:</span>
                    <span className="pipeline-value">
                      {pipelineData.total_duration || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="pipeline-stages">
                  <h4>Pipeline Stages</h4>
                  {pipelineData.stages.map(stage => (
                    <div key={stage.id} className="pipeline-stage">
                      <div className="stage-number">#{stage.id}</div>
                      <div className="stage-content">
                        <h5>{stage.name}</h5>
                        <span className={`stage-status ${stage.status.toLowerCase()}`}>
                          {stage.status}
                        </span>
                        {stage.details && <p className="stage-details">{stage.details}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <h3>No Active Pipeline</h3>
                <p>No deployment pipeline is currently active.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deployment History Table */}
      <div className="history-section">
        <div className="section-header">
          <h3>Deployment History</h3>
          <span className="history-count">
            Showing {filteredDeployments.length} of {deployments.length} deployments
          </span>
        </div>
        <div className="section-content">
          {isLoading && !filteredDeployments.length ? (
            <div className="loading-indicator">
              <Loader2 size={20} className="spin" />
              <p>Loading deployment history...</p>
            </div>
          ) : filteredDeployments.length === 0 ? (
            <div className="empty-state-large">
              <div className="empty-state-icon">
                <Terminal size={48} />
              </div>
              <h3>No Deployment History</h3>
              <p className="empty-state-description">
                No deployments have been recorded yet. Deploy an application to begin tracking deployment history.
              </p>
              <div className="empty-state-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => {/* Trigger new deployment */}}
                >
                  <Rocket size={20} />
                  Deploy Application
                </button>
              </div>
            </div>
          ) : (
            <div className="deployment-table">
              <div className="table-header">
                <div className="table-cell">Application</div>
                <div className="table-cell">Environment</div>
                <div className="table-cell">Commit</div>
                <div className="table-cell">Status</div>
                <div className="table-cell">Started</div>
                <div className="table-cell">Duration</div>
                <div className="table-cell">Triggered By</div>
                <div className="table-cell">Actions</div>
              </div>

              <div className="table-body">
                {filteredDeployments.map((deployment, index) => (
                  <div key={deployment.deployment_id || index} className="table-row">
                    <div className="table-cell">
                      <div className="app-info">
                        <strong>{deployment.application}</strong>
                        <br />
                        <small className="app-id">{deployment.deployment_id?.substring(0, 8)}</small>
                      </div>
                    </div>
                    <div className="table-cell">
                      <span className="env-tag">{deployment.environment}</span>
                    </div>
                    <div className="table-cell">
                      <div className="commit-info">
                        <code>{deployment.git_commit?.substring(0, 8)}</code>
                      </div>
                    </div>
                    <div className="table-cell">
                      <span className={getStatusClass(deployment.status)}>
                        {deployment.status}
                      </span>
                    </div>
                    <div className="table-cell">
                      <time dateTime={deployment.started_at}>
                        {new Date(deployment.started_at).toLocaleString()}
                      </time>
                    </div>
                    <div className="table-cell">
                      {formatDuration(deployment.duration)}
                    </div>
                    <div className="table-cell">
                      {deployment.trigger}
                    </div>
                    <div className="table-cell">
                      <div className="action-buttons">
                        <button
                          className="btn btn-icon btn-info"
                          onClick={() => {
                            // Would show deployment details
                            setSelectedDeployment(deployment.deployment_id);
                          }}
                          title="View Details"
                        >
                          <ExternalLink size={14} />
                        </button>
                        <button
                          className="btn btn-icon btn-secondary"
                          onClick={() => {
                            // Would show logs for this deployment
                          }}
                          title="View Logs"
                        >
                          <Terminal size={14} />
                        </button>
                        {deployment.status === 'Running' && (
                          <button
                            className="btn btn-icon btn-warning"
                            onClick={() => {
                              // Would cancel deployment
                            }}
                            title="Cancel Deployment"
                            disabled={true} // Would be enabled if cancellation supported
                          >
                            <Zap size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Deployment;