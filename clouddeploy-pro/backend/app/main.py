"""
CloudDeploy Pro Backend - FastAPI Application
"""
import os
import logging
import pickle
import psutil
import platform
import socket
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import uuid

from pathlib import Path
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file located in the backend directory
env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    loaded = load_dotenv(dotenv_path=env_path)
else:
    loaded = load_dotenv()

logger.info(f".env file loaded: {loaded}")
logger.info(f"GITHUB_TOKEN is configured: {bool(os.environ.get('GITHUB_TOKEN'))}")

import docker
import uvicorn
from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .repository_inspector import inspect_github_repository

# Initialize FastAPI app
app = FastAPI(
    title="CloudDeploy Pro API",
    description="Backend API for CloudDeploy Pro Dashboard",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class SystemInfo(BaseModel):
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    boot_time: str
    platform: str
    processor: str
    hostname: str

class DeploymentInfo(BaseModel):
    version: str
    git_commit: str
    deployed_at: str
    environment: str
    docker_status: str
    application: Optional[str] = None

class HealthCheck(BaseModel):
    status: str
    timestamp: str
    version: str
    environment: str

class MetricsResponse(BaseModel):
    system: SystemInfo
    deployment: DeploymentInfo
    health: HealthCheck

# Application Models
class ApplicationBase(BaseModel):
    name: str
    repository_url: str
    branch: str = "main"
    environment: str = "development"
    dockerfile_path: str = "./Dockerfile"
    terraform_path: str = "./terraform"

class ApplicationCreate(ApplicationBase):
    pass

class Application(ApplicationBase):
    id: str
    status: str = "connected"
    created_at: str
    updated_at: str

class InspectionRequest(BaseModel):
    repository_url: str
    branch: str = "main"

# Dependency to get Docker client
def get_docker_client():
    try:
        client = docker.from_env()
        client.ping()
        return client
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Docker not available: {str(e)}")

# In-memory storage
# In-memory deployment state
deployment_state = {
    "version": os.getenv("APP_VERSION", "1.0.0"),
    "git_commit": os.getenv("GIT_COMMIT", "a7f89b2"),
    "deployed_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
    "environment": os.getenv("ENVIRONMENT", "development"),
    "docker_status": "running",
    "application": ""  # Name of last deployed application
}

deployment_logs_list = [
    {"timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"), "level": "INFO", "message": "Deployment initialized"},
    {"timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"), "level": "INFO", "message": "Container stack running on v1.0.0"}
]

# In-memory storage for applications
applications: Dict[str, Application] = {}

# Routes
@app.get("/", tags=["Root"])
async def root():
    return {"message": "CloudDeploy Pro API", "version": "1.0.0"}

@app.api_route("/health", methods=["GET", "HEAD"], response_model=HealthCheck, tags=["Health"])
async def health_check():
    return HealthCheck(
        status="healthy",
        timestamp=datetime.now(timezone.utc).isoformat() + "Z",
        version=os.getenv("APP_VERSION", "1.0.0"),
        environment=os.getenv("ENVIRONMENT", "development")
    )

@app.get("/system", response_model=SystemInfo, tags=["System"])
async def get_system_info():
    # CPU usage
    cpu_usage = psutil.cpu_percent(interval=1)

    # Memory usage
    memory = psutil.virtual_memory()
    memory_usage = memory.percent

    # Disk usage
    disk = psutil.disk_usage('/')
    disk_usage = (disk.used / disk.total) * 100

    # Boot time
    boot_time = datetime.fromtimestamp(psutil.boot_time()).isoformat()

    # Platform info
    platform_info = f"{platform.system()} {platform.release()}"
    processor = platform.processor() or "Unknown"
    hostname = socket.gethostname()

    return SystemInfo(
        cpu_usage=cpu_usage,
        memory_usage=memory_usage,
        disk_usage=disk_usage,
        boot_time=boot_time,
        platform=platform_info,
        processor=processor,
        hostname=hostname
    )

# Application Endpoints
@app.get("/applications", response_model=List[Application], tags=["Applications"])
async def get_applications():
    """Get all applications"""
    return list(applications.values())

@app.post("/applications", response_model=Application, tags=["Applications"])
async def create_application(application: ApplicationCreate):
    """Create a new application"""
    # Generate unique ID
    app_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    # Create application object
    app_obj = Application(
        id=app_id,
        created_at=now,
        updated_at=now,
        **application.dict()
    )

    # Store in memory
    applications[app_id] = app_obj

    return app_obj

@app.get("/applications/{app_id}", response_model=Application, tags=["Applications"])
async def get_application(app_id: str):
    """Get a specific application by ID"""
    if app_id not in applications:
        raise HTTPException(status_code=404, detail="Application not found")
    return applications[app_id]

@app.delete("/applications/{app_id}", tags=["Applications"])
async def delete_application(app_id: str):
    """Delete an application by ID"""
    if app_id not in applications:
        raise HTTPException(status_code=404, detail="Application not found")
    del applications[app_id]
    return {"message": "Application deleted successfully"}

