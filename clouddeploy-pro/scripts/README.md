# Scripts

This directory contains utility scripts to help with development, deployment, and maintenance of CloudDeploy Pro.

## Available Scripts

### `setup-dev.sh`
Sets up the local development environment by:
- Checking for required tools (git, docker, docker-compose, terraform, aws)
- Setting up Python virtual environment for the backend
- Installing Node.js dependencies for the frontend
- Creating a default .env file for Docker Compose

#### Usage
```bash
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh
```

## Contributing

Feel free to add more scripts as needed for common tasks. Please follow these guidelines:

1. Use bash for portability
2. Add proper error handling with `set -e` and informative messages
3. Make scripts executable (`chmod +x`)
4. Document usage in this README