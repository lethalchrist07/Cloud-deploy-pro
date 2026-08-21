# Deployment Guide

This guide explains how to deploy CloudDeploy Pro to AWS using the provided CI/CD pipelines or manually.

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Automated Deployment via GitHub Actions](#automated-deployment-via-github-actions)
- [Manual Deployment](#manual-deployment)
- [Rollback Procedure](#rollback-procedure)

## Overview

CloudDeploy Pro can be deployed using two main methods:
1. **Automated Deployment**: Using GitHub Actions workflows that trigger on code pushes.
2. **Manual Deployment**: Using Terraform CLI and Docker commands directly.

## Prerequisites

Before deploying, ensure you have:
- An AWS account with appropriate permissions
- Terraform installed (version >= 1.0.0)
- Docker installed (version >= 20.10)
- GitHub account for the repository
- AWS CLI configured with your credentials
- GitHub Secrets set up in the repository (see [GitHub Secrets Setup](#github-secrets-setup))

## Automated Deployment via GitHub Actions

The repository includes GitHub Actions workflows for continuous deployment:

1. **CI Workflow** (`.github/workflows/ci.yml`): Runs on pull requests to the `main` branch, executing tests, linting, and security scans.

2. **CD Workflows**:
   - **Staging** (`.github/workflows/cd-staging.yml`): Deploys to the staging environment on pushes to `main`.
   - **Production** (`.github/workflows/cd-production.yml`): Deploys to the production environment on pushes to the `production` branch.
   - **Rollback** (`.github/workflows/rollback.yml`): Manually triggered workflow to rollback to a specific commit.

### How It Works

When you push code to GitHub:
1. The CI workflow runs to validate the code.
2. If successful, the CD workflow:
   - Builds Docker images for the backend and frontend.
   - Pushes the images to Docker Hub (or your preferred registry).
   - Uses Terraform to provision/update the AWS infrastructure.
   - SSHs into the EC2 instance to deploy the new containers.
   - Performs a health check to ensure the deployment is successful.

### Setting Up GitHub Secrets

Refer to the [GitHub Secrets Setup](#github-secrets-setup) document for details on the required secrets.

## Manual Deployment

If you prefer to deploy manually, follow these steps:

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/clouddeploy-pro.git
cd clouddeploy-pro
```

### Step 2: Configure Terraform for Your Environment

Choose the environment you want to deploy to (dev, staging, or production) and navigate to the corresponding directory:
```bash
cd terraform/staging  # or dev/production
```

### Step 3: Initialize and Apply Terraform
```bash
terraform init
terraform plan -var-file="staging.tfvars"
terraform apply -var-file="staging.tfvars"
```

### Step 4: Deploy the Application

After Terraform successfully creates the EC2 instance, note the public IP from the output.

SSH into the instance:
```bash
ssh -i your-key.pem ubuntu@<ec2-public-ip>
```

On the EC2 instance, create a `docker-compose.yml` file:
```yaml
version: '3.8'
services:
  backend:
    image: your-dockerhub-user/clouddeploy-pro-backend:latest
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=staging
      - APP_VERSION=1.0.0
      # GIT_COMMIT and DEPLOYED_AT would be set by your CI/CD process
    restart: unless-stopped
  frontend:
    image: your-dockerhub-user/clouddeploy-pro-frontend:latest
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

Then, start the containers:
```bash
docker-compose pull
docker-compose up -d
```

### Step 5: Verify the Deployment

Check that the containers are running:
```bash
docker ps
```

Access the dashboard at `http://<ec2-public-ip>:3000`.

## Rollback Procedure

To rollback to a previous version:

### Using GitHub Actions (Recommended)
1. Go to the Actions tab in your GitHub repository.
2. Select the "Rollback" workflow.
3. Click "Run workflow".
4. Specify the environment and the commit SHA you want to rollback to.

### Manual Rollback
1. SSH into the EC2 instance.
2. Navigate to the directory containing the `docker-compose.yml` file (e.g., `/opt/clouddeploy-pro`).
3. Update the image tags in the `docker-compose.yml` file to the desired commit SHA.
4. Run:
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

## Troubleshooting

Refer to the [Troubleshooting Guide](troubleshooting.md) for common issues and their solutions.

---

*Last updated: August 2026*