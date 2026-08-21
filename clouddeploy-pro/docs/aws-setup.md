# AWS Setup Guide

This guide explains how to set up an AWS account for use with CloudDeploy Pro.

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Creating an IAM User](#creating-an-iam-user)
- [Configuring the AWS CLI](#configuring-the-aws-cli)
- [Creating an S3 Bucket for Terraform State (Optional)](#creating-an-s3-bucket-for-terraform-state-optional)
- [Setting Up a VPC for Production (Advanced)](#setting-up-a-vpc-for-production-advanced)
- [IAM Policies for Least Privilege](#iam-policies-for-least-privilege)
- [Testing Your AWS Configuration](#testing-your-aws-configuration)

## Overview

CloudDeploy Pro uses AWS for hosting the application infrastructure. The Terraform modules provision resources such as VPC, EC2, IAM roles, Security Groups, S3 buckets, and CloudWatch Log Groups.

To use CloudDeploy Pro with AWS, you need:
1. An AWS account
2. An IAM user with appropriate permissions
3. The AWS CLI configured with that user's credentials

## Prerequisites

Before you begin, ensure you have:
- An AWS account (you can sign up at https://aws.amazon.com/)
- The AWS CLI installed (https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- Basic knowledge of AWS IAM and EC2

## Creating an IAM User

For simplicity in this project, we'll create an IAM user with administrative permissions. In a production environment, you should follow the principle of least privilege (see the [IAM Policies for Least Privilege](#iam-policies-for-least-privilege) section).

### Step 1: Sign in to the AWS Management Console
Open https://console.aws.amazon.com/ and sign in with your AWS account credentials.

### Step 2: Navigate to IAM
In the AWS Management Console, search for "IAM" and select it.

### Step 3: Create a New User
1. In the IAM dashboard, select "Users" from the left sidebar.
2. Click the "Add users" button.
3. Enter a username (e.g., `clouddeploy-pro-admin`).
4. Select "Programmatic access" for the access type (this enables API keys).
5. Click "Next: Permissions".

### Step 4: Set Permissions
For simplicity in this project, we'll attach the `AdministratorAccess` policy:
1. On the Permissions page, select "Attach existing policies directly".
2. Search for and select `AdministratorAccess`.
3. Click "Next: Tags".

### Step 5: Review and Create
1. Optionally add tags (e.g., `Project=CloudDeployPro`).
2. Click "Next: Review".
3. Review the user details and click "Create user".

### Step 6: Save the Credentials
After the user is created, you will see the user's access key ID and secret access key. **Download the .csv file or copy these values** as you will need them to configure the AWS CLI. You will not be able to view the secret access key again after this step.

## Configuring the AWS CLI

Once you have the access key ID and secret access key, configure the AWS CLI:

```bash
aws configure
```

You will be prompted for:
- AWS Access Key ID: [your access key ID]
- AWS Secret Access Key: [your secret access key]
- Default region name: [e.g., us-east-1]
- Default output format: [json]

Alternatively, you can set the environment variables:
```bash
export AWS_ACCESS_KEY_ID="your_access_key_id"
export AWS_SECRET_ACCESS_KEY="your_secret_access_key"
export AWS_DEFAULT_REGION="us-east-1"
```

## Creating an S3 Bucket for Terraform State (Optional)

For production use, it's recommended to store Terraform state remotely in an S3 bucket with state locking using DynamoDB. This prevents conflicts when multiple team members run Terraform.

### Step 1: Create the S3 Bucket
```bash
aws s3api create-bucket \
    --bucket your-terraform-state-bucket \
    --region us-east-1 \
    --create-bucket-configuration LocationConstraint=us-east-1
```

### Step 2: Enable Versioning (Recommended)
```bash
aws s3api put-bucket-versioning \
    --bucket your-terraform-state-bucket \
    --versioning-configuration Status=Enabled
```

### Step 3: Create a DynamoDB Table for Locking
```bash
aws dynamodb create-table \
    --table-name terraform-locks \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST
```

### Step 4: Configure Terraform to Use the Remote Backend
In each environment's `main.tf` file, add a `terraform` block:
```hcl
terraform {
  backend "s3" {
    bucket = "your-terraform-state-bucket"
    key    = "clouddeploy-pro/terraform.tfstate"
    region = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
  # ... existing required_providers and providers ...
}
```

Then re-run `terraform init` to migrate the state to the S3 bucket.

## Setting Up a VPC for Production (Advanced)

The provided Terraform modules create a basic VPC with a single public subnet. For production, you may want to:
- Use private subnets for the EC2 instances
- Set up NAT gateways for outbound internet access
- Configure multiple availability zones for high availability
- Set up an Application Load Balancer (ALB) in front of the EC2 instances

These advanced configurations are beyond the scope of this guide but can be implemented by modifying the Terraform modules.

## IAM Policies for Least Privilege

For a more secure setup, create a custom IAM policy with only the permissions required by CloudDeploy Pro. The following policy covers the actions needed by the Terraform modules and the EC2 instance:

### IAM Policy for Terraform (to provision resources)
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:AuthorizeSecurityGroupIngress",
                "ec2:AuthorizeSecurityGroupEgress",
                "ec2:CreateInternetGateway",
                "ec2:CreateRoute",
                "ec2:CreateRouteTable",
                "ec2:CreateSecurityGroup",
                "ec2:CreateSubnet",
                "ec2:CreateVpc",
                "ec2:DeleteInternetGateway",
                "ec2:DeleteRouteTable",
                "ec2:DeleteSecurityGroup",
                "ec2:DeleteSubnet",
                "ec2:DeleteVpc",
                "ec2:Describe*",
                "ec2:DetachInternetGateway",
                "ec2:ModifySubnetAttribute",
                "ec2:ModifyVpcAttribute",
                "ec2:RevokeSecurityGroupIngress",
                "ec2:RevokeSecurityGroupEgress",
                "ec2:RunInstances",
                "ec2:TerminateInstances"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "iam:AttachRolePolicy",
                "iam:CreateInstanceProfile",
                "iam:CreateRole",
                "iam:DeleteInstanceProfile",
                "iam:DeleteRole",
                "iam:DetachRolePolicy",
                "iam:GetRole",
                "iam:PassRole",
                "iam:ListInstanceProfilesForRole",
                "iam:ListRolePolicies",
                "iam:ListAttachedRolePolicies"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:CreateBucket",
                "s3:DeleteBucket",
                "s3:GetBucket*",
                "s3:GetObject",
                "s3:ListBucket",
                "s3:PutObject",
                "s4:DeleteObject"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams"
            ],
            "Resource": "*"
        }
    ]
}
```

### IAM Role for EC2 Instances (already least privilege in the module)
The EC2 instance role in the Terraform module already follows least privilege:
- `CloudWatchAgentServerPolicy` for publishing metrics and logs
- `AmazonS3ReadOnlyAccess` for reading from S3 buckets (if needed)

You can further restrict the S3 access to specific buckets if desired.

## Testing Your AWS Configuration

After setting up the IAM user and configuring the AWS CLI, test your configuration:

```bash
# Test that you can list S3 buckets (requires s3:ListAllMyBuckets)
aws s3 ls

# Test that you can describe EC2 instances (requires ec2:DescribeInstances)
aws ec2 describe-instances

# Test that you can get caller identity (requires sts:GetCallerIdentity)
aws sts get-caller-identity
```

If these commands succeed, your AWS configuration is ready to use with CloudDeploy Pro.

## Troubleshooting

### Common Issues

1. **AccessDenied Errors**
   - Ensure your IAM user has the necessary permissions
   - Check that you're using the correct access key and secret key
   - Verify the AWS CLI is configured for the correct region

2. **Resource Already Exists**
   - If you're re-running Terraform, you may need to destroy existing resources first
   - Use `terraform destroy` to clean up before re-applying

3. **SSH Connection Issues**
   - Ensure the security group allows SSH from your IP address
   - Verify you're using the correct private key file
   - Check that the EC2 instance is in a running state

For more troubleshooting tips, see the [Troubleshooting Guide](troubleshooting.md).

---

*Last updated: August 2026*