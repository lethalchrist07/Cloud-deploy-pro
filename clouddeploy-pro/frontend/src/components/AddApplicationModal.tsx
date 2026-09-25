import { useState } from 'react';
import { X, CheckCircle2, Loader2 } from 'lucide-react';

interface InspectionResult {
  success: boolean;
  repository_name: string;
  repository_url: string;
  branch: string;
  description: string;
  default_branch: string;
  languages: string[];
  primary_language: string;
  frameworks: string[];
  project_type: string;
  package_manager: string;
  files: {
    package_json: boolean;
    requirements_txt: boolean;
    pyproject_toml: boolean;
    dockerfile: boolean;
    docker_compose: boolean;
    terraform: boolean;
    makefile: boolean;
    env_example: boolean;
  };
  docker_configuration: {
    has_dockerfile: boolean;
    has_docker_compose: boolean;
    dockerfile_path?: string;
    dockerfile_analysis: Record<string, unknown>;
    docker_compose_analysis: Record<string, unknown>;
  };
  terraform_configuration: {
    has_terraform: boolean;
    terraform_path?: string;
  };
  ci_cd_configuration: Record<string, boolean>;
  build_command?: string;
  start_command?: string;
  environment_variables: string[];
  deployment_readiness: string;
  warnings: string[];
  detailed_analysis: Record<string, unknown>;
}

interface AddApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (applicationData: {
    name: string;
    repository_url: string;
    branch: string;
    environment: string;
    dockerfile_path: string;
    terraform_path: string;
  }) => Promise<void>;
}

