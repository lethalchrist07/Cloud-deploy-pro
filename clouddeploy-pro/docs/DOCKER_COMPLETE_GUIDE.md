# CloudDeploy Pro - Complete Docker Guide

## 🚀 Quick Start

### Development Environment (with hot-reload)
```bash
make dev-up
```
- Backend: http://localhost:8000
- Frontend: http://localhost:3000
- Changes to code are reflected instantly

### Production Environment
```bash
make prod-up
```
- Optimized resource limits (2 CPUs, 1GB RAM for backend)
- Logging configured for production
- No code hot-reload (compiled assets only)

### Check Service Health
```bash
make health
```
Shows real-time status of backend, frontend, and Docker containers.

---

## 📁 Project Structure

```
clouddeploy-pro/
├── docker/
│   ├── docker-compose.yml          # Default (same as dev)
│   ├── docker-compose.dev.yml      # Development with hot-reload
│   ├── docker-compose.staging.yml  # Staging environment
│   ├── docker-compose.prod.yml     # Production (optimized)
│   ├── .env.example                # Environment template
│   └── .env                        # Local environment (git-ignored)
├── backend/
│   ├── Dockerfile                  # Multi-stage, optimized for caching
│   ├── .dockerignore               # Excludes unnecessary files
│   ├── app/                        # FastAPI application
│   └── requirements.txt            # Python dependencies
├── frontend/
│   ├── Dockerfile                  # Multi-stage React build
│   ├── .dockerignore               # Excludes node_modules, build artifacts
│   ├── nginx.conf                  # Production nginx config
│   ├── src/                        # React source code
│   └── package.json                # Node dependencies
├── scripts/
│   └── health-check.sh             # Service health monitoring
├── Makefile                        # Command shortcuts
├── .dockerignore                   # Root-level exclusions
└── .pre-commit-config.yaml         # Dockerfile linting hooks
```

---

## 🛠️ Available Commands

### Development
```bash
make dev-up          # Start development environment with hot-reload
make dev-down        # Stop development environment
make dev-logs        # View live logs
make dev-ps          # List running containers
make backend         # Run backend locally (outside Docker)
make frontend        # Run frontend locally (outside Docker)
```

### Production & Staging
```bash
make prod-up         # Start production environment
make prod-down       # Stop production environment
make staging-up      # Start staging environment
make staging-down    # Stop staging environment
```

### Build & Deploy
```bash
make build-backend   # Build backend image only
make build-frontend  # Build frontend image only
make build-all       # Build both images
```

### Testing & Quality
```bash
make test            # Run all tests
make lint            # Lint backend, frontend, and Dockerfiles
make format          # Format code (backend and frontend)
make health          # Check service health
```

### Cleanup
```bash
make clean           # Remove containers and prune unused resources
make clean-all       # Deep clean (including volumes)
```

---

## 🔧 Environment Configuration

### Available Variables

**docker/.env**
```env
# Application Settings
ENVIRONMENT=development          # development, staging, production
APP_VERSION=1.0.0
DEBUG=true                       # Enable debug mode
NODE_ENV=development

# Port Configuration
BACKEND_PORT=8000               # Backend API port
FRONTEND_PORT=3000              # Frontend port (dev) / 80 (prod)

# CI/CD (populated by GitHub Actions)
# GIT_COMMIT=abc123...
# DEPLOYED_AT=2024-01-15T10:30:00Z
```

### Port Configuration
Change ports by editing `.env`:
```env
BACKEND_PORT=9000
FRONTEND_PORT=4000
```

Then restart: `make dev-down && make dev-up`

---

## 📊 Environment Comparison

| Aspect | Development | Staging | Production |
|--------|-------------|---------|------------|
| Hot-reload | ✓ (volumes mounted) | ✗ | ✗ |
| Resource limits | 1 CPU, 512MB | 1.5 CPU, 768MB | 2 CPU, 1GB |
| DEBUG mode | true | false | false |
| Logging | Console | Console | JSON file (100MB max) |
| Restart policy | unless-stopped | always | always |
| Health checks | 30s interval | 30s interval | 60s interval |
| Network | dev-specific | staging-specific | prod-specific |

---

## 🐳 Docker Images

### Backend Image
- **Base**: `python:3.11-slim`
- **Size**: ~180MB (optimized with multi-stage build)
- **Non-root user**: `appuser`
- **Security**: curl for healthchecks, minimal dependencies

### Frontend Image
- **Base**: `nginx:alpine`
- **Size**: ~50MB (only static assets in runtime)
- **Security headers**: Enabled in nginx.conf
- **SPA support**: Falls back to index.html for client-side routing

---

## 🔒 Security Features

### Non-root Execution
Both containers run as non-root users:
- Backend: `appuser` (UID: auto-assigned)
- Frontend: `nginx` (default nginx user)

### Build Optimization
- `.dockerignore` reduces build context by 99%+
- Secrets never included in images
- Layer caching optimized (stable layers first)

### Network Isolation
- Services run on isolated networks per environment
- No default access to host system
- Resource limits prevent abuse

### Security Headers (Frontend)
```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: no-referrer-when-downgrade
```

---

## 📈 Performance

### Build Speed Optimization
1. **Layer Caching**: Copy `package.json` before source code
   - Dependency layer cached if manifest unchanged
   - Source layer rebuilds quickly

2. **.dockerignore**: 99.8% context reduction
   - Frontend: 102MB → 226KB
   - Backend: 150MB+ → <1MB

3. **Multi-stage builds**: Final image excludes build tools
   - No build dependencies in runtime
   - Smaller image = faster deployments

### Runtime Performance
- **Backend**: Healthchecks every 30s (prod) / 60s (dev)
- **Frontend**: Gzip compression enabled (assets ~70% smaller)
- **Static caching**: Assets cached for 1 year
- **Resource limits**: Prevents resource exhaustion

---

## 🏥 Health Monitoring

### Manual Health Check
```bash
make health
```

### Automated Healthchecks
Both containers have built-in healthchecks:
```bash
# Backend
curl http://localhost:8000/health

# Frontend  
curl http://localhost:3000/health
```

### View Container Logs
```bash
# Backend logs
docker logs clouddeploy-pro-backend

# Frontend logs
docker logs clouddeploy-pro-frontend

# Real-time logs
make dev-logs
```

### Docker Stats
```bash
docker stats
```

---

## 🚨 Troubleshooting

### Services Won't Start
```bash
# Check port conflicts
netstat -tuln | grep LISTEN

# View detailed logs
docker compose -f docker/docker-compose.yml logs

# Rebuild from scratch
make clean && make dev-up
```

### High Memory Usage
```bash
# Check container stats
docker stats

# Inspect resource usage
docker inspect <container_id> | grep -A 10 Memory

# Increase limits in docker-compose.yml
```

### Slow Builds
```bash
# Clear build cache
docker builder prune

# Check which layer is slow
docker build --progress=plain -t test .

# Rebuild without cache
docker build --no-cache -t clouddeploy-pro-backend:latest backend/
```

### Healthcheck Failing
```bash
# Check if ports are accessible
curl -v http://localhost:8000/health

# View healthcheck logs
docker inspect <container_id> | grep -A 5 "State"

# Restart container
docker restart <container_id>
```

---

## 📦 GitHub Actions - Docker Build & Push

### Setup
1. Add GitHub secrets:
   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_PASSWORD`: Docker Hub access token

2. Push to `main` or `develop` branch to trigger build

### Workflow Features
- ✓ Builds on every push/PR
- ✓ Pushes images to Docker Hub only on successful PR merge
- ✓ Uses layer caching for faster builds
- ✓ Automatic vulnerability scanning with Trivy
- ✓ Multi-platform support (AMD64, ARM64 ready)

### Image Tags
- `latest` (main branch)
- Branch name (e.g., `develop-abc123`)
- Semantic version tags (e.g., `v1.0.0`)

---

## 🔐 Pre-commit Hooks

### Setup
```bash
pip install pre-commit
pre-commit install
```

### Checks
- **Hadolint**: Lints all Dockerfiles for best practices
- **Trailing whitespace**: Removes trailing spaces
- **Large files**: Blocks files >1MB
- **JSON/YAML**: Validates syntax
- **Prettier**: Formats code

### Run Manually
```bash
pre-commit run --all-files
```

---

## 📚 Advanced Usage

### Hot-Reload Development
The dev compose mounts source code volumes:
```yaml
volumes:
  - ../backend/app:/app/app        # Backend code hot-reload
  - ../frontend/src:/app/src       # Frontend code hot-reload
```

Changes are reflected instantly without rebuild.

### Custom Environment Variables
1. Create `.env.local` in `docker/` folder
2. Load with: `docker compose --env-file .env.local up`

Or edit `docker/.env` directly (git-ignored).

### Deploy to Docker Hub
```bash
docker build -t yourusername/clouddeploy-pro-backend:1.0.0 backend/
docker push yourusername/clouddeploy-pro-backend:1.0.0
```

### Use Docker Compose Profiles (Future)
```bash
# Run only backend
docker compose up --profile backend

# Run only frontend
docker compose up --profile frontend
```

---

## ✅ What Was Optimized

| Issue | Before | After |
|-------|--------|-------|
| Build context | 102MB+ | 226KB |
| Deprecated syntax | ✗ | ✓ Fixed |
| Security (non-root) | ✗ | ✓ Implemented |
| Healthchecks | Curl missing | ✓ Working |
| Layer caching | Poor | ✓ Optimized |
| Environments | Single | ✓ Dev/Staging/Prod |
| Documentation | Minimal | ✓ Comprehensive |

---

## 📖 Next Steps

1. **Fix frontend TypeScript error** in `AddApplicationModal.tsx` for frontend to build
2. **Set up pre-commit hooks**: `pip install pre-commit && pre-commit install`
3. **Configure GitHub secrets** for CI/CD (Docker Hub credentials)
4. **Add DNS/reverse proxy** for production (recommend Nginx/Traefik)
5. **Implement log aggregation** (ELK stack or CloudWatch)
6. **Add monitoring dashboards** (Prometheus + Grafana)
