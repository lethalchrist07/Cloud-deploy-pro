# GitHub Secrets Setup Guide

This guide explains how to set up the required GitHub Secrets for the CloudDeploy Pro CI/CD workflows.

## Table of Contents
- [Overview](#overview)
- [Required Secrets](#required-secrets)
- [How to Add Secrets to GitHub](#how-to-add-secrets-to-github)
- [Secret Values and Examples](#secret-values-and-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

CloudDeploy Pro uses GitHub Actions for continuous integration and deployment. The workflows require access to various external services (AWS, Docker Hub, etc.) and sensitive information (SSH keys, API tokens). To keep this information secure, we use GitHub Secrets.

GitHub Secrets are encrypted environment variables that you create in your repository settings. They are available to workflows but are not exposed in logs or workflow files.

## Required Secrets

The following secrets are required for the CloudDeploy Pro workflows to function correctly:

| Secret Name | Description | Required For | Example Value |
|-------------|-------------|--------------|---------------|
| `AWS_ACCESS_KEY_ID` | AWS access key ID for the IAM user | All AWS-related workflows (Terraform, deployment) | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key for the IAM user | All AWS-related workflows | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_DEFAULT_REGION` | AWS region where resources will be deployed | All AWS-related workflows | `us-east-1` |
| `DOCKER_USERNAME` | Docker Hub username (or other registry username) | Docker build and push workflows | `dockerhubuser` |
| `DOCKER_PASSWORD` | Docker Hub password or personal access token | Docker build and push workflows | `dckr_pat_exampleToken` |
| `SSH_PRIVATE_KEY` | Private key for SSH access to EC2 instances | Deployment workflows (to SSH into EC2) | Contents of your .pem file |
| `SSH_PUBLIC_KEY` | Public key for SSH access (added to EC2 instances via user data) | Deployment workflows | Contents of your .pub file |
| `TF_STATE_BUCKET` | S3 bucket name for Terraform state (if using remote state) | Terraform workflows | `my-terraform-state-bucket` |
| `TF_STATE_KEY` | Terraform state file key in the S3 bucket | Terraform workflows | `clouddeploy-pro/terraform.tfstate` |

> **Note**: The `TF_STATE_BUCKET` and `TF_STATE_KEY` secrets are only required if you have configured Terraform to use a remote S3 backend. If you are using local state (not recommended for team environments), these secrets are not needed.

## How to Add Secrets to GitHub

Follow these steps to add secrets to your GitHub repository:

### Step 1: Navigate to Your Repository
Go to the main page of your CloudDeploy Pro repository on GitHub.

### Step 2: Access Repository Settings
Click on the "Settings" tab located below the repository name.

### Step 3: Navigate to Secrets
In the left sidebar, select "Secrets and variables", then click on "Actions".

### Step 4: Add a New Secret
Click the "New repository secret" button.

### Step 5: Enter Secret Details
- **Name**: Enter the secret name (e.g., `AWS_ACCESS_KEY_ID`)
- **Value**: Enter the secret value (e.g., your AWS access key ID)
- Click "Add secret" to save

### Step 6: Repeat for All Secrets
Repeat steps 4-5 for each required secret listed above.

## Secret Values and Examples

### AWS Credentials
To obtain your AWS access key ID and secret access key:
1. Sign in to the AWS Management Console
2. Open the IAM console at https://console.aws.amazon.com/iam/
3. In the navigation pane, choose "Users"
4. Select your IAM user (not a group)
5. Choose the "Security credentials" tab
6. In the "Access keys" section, choose "Create access key"
7. Copy the access key ID and secret access key

### Docker Hub Credentials
To obtain your Docker Hub credentials:
1. Sign in to Docker Hub at https://hub.docker.com/
2. Click on your profile icon and select "Account Settings"
3. Go to the "Security" tab
4. Under "Access Tokens", click "New Access Token"
5. Give your token a description and set permissions (read/write is sufficient for pushing images)
6. Click "Generate" and copy the token (use this as the `DOCKER_PASSWORD` value)

### SSH Keys
To generate an SSH key pair for EC2 access:
```bash
# Generate a new SSH key pair
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# This will create:
#   ~/.ssh/id_rsa (private key)
#   ~/.ssh/id_rsa.pub (public key)

# Copy the contents of the private key file (id_rsa) to the SSH_PRIVATE_KEY secret
# Copy the contents of the public key file (id_rsa.pub) to the SSH_PUBLIC_KEY secret
```

When creating the EC2 instance, the Terraform module includes the public key in the instance's user data, which is appended to the `~ubuntu/.ssh/authorized_keys` file during boot.

### Terraform State Secrets
If you are using an S3 bucket for Terraform state:
- `TF_STATE_BUCKET`: The name of the S3 bucket you created for Terraform state
- `TF_STATE_KEY`: The path within the bucket where the state file will be stored (e.g., `clouddeploy-pro/terraform.tfstate`)

## Best Practices

1. **Use Least Privilege IAM**: Instead of using `AdministratorAccess`, create a custom IAM policy with only the permissions required by CloudDeploy Pro (see the [AWS Setup Guide](aws-setup.md) for an example policy).

2. **Rotate Secrets Regularly**: Change your AWS keys, Docker Hub tokens, and SSH keys periodically.

3. **Limit SSH Access**: In production, restrict the `SSH_CIDR_BLOCKS` variable in your Terraform tfvars file to only your IP address or a bastion host subnet.

4. **Use Different Credentials per Environment**: Consider using separate AWS IAM users for different environments (dev, staging, production) to limit the blast radius of compromised credentials.

5. **Never Commit Secrets**: Double-check that your `.gitignore` file includes patterns to exclude files that might contain secrets (e.g., `.env`, `*.tfvars`, `*.json` files with credentials).

6. **Use GitHub Environments**: For added security, use GitHub Environments with protection rules and secrets that are only accessible to specific workflows.

## Troubleshooting

### Common Issues

1. **"AccessDenied" when accessing AWS**
   - Double-check that the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` secrets are set correctly
   - Verify that the IAM user has the necessary permissions
   - Ensure the `AWS_DEFAULT_REGION` matches the region where you're deploying resources

2. **"denied: requested access to the resource is denied" when pushing Docker images**
   - Verify that your `DOCKER_USERNAME` and `DOCKER_PASSWORD` are correct
   - Ensure your Docker Hub account has not reached its rate limit
   - Check that you're pushing to a repository you have access to

3. **"Permission denied (publickey)" when SSHing to EC2**
   - Confirm that the `SSH_PRIVATE_KEY` secret matches the private key corresponding to the public key you provided in the Terraform configuration
   - Check that the EC2 instance is running and has passed its status checks
   - Verify that the security group allows SSH (port 22) from your GitHub Actions runner's IP address

4. **"Error: failed to solve with frontend dockerfile.v0: failed to read dockerfile"**
   - This usually indicates a problem with the Dockerfile context
   - Ensure you're running the workflow from the repository root
   - Check that the Dockerfile exists in the expected location (`backend/Dockerfile` and `frontend/Dockerfile`)

5. **" terraform exit code 1"**
   - Look at the detailed error message in the workflow logs
   - Common causes include:
     - Incorrect Terraform version
     - Missing provider plugins
     - Syntax errors in Terraform files
     - Missing or incorrect variable values

### Getting Help

If you encounter issues that are not covered in this guide:
1. Check the workflow logs in GitHub Actions for detailed error messages
2. Refer to the [Troubleshooting Guide](troubleshooting.md) for common deployment issues
3. Review the [AWS Setup Guide](aws-setup.md) for AWS-specific troubleshooting
4. Search GitHub Issues in the repository for similar problems
5. Consider creating a new issue with detailed logs and steps to reproduce the problem

---

*Last updated: August 2026*