# Troubleshooting Guide

This guide provides solutions to common issues encountered when developing, testing, or deploying CloudDeploy Pro.

## Table of Contents
- [Overview](#overview)
- [General Troubleshooting Steps](#general-troubleshooting-steps)
- [Backend Issues](#backend-issues)
- [Frontend Issues](#frontend-issues)
- [Docker Issues](#docker-issues)
- [Terraform Issues](#terraform-issues)
- [AWS Issues](#aws-issues)
- [GitHub Actions Issues](#github-actions-issues)
- [Deployment Issues](#deployment-issues)
- [Performance Issues](#performance-issues)
- [Security Issues](#security-issues)
- [Getting Help](#getting-help)

## Overview

When working with a complex system like CloudDeploy Pro, issues can arise at various stages of the development and deployment lifecycle. This guide covers the most common problems and their solutions.

## General Troubleshooting Steps

Before diving into specific issues, follow these general steps:

1. **Check the Logs**: Most issues leave traces in logs. Check:
   - Backend logs: `docker logs backend` or `journalctl -u clouddeploy-pro-backend` (if running as service)
   - Frontend logs: Browser console (F12) or Docker logs
   - Docker daemon logs: `docker info` and `docker system events`
   - AWS CloudWatch logs: Use the AWS CLI or Console

2. **Verify Environment**: Ensure you're working in the correct environment (dev/staging/production) and that environment variables are set correctly.

3. **Check Versions**: Verify you're using the correct versions of tools:
   - Docker: `docker --version`
   - Docker Compose: `docker-compose --version`
   - Terraform: `terraform --version`
   - AWS CLI: `aws --version`
   - Node.js: `node --version`
   - Python: `python --version`

4. **Look for Error Messages**: Pay close attention to any error messages in the output - they often contain the solution.

5. **Reproduce the Issue**: Try to consistently reproduce the issue before attempting fixes.

6. **Check Recent Changes**: If the issue appeared recently, review what changed (code, configuration, dependencies).

7. **Search Known Issues**: Check the project's issue tracker or search online for similar problems.

## Backend Issues

### Issue: Backend fails to start
**Symptoms**: Container exits immediately or health check fails
**Possible Causes**:
- Missing environment variables
- Port already in use
- Application error during startup

**Solutions**:
1. Check the backend logs:
   ```bash
   docker logs backend
   ```
2. Verify required environment variables are set:
   ```bash
   docker inspect --format='{{.Config.Env}}' backend
   ```
3. Check if port 8000 is already in use:
   ```bash
   netstat -tulpn | grep :8000
   # or
   ss -tulpn | grep :8000
   ```
4. Try running the backend manually to see the error:
   ```bash
   docker run --rm -p 8000:8000 -e ENVIRONMENT=development -e APP_VERSION=1.0.0 clouddeploy-pro-backend
   ```

### Issue: API returns 500 errors
**Symptoms**: Frontend shows error messages or API returns 500 Internal Server Error
**Possible Causes**:
- Unhandled exceptions in the backend
- Database connection issues (if applicable)
- Missing dependencies

**Solutions**:
1. Check backend logs for stack traces
2. Enable debug mode by setting `DEBUG=true` in environment variables
3. Test the API directly with curl:
   ```bash
   curl -v http://localhost:8000/health
   curl -v http://localhost:8000/system
   ```
4. Check if all Python dependencies are installed:
   ```bash
   docker exec backend pip list
   ```

### Issue: High memory usage
**Symptoms**: Container using excessive memory, eventually getting killed
**Possible Causes**:
- Memory leak in the application
- Too many concurrent requests
- Insufficient memory allocation

**Solutions**:
1. Monitor memory usage over time:
   ```bash
   docker stats backend
   ```
2. Check for memory leaks in the code (look for unbounded accumulation of data)
3. Consider increasing memory limits or optimizing the application
4. Add resource limits to prevent the container from consuming all available memory:
   ```yaml
   # In docker-compose.yml
   deploy:
     resources:
       limits:
         memory: 512M
   ```

## Frontend Issues

### Issue: Frontend fails to load
**Symptoms**: Blank page or error in browser console
**Possible Causes**:
- Build errors
- Missing dependencies
- Incorrect API URL configuration

**Solutions**:
1. Check the browser console (F12) for JavaScript errors
2. Verify the frontend container is running:
   ```bash
   docker ps | grep frontend
   ```
3. Check frontend logs:
   ```bash
   docker logs frontend
   ```
4. Test if the frontend is serving files:
   ```bash
   curl -I http://localhost:3000
   ```
5. Verify the frontend can reach the backend API:
   ```bash
   # From inside the frontend container
   docker exec frontend curl -v http://backend:8000/health
   ```

### Issue: Stale content after update
**Symptoms**: Changes not reflecting after redeployment
**Possible Causes**:
- Browser caching
- Docker image caching
- CDN caching (if applicable)

**Solutions**:
1. Hard refresh the browser (Ctrl+F5 or Shift+F5)
2. Clear browser cache
3. Ensure you're pulling the latest Docker image:
   ```bash
   docker-compose pull frontend
   docker-compose up -d frontend
   ```
4. If using a custom domain, clear any CDN cache

## Docker Issues

### Issue: "Cannot connect to the Docker daemon"
**Symptoms**: Docker commands fail with connection errors
**Possible Causes**:
- Docker service not running
- User not in docker group (Linux)
- Docker Desktop not started (Mac/Windows)

**Solutions**:
1. Start Docker:
   - Linux: `sudo systemctl start docker`
   - Mac/Windows: Start Docker Desktop application
2. Add your user to the docker group (Linux):
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker  # or log out and back in
   ```
3. Verify Docker is running:
   ```bash
   docker info
   ```

### Issue: "Failed to build image"
**Symptoms**: Docker build process fails
**Possible Causes**:
- Syntax errors in Dockerfile
- Missing dependencies
- Network issues preventing package downloads

**Solutions**:
1. Check the build output for specific error messages
2. Build with detailed progress:
   ```bash
   docker build --progress=plain -t IMAGE_NAME .
   ```
3. Verify you have internet access for package downloads
4. Check that base images are available:
   ```bash
   docker pull python:3.11-slim
   docker pull node:18-alpine
   ```

### Issue: "Port is already allocated"
**Symptoms**: Error when trying to run a container on a specific port
**Possible Causes**:
- Another container or service is already using that port
- Orphaned container still holding the port

**Solutions**:
1. Find what's using the port:
   ```bash
   sudo lsof -i :8000
   # or
   ss -tulpn | grep :8000
   ```
2. Stop the conflicting process:
   ```bash
   # For Docker containers
   docker stop $(docker ps -q -f "publish=8000")
   
   # For non-Docker processes
   sudo kill -9 <PID>
   ```
3. Change the host port in your run command:
   ```bash
   docker run -p 8080:8000 IMAGE_NAME  # Maps host port 8080 to container port 8000
   ```

## Terraform Issues

### Issue: "Error: Failed to query available provider packages"
**Symptoms**: Terraform init fails to download providers
**Possible Causes**:
- No internet connectivity
- Proxy blocking access to registry.terraform.org
- Incorrect Terraform version

**Solutions**:
1. Verify internet connectivity
2. If behind a proxy, set the environment variables:
   ```bash
   export HTTP_PROXY=http://proxy.example.com:8080
   export HTTPS_PROXY=http://proxy.example.com:8080
   export NO_PROXY=localhost,127.0.0.1
   ```
3. Check you're using a compatible Terraform version (>= 1.0.0)
4. Try forcing a reinstall of providers:
   ```bash
   terraform init -upgrade
   ```

### Issue: "Error: Acquiring state lock"
**Symptoms**: Terraform commands hang or fail with lock error
**Possible Causes**:
- Another Terraform process is running
- Previous Terraform process crashed holding the lock
- Issues with the locking mechanism (DynamoDB or local)

**Solutions**:
1. Wait for any ongoing Terraform operations to complete
2. If you're sure no other Terraform process is running, force release the lock:
   ```bash
   # For local state
   terraform force-unlock <LOCK_ID>
   
   # For remote state (requires AWS CLI)
   # First get the lock ID from the DynamoDB table
   aws dynamodb scan \
     --table-name terraform-locks \
     --filter-expression "LockID = :lid" \
     --expression-attribute-values '{":lid": {"S": "lock-id-here"}}'
   # Then force unlock with the Lock ID
   ```
3. Check the DynamoDB table for stale locks if using remote state

### Issue: "Error: Error applying plan"
**Symptoms**: Terraform apply fails during execution
**Possible Causes**:
- Insufficient IAM permissions
- Resource conflicts
- Invalid configuration

**Solutions**:
1. Read the error message carefully - it usually indicates the specific resource and action that failed
2. Check IAM permissions for the AWS user/role being used
3. Run with detailed logging:
   ```bash
   export TF_LOG=DEBUG
   terraform apply
   ```
4. If it's a timeout issue, consider increasing timeouts:
   ```hcl
   # In your Terraform provider configuration
   provider "aws" {
     region = "us-east-1"
     # Increase timeouts for specific operations
     timeout "create" = "20m"
     timeout "update" = "20m"
     timeout "delete" = "20m"
   }
   ```

## AWS Issues

### Issue: "UnauthorizedOperation" or "AccessDenied"
**Symptoms**: AWS API calls fail with permission errors
**Possible Causes**:
- IAM user lacks required permissions
- Using wrong AWS credentials
- Region mismatch

**Solutions**:
1. Verify the AWS credentials being used:
   ```bash
   aws sts get-caller-identity
   ```
2. Check that the IAM user has the necessary permissions (see [AWS Setup Guide](aws-setup.md))
3. Ensure you're operating in the correct region:
   ```bash
   aws configure get region
   ```
4. Test a simple AWS command to isolate the issue:
   ```bash
   aws ec2 describe-availability-zones
   ```

### Issue: "Instance failed to pass status checks"
**Symptoms**: EC2 instance shows as impaired in AWS Console
**Possible Causes**:
- User data script failed to execute
- Instance ran out of memory during startup
- Missing dependencies in the instance

**Solutions**:
1. Check the instance system logs:
   ```bash
   aws ec2 get-console-output --instance-id i-0123456789abcdef0
   ```
2. If using CloudWatch Logs, check the logs for the instance
3. Verify the user data script in the Terraform module is correct
4. Try increasing the instance type if it's a resource issue:
   ```hcl
   # In your tfvars file
   instance_type = "t3.medium"  # instead of t3.micro
   ```

### Issue: "Timeout while waiting for SSH"
**Symptoms**: Deployment workflows fail when trying to SSH to EC2 instance
**Possible Causes**:
- Security group doesn't allow SSH from GitHub Actions IPs
- Instance not yet ready to accept SSH connections
- Incorrect SSH key

**Solutions**:
1. Verify the security group allows inbound SSH (port 22) from:
   - Your IP address (for manual testing)
   - GitHub Actions IP ranges (for workflows) - see https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#github-ip-addresses
2. Wait longer for the instance to initialize - the user data script may take time
3. Verify the SSH key pair:
   - The public key is correctly embedded in the Terraform user data
   - The private key matches the one in the `SSH_PRIVATE_KEY` secret
4. Check the instance status:
   ```bash
   aws ec2 describe-instance-status --instance-ids i-0123456789abcdef0
   ```

## GitHub Actions Issues

### Issue: "Workflow disabled"
**Symptoms**: Workflows don't trigger on push/pull request
**Possible Causes**:
- Workflow manually disabled
- Repository settings disabling workflows
- Fork pull request workflows disabled

**Solutions**:
1. Check if the workflow is disabled:
   - Go to the Actions tab in your repository
   - Look for the workflow and see if it shows as disabled
2. Check repository settings:
   - Settings → Actions → General
   - Ensure "Allow GitHub Actions to create and approve pull requests" is enabled if needed
   - Ensure workflows are allowed to be triggered
3. If it's a fork, ensure workflows are permitted to run in forked repositories

### Issue: "Secrets not available"
**Symptoms**: Workflow fails with errors about missing secrets
**Possible Causes**:
- Secret not defined in repository
- Secret name misspelled in workflow
- Secret not available to the workflow due to environment protections

**Solutions**:
1. Go to Settings → Secrets and variables → Actions
2. Verify all required secrets are defined
3. Check the workflow file for correct secret references:
   ```yaml
   env:
     AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
   ```
4. If using environments, ensure the secret is available to that environment
5. Remember that secrets are masked in logs - you won't see their values

### Issue: "Docker build failed"
**Symptoms**: Workflow fails during Docker image build
**Possible Causes**:
- Dockerfile syntax errors
- Missing build dependencies
- Network issues
- Timeouts

**Solutions**:
1. Check the detailed build logs in the workflow run
2. Try building the image locally to see if it reproduces:
   ```bash
   cd backend
   docker build -t test-image .
   ```
3. Increase build timeout if needed (GitHub Actions has a default timeout)
4. Consider using Docker buildkit for better caching and performance:
   ```yaml
   # In your workflow
   steps:
   - name: Set up Docker Buildx
     uses: docker/setup-buildx-action@v2
   - name: Build and push
     uses: docker/build-push-action@v3
     with:
       context: ./backend
       push: true
       tags: user/app:latest
   ```

## Deployment Issues

### Issue: "Health check failed"
**Symptoms**: Deployment workflow reports health check failure after container startup
**Possible Causes**:
- Application taking longer than expected to start
- Application failing to start
- Health check endpoint not implemented correctly
- Container not listening on the expected port

**Solutions**:
1. Check the deployment logs in the workflow for more details
2. SSH into the EC2 instance and check the container logs:
   ```bash
   docker logs clouddeploy-pro-backend
   ```
3. Test the health check endpoint directly on the instance:
   ```bash
   curl -v http://localhost:8000/health
   ```
4. Verify the container is listening on port 8000:
   ```bash
   netstat -tulpn | grep :8000
   # inside the container or on the host if port is mapped
   ```
5. Increase the health check timeout or interval in the workflow if the app just needs more time to start

### Issue: "Containers not starting after reboot"
**Symptoms**: After EC2 instance reboot, containers are not running
**Possible Causes**:
- Docker service not set to start on boot
- Restart policy not set correctly
- Images not pulled automatically

**Solutions**:
1. Ensure Docker is enabled to start on boot:
   ```bash
   sudo systemctl enable docker
   ```
2. Check the restart policy of your containers:
   ```bash
   docker inspect --format='{{.HostConfig.RestartPolicy}}' container_name
   ```
   Should be `unless-stopped` or `always`
3. Consider using a process manager like systemd to manage Docker Compose:
   ```bash
   # Create a systemd service file for docker-compose
   sudo tee /etc/systemd/system/clouddeploy-pro.service > /dev/null <<EOF
   [Unit]
   Description=CloudDeploy Pro Docker Compose Application
   Requires=docker.service
   After=docker.service

   [Service]
   WorkingDirectory=/opt/clouddeploy-pro
   ExecStart=/usr/local/bin/docker-compose up
   ExecStop=/usr/local/bin/docker-compose down
   TimeoutStartSec=0
   Restart=always
   RestartSec=10s

   [Install]
   WantedBy=multi-user.target
   EOF
   
   sudo systemctl daemon-reload
   sudo systemctl enable clouddeploy-pro.service
   ```

## Performance Issues

### Issue: High CPU usage
**Symptoms**: Container or instance showing high CPU utilization
**Possible Causes**:
- Inefficient code (infinite loops, unoptimized algorithms)
- Too many concurrent requests
- Lack of caching
- Background processes consuming resources

**Solutions**:
1. Identify the source of high CPU usage:
   ```bash
   # Inside the container
   top
   # or
   ps aux --sort=-%cpu | head
   
   # On the host for container stats
   docker stats --no-stream
   ```
2. Profile the application to find bottlenecks
3. Consider implementing caching (e.g., Redis for backend)
4. Optimize database queries if applicable
5. Use a load balancer and scale horizontally if traffic is high

### Issue: High memory usage
**Symptoms**: Memory usage constantly increasing or at high levels
**Possible Causes**:
- Memory leak in application
- Caching without limits
- Too many simultaneous connections
- Insufficient memory for workload

**Solutions**:
1. Monitor memory over time to confirm leak:
   ```bash
   docker stats --no-stream backend
   ```
2. Use memory profiling tools for Python (if backend):
   ```bash
   # Install memory profiler
   pip install memory_profiler
   # Add @profile decorator to functions and run with mprof
   ```
3. Implement cache expiration and limits
4. Consider using a connection pool for database connections
5. Increase memory allocation or optimize memory usage

### Issue: Slow response times
**Symptoms**: API requests or page loads taking longer than expected
**Possible Causes**:
- Network latency
- Inefficient database queries
- Lack of caching
- Blocking operations in event loop
- Insufficient resources

**Solutions**:
1. Use application performance monitoring (APM) tools
2. Check database query performance
3. Implement caching for frequently accessed data
4. Use asynchronous operations where possible
5. Optimize frontend bundle size:
   - Enable production builds
   - Use code splitting
   - Optimize images and assets
6. Consider using a CDN for static assets
7. Scale up instance size or add more instances behind a load balancer

## Security Issues

### Issue: Vulnerability reported in dependencies
**Symptoms**: Security scan reports vulnerabilities in Python/npm packages
**Possible Causes**:
- Outdated dependencies
- Known vulnerabilities in dependencies

**Solutions**:
1. Update dependencies:
   ```bash
   # Backend
   cd backend
   pip list --outdated
   pip install --upgrade -r requirements.txt
   
   # Frontend
   cd frontend
   npm outdated
   npm update
   ```
2. If updating is not immediately possible, assess if the vulnerability is exploitable in your context
3. Consider using a service like Dependabot or Snyk for automated dependency updates
4. For critical vulnerabilities, consider temporary workarounds or alternative packages

### Issue: Container running as root
**Symptoms**: Security scan flags containers for running as root
**Possible Causes**:
- Dockerfile doesn't create a non-root user
- USER directive missing or incorrect

**Solutions**:
1. Verify the Dockerfile includes a USER directive:
   ```dockerfile
   # Example from backend Dockerfile
   RUN useradd --create-home --shell /bin/bash app
   USER app
   ```
2. If using a base image that runs as root, explicitly create and switch to a non-root user
3. Test that the container runs as non-root:
   ```bash
   docker run --rm IMAGE_NAME id
   # Should show uid=1000(app) gid=1000(app) groups=1000(app)
   ```

### Issue: Secrets leaked in logs or environment
**Symptoms**: Sensitive information visible in logs, error messages, or environment dumps
**Possible Causes**:
- Logging sensitive data
- Error messages that include secrets
- Debugging endpoints that expose configuration

**Solutions**:
1. Audit code for logging of sensitive information
2. Ensure error handling doesn't expose secrets in messages
3. Disable debug endpoints in production
4. Use secrets masking in logs (some logging frameworks support this)
5. Never log environment variables wholesale - log only specific non-sensitive ones

## Getting Help

If you've exhausted the troubleshooting steps in this guide and still need assistance:

### 1. Check Project Documentation
- Review the [README.md](../README.md) for general information
- Check the specific [guides](../docs/) for detailed instructions
- Look at the [architecture](../architecture/architecture.mmd) for system design

### 2. Search Existing Issues
- Go to the Issues tab in the GitHub repository
- Search for keywords related to your problem
- Check both open and closed issues

### 3. Create a New Issue
If you can't find an existing issue that matches your problem:
1. Gather relevant information:
   - Error messages and logs
   - Steps to reproduce the issue
   - Environment details (OS, Docker version, etc.)
   - Relevant code snippets or configuration files
2. Create a new issue with:
   - A clear, descriptive title
   - Detailed description of the problem
   - Steps to reproduce
   - Expected vs. actual behavior
   - Logs and error messages
   - Any troubleshooting steps you've already tried
3. Use the appropriate issue template if available

### 4. Contact Maintainers
For urgent or security-related issues:
- Check if the project maintains a security policy (look for SECURITY.md)
- Follow the responsible disclosure process if applicable

### 5. Community Resources
- Stack Overflow (tag with relevant technologies: docker, terraform, aws, etc.)
- Reddit communities (r/docker, r/terraform, r/aws)
- Discord or Slack communities for DevOps/cloud technologies

### Important: Security Issues
If you believe you've discovered a security vulnerability:
1. **Do not** create a public issue
2. Follow the project's security reporting process if defined (look for SECURITY.md)
3. If no process is defined, contact the maintainers directly through a private channel
4. Provide detailed steps to reproduce the vulnerability
5. Allow reasonable time for a fix before public disclosure

---

*Last updated: August 2026*