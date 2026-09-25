from pathlib import Path, PurePosixPath

import docker
import pytest

from app.docker_service import (
    DockerPipelineError,
    DockerService,
    redact_output,
    redact_stream_chunk,
    validate_branch,
    validate_dockerfile_path,
    validate_github_repository,
)


class _ContainerState:
    def __init__(self, state):
        self.attrs = {"State": state}

    def reload(self):
        return None


def test_public_github_repository_validation():
    assert validate_github_repository("https://github.com/traefik/whoami") == "https://github.com/traefik/whoami.git"
    with pytest.raises(DockerPipelineError):
        validate_github_repository("https://github.com.evil.test/owner/repo")
    with pytest.raises(DockerPipelineError):
        validate_github_repository("https://github.com/owner/repo?token=secret")


def test_branch_and_dockerfile_paths_reject_traversal_and_options():
    assert validate_branch("release/candidate-1") == "release/candidate-1"
    for branch in ("--upload-pack=evil", "../main", "feature//x", "main;whoami"):
        with pytest.raises(DockerPipelineError):
            validate_branch(branch)

    assert validate_dockerfile_path("./deploy/Dockerfile") == PurePosixPath("deploy/Dockerfile")
    for path in ("../Dockerfile", "C:\\Dockerfile", "\\\\server\\Dockerfile"):
        with pytest.raises(DockerPipelineError):
            validate_dockerfile_path(path)


def test_dockerfile_must_exist_inside_checkout():
    checkout = Path(__file__).resolve().parent
    with pytest.raises(DockerPipelineError, match="No Dockerfile was found"):
        DockerService._safe_repo_directory(checkout, PurePosixPath("__clouddeploy_missing_Dockerfile__"))


def test_container_without_a_probe_is_not_reported_healthy():
    with pytest.raises(DockerPipelineError, match="no exposed port or Docker HEALTHCHECK") as error:
        DockerService()._wait_for_health(
            _ContainerState({"Running": True}),
            exposed_ports=[],
            has_healthcheck=False,
            log=lambda *_: None,
        )
    assert error.value.health_status == "UNHEALTHY"


def test_unhealthy_docker_healthcheck_fails_the_deployment():
    with pytest.raises(DockerPipelineError, match="HEALTHCHECK reported unhealthy") as error:
        DockerService()._wait_for_health(
            _ContainerState({"Running": True, "Health": {"Status": "unhealthy"}}),
            exposed_ports=[],
            has_healthcheck=True,
            log=lambda *_: None,
        )
    assert error.value.health_status == "UNHEALTHY"


def test_build_output_redacts_secrets_and_multiline_private_keys():
    output = redact_output(
        'AWS_SECRET_ACCESS_KEY="sensitive value" GITHUB_TOKEN=ghp_12345678901234567890123456789012 '
        'DATABASE_URL=postgres://user:db-secret@localhost/app Authorization: Bearer header-secret'
    )
    assert "sensitive value" not in output
    assert "ghp_12345678901234567890123456789012" not in output
    assert "db-secret" not in output
    assert "header-secret" not in output

    header, inside_key = redact_stream_chunk("-----BEGIN PRIVATE KEY-----", False)
    body, inside_key = redact_stream_chunk("private-key-material", inside_key)
    end, inside_key = redact_stream_chunk("-----END PRIVATE KEY-----", inside_key)
    assert "PRIVATE KEY" in header
    assert body == ""
    assert end == ""
    assert inside_key is False


def test_docker_unavailable_returns_safe_actionable_error(monkeypatch):
    def unavailable(*args, **kwargs):
        raise docker.errors.DockerException("host socket details")

    monkeypatch.setattr("app.docker_service.docker.from_env", unavailable)
    with pytest.raises(DockerPipelineError, match="Docker Engine is unavailable") as error:
        DockerService()._client()
    assert "host socket details" not in str(error.value)
