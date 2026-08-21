"""
Unit tests for the backend API
"""
import asyncio
import pytest
import httpx
from app.main import app

def run_async(coro):
    return asyncio.run(coro)

def test_root():
    """Test root endpoint"""
    async def _test():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as ac:
            return await ac.get("/")
    response = run_async(_test())
    assert response.status_code == 200
    assert response.json()["message"] == "CloudDeploy Pro API"

def test_health_check():
    """Test health check endpoint"""
    async def _test():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as ac:
            return await ac.get("/health")
    response = run_async(_test())
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_system_info():
    """Test system info endpoint"""
    async def _test():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as ac:
            return await ac.get("/system")
    response = run_async(_test())
    assert response.status_code == 200
    assert "cpu_usage" in response.json()

def test_deployment_info():
    """Test deployment info endpoint"""
    async def _test():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as ac:
            return await ac.get("/deployment")
    response = run_async(_test())
    assert response.status_code == 200
    assert "version" in response.json()

def test_metrics():
    """Test metrics endpoint"""
    async def _test():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as ac:
            return await ac.get("/metrics")
    response = run_async(_test())
    assert response.status_code == 200
    assert "system" in response.json()
    assert "health" in response.json()

def test_logs():
    """Test logs endpoint"""
    async def _test():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as ac:
            return await ac.get("/logs")
    response = run_async(_test())
    assert response.status_code == 200
    assert "logs" in response.json()

def test_environment():
    """Test environment endpoint"""
    async def _test():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as ac:
            return await ac.get("/environment")
    response = run_async(_test())
    assert response.status_code == 200
    assert "environment" in response.json()

def test_applications_lifecycle():
    """Test creating, listing, and deleting an application"""
    async def _test():
        payload = {
            "name": "Test App",
            "repository_url": "https://github.com/octocat/Hello-World",
            "branch": "master",
            "environment": "development"
        }
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as ac:
            create_res = await ac.post("/applications", json=payload)
            assert create_res.status_code == 200
            app_id = create_res.json()["id"]

            get_res = await ac.get(f"/applications/{app_id}")
            assert get_res.status_code == 200
            assert get_res.json()["name"] == "Test App"

            del_res = await ac.delete(f"/applications/{app_id}")
            assert del_res.status_code == 200
    run_async(_test())

def test_inspect_invalid_url():
    """Test inspecting an invalid repository URL returns 400"""
    async def _test():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as ac:
            return await ac.post(
                "/applications/inspect",
                json={"repository_url": "https://invalid-url.com/no-repo", "branch": "main"}
            )
    response = run_async(_test())
    assert response.status_code == 400