import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';
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
}

const Applications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Fetch applications from backend
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/applications');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setApplications(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load applications');
      setLoading(false);
    }
  };

  // Create new application
  const createApplication = async (applicationData: Omit<Application, 'id' | 'status' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch('http://localhost:8000/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const newApp = await response.json();
      setApplications(prev => [...prev, newApp]);
      setShowAddModal(false);
      return newApp;
    } catch (err) {
      console.error('Error creating application:', err);
      throw err;
    }
  };

  // Delete application
  const deleteApplication = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:8000/applications/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      setApplications(prev => prev.filter(app => app.id !== id));
      if (selectedApp?.id === id) {
        setSelectedApp(null);
      }
    } catch (err) {
      console.error('Error deleting application:', err);
      throw err;
    }
  };

  // Deploy application
  const deployApplication = async (app: Application) => {
    try {
      setSelectedApp(app);
      const response = await fetch(`http://localhost:8000/applications/${app.id}/deploy`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      navigate(`/deployment`);
      return result;
    } catch (err) {
      console.error('Error deploying application:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchApplications();

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchApplications, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="applications-page">
      <div className="page-header">
        <div className="page-title">
          <h2>Applications</h2>
          <p className="page-description">
            Connect and manage your application repositories for deployment
          </p>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={18} /> Add Application
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => {
              setLoading(true);
              fetchApplications().finally(() => setLoading(false));
            }}
          >
            <RefreshCw size={18} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {loading && !applications.length && !error ? (
        <div className="loading-indicator">Loading applications...</div>
      ) : (
        <div className="applications-grid">
          {applications.length > 0 ? (
            applications.map(app => (
              <ApplicationCard
                key={app.id}
                app={app}
                onDelete={deleteApplication}
                onDeploy={deployApplication}
                onSelect={() => setSelectedApp(app)}
                selected={selectedApp?.id === app.id}
              />
            ))
          ) : (
            <div className="empty-state">
              <h3>No applications connected yet</h3>
              <p className="empty-state-description">
                Click &#34;Add Application&#34; to connect your first repository
              </p>
            </div>
          )}
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