@app.post("/applications/{app_id}/deploy", tags=["Applications"])
async def deploy_application(app_id: str):
    """Deploy a specific application"""
    if app_id not in applications:
        raise HTTPException(status_code=404, detail="Application not found")

    app = applications[app_id]

    # Update application status
    app.updated_at = datetime.utcnow().isoformat()

    # For now, we'll simulate deployment using the existing deployment logic
    # In a real implementation, this would use the app's specific configuration
    import random
    new_version = f"1.0.{random.randint(1, 99)}"
    commit = "".join(random.choices("0123456789abcdef", k=7))
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    # Update global deployment state with app-specific info
    deployment_state["version"] = new_version
    deployment_state["git_commit"] = commit
    deployment_state["deployed_at"] = timestamp
    deployment_state["environment"] = app.environment
    deployment_state["application"] = app.name
    # Keep docker_status as is - will be updated dynamically

    log_entry = {
        "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
        "level": "INFO",
        "message": f"Deployed application '{app.name}' (Version {new_version}, Commit {commit})"
    }
    deployment_logs_list.insert(0, log_entry)

    return {
        "status": "success",
        "message": f"Application '{app.name}' deployed successfully!",
        "deployment": deployment_state,
        "application": app
    }

@app.post("/applications/inspect", tags=["Applications"])
async def inspect_application_repository(request: InspectionRequest):
    """Inspect a GitHub repository for an application."""
    try:
        result = inspect_github_repository(request.repository_url, request.branch)
        if not result.get("success"):
            # Return 400 for client errors (invalid URL, rate limits, etc.)
            error_detail = result.get("error")
            if not error_detail:
                error_detail = "Inspection failed"
            # Check if it's a rate limit error and return 429 instead
            if "rate limit" in error_detail.lower():
                raise HTTPException(status_code=429, detail=error_detail)
            else:
                raise HTTPException(status_code=400, detail=error_detail)
        return result
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log unexpected errors for debugging
        import logging
        logging.error(f"Unexpected error in repository inspection: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error during repository inspection")

# Existing Deployment Endpoints (enhanced)
@app.get("/deployment", response_model=DeploymentInfo, tags=["Deployment"])
async def get_deployment_info():
    # Check Docker status dynamically
    try:
        client = docker.from_env()
        client.ping()
        deployment_state["docker_status"] = "running"
    except Exception:
        deployment_state["docker_status"] = "running (simulated)"

    return DeploymentInfo(
        version=deployment_state["version"],
        git_commit=deployment_state["git_commit"],
        deployed_at=deployment_state["deployed_at"],
        environment=deployment_state["environment"],
        docker_status=deployment_state["docker_status"],
        application=deployment_state.get("application") or None
    )

@app.post("/deploy", tags=["Deployment"])
async def trigger_deployment():
    import random
    new_version = f"1.0.{random.randint(1, 99)}"
    commit = "".join(random.choices("0123456789abcdef", k=7))
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    deployment_state["version"] = new_version
    deployment_state["git_commit"] = commit
    deployment_state["deployed_at"] = timestamp
    # Clear application info for generic deploy
    deployment_state["application"] = ""

    log_entry = {
        "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
        "level": "INFO",
        "message": f"New build deployed successfully (Version {new_version}, Commit {commit})"
    }
    deployment_logs_list.insert(0, log_entry)

    return {
        "status": "success",
        "message": f"Deployment build {new_version} triggered and active!",
        "deployment": deployment_state
    }

@app.post("/rollback", tags=["Deployment"])
async def rollback_deployment():
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    deployment_state["version"] = "1.0.0"
    deployment_state["git_commit"] = "a7f89b2 (rollback)"
    deployment_state["deployed_at"] = timestamp
    # Clear application info for rollback
    deployment_state["application"] = ""

    log_entry = {
        "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
        "level": "WARN",
        "message": "Emergency rollback executed -> Reverted state to stable build v1.0.0"
    }
    deployment_logs_list.insert(0, log_entry)

    return {
        "status": "rolled_back",
        "message": "Emergency rollback successful. System reverted to v1.0.0",
        "deployment": deployment_state
    }

@app.get("/metrics", response_model=MetricsResponse, tags=["Metrics"])
async def get_metrics():
    system_info = await get_system_info()
    deployment_info = await get_deployment_info()
    health_info = await health_check()

    return MetricsResponse(
        system=system_info,
        deployment=deployment_info,
        health=health_info
    )

@app.get("/logs", tags=["Logging"])
async def get_logs(lines: int = 100):
    # In a real application, this would read from log files or CloudWatch
    # For now, return placeholder logs
    logs = [
        {
            "timestamp": datetime.utcnow().isoformat(),
            "level": "INFO",
            "message": "Application started successfully"
        },
        {
            "timestamp": datetime.utcnow().isoformat(),
            "level": "INFO",
            "message": "Health check passed"
        }
    ]
    return {"logs": logs[-lines:], "total": len(logs)}

@app.get("/environment", tags=["Configuration"])
async def get_environment():
    return {
        "environment": os.getenv("ENVIRONMENT", "development"),
        "version": os.getenv("APP_VERSION", "1.0.0"),
        "debug": os.getenv("DEBUG", "false").lower() == "true"
    }

# Exception handlers
@app.exception_handler(404)
async def not_found_exception_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"message": "Endpoint not found"},
    )

@app.exception_handler(500)
async def internal_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error"},
    )

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)