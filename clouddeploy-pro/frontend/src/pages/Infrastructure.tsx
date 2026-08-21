import { Cloud, CheckCircle } from 'lucide-react'
import { AWSInfrastructureGrid } from '../components/AWSInfrastructureGrid'
import './Infrastructure.css'

export const Infrastructure = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <div className="page-icon"><Cloud size={22} color="#06B6D4" /></div>
          <h2>Infrastructure & Terraform Architecture</h2>
        </div>
        <p className="page-description">
          Active cloud resources provisioned via AWS Terraform modules
        </p>
      </div>

      <div className="infrastructure-content">
        <section className="section">
          <div className="section-header">
            <h3>AWS Infrastructure Topology</h3>
          </div>
          <div className="section-content">
            <AWSInfrastructureGrid />
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <h3>Terraform State Overview</h3>
          </div>
          <div className="section-content terraform-overview">
            <div className="overview-grid">
              <div className="overview-card">
                <div className="overview-label">Backend State Storage</div>
                <div className="overview-value">AWS S3 + DynamoDB</div>
                <div className="overview-details">Encrypted, versioned, and locked for team collaboration</div>
              </div>
              <div className="overview-card">
                <div className="overview-label">VPC CIDR Block</div>
                <div className="overview-value">10.0.0.0/16</div>
                <div className="overview-details">Private network isolation with public/private subnets</div>
              </div>
              <div className="overview-card">
                <div className="overview-label">EC2 Target Machine</div>
                <div className="overview-value">t3.medium (Ubuntu 22.04)</div>
                <div className="overview-details">2 vCPU, 4GB RAM, EBS-optimized</div>
              </div>
              <div className="overview-card">
                <div className="overview-label">Load Balancer</div>
                <div className="overview-value">Application Load Balancer</div>
                <div className="overview-details">Internet-facing, multi-AZ, SSL termination</div>
              </div>
              <div className="overview-card">
                <div className="overview-label">Auto Scaling Group</div>
                <div className="overview-value">2-4 instances</div>
                <div className="overview-details">Target tracking scaling policy</div>
              </div>
              <div className="overview-card">
                <div className="overview-label">Database</div>
                <div className="overview-value">Amazon RDS PostgreSQL</div>
                <div className="overview-details">db.t3.medium, Multi-AZ, automated backups</div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <h3>Resource Monitoring</h3>
          </div>
          <div className="section-content">
            <div className="monitoring-grid">
              <div className="monitoring-card">
                <h4>Cost Optimization</h4>
                <p className="monitoring-status" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={16} color="#10b981" /> Within budget</p>
                <p className="monitoring-detail">Estimated monthly: $45.20</p>
              </div>
              <div className="monitoring-card">
                <h4>Security Posture</h4>
                <p className="monitoring-status" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={16} color="#10b981" /> Hardened</p>
                <p className="monitoring-detail">All resources compliant with CIS benchmarks</p>
              </div>
              <div className="monitoring-card">
                <h4>Performance</h4>
                <p className="monitoring-status" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={16} color="#10b981" /> Optimal</p>
                <p className="monitoring-detail">99.9% uptime SLA</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Infrastructure
