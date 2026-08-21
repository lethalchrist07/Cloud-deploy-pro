# Docker Commands Guide

This guide explains the essential Docker commands used in the CloudDeploy Pro project.

## Table of Contents
- [Overview](#overview)
- [Basic Docker Workflow](#basic-docker-workflow)
- [Common Docker Commands](#common-docker-commands)
- [Docker Compose Commands](#docker-compose-commands)
- [Environment-Specific Usage](#environment-specific-usage)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

CloudDeploy Pro uses Docker to containerize both the backend (Python FastAPI) and frontend (React + Vite + TypeScript) applications. Docker ensures consistent environments across development, testing, and production.

The project includes:
- `backend/Dockerfile` - Multi-stage Docker build for the backend
- `frontend/Dockerfile` - Multi-stage Docker build for the frontend
- `docker/docker-compose.yml` - Docker Compose file for local development

## Basic Docker Workflow

The standard Docker workflow for CloudDeploy Pro consists of:

1. **Build** (`docker build`): Creates a Docker image from a Dockerfile.
2. **Push** (`docker push`): Uploads a Docker image to a registry (Docker Hub in this project).
3. **Pull** (`docker pull`): Downloads a Docker image from a registry.
4. **Run** (`docker run`): Creates and starts a container from an image.

For local development, Docker Compose orchestrates multiple containers:
- **Build** (`docker-compose build`): Builds images for services defined in the Compose file.
- **Up** (`docker-compose up`): Creates and starts containers.
- **Down** (`docker-compose down`): Stops and removes containers.

## Common Docker Commands

Here are the most commonly used Docker commands in CloudDeploy Pro:

### Image Management
```bash
# Build an image from a Dockerfile
docker build -t IMAGE_NAME:TAG PATH_TO_DOCKERFILE

# Example: Build the backend image
cd backend
docker build -t clouddeploy-pro-backend:latest .

# Example: Build the frontend image
cd frontend
docker build -t clouddeploy-pro-frontend:latest .

# List images
docker images

# Remove an image
docker rmi IMAGE_NAME:TAG

# Remove all unused images
docker image prune
```

### Container Management
```bash
# Run a container from an image
docker run [OPTIONS] IMAGE[:TAG|@DIGEST] [COMMAND] [ARG...]

# Example: Run the backend container
docker run -d \
  -p 8000:8000 \
  -e ENVIRONMENT=development \
  -e APP_VERSION=1.0.0 \
  --name clouddeploy-pro-backend \
  clouddeploy-pro-backend:latest

# Example: Run the frontend container
docker run -d \
  -p 3000:80 \
  -e NODE_ENV=development \
  --name clouddeploy-pro-frontend \
  clouddeploy-pro-frontend:latest

# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Stop a container
docker stop CONTAINER_ID_OR_NAME

# Start a stopped container
docker start CONTAINER_ID_OR_NAME

# Remove a container
docker rm CONTAINER_ID_OR_NAME

# View container logs
docker logs CONTAINER_ID_OR_NAME

# Follow container logs in real-time
docker logs -f CONTAINER_ID_OR_NAME

# Execute a command in a running container
docker exec -it CONTAINER_ID_OR_NAME COMMAND

# Example: Get a shell in the backend container
docker exec -it clouddeploy-pro-backend sh
```

### Registry Operations
```bash
# Log in to a Docker registry
docker login

# Push an image to a registry
docker push IMAGE_NAME:TAG

# Example: Push the backend image to Docker Hub
docker push yourdockerhubuser/clouddeploy-pro-backend:latest

# Pull an image from a registry
docker pull IMAGE_NAME:TAG

# Example: Pull the frontend image from Docker Hub
docker pull yourdockerhubuser/clouddeploy-pro-frontend:latest
```

### Image Inspection
```bash
# Display detailed information about an image
docker inspect IMAGE_NAME:TAG

# Show the layers of an image
docker image history IMAGE_NAME:TAG

# Scan an image for vulnerabilities (requires Docker Scout or third-party tool)
docker scout cve IMAGE_NAME:TAG
```

## Docker Compose Commands

The `docker/docker-compose.yml` file defines two services: `backend` and `frontend`. Here are the essential Docker Compose commands:

### Project Lifecycle
```bash
# Navigate to the docker directory
cd docker

# Build images for all services
docker-compose build

# Build images for a specific service
docker-compose build backend

# Start all services
docker-compose up

# Start all services in detached mode (in the background)
docker-compose up -d

# Start services with build
docker-compose up --build

# Stop all services
docker-compose down

# Stop all services and remove volumes
docker-compose down -v

# View logs for all services
docker-compose logs

# View logs for a specific service
docker-compose logs backend

# Follow logs in real-time
docker-compose logs -f

# List running containers
docker-compose ps

# Execute a command in a running service container
docker-compose exec SERVICE_NAME COMMAND

# Example: Get a shell in the backend container
docker-compose exec backend sh

# Scale a service (not typically used in this project)
docker-compose up --scale backend=2
```

### Configuration Validation
```bash
# Validate the Compose file
docker-compose config

# Show resolved configuration
docker-compose config --services
```

## Environment-Specific Usage

### Development
For local development, use the Docker Compose file as-is:
```bash
cd docker
docker-compose up --build
```
This will:
- Build both backend and frontend images
- Start the backend on port 8000
- Start the frontend on port 3000
- Mount no volumes (changes require rebuild)

### Development with Live Code Reload
For development where you want to see code changes without rebuilding, you can override the Compose file. Create a `docker-compose.override.yml` file:

```yaml
# docker/docker-compose.override.yml
version: '3.8'
services:
  backend:
    volumes:
      - ../backend:/app
      - /app/node_modules  # Prevents overwriting mounted node_modules
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
  frontend:
    volumes:
      - ../frontend:/app
      - /app/node_modules
    command: npm run dev
```

Then run:
```bash
cd docker
docker-compose up --build
```

### Production-like Environment
To run a production-like setup locally:
```bash
cd docker
# Set environment variables for production
export COMPOSE_PROJECT_NAME=clouddeploy-pro
docker-compose -f docker-compose.yml up -d
```
Note: The Dockerfiles are already optimized for production (multi-stage builds, non-root users, etc.).

## Best Practices

### Image Building
1. **Use Multi-Stage Builds**: Both Dockerfiles use multi-stage builds to minimize the final image size by separating build-time dependencies from runtime dependencies.
2. **Leverage Build Cache**: Order your Dockerfile instructions from least to most frequently changed to maximize cache utilization.
3. **Use Specific Tags**: Avoid using `latest` in production environments. Use version tags or Git commit SHAs.
4. **Scan Images**: Regularly scan images for vulnerabilities using tools like Docker Scout, Trivy, or Snyk.

### Container Execution
1. **Run as Non-Root**: Both Dockerfiles create a non-root user for security.
2. **Set Resource Limits**: In production, consider setting memory and CPU limits:
   ```yaml
   # In docker-compose.yml or Kubernetes deployment
   deploy:
     resources:
       limits:
         cpus: "0.5"
         memory: 512M
       reservations:
         cpus: "0.25"
         memory: 256M
   ```
3. **Use Healthchecks**: Both Dockerfiles include HEALTHCHECK instructions that Docker uses to monitor container health.
4. **Restart Policies**: Use `unless-stopped` or `always` restart policies to ensure containers recover from failures.

### Docker Compose
1. **Use Environment Files**: For different environments, use `.env` files with Docker Compose:
   ```bash
   # Create a .env file in the docker directory
   echo "ENVIRONMENT=development" > .env
   echo "APP_VERSION=1.0.0" >> .env
   docker-compose up
   ```
2. **Extend for Production**: Create environment-specific Compose files:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```
3. **Version Control**: Commit your `docker-compose.yml` file but exclude any `.env` files containing secrets.

## Troubleshooting

### Common Issues

1. **"Cannot connect to the Docker daemon"**
   - Ensure Docker is running: `systemctl status docker` (Linux) or start Docker Desktop
   - On Linux, ensure your user is in the `docker` group: `sudo usermod -aG docker $USER`

2. **"pull access denied for IMAGE_NAME"**
   - You're trying to pull a private image without authenticating
   - Run `docker login` and ensure you have permission to access the image

3. **"no such image: IMAGE_NAME:TAG"**
   - The image doesn't exist locally or in the registry
   - Build the image first or check the registry for the correct tag

4. **"driver failed programming external connectivity on endpoint"**
   - Port conflict: another container or service is already using the host port
   - Change the host port in your `docker run` or Compose file:
     ```yaml
     ports:
       - "8080:8000"  # Host port 8080 maps to container port 8000
     ```

5. **"Container failed to start" or "exited with code X"**
   - Check the container logs: `docker logs CONTAINER_NAME`
   - Common causes:
     - Missing environment variables
     - Application errors during startup
     - Permission issues (trying to bind to privileged ports without proper capabilities)

6. **"Build fails"**
   - Check the build output for specific errors
   - Common causes:
     - Syntax errors in Dockerfile
     - Missing dependencies in the build stage
     - Network issues preventing package downloads

### Debugging Docker Builds
To debug a Docker build, you can:
1. Build with progress output: `docker build --progress=plain -t IMAGE_NAME .`
2. Use buildkit for better debugging: 
   ```bash
   DOCKER_BUILDKIT=1 docker build -t IMAGE_NAME .
   ```
3. Commit intermediate containers for inspection:
   ```bash
   # Add this to your Dockerfile to commit at a specific stage
   RUN <command> && ls -la
   ```
   Then build with: `docker build --target=STAGE_NAME -t IMAGE_NAME .`

### Debugging Docker Containers
To debug a running container:
```bash
# Get a shell in the container
docker exec -it CONTAINER_NAME sh

# If the container doesn't have a shell, you can try:
docker exec -it CONTAINER_NAME /bin/bash
# or
docker exec -it CONTAINER_NAME ash

# If the container is stripped down, you can still:
docker exec -it CONTAINER_NAME sh -c "export TERM=xterm && exec sh"
```

### Docker Compose Specific Issues

1. **"Configurations for services ... are similar but services ... must use the same network mode"**
   - This usually indicates a version mismatch in the Compose file
   - Ensure all services use compatible versions (prefer version '3.8' for Docker Engine 19.03+)

2. **"Couldn't connect to Docker daemon"**
   - Same as regular Docker issues - ensure Docker is running

3. **"No such service: SERVICE_NAME"**
   - Check the service name in your Compose file
   - Run `docker-compose config --services` to list all defined services

### Getting Help

- Run `docker --help` for a list of all Docker commands
- Run `docker <command> --help` for help on a specific command
- Run `docker-compose --help` for Docker Compose help
- Consult the official Docker documentation: https://docs.docker.com/
- Check the [Troubleshooting Guide](troubleshooting.md) for common deployment issues

---

*Last updated: August 2026*