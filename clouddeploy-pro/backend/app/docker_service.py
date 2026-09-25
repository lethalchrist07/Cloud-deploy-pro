"""Local Docker build and container health operations for CloudDeploy Pro."""

from __future__ import annotations

import logging
import os
import re
import shutil
import socket
import stat
import subprocess
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from typing import Any, Callable, Dict, List, Optional, Tuple
from urllib.parse import urlsplit

import docker
import requests
from docker.errors import APIError, DockerException, ImageNotFound


logger = logging.getLogger(__name__)
LogCallback = Callable[[str, str], None]
StageCallback = Callable[[str, Dict[str, Any]], None]


class DockerPipelineError(Exception):
    """A safe-to-display Docker workflow error."""

    def __init__(self, message: str, health_status: Optional[str] = None):
        super().__init__(message)
        self.health_status = health_status


_SECRET_ASSIGNMENT = re.compile(
    r"(?i)([A-Z0-9_.-]*(?:SECRET|TOKEN|PASSWORD|PASSWD|AUTHORIZATION|API[_-]?KEY|ACCESS[_-]?KEY|"
    r"PRIVATE[_-]?KEY|CREDENTIAL)[A-Z0-9_.-]*[\"']?\s*[:=]\s*)"
    r"(\"[^\"]*\"|'[^']*'|[^\s,;]+)"
)
_PEM_BLOCK = re.compile(
    r"-----BEGIN [^-]*PRIVATE KEY-----.*?-----END [^-]*PRIVATE KEY-----",
    re.IGNORECASE | re.DOTALL,
)
_PEM_START = re.compile(r"-----BEGIN [^-]*PRIVATE KEY-----", re.IGNORECASE)
_PEM_END = re.compile(r"-----END [^-]*PRIVATE KEY-----", re.IGNORECASE)
_GITHUB_TOKEN = re.compile(r"\bgh[pousr]_[A-Za-z0-9_]{20,}\b")
_AWS_ACCESS_KEY = re.compile(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b")
_URL_CREDENTIALS = re.compile(
    r"((?:https?|postgres(?:ql)?|mysql|redis|amqps?|mongodb(?:\+srv)?)://)[^/@\s]+:[^/@\s]+@",
    re.IGNORECASE,
)
_AUTHORIZATION_HEADER = re.compile(
    r"(?i)\b(?:proxy-)?authorization\s*[:=]\s*(?:bearer|basic)\s+[^\s,;]+"
)
_SENSITIVE_FILE = re.compile(
    r"(?i)^(?:\.env(?!\.(?:example|sample|template)$)|id_(?:rsa|dsa|ecdsa|ed25519)|"
    r"\.npmrc|\.pypirc|\.netrc|\.dockercfg|credentials|secrets?\.(?:json|ya?ml))$"
)
_SENSITIVE_DIRECTORIES = {".aws", ".ssh", ".gnupg", ".kube", ".docker"}
_SENSITIVE_SUFFIXES = {".pem", ".key", ".p12", ".pfx", ".p8", ".ppk", ".jks", ".keystore"}


def redact_output(value: Any, max_length: int = 4000) -> str:
    """Scrub credentials and private keys from process and Docker output."""
    text = str(value or "")
    text = _PEM_BLOCK.sub("[REDACTED PRIVATE KEY]", text)
    text = _AUTHORIZATION_HEADER.sub("Authorization: [REDACTED]", text)
    text = _SECRET_ASSIGNMENT.sub(lambda match: f"{match.group(1)}[REDACTED]", text)
    text = _GITHUB_TOKEN.sub("[REDACTED GITHUB TOKEN]", text)
    text = _AWS_ACCESS_KEY.sub("[REDACTED AWS ACCESS KEY]", text)
    text = _URL_CREDENTIALS.sub(r"\1[REDACTED]@", text)
    if len(text) > max_length:
        text = text[:max_length] + " … [line truncated]"
    return text


def redact_stream_chunk(value: Any, inside_private_key: bool = False) -> Tuple[str, bool]:
    """Redact a possibly multi-line key across streamed Docker output chunks."""
    output: List[str] = []
    text = str(value or "")
    while text:
        if inside_private_key:
            end = _PEM_END.search(text)
            if end is None:
                return "".join(output), True
            text = text[end.end():]
            inside_private_key = False
            continue
        start = _PEM_START.search(text)
        if start is None:
            output.append(redact_output(text))
            break
        output.append(redact_output(text[:start.start()]))
        output.append("[REDACTED PRIVATE KEY]")
        text = text[start.end():]
        end = _PEM_END.search(text)
        if end is None:
            inside_private_key = True
            return "".join(output), inside_private_key
        text = text[end.end():]
    return "".join(output), inside_private_key


def validate_github_repository(repository_url: str) -> str:
    """Accept only a plain public github.com owner/repository URL."""
    try:
        parsed = urlsplit(repository_url.strip())
        parts = parsed.path.strip("/").split("/")
        if (
            parsed.scheme.lower() != "https"
            or parsed.hostname != "github.com"
            or parsed.username
            or parsed.password
            or parsed.port
            or parsed.query
            or parsed.fragment
            or len(parts) != 2
            or not all(re.fullmatch(r"[A-Za-z0-9_.-]{1,100}", part) for part in parts)
        ):
            raise ValueError
        repo = parts[1]
        if repo.lower().endswith(".git"):
            repo = repo[:-4]
        if not repo:
            raise ValueError
        return f"https://github.com/{parts[0]}/{repo}.git"
    except (AttributeError, TypeError, ValueError):
        raise DockerPipelineError("Repository URL must be an HTTPS URL for a public github.com owner/repository.")


def validate_branch(branch: str) -> str:
    value = (branch or "").strip()
    if (
        not value
        or len(value) > 128
        or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._/-]*", value)
        or any(part in ("", ".", "..") for part in value.split("/"))
        or value.endswith((".", ".lock", "/"))
        or ".." in value
    ):
        raise DockerPipelineError("Branch name contains unsupported characters.")
    return value


