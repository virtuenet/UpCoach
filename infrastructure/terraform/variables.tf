# UpCoach Platform - Terraform Variables

# ===========================================
# General Configuration
# ===========================================

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "upcoach"
}

variable "environment" {
  description = "Environment (staging, production)"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either 'staging' or 'production'."
  }
}

# ===========================================
# AWS Configuration
# ===========================================

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

# ===========================================
# GCP Configuration
# ===========================================

variable "gcp_project_id" {
  description = "GCP project ID"
  type        = string
}

variable "gcp_region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

# ===========================================
# Railway Configuration
# ===========================================

variable "railway_token" {
  description = "Railway API token"
  type        = string
  sensitive   = true
}

variable "railway_project_id" {
  description = "Railway project ID"
  type        = string
}

# ===========================================
# Vercel Configuration
# ===========================================

variable "vercel_token" {
  description = "Vercel API token"
  type        = string
  sensitive   = true
}

variable "vercel_team_id" {
  description = "Vercel team ID"
  type        = string
}

variable "vercel_admin_project_id" {
  description = "Vercel project ID for admin panel"
  type        = string
}

# ===========================================
# Database Configuration
# ===========================================

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 50
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "upcoach"
}

variable "db_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

# ===========================================
# Redis Configuration
# ===========================================

variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 1
}

# ===========================================
# API Configuration
# ===========================================

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe secret API key"
  type        = string
  sensitive   = true
}

variable "stripe_public_key" {
  description = "Stripe public API key"
  type        = string
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook signing secret"
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
}

variable "api_sentry_dsn" {
  description = "Sentry DSN for API"
  type        = string
}

variable "admin_sentry_dsn" {
  description = "Sentry DSN for admin panel"
  type        = string
}

# ===========================================
# CDN Configuration
# ===========================================

variable "cdn_domain_aliases" {
  description = "Domain aliases for CloudFront"
  type        = list(string)
  default     = []
}

variable "ssl_certificate_arn" {
  description = "ARN of SSL certificate in ACM"
  type        = string
}

# ===========================================
# Monitoring Configuration
# ===========================================

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "alert_email" {
  description = "Email for alerts"
  type        = string
}
