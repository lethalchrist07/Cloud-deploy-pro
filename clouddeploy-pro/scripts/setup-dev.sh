#!/bin/bash
# Setup script for local development environment
# This script helps set up the development environment for CloudDeploy Pro

set -e  # Exit on any error

echo "Setting up CloudDeploy Pro development environment..."

# Check for required tools
check_tool() {
  if ! command -v "$1" &> /dev/null; then
    echo "Error: $1 is not installed. Please install it before proceeding."
    exit 1
  fi
}

# Check required tools
check_tool "git"
check_tool "docker"
check_tool "docker-compose"
check_tool "terraform"
check_tool "aws"

# Clone repository if not already done
if [ ! -d ".git" ]; then
  echo "This script should be run from the repository root."
  echo "Please clone the repository first:"
  echo "  git clone https://github.com/your-username/clouddeploy-pro.git"
  echo "  cd clouddeploy-pro"
  exit 1
fi

# Setup backend
echo "Setting up backend..."
cd backend
if [ ! -d "venv" ]; then
  python -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

# Setup frontend
echo "Setting up frontend..."
cd frontend
npm ci
cd ..

# Setup Docker Compose for local development
echo "Setting up Docker Compose..."
cd docker
# Pull latest images (optional)
# docker-compose pull
cd ..

# Create .env file for Docker Compose if it doesn't exist
if [ ! -f "docker/.env" ]; then
  echo "Creating .env file for Docker Compose..."
  cat > docker/.env << EOF
ENVIRONMENT=development
APP_VERSION=1.0.0
NODE_ENV=development
EOF
fi

echo ""
echo "Setup complete! You can now:"
echo "1. Start the backend: cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "2. Start the frontend: cd frontend && npm run dev"
echo "3. Or use Docker Compose: cd docker && docker-compose up --build"
echo ""
echo "Don't forget to set up AWS credentials and GitHub Secrets for deployment."
echo "See the documentation in the docs/ directory for more information."