def validate_dockerfile_path(value: str) -> PurePosixPath:
    raw = (value or "Dockerfile").strip().replace("\\", "/")
    path = PurePosixPath(raw)
    if (
        not raw
        or any(ord(character) < 32 or ord(character) == 127 for character in raw)
        or path.is_absolute()
        or ":" in raw
        or ".." in path.parts
        or raw.startswith("//")
    ):
        raise DockerPipelineError("Dockerfile path must stay inside the repository.")
    normalized = PurePosixPath(*(part for part in path.parts if part not in ("", ".")))
    if not normalized.parts:
        raise DockerPipelineError("Dockerfile path is invalid.")
    return normalized


def application_slug(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", (name or "application").lower()).strip("-")[:48]
    return slug or "application"


class DockerService:
    """Build public GitHub source and run its image on the configured local engine."""

    build_log_limit = 1_000
    health_timeout_seconds = 45

    def _client(self):
        client = None
        try:
            client = docker.from_env(timeout=900)
            client.ping()
            return client
        except DockerException:
            if client is not None:
                client.close()
            raise DockerPipelineError(
                "Docker Engine is unavailable. Start Docker Desktop or the Docker daemon, then retry."
            )

    @staticmethod
    def _git_environment() -> Dict[str, str]:
        allowed = {"PATH", "SYSTEMROOT", "WINDIR", "TEMP", "TMP", "COMSPEC", "PATHEXT"}
        environment = {key: value for key, value in os.environ.items() if key.upper() in allowed}
        environment.update(
            {
                "GIT_TERMINAL_PROMPT": "0",
                "GIT_CONFIG_NOSYSTEM": "1",
                "GIT_CONFIG_GLOBAL": os.devnull,
                "GIT_LFS_SKIP_SMUDGE": "1",
            }
        )
        return environment

    @staticmethod
    def _remove_read_only_path(function: Callable[..., Any], path: str, error_info: Any) -> None:
        """Retry Git's Windows read-only object cleanup with writable permissions."""
        try:
            os.chmod(path, stat.S_IREAD | stat.S_IWRITE)
            function(path)
        except OSError:
            raise error_info[1]

    @staticmethod
    def _safe_repo_directory(repository_root: Path, dockerfile: PurePosixPath) -> Path:
        root = repository_root.resolve(strict=True)
        try:
            candidate = (root / Path(*dockerfile.parts)).resolve(strict=True)
        except FileNotFoundError:
            raise DockerPipelineError(f"No Dockerfile was found at '{dockerfile.as_posix()}' in this repository branch.")
        except OSError:
            raise DockerPipelineError("Dockerfile path could not be safely resolved inside the repository.")
        if not candidate.is_relative_to(root) or not candidate.is_file():
            raise DockerPipelineError("Dockerfile was not found inside the checked-out repository.")
        return candidate

    def _clone_repository(
        self,
        repository_url: str,
        branch: str,
        destination: Path,
        log: LogCallback,
    ) -> str:
        safe_url = validate_github_repository(repository_url)
        safe_branch = validate_branch(branch)
        command = [
            "git",
            "clone",
            "--depth",
            "1",
            "--single-branch",
            "--branch",
            safe_branch,
            "--",
            safe_url,
            str(destination),
        ]
        try:
            completed = subprocess.run(
                command,
                shell=False,
                check=False,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=180,
                env=self._git_environment(),
            )
        except FileNotFoundError:
            raise DockerPipelineError("Git is not installed or is not available on the backend PATH.")
        except subprocess.TimeoutExpired:
            raise DockerPipelineError("GitHub repository clone timed out after 180 seconds.")
        except OSError:
            raise DockerPipelineError("Git could not start the repository clone.")

        for line in (completed.stdout or "").splitlines():
            if line.strip():
                log("INFO", redact_output(line))
        if completed.returncode != 0:
            raise DockerPipelineError("GitHub repository clone failed. Check the repository URL and branch.")

        try:
            revision = subprocess.run(
                ["git", "-C", str(destination), "rev-parse", "HEAD"],
                shell=False,
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                text=True,
                timeout=15,
                env=self._git_environment(),
            ).stdout.strip()
        except (OSError, subprocess.SubprocessError):
            revision = "unavailable"

        # Git metadata is unnecessary to build and must not enter the image context.
        git_metadata = destination / ".git"
        if git_metadata.is_dir():
            shutil.rmtree(git_metadata, onerror=self._remove_read_only_path)
        elif git_metadata.exists():
            git_metadata.unlink()
        return revision

    @staticmethod
    def _remove_sensitive_files(repository_root: Path, log: LogCallback) -> None:
        """Keep obvious credential files from being copied into a built image."""
        for current, directories, files in os.walk(repository_root, topdown=True, followlinks=False):
            safe_directories = []
            for item in directories:
                if item not in _SENSITIVE_DIRECTORIES:
                    safe_directories.append(item)
                    continue
                directory_path = Path(current) / item
                try:
                    if directory_path.is_symlink():
                        directory_path.unlink()
                    else:
                        shutil.rmtree(directory_path, onerror=DockerService._remove_read_only_path)
                    log("WARNING", f"Excluded credential directory from Docker build context: {directory_path.relative_to(repository_root).as_posix()}")
                except OSError:
                    raise DockerPipelineError("A credential directory could not be excluded from the Docker build context.")
            directories[:] = safe_directories
            for filename in files:
                file_path = Path(current) / filename
                if _SENSITIVE_FILE.match(filename) or file_path.suffix.lower() in _SENSITIVE_SUFFIXES:
                    try:
                        file_path.unlink()
                    except PermissionError:
                        try:
                            os.chmod(file_path, stat.S_IREAD | stat.S_IWRITE)
                            file_path.unlink()
                        except OSError:
                            raise DockerPipelineError("A sensitive-looking file could not be excluded from the build context.")
                    except OSError:
                        raise DockerPipelineError("A sensitive-looking file could not be excluded from the build context.")
                    log("WARNING", f"Excluded sensitive-looking file from Docker build context: {file_path.relative_to(repository_root).as_posix()}")

    @staticmethod
    def _docker_ports(image: Any) -> List[str]:
        configured = image.attrs.get("Config", {}).get("ExposedPorts") or {}
        ports = []
        for value in configured:
            if re.fullmatch(r"[1-9][0-9]{0,4}/(?:tcp|udp)", value):
                number = int(value.split("/", 1)[0])
                if number <= 65535:
                    ports.append(value)
        return sorted(set(ports), key=lambda value: (value.endswith("/udp"), int(value.split("/", 1)[0])))

    @staticmethod
    def _has_healthcheck(image: Any) -> bool:
        healthcheck = image.attrs.get("Config", {}).get("Healthcheck") or {}
        commands = healthcheck.get("Test") or []
        return bool(commands) and commands[0].upper() != "NONE"

    def _build_image(
        self,
        client: Any,
        repository_root: Path,
        dockerfile: PurePosixPath,
        image_tag: str,
        log: LogCallback,
    ) -> Tuple[Any, Dict[str, Any]]:
        started = time.monotonic()
        build_lines: List[str] = []
        inside_private_key = False
        try:
            stream = client.api.build(
                path=str(repository_root),
                dockerfile=dockerfile.as_posix(),
                tag=image_tag,
                rm=True,
                forcerm=True,
                decode=True,
            )
            for event in stream:
                if not isinstance(event, dict):
                    continue
                message = event.get("stream") or event.get("status") or ""
                if message and event.get("status") and event.get("id"):
                    progress = event.get("progress")
                    message = f"{event['id']}: {message} {progress or ''}".strip()
                if message:
                    safe_message, inside_private_key = redact_stream_chunk(message, inside_private_key)
                    safe_message = safe_message.rstrip()
                    if safe_message:
                        if len(build_lines) < self.build_log_limit:
                            build_lines.append(safe_message)
                        log("INFO", safe_message)
                if event.get("error") or event.get("errorDetail"):
                    error_detail = event.get("errorDetail") or {}
                    detail = error_detail.get("message") if isinstance(error_detail, dict) else str(error_detail)
                    failure = redact_output(detail or event.get("error") or "Docker reported a build failure.", 1000)
                    log("ERROR", failure)
                    raise DockerPipelineError(f"Docker image build failed: {failure}")
        except DockerPipelineError:
            raise
        except (DockerException, OSError) as error:
            safe_error = redact_output(error, 1000)
            log("ERROR", safe_error)
            raise DockerPipelineError(f"Docker image build failed: {safe_error}")

        try:
            image = client.images.get(image_tag)
        except ImageNotFound:
            failure = "Docker build did not produce the expected image. Check Dockerfile syntax and the build output for the failing instruction."
            log("ERROR", failure)
            raise DockerPipelineError(failure)
        except DockerException as error:
            failure = redact_output(error, 1000)
            log("ERROR", failure)
            raise DockerPipelineError(f"Docker could not retrieve the built image: {failure}")

        duration = round(time.monotonic() - started, 3)
        return image, {
            "status": "BUILT",
            "image_name": image_tag.split(":", 1)[0],
            "image_tag": image_tag,
            "image_id": image.id,
            "duration_seconds": duration,
            "log_count": len(build_lines),
            "exposed_ports": self._docker_ports(image),
            "has_healthcheck": self._has_healthcheck(image),
        }

    @staticmethod
    def _container_health(container: Any) -> Optional[str]:
        try:
            container.reload()
            return container.attrs.get("State", {}).get("Health", {}).get("Status")
        except DockerException:
            return None

    @staticmethod
    def _published_port(container: Any, exposed_port: str) -> Optional[int]:
        try:
            bindings = container.attrs.get("NetworkSettings", {}).get("Ports", {}).get(exposed_port) or []
            if bindings and bindings[0].get("HostPort"):
                return int(bindings[0]["HostPort"])
        except (TypeError, ValueError, AttributeError):
            pass
        return None

    @staticmethod
    def _http_probe(port: int) -> Tuple[bool, Optional[int], Optional[str]]:
        last_error = None
        last_code = None
        received_http_response = False
        for path in ("/health", "/healthz", "/"):
            try:
                response = requests.get(
                    f"http://127.0.0.1:{port}{path}",
                    timeout=(0.35, 0.75),
                    allow_redirects=False,
                )
                received_http_response = True
                last_code = response.status_code
                if response.status_code < 500:
                    return True, response.status_code, path
            except requests.RequestException as error:
                last_error = type(error).__name__
        if received_http_response:
            return False, last_code, "application returned an HTTP error"
        return False, last_code, last_error

    def _wait_for_health(
        self,
        container: Any,
        exposed_ports: List[str],
        has_healthcheck: bool,
        log: LogCallback,
    ) -> Dict[str, Any]:
        deadline = time.monotonic() + self.health_timeout_seconds
        last_state = "starting"
        last_http_status: Optional[int] = None
        last_probe_error: Optional[str] = None
        probe_port: Optional[int] = None
        probe_protocol: Optional[str] = None

        while time.monotonic() < deadline:
            try:
                container.reload()
                state = container.attrs.get("State", {})
                if not state.get("Running"):
                    exit_code = state.get("ExitCode")
                    raise DockerPipelineError(
                        f"Container exited before it became healthy (exit code {exit_code}).",
                        health_status="FAILED",
                    )

                health = (state.get("Health") or {}).get("Status")
                if has_healthcheck and health == "healthy":
                    return {
                        "status": "HEALTHY",
                        "method": "docker-healthcheck",
                        "detail": "The Dockerfile health check passed.",
                    }
                if has_healthcheck and health == "unhealthy":
                    raise DockerPipelineError(
                        "The container's Docker HEALTHCHECK reported unhealthy.",
                        health_status="UNHEALTHY",
                    )
                if health:
                    last_state = health

                if not has_healthcheck and exposed_ports:
                    for exposed_port in exposed_ports:
                        port = self._published_port(container, exposed_port)
                        if not port:
                            continue
                        probe_port = port
                        probe_protocol = exposed_port.rsplit("/", 1)[-1]
                        if probe_protocol == "tcp":
                            healthy, status_code, probe_detail = self._http_probe(port)
                            last_http_status = status_code
                            last_probe_error = probe_detail
                            if healthy:
                                return {
                                    "status": "HEALTHY",
                                    "method": "http",
                                    "url": f"http://127.0.0.1:{port}{probe_detail}",
                                    "http_status": status_code,
                                    "detail": f"The application responded over HTTP at {probe_detail}.",
                                }
                            if status_code is not None:
                                continue
                            try:
                                with socket.create_connection(("127.0.0.1", port), timeout=0.35):
                                    return {
                                        "status": "HEALTHY",
                                        "method": "tcp",
                                        "url": f"127.0.0.1:{port}",
                                        "http_status": status_code,
                                        "detail": "The published application port accepted a TCP connection.",
                                    }
                            except OSError:
                                pass
                elif not has_healthcheck:
                    raise DockerPipelineError(
                        "Application reachability cannot be checked because the image declares no exposed port or Docker HEALTHCHECK.",
                        health_status="UNHEALTHY",
                    )
            except DockerPipelineError:
                raise
            except DockerException:
                last_state = "unavailable"
            time.sleep(1)

        if exposed_ports and probe_port:
            detail = f"No response was received on the published application port {probe_port} within {self.health_timeout_seconds} seconds."
            if last_http_status is not None:
                detail += f" Last HTTP status: {last_http_status}."
            elif last_probe_error:
                detail += f" Last probe: {last_probe_error}."
        elif has_healthcheck:
            detail = f"Docker HEALTHCHECK remained {last_state} after {self.health_timeout_seconds} seconds."
        else:
            detail = f"Container did not become available within {self.health_timeout_seconds} seconds."
        raise DockerPipelineError(detail, health_status="UNHEALTHY")

    @staticmethod
    def _cleanup_container(container: Any, deployment_id: str, log: LogCallback) -> None:
        try:
            container.reload()
            labels = container.labels or {}
            if labels.get("com.clouddeploy.deployment") != deployment_id:
                log("ERROR", "Cleanup skipped because the container ownership label did not match this deployment.")
                return
            if container.status == "running":
                container.stop(timeout=5)
            container.remove(force=True)
            log("WARNING", "Stopped and removed the container created by this failed deployment.")
        except DockerException as error:
            log("WARNING", f"Could not clean up the failed deployment container: {redact_output(error, 500)}")

    @staticmethod
    def _capture_container_logs(container: Any, log: LogCallback) -> None:
        try:
            output = container.logs(tail=100, stdout=True, stderr=True)
            if isinstance(output, bytes):
                output = output.decode("utf-8", errors="replace")
            inside_private_key = False
            for line in str(output).splitlines():
                safe_line, inside_private_key = redact_stream_chunk(line, inside_private_key)
                if safe_line.strip():
                    log("INFO", f"Container output: {safe_line.strip()}")
        except DockerException as error:
            log("WARNING", f"Container output could not be collected: {redact_output(error, 500)}")

    def deploy(
        self,
        application: Dict[str, Any],
        deployment_id: str,
        log: LogCallback,
        stage: StageCallback,
    ) -> Dict[str, Any]:
        """Build, run, and probe one application, cleaning up only its failed container."""
        repository_url = validate_github_repository(application.get("repository_url", ""))
        branch = validate_branch(application.get("branch", "main"))
        dockerfile_path = validate_dockerfile_path(application.get("dockerfile_path", "Dockerfile"))
        safe_id = re.sub(r"[^a-f0-9]", "", deployment_id.lower())
        if len(safe_id) != 32:
            raise DockerPipelineError("Deployment ID is invalid.")

        image_repo = f"clouddeploy/{application_slug(application.get('name', 'application'))}-{application.get('id', '')[:8].lower()}"
        if not re.fullmatch(r"[a-z0-9]+(?:[._/-][a-z0-9]+)*", image_repo) or len(image_repo) > 240:
            raise DockerPipelineError("Application name cannot be used for a Docker image name.")
        image_tag = f"{image_repo}:dep-{safe_id}"
        container_name = f"clouddeploy-{application_slug(application.get('name', 'application'))}-{safe_id[:12]}"

        client = self._client()
        container = None
        try:
            stage("BUILDING", {"message": "Fetching repository source and preparing the Docker build."})
            log("INFO", f"Cloning {repository_url.rsplit('/', 1)[-1][:-4]} branch '{branch}'.")
            with tempfile.TemporaryDirectory(prefix="clouddeploy-source-") as temporary_directory:
                repository_root = Path(temporary_directory) / "source"
                revision = self._clone_repository(repository_url, branch, repository_root, log)
                dockerfile = self._safe_repo_directory(repository_root, dockerfile_path)
                log("INFO", f"Dockerfile detected: {dockerfile.relative_to(repository_root).as_posix()}")
                self._remove_sensitive_files(repository_root, log)

                image, build_result = self._build_image(client, repository_root, dockerfile_path, image_tag, log)
                stage("BUILT", {"image": build_result, "git_commit": revision})
                log("INFO", f"Built image {image_tag} with ID {image.id} in {build_result['duration_seconds']} seconds.")

            stage("STARTING", {"message": "Starting the built image in a CloudDeploy-managed container."})
            exposed_ports = build_result["exposed_ports"]
            port_bindings = {port: ("127.0.0.1", None) for port in exposed_ports}
            labels = {
                "com.clouddeploy.managed": "true",
                "com.clouddeploy.deployment": safe_id,
                "com.clouddeploy.application": str(application.get("id", "")),
            }
            try:
                container = client.containers.create(
                    image.id,
                    name=container_name,
                    detach=True,
                    labels=labels,
                    ports=port_bindings or None,
                )
                container.start()
                container.reload()
            except (DockerException, APIError) as error:
                safe_error = redact_output(error, 1000)
                log("ERROR", f"Container startup failed: {safe_error}")
                raise DockerPipelineError(f"Container startup failed: {safe_error}", health_status="FAILED")

            started_at = container.attrs.get("State", {}).get("StartedAt")
            port_map = {}
            for exposed_port in exposed_ports:
                host_port = self._published_port(container, exposed_port)
                if host_port:
                    port_map[exposed_port] = f"127.0.0.1:{host_port}"
            container_result = {
                "container_id": container.id,
                "container_name": container.name,
                "image": image_tag,
                "status": container.status.upper(),
                "exposed_ports": port_map,
                "started_at": started_at,
            }
            stage("HEALTH_CHECK", {"container": container_result})
            log("INFO", f"Container {container.name} started; checking application availability.")
            health_result = self._wait_for_health(
                container,
                exposed_ports,
                build_result["has_healthcheck"],
                log,
            )
            container.reload()
            container_result["status"] = container.status.upper()
            self._capture_container_logs(container, log)
            log("INFO", f"Health check {health_result['status']}: {health_result['detail']}")
            return {
                "build": build_result,
                "container": container_result,
                "health": health_result,
                "git_commit": revision,
                "deployed_at": datetime.now(timezone.utc).isoformat(),
            }
        except DockerPipelineError:
            if container is not None:
                self._capture_container_logs(container, log)
                self._cleanup_container(container, safe_id, log)
            raise
        except Exception:
            if container is not None:
                self._capture_container_logs(container, log)
                self._cleanup_container(container, safe_id, log)
            logger.exception("Unexpected error during Docker deployment %s", safe_id)
            raise DockerPipelineError("Docker deployment failed because of an unexpected backend error.")
        finally:
            client.close()
