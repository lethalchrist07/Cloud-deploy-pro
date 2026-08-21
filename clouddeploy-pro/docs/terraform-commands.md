# Terraform Commands Guide

This guide explains the essential Terraform commands used in the CloudDeploy Pro project.

## Table of Contents
- [Overview](#overview)
- [Basic Terraform Workflow](#basic-terraform-workflow)
- [Common Terraform Commands](#common-terraform-commands)
- [Environment-Specific Commands](#environment-specific-commands)
- [Troubleshooting](#troubleshooting)
- [Terraform Cloud/Enterprise Integration (Advanced)](#terraform-cloudenterprise-integration-advanced)

## Overview

Terraform is an open-source infrastructure as code software tool that provides a consistent CLI workflow to manage hundreds of cloud services. In CloudDeploy Pro, Terraform is used to provision AWS infrastructure across multiple environments (dev, staging, production).

The Terraform code is organized as follows:
- `terraform/modules/clouddeploy-pro/` - Reusable modules
- `terraform/dev/` - Development environment configuration
- `terraform/staging/` - Staging environment configuration
- `terraform/production/` - Production environment configuration

Each environment has its own `.tfvars` file for environment-specific values.

## Basic Terraform Workflow

The standard Terraform workflow consists of three main steps:

1. **Initialize** (`terraform init`): Prepares the working directory for use with Terraform.
2. **Plan** (`terraform plan`): Creates an execution plan showing what Terraform will do to reach the desired state.
3. **Apply** (`terraform apply`): Executes the proposed changes to reach the desired state of the infrastructure.

Additional useful commands include:
- `terraform destroy`: Destroys the Terraform-managed infrastructure.
- `terraform fmt`: Rewrites Terraform configuration files to a canonical format.
- `terraform validate`: Validates the Terraform files.
- `terraform output`: Displays the values of outputs from the Terraform state.
- `terraform show`: Displays the current state or a saved plan.

## Common Terraform Commands

Here are the most commonly used Terraform commands in CloudDeploy Pro:

### Initialization
```bash
# Initializes the Terraform working directory
# This downloads the necessary provider plugins and sets up the backend
terraform init

# If you've changed the backend configuration, you may need to re-initialize
terraform init -reconfigure
```

### Validation and Formatting
```bash
# Checks that the Terraform files are syntactically valid and internally consistent
terraform validate

# Rewrites all Terraform configuration files to a canonical format
terraform fmt -recursive

# Checks if the files are correctly formatted (returns non-zero exit code if not)
terraform fmt -check -recursive
```

### Planning
```bash
# Creates an execution plan
terraform plan

# Specifies a variable file
terraform plan -var-file="dev.tfvars"

# Saves the plan to a file for later application
terraform plan -out=tfplan

# Shows the details of a saved plan
terraform show tfplan
```

### Application
```bash
# Applies the changes required to reach the desired state
terraform apply

# Applies without prompting for approval
terraform apply -auto-approve

# Applies a saved plan
terraform apply tfplan
```

### Destruction
```bash
# Destroys the Terraform-managed infrastructure
terraform destroy

# Destroys without prompting for approval
terraform destroy -auto-approve

# Destroys using a specific variable file
terraform destroy -var-file="dev.tfvars"
```

### State Management
```bash
# Lists resources in the state
terraform state list

# Shows information about a specific resource
terraform state show aws_instance.web

# Removes an item from the state
terraform state rm aws_instance.web

# Imports an existing resource into the state
terraform import aws_instance.web i-0123456789abcdef0
```

### Outputs
```bash
# Displays all outputs
terraform output

# Displays a specific output
terraform output instance_public_ip

# Displays outputs in machine-readable format (JSON)
terraform output -json
```

## Environment-Specific Commands

CloudDeploy Pro uses separate directories for each environment. Here's how to work with each environment:

### Development Environment
```bash
cd terraform/dev

# Initialize
terraform init

# Validate
terraform validate

# Format
terraform fmt -recursive

# Plan
terraform plan -var-file="dev.tfvars"

# Apply
terraform apply -var-file="dev.tfvars"

# Destroy
terraform destroy -var-file="dev.tfvars"
```

### Staging Environment
```bash
cd terraform/staging

# Initialize
terraform init

# Validate
terraform validate

# Format
terraform fmt -recursive

# Plan
terraform plan -var-file="staging.tfvars"

# Apply
terraform apply -var-file="staging.tfvars"

# Destroy
terraform destroy -var-file="staging.tfvars"
```

### Production Environment
```bash
cd terraform/production

# Initialize
terraform init

# Validate
terraform validate

# Format
terraform fmt -recursive

# Plan
terraform plan -var-file="production.tfvars"

# Apply
terraform apply -var-file="production.tfvars"

# Destroy
terraform destroy -var-file="production.tfvars"
```

## Working with Modules

CloudDeploy Pro uses a reusable module located at `terraform/modules/clouddeploy-pro/`. You can test the module independently:

```bash
cd terraform/modules/clouddeploy-pro

# Initialize (if needed)
terraform init

# Validate
terraform validate

# Format
terraform fmt -recursive

# The module is designed to be called from the environment configurations,
# so it doesn't have its own variables.tf or outputs.tf for direct application.
# Instead, review the variables.tf and outputs.tf to understand its interface.
```

## Advanced Terraform Features

### Workspaces (Not Used in This Project)
CloudDeploy Pro uses separate directories instead of Terraform workspaces for environment isolation. This approach provides clearer separation and easier management of environment-specific configurations.

### Remote State Configuration
As mentioned in the [AWS Setup Guide](aws-setup.md), for team environments it's recommended to use remote state storage. To configure remote state:

1. Create an S3 bucket and DynamoDB table for locking (see AWS Setup Guide)
2. Add a `backend` block to each environment's `main.tf`:
   ```hcl
   terraform {
     backend "s3" {
       bucket = "your-terraform-state-bucket"
       key    = "clouddeploy-pro/${terraform.workspace}.tfstate"
       region = "us-east-1"
       dynamodb_table = "terraform-locks"
       encrypt        = true
     }
   }
   ```
3. Run `terraform init` to migrate the state

### Terraform Cloud Integration
For teams using Terraform Cloud or Terraform Enterprise, you can configure the backend to point to your Terraform Cloud workspace:

```hcl
terraform {
  backend "remote" {
    organization = "your-organization-name"

    workspaces {
      name = "clouddeploy-pro-dev"
    }
  }
}
```

Then, set the `TOKEN` environment variable or configure credentials in your Terraform CLI.

## Troubleshooting

### Common Issues

1. **"Error: Failed to query available provider packages"**
   - Run `terraform init` to install the required providers
   - Check your internet connection if using public providers
   - If using a proxy, configure the `HTTP_PROXY` and `HTTPS_PROXY` environment variables

2. **"Error: Invalid index"**
   - This usually means you're trying to access an element of a list or map that doesn't exist
   - Check your variable definitions and references
   - Use the `-debug` flag for more detailed output: `TF_LOG=DEBUG terraform apply`

3. **"Error: Acquiring state lock"**
   - Another Terraform process is holding the state lock
   - Wait for the other process to finish or force release the lock (use with caution):
     ```bash
     terraform force-unlock <LOCK_ID>
     ```

4. **"Error: Insufficient privileges to perform this action"**
   - Your IAM user or role doesn't have sufficient permissions
   - Check the error message for the specific action that failed
   - Refer to the [AWS Setup Guide](aws-setup.md) for required permissions

5. **"Error: Error waiting for EC2 Instance to become ready"**
   - Check the EC2 instance status in the AWS Console
   - Verify the user data script is executing correctly
   - Check the instance logs (if CloudWatch Logs are configured)

### Debugging

To enable detailed logging for troubleshooting:
```bash
# Set the TF_LOG environment variable to one of the levels:
# TRACE, DEBUG, INFO, WARN, or ERROR
export TF_LOG=DEBUG

# To also log to a file:
export TF_LOG_PATH=terraform.log

# Then run your Terraform command
terraform apply
```

Remember to unset `TF_LOG` when you're done to avoid excessive logging:
```bash
unset TF_LOG
unset TF_LOG_PATH
```

### Getting Help

- Run `terraform --help` for a list of all commands
- Run `terraform <command> --help` for help on a specific command
- Consult the official Terraform documentation: https://developer.hashicorp.com/terraform/language
- Check the [Troubleshooting Guide](troubleshooting.md) for common deployment issues

---

*Last updated: August 2026*