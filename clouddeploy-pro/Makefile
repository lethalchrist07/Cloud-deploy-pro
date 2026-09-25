.PHONY: help setup dev-up dev-down backend frontend test lint format build-all clean

# Variables
COMPOSE_FILE_DEV=docker/docker-compose.yml
COMPOSE_FILE_PROD=docker/docker-compose.prod.yml
COMPOSE_FILE_STAGING=docker/docker-compose.staging.yml

# Help target
help:
	@echo "CloudDeploy Pro Makefile"
	@echo "========================"
	@echo "Dev Environment:"
	@echo "  make dev-up              - Start development environment with Docker Compose"
	@echo "  make dev-down            - Stop development environment"
	@echo "  make dev-logs            - View development logs"
	@echo "  make dev-ps              - List running containers"
	@echo ""
	@echo "Production:"
	@echo "  make prod-up             - Start production environment"
	@echo "  make prod-down           - Stop production environment"
	@echo ""
	@echo "Build & Deploy:"
	@echo "  make build-backend       - Build backend Docker image"
	@echo "  make build-frontend      - Build frontend Docker image"
	@echo "  make build-all           - Build all Docker images"
	@echo ""
	@echo "Local Development:"
	@echo "  make backend             - Run backend locally (requires setup)"
	@echo "  make frontend            - Run frontend locally (requires setup)"
	@echo "  make setup               - Set up development environment"
	@echo ""
	@echo "Testing & Quality:"
	@echo "  make test                - Run all tests"
	@echo "  make lint                - Run linters"
	@echo "  make format              - Format code"
	@echo "  make health              - Check service health"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean               - Clean up Docker resources"
	@echo "  make clean-all           - Deep clean (includes volumes)"

# Setup development environment
setup:
	chmod +x scripts/setup-dev.sh
	./scripts/setup-dev.sh

# Development environment
dev-up:
	cd docker && docker compose -f docker-compose.yml up --build

dev-down:
	cd docker && docker compose -f docker-compose.yml down

dev-logs:
	cd docker && docker compose -f docker-compose.yml logs -f

dev-ps:
	cd docker && docker compose -f docker-compose.yml ps

# Production environment
prod-up:
	cd docker && docker compose -f docker-compose.prod.yml up -d

prod-down:
	cd docker && docker compose -f docker-compose.prod.yml down

# Staging environment
staging-up:
	cd docker && docker compose -f docker-compose.staging.yml up -d

staging-down:
	cd docker && docker compose -f docker-compose.staging.yml down

# Run backend locally (requires setup)
backend:
	cd backend && source venv/bin/activate && uvicorn app.main:app --reload

# Run frontend locally (requires setup)
frontend:
	cd frontend && npm run dev

# Run tests
test:
	@echo "Running backend tests..."
	cd backend && source venv/bin/activate && python -m pytest tests/ -v
	@echo "Running frontend tests..."
	cd frontend && npm test -- --run

# Lint code
lint:
	@echo "Linting backend..."
	cd backend && source venv/bin/activate && flake8 app/ tests/ --max-line-length=127 || echo "Linting completed with warnings"
	@echo "Linting frontend..."
	cd frontend && npx eslint src --ext .ts,.tsx
	@echo "Linting Dockerfiles..."
	@command -v hadolint >/dev/null 2>&1 && hadolint backend/Dockerfile frontend/Dockerfile || echo "hadolint not installed, skipping"

# Format code
format:
	@echo "Formatting backend..."
	cd backend && source venv/bin/activate && black app/ tests/
	@echo "Formatting frontend..."
	cd frontend && npx prettier --write src --ext .ts,.tsx

# Build Docker images
build-backend:
	cd backend && docker build -t clouddeploy-pro-backend:latest .

build-frontend:
	cd frontend && docker build -t clouddeploy-pro-frontend:latest .

build-all: build-backend build-frontend

# Health check
health:
	@echo "Checking service health..."
	@bash scripts/health-check.sh

# Clean up Docker images, containers, volumes, and networks
clean:
	docker compose -f docker/docker-compose.yml down --remove-orphans
	docker system prune -f

clean-all:
	docker compose -f docker/docker-compose.yml down -v --remove-orphans
	docker system prune -af --volumes
	rm -rf backend/vendor frontend/node_modules
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete