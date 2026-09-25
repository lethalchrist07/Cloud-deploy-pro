#!/bin/bash

# Health Check Script for CloudDeploy Pro
# Checks both backend and frontend service health

set -e

BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
BACKEND_HEALTH="${BACKEND_URL}/health"
FRONTEND_HEALTH="${FRONTEND_URL}/health"
TIMEOUT=10

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         CloudDeploy Pro - Service Health Check                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check service health
check_service() {
    local service_name=$1
    local health_url=$2
    local description=$3
    
    echo -n "Checking ${BLUE}${service_name}${NC}... "
    
    if response=$(curl -s -m $TIMEOUT -w "\n%{http_code}" "$health_url" 2>/dev/null); then
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | head -n-1)
        
        if [ "$http_code" = "200" ]; then
            echo -e "${GREEN}✓ HEALTHY${NC}"
            echo "  Response: $body"
            return 0
        else
            echo -e "${RED}✗ UNHEALTHY${NC} (HTTP $http_code)"
            echo "  Response: $body"
            return 1
        fi
    else
        echo -e "${RED}✗ UNREACHABLE${NC}"
        echo "  URL: $health_url"
        return 1
    fi
    echo ""
}

# Function to check Docker containers
check_containers() {
    echo "Checking Docker Containers:"
    echo ""
    
    if ! command -v docker &> /dev/null; then
        echo -e "${YELLOW}⚠ Docker CLI not found${NC}"
        return 1
    fi
    
    backend_container=$(docker ps --filter "name=clouddeploy-pro-backend" -q | head -1)
    frontend_container=$(docker ps --filter "name=clouddeploy-pro-frontend" -q | head -1)
    
    if [ -n "$backend_container" ]; then
        echo -e "  Backend Container:  ${GREEN}RUNNING${NC} ($backend_container)"
        docker stats --no-stream $backend_container 2>/dev/null | tail -1 || echo "    (stats unavailable)"
    else
        echo -e "  Backend Container:  ${RED}NOT RUNNING${NC}"
    fi
    
    if [ -n "$frontend_container" ]; then
        echo -e "  Frontend Container: ${GREEN}RUNNING${NC} ($frontend_container)"
        docker stats --no-stream $frontend_container 2>/dev/null | tail -1 || echo "    (stats unavailable)"
    else
        echo -e "  Frontend Container: ${RED}NOT RUNNING${NC}"
    fi
    echo ""
}

# Main health checks
check_containers
echo "Service Health Endpoints:"
echo ""

backend_health=0
frontend_health=0

check_service "Backend API" "$BACKEND_HEALTH" "FastAPI Server" || backend_health=1
echo ""

check_service "Frontend Web" "$FRONTEND_HEALTH" "Nginx Server" || frontend_health=1
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                      Health Check Summary                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ $backend_health -eq 0 ] && [ $frontend_health -eq 0 ]; then
    echo -e "${GREEN}✓ All services are HEALTHY${NC}"
    exit 0
else
    echo -e "${RED}✗ Some services are UNHEALTHY${NC}"
    [ $backend_health -ne 0 ] && echo "  - Backend API is unreachable"
    [ $frontend_health -ne 0 ] && echo "  - Frontend Web is unreachable"
    echo ""
    echo "Troubleshooting steps:"
    echo "  1. Check if containers are running: docker ps"
    echo "  2. View container logs: docker logs <container_name>"
    echo "  3. Verify ports are accessible: netstat -tuln | grep LISTEN"
    echo "  4. Start services with: make dev-up"
    exit 1
fi
