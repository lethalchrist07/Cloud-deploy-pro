import { useState } from 'react';

export const APISandbox = () => {
  const [endpoint, setEndpoint] = useState('/health');
  const [response, setResponse] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endpoints = [
    { label: 'Health Probe (/health)', value: '/health' },
    { label: 'System Hardware Metrics (/system)', value: '/system' },
    { label: 'Deployment State (/deployment)', value: '/deployment' },
    { label: 'Pipeline Stages (/pipeline)', value: '/pipeline' },
    { label: 'Applications List (/applications)', value: '/applications' },
    { label: 'Infrastructure Inventory (/infrastructure/inventory)', value: '/infrastructure/inventory' },
    { label: 'Architectural Drawbacks (/drawbacks)', value: '/drawbacks' },
    { label: 'Environment Config (/environment)', value: '/environment' },
    { label: 'Recent Logs (/logs?lines=10)', value: '/logs?lines=10' },
    { label: 'Full Metrics Aggregation (/metrics)', value: '/metrics' },
  ];

  const callAPI = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api${endpoint}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">API Sandbox</h3>
      </div>
      <div className="card-content">
        <div className="sandbox-controls">
          <select
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            className="input"
          >
            {endpoints.map(ep => (
              <option key={ep.value} value={ep.value}>
                {ep.label}
              </option>
            ))}
          </select>
          <button
            onClick={callAPI}
            disabled={loading}
            className={loading ? 'btn btn-secondary' : 'btn btn-primary'}
          >
            {loading ? 'Calling...' : 'Call API'}
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {response !== null && (
          <div className="sandbox-response">
            <h4>Response:</h4>
            <pre className="json-response">{JSON.stringify(response, null, 2)}</pre>
          </div>
        )}

        {!response && !error && !loading && (
          <div className="placeholder">Select an endpoint and click Call API</div>
        )}
      </div>
    </div>
  );
};
