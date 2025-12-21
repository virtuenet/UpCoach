# UpCoach Platform - Terraform Main Configuration
# Infrastructure as Code for multi-cloud deployment

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    railway = {
      source  = "railway/railway"
      version = "~> 0.3"
    }
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
  }

  backend "s3" {
    bucket         = "upcoach-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "upcoach-terraform-locks"
  }
}

# ===========================================
# Provider Configuration
# ===========================================

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "UpCoach"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

provider "railway" {
  token = var.railway_token
}

provider "vercel" {
  api_token = var.vercel_token
  team      = var.vercel_team_id
}

# ===========================================
# Data Sources
# ===========================================

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# ===========================================
# Modules
# ===========================================

module "networking" {
  source = "./modules/networking"

  environment         = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = data.aws_availability_zones.available.names

  tags = local.common_tags
}

module "database" {
  source = "./modules/database"

  environment        = var.environment
  vpc_id             = module.networking.vpc_id
  subnet_ids         = module.networking.private_subnet_ids
  security_group_ids = [module.networking.database_security_group_id]

  db_instance_class  = var.db_instance_class
  db_allocated_storage = var.db_allocated_storage
  db_name            = var.db_name
  db_username        = var.db_username
  db_password        = var.db_password

  tags = local.common_tags
}

module "cache" {
  source = "./modules/cache"

  environment        = var.environment
  vpc_id             = module.networking.vpc_id
  subnet_ids         = module.networking.private_subnet_ids
  security_group_ids = [module.networking.cache_security_group_id]

  redis_node_type    = var.redis_node_type
  redis_num_cache_nodes = var.redis_num_cache_nodes

  tags = local.common_tags
}

module "api" {
  source = "./modules/api"

  environment = var.environment

  # Railway configuration
  railway_project_id = var.railway_project_id

  # Environment variables for API
  database_url = module.database.connection_string
  redis_url    = module.cache.connection_string
  jwt_secret   = var.jwt_secret

  # External service keys
  stripe_secret_key     = var.stripe_secret_key
  stripe_webhook_secret = var.stripe_webhook_secret
  openai_api_key        = var.openai_api_key
  sentry_dsn            = var.api_sentry_dsn

  tags = local.common_tags
}

module "admin_panel" {
  source = "./modules/admin-panel"

  environment = var.environment

  # Vercel configuration
  vercel_project_id = var.vercel_admin_project_id

  # Build-time environment variables
  api_url            = module.api.api_url
  stripe_public_key  = var.stripe_public_key
  sentry_dsn         = var.admin_sentry_dsn

  tags = local.common_tags
}

module "cdn" {
  source = "./modules/cdn"

  environment = var.environment

  # S3 bucket for static assets
  bucket_name = "${var.project_name}-assets-${var.environment}"

  # CloudFront configuration
  domain_aliases      = var.cdn_domain_aliases
  ssl_certificate_arn = var.ssl_certificate_arn

  tags = local.common_tags
}

module "monitoring" {
  source = "./modules/monitoring"

  environment = var.environment

  # CloudWatch configuration
  log_retention_days = var.log_retention_days

  # Alerting
  alert_email = var.alert_email

  # Services to monitor
  api_service_name = module.api.service_name

  tags = local.common_tags
}

# ===========================================
# Outputs
# ===========================================

output "api_url" {
  description = "URL of the deployed API"
  value       = module.api.api_url
}

output "admin_panel_url" {
  description = "URL of the admin panel"
  value       = module.admin_panel.panel_url
}

output "database_endpoint" {
  description = "Database endpoint"
  value       = module.database.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = module.cache.endpoint
  sensitive   = true
}

output "cdn_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.cdn.distribution_id
}

output "cdn_domain" {
  description = "CloudFront domain name"
  value       = module.cdn.domain_name
}

# ===========================================
# Local Values
# ===========================================

locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    CreatedAt   = timestamp()
  }
}
