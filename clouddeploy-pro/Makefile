.PHONY: help setup dev-up dev-down backend frontend test lint format

# Variables
COMPOSE_FILE=docker/docker-compose.yml

# Help target
help:
	@echo "CloudDeploy Pro Makefile"
	@echo "========================"
	@echo "setup		- Set up development environment"
	@echo "dev-up		- Start development environment with Docker Compose"
	@echo "dev-down	- Stop development environment"
	@echo "backend		- Run backend locally (requires setup)"
	@echo "frontend	- Run frontend locally (requires setup)"
	@echo "test		- Run tests for backend and frontend"
	@echo "lint		- Run linters for backend and frontend"
	@echo "format		- Format code for backend and frontend"

# Setup development environment
setup:
	chmod +x scripts/setup-dev.sh
	./scripts/setup-dev.sh

# Start development environment with Docker Compose
dev-up:
	cd docker && docker-compose up --build

# Stop development environment
dev-down:
	cd docker && docker-compose down

# Run backend locally (requires setup)
backend:
	cd backend && source venv/bin/activate && uvicorn app.main:app --reload

# Run frontend locally (requires setup)
frontend:
	cd frontend && npm run dev

# Run tests for backend and frontend
test:
	@echo "Running backend tests..."
	cd backend && source venv/bin/activate && python -m pytest tests/ -v
	@echo "Running frontend tests..."
	cd frontend && npm test -- --run

# Run linters for backend and frontend
lint:
	@echo "Linting backend..."
	cd backend && source venv/bin/activate && flake8 app/ tests/ --max-line-length=127 || echo "Linting completed with warnings"
	@echo "Linting frontend..."
	cd frontend && npx eslint src --ext .ts,.tsx

# Format code for backend and frontend
format:
	@echo "Formatting backend..."
	cd backend && source venv/bin/activate && black app/ tests/
	@echo "Formatting frontend..."
	cd frontend && npx prettier --write src --ext .ts,.tsx

# Build Docker images locally
build-backend:
	cd backend && docker build -t clouddeploy-pro-backend:latest .

build-frontend:
	cd frontend && docker build -t clouddeploy-pro-frontend:latest .

build-all: build-backend build-frontend

# Clean up Docker images, containers, volumes, and networks
clean:
	docker system prune -af --volumes
	rm -rf backend/vendor frontend/node_modules
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete