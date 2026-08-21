# Installation Guide

This guide explains how to set up your local development environment for CloudDeploy Pro.

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Backend Installation](#backend-installation)
- [Frontend Installation](#frontend-installation)
- [Running Locally with Docker Compose](#running-locally-with-docker-compose)
- [Running Locally without Docker](#running-locally-without-docker)

## Overview

CloudDeploy Pro consists of two main components:
- **Backend**: A Python FastAPI application
- **Frontend**: A React + Vite + TypeScript dashboard

You can run both components locally for development and testing.

## Prerequisites

Before installing, ensure you have the following installed:
- **Git** (https://git-scm.com/)
- **Docker** (https://www.docker.com/get-started) - for containerized installation
- **Node.js** (version >= 18.0) - for frontend development
- **Python** (version >= 3.9) - for backend development
- **Make** (optional) - for using the provided Makefile

## Backend Installation

### Option 1: Using Docker (Recommended for Consistency)
```bash
# Clone the repository
git clone https://github.com/your-username/clouddeploy-pro.git
cd clouddeploy-pro

# Build and run the backend container
cd backend
docker build -t clouddeploy-pro-backend .
docker run -p 8000:8000 -e ENVIRONMENT=development clouddeploy-pro-backend
```

### Option 2: Local Installation
```bash
# Clone the repository
git clone https://github.com/your-username/clouddeploy-pro.git
cd clouddeploy-pro/backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables (create a .env file or export them)
export ENVIRONMENT=development
export APP_VERSION=1.0.0

# Run the application
uvicorn app.main:app --reload
```

The backend API will be available at `http://localhost:8000`.

## Frontend Installation

### Option 1: Using Docker (Recommended for Consistency)
```bash
# Clone the repository (if not already done)
git clone https://github.com/your-username/clouddeploy-pro.git
cd clouddeploy-pro

# Build and run the frontend container
cd frontend
docker build -t clouddeploy-pro-frontend .
docker run -p 3000:80 clouddeploy-pro-frontend
```

### Option 2: Local Installation
```bash
# Clone the repository
git clone https://github.com/your-username/clouddeploy-pro.git
cd clouddeploy-pro/frontend

# Install dependencies
npm ci

# Start the development server
npm run dev
```

The frontend dashboard will be available at `http://localhost:3000`.

## Running Locally with Docker Compose

The easiest way to run the entire application locally is using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/your-username/clouddeploy-pro.git
cd clouddeploy-pro

# Navigate to the docker directory
cd docker

# Start the services
docker-compose up --build
```

This will:
- Build the backend and frontend Docker images
- Start the backend on port 8000
- Start the frontend on port 3000

You can then access:
- Backend API: `http://localhost:8000`
- Frontend Dashboard: `http://localhost:3000`
- API Documentation: `http://localhost:8000/docs`

To stop the services:
```bash
docker-compose down
```

## Running Locally without Docker

If you prefer to run the services directly on your machine:

### Step 1: Start the Backend
```bash
cd clouddeploy-pro/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export ENVIRONMENT=development
export APP_VERSION=1.0.0
uvicorn app.main:app --reload
```

### Step 2: Start the Frontend (in a separate terminal)
```bash
cd clouddeploy-pro/frontend
npm ci
npm run dev
```

### Step 3: Access the Application
- Backend API: `http://localhost:8000`
- Frontend Dashboard: `http://localhost:3000`

## Environment Variables

The application uses the following environment variables:

### Backend
| Variable | Description | Default |
|----------|-------------|---------|
| `ENVIRONMENT` | Deployment environment (development, staging, production) | `development` |
| `APP_VERSION` | Application version | `1.0.0` |
| `GIT_COMMIT` | Git commit SHA (set by CI/CD) | `unknown` |
| `DEPLOYED_AT` | Deployment timestamp (set by CI/CD) | Current timestamp |

### Frontend
| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Node environment (development, production) | `development` |

## Development Tools

### Code Formatters
- **Backend**: Black (via `make format` or `black .`)
- **Frontend**: Prettier (via `npm run format`)

### Linters
- **Backend**: Flake8 (via `make lint` or `flake8 .`)
- **Frontend**: ESLint (via `npm run lint`)

### Testing
- **Backend**: Pytest (via `make test` or `python -m pytest tests/`)
- **Frontend**: Vitest (via `npm test`)

## Next Steps

After setting up your local environment, you can:
1. Explore the API documentation at `http://localhost:8000/docs`
2. Make changes to the code and see them reflected in real-time
3. Push your changes to GitHub to trigger the CI/CD pipeline
4. Deploy to AWS using the provided Terraform configurations

For more information on deploying to AWS, see the [Deployment Guide](deployment-guide.md).

---

*Last updated: August 2026*