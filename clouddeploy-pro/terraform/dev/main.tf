terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "clouddeploy_pro" {
  source = "../../modules/clouddeploy-pro"

  environment = var.environment
  vpc_cidr    = var.vpc_cidr
  public_subnet_cidr = var.public_subnet_cidr
  instance_type = var.instance_type
  ssh_cidr_blocks = var.ssh_cidr_blocks
  tags = var.tags
}