export const AddApplicationModal = ({
  isOpen,
  onClose,
  onCreate
}: AddApplicationModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    repository_url: '',
    branch: 'main',
    environment: 'development',
    dockerfile_path: './Dockerfile',
    terraform_path: './terraform'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [inspectionResults, setInspectionResults] = useState<InspectionResult | null>(null);
  const [inspectionLoading, setInspectionLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '', general: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Application name is required';
    }

    if (!formData.repository_url.trim()) {
      newErrors.repository_url = 'Repository URL is required';
    } else if (!formData.repository_url.startsWith('https://github.com/')) {
      newErrors.repository_url = 'Please enter a valid GitHub URL';
    }

    if (!formData.branch.trim()) {
      newErrors.branch = 'Branch is required';
    }

    const validEnvironments = ['development', 'staging', 'production'];
    if (!validEnvironments.includes(formData.environment)) {
      newErrors.environment = 'Please select a valid environment';
    }

    if (!formData.dockerfile_path.trim()) {
      newErrors.dockerfile_path = 'Dockerfile path is required';
    }

    if (!formData.terraform_path.trim()) {
      newErrors.terraform_path = 'Terraform path is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (inspectionResults) {
      setLoading(true);
      setSuccessMessage(null);

      try {
        await onCreate({
          ...formData,
          repository_url: formData.repository_url,
          branch: formData.branch,
          dockerfile_path: formData.dockerfile_path,
          terraform_path: formData.terraform_path
        });
        setSuccessMessage("Application added successfully!");
        setFormData({
          name: '',
          repository_url: '',
          branch: 'main',
          environment: 'development',
          dockerfile_path: './Dockerfile',
          terraform_path: './terraform'
        });
        setErrors({});
        setInspectionResults(null);

        setTimeout(() => {
          onClose();
        }, 1500);
      } catch (err) {
        setErrors(prev => ({ ...prev, general: err instanceof Error ? err.message : 'Unable to add application.' }));
      } finally {
        setLoading(false);
      }
    } else {
      setInspectionLoading(true);
      setErrors(prev => ({ ...prev, repository_url: "" }));

      try {
        const response = await fetch("/api/applications/inspect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            repository_url: formData.repository_url,
            branch: formData.branch || "main"
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.detail || `Repository inspection failed (HTTP ${response.status}).`);
        }
        setInspectionResults(result);
        setFormData(prev => ({
          ...prev,
          repository_url: result.repository_url,
          branch: result.branch,
          dockerfile_path: result.dockerfile_path ?? prev.dockerfile_path,
          terraform_path: result.terraform_path ?? prev.terraform_path
        }));
      } catch (err) {
        setErrors(prev => ({ ...prev, repository_url: err instanceof Error ? err.message : 'Unable to inspect this repository.' }));
      } finally {
        setInspectionLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => { if (!loading && !inspectionLoading) onClose() }}>
      <div className="relative w-full max-w-[650px] mx-auto overflow-y-auto max-h-[90vh]" role="dialog" aria-modal="true" aria-labelledby="add-application-title" onClick={(e) => e.stopPropagation()}>
        <div className="bg-secondary border border-active rounded-xl shadow-md glass flex flex-col h-full" style={{ borderRadius: 'var(--border-radius-lg)', padding: 'var(--space-5)', gap: 'var(--space-4)' }}>
          <div className="flex flex-col space-y-2" style={{ gap: 'var(--space-3)' }}>
            <h3 id="add-application-title" className="text-primary font-semibold text-lg">Add New Application</h3>
            <p className="text-muted text-sm">Connect a GitHub repository and configure its deployment settings.</p>
          </div>
          <button className="btn-icon" onClick={onClose} disabled={loading || inspectionLoading} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {successMessage && (
          <div className="p-4" role="status" style={{ backgroundColor: 'var(--bg-success)/10', border: '1px solid var(--border-success)/20', borderRadius: 'var(--border-radius-lg)', marginTop: 'calc(var(--space-5) * -1)', marginInline: 'calc(var(--space-5) * -1)', padding: 'var(--space-5)' }}>
            <CheckCircle2 size={14} className="text-success mr-2" />
            <span>{successMessage}</span>
          </div>
        )}
        {errors.general && <div className="error-alert" role="alert">{errors.general}</div>}

        {inspectionResults ? (
          <div className="p-4 space-y-4" style={{ marginTop: 'calc(var(--space-5) * -1)', marginInline: 'calc(var(--space-5) * -1)', padding: 'var(--space-5)' }}>
            <div className="bg-tertiary border border-active rounded-xl shadow-md p-4" style={{ borderRadius: 'var(--border-radius-lg)', padding: 'var(--space-5)' }}>
              <h3 className="font-semibold text-primary mb-2" style={{ marginBottom: 'var(--space-3)' }}>Inspection Results</h3>

              <div className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex">
                    <span className="w-32 text-muted">Repository:</span>
                    <span className="text-primary truncate max-w-[200px]">{inspectionResults.repository_url}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-muted">Branch:</span>
                    <span className="text-primary">{inspectionResults.branch}</span>
                  </div>
                  {inspectionResults.description && (
                    <div className="flex">
                      <span className="w-32 text-muted">Description:</span>
                      <span className="text-primary">{inspectionResults.description}</span>
                    </div>
                  )}
                  <div className="flex">
                    <span className="w-32 text-muted">Default Branch:</span>
                    <span className="text-primary">{inspectionResults.default_branch}</span>
                  </div>
                </div>

                <div className="border-t border-active pt-4">
                  <h4 className="font-medium text-primary mb-2">Project Analysis</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex">
                      <span className="w-32 text-muted">Primary Language:</span>
                      <span className="text-primary">{inspectionResults.primary_language}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-muted">Project Type:</span>
                      <span className="text-primary">{inspectionResults.project_type}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-muted">Package Manager:</span>
                      <span className="text-primary">{inspectionResults.package_manager}</span>
                    </div>
                    {inspectionResults.frameworks.length > 0 && (
                      <div className="flex">
                        <span className="w-32 text-muted">Frameworks:</span>
                        <span className="text-primary">{inspectionResults.frameworks.join(', ')}</span>
                      </div>
                    )}
                    {inspectionResults.languages.length > 0 && (
                      <div className="flex">
                        <span className="w-32 text-muted">Languages:</span>
                        <span className="text-primary">{inspectionResults.languages.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-active pt-4">
                  <h4 className="font-medium text-primary mb-2">Detected Files</h4>
                  <div className="space-y-1 text-sm">
                    {Object.entries(inspectionResults.files).map(([key, value]) => (
                      value && (
                        <div className="flex" key={key}>
                          <span className="w-32 text-muted">{key.replace('_', ' ').toUpperCase()}:</span>
                          <span className="text-primary">Yes</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>

                {(inspectionResults.build_command || inspectionResults.start_command) && (
                  <div className="border-t border-active pt-4">
                    <h4 className="font-medium text-primary mb-2">Commands</h4>
                    <div className="space-y-2 text-sm">
                      {inspectionResults.build_command && (
                        <div className="flex">
                          <span className="w-32 text-muted">Build Command:</span>
                          <span className="text-primary">{inspectionResults.build_command}</span>
                        </div>
                      )}
                      {inspectionResults.start_command && (
                        <div className="flex">
                          <span className="w-32 text-muted">Start Command:</span>
                          <span className="text-primary">{inspectionResults.start_command}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {inspectionResults.environment_variables.length > 0 && (
                  <div className="border-t border-active pt-4">
                    <h4 className="font-medium text-primary mb-2">Environment Variables</h4>
                    <div className="space-y-1 text-sm">
                      {inspectionResults.environment_variables.map((env, index) => (
                        <div className="flex" key={index}>
                          <span className="w-32 text-muted">{env}:</span>
                          <span className="text-primary">Detected</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-active pt-4">
                  <h4 className="font-medium text-primary mb-2">Deployment Readiness</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex">
                      <span className="w-32 text-muted">Status:</span>
                      <span className={`text-${inspectionResults.deployment_readiness === 'ready' ? 'success' : 'warning'}`}>
                        {inspectionResults.deployment_readiness}
                      </span>
                    </div>
                    {inspectionResults.warnings.length > 0 && (
                      <div className="mt-1">
                        <span className="w-32 text-muted">Warnings:</span>
                        <span className="text-warning text-xs">{inspectionResults.warnings.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {(inspectionResults.docker_configuration.has_dockerfile || inspectionResults.docker_configuration.has_docker_compose) && (
                  <div className="border-t border-active pt-4">
                    <h4 className="font-medium text-primary mb-2">Docker Configuration</h4>
                    <div className="space-y-2 text-sm">
                      {inspectionResults.docker_configuration.has_dockerfile && (
                        <div className="flex">
                          <span className="w-32 text-muted">Dockerfile:</span>
                          <span className="text-primary">Yes</span>
                        </div>
                      )}
                      {inspectionResults.docker_configuration.has_docker_compose && (
                        <div className="flex">
                          <span className="w-32 text-muted">Docker Compose:</span>
                          <span className="text-primary">Yes</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {inspectionResults.terraform_configuration.has_terraform && (
                  <div className="border-t border-active pt-4">
                    <h4 className="font-medium text-primary mb-2">Terraform Configuration</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex">
                        <span className="w-32 text-muted">Terraform:</span>
                        <span className="text-primary">Yes</span>
                      </div>
                    </div>
                  </div>
                )}

                {Object.values(inspectionResults.ci_cd_configuration).some(value => value) && (
                  <div className="border-t border-active pt-4">
                    <h4 className="font-medium text-primary mb-2">CI/CD Configuration</h4>
                    <div className="space-y-2 text-sm">
                      {Object.entries(inspectionResults.ci_cd_configuration).map(([key, value]) => (
                        value && (
                          <div className="flex" key={key}>
                            <span className="w-32 text-muted">{key.replace('_', ' ').toUpperCase()}:</span>
                            <span className="text-primary">Configured</span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setInspectionResults(null);
                }}
                className="btn btn-secondary w-full"
                style={{ marginTop: 'var(--space-5)', padding: '0.4rem 0.8rem' }}
              >
                Back to Form
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4" style={{ marginTop: 'calc(var(--space-5) * -1)', marginInline: 'calc(var(--space-5) * -1)', padding: 'var(--space-5)' }}>
            <div className="mb-4" style={{ marginBottom: 'var(--space-5)' }}>
              <label htmlFor="name" className="block text-sm font-medium text-muted mb-1">Application Name <span className="text-danger">*</span></label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input w-full ${errors.name ? 'border-danger' : ''} ${loading || inspectionLoading ? 'opacity-50' : ''}`}
                placeholder="Enter application name"
              />
              {errors.name && (
                <div className="mt-1 text-sm text-danger">{errors.name}</div>
              )}
            </div>

            <div className="mb-4" style={{ marginBottom: 'var(--space-5)' }}>
              <label htmlFor="repository_url" className="block text-sm font-medium text-muted mb-1">GitHub Repository URL <span className="text-danger">*</span></label>
              <input
                type="url"
                id="repository_url"
                name="repository_url"
                value={formData.repository_url}
                onChange={handleChange}
                className={`input w-full ${errors.repository_url ? 'border-danger' : ''} ${loading || inspectionLoading ? 'opacity-50' : ''}`}
                placeholder="https://github.com/username/repository"
              />
              {errors.repository_url && (
                <div className="mt-1 text-sm text-danger">{errors.repository_url}</div>
              )}
            </div>

            <div className="mb-4" style={{ marginBottom: 'var(--space-5)' }}>
              <label htmlFor="branch" className="block text-sm font-medium text-muted mb-1">Branch <span className="text-danger">*</span></label>
              <input
                type="text"
                id="branch"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                className={`input w-full ${errors.branch ? 'border-danger' : ''} ${loading || inspectionLoading ? 'opacity-50' : ''}`}
                placeholder="main"
              />
              {errors.branch && (
                <div className="mt-1 text-sm text-danger">{errors.branch}</div>
              )}
            </div>

            <div className="mb-4" style={{ marginBottom: 'var(--space-5)' }}>
              <label htmlFor="environment" className="block text-sm font-medium text-muted mb-1">Environment <span className="text-danger">*</span></label>
              <select
                id="environment"
                name="environment"
                value={formData.environment}
                onChange={handleChange}
                className={`input w-full ${errors.environment ? 'border-danger' : ''} ${loading || inspectionLoading ? 'opacity-50' : ''}`}
              >
                <option value="development">Development</option>
                <option value="staging">Staging</option>
                <option value="production">Production</option>
              </select>
              {errors.environment && (
                <div className="mt-1 text-sm text-danger">{errors.environment}</div>
              )}
            </div>

            <div className="mb-4" style={{ marginBottom: 'var(--space-5)' }}>
              <label htmlFor="dockerfile_path" className="block text-sm font-medium text-muted mb-1">Dockerfile Path <span className="text-danger">*</span></label>
              <input
                type="text"
                id="dockerfile_path"
                name="dockerfile_path"
                value={formData.dockerfile_path}
                onChange={handleChange}
                className={`input w-full ${errors.dockerfile_path ? 'border-danger' : ''} ${loading || inspectionLoading ? 'opacity-50' : ''}`}
                placeholder="./Dockerfile"
              />
              {errors.dockerfile_path && (
                <div className="mt-1 text-sm text-danger">{errors.dockerfile_path}</div>
              )}
            </div>

            <div className="mb-4" style={{ marginBottom: 'var(--space-5)' }}>
              <label htmlFor="terraform_path" className="block text-sm font-medium text-muted mb-1">Terraform Path <span className="text-danger">*</span></label>
              <input
                type="text"
                id="terraform_path"
                name="terraform_path"
                value={formData.terraform_path}
                onChange={handleChange}
                className={`input w-full ${errors.terraform_path ? 'border-danger' : ''} ${loading || inspectionLoading ? 'opacity-50' : ''}`}
                placeholder="./terraform"
              />
              {errors.terraform_path && (
                <div className="mt-1 text-sm text-danger">{errors.terraform_path}</div>
              )}
            </div>

            <div className="modal-actions flex justify-between items-center space-x-3" style={{ marginTop: 'var(--space-5)', gap: 'var(--space-3)' }}>
              <button
                type="button"
                className="btn btn-secondary w-full md:w-1/2"
                onClick={onClose}
                disabled={loading || inspectionLoading}
                style={{ opacity: loading || inspectionLoading ? 0.5 : 1, padding: '0.4rem 0.8rem' }}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary w-full md:w-1/2"
                disabled={loading || inspectionLoading}
                style={{ opacity: loading || inspectionLoading ? 0.5 : 1, padding: '0.4rem 0.8rem' }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="mr-2" />
                    Adding...
                  </>
                ) : inspectionResults ? (
                  'Add Application'
                ) : (
                  'Connect & Inspect Repository'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
