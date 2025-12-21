# UpCoach API Module - Railway Deployment

# ===========================================
# Railway Service Configuration
# ===========================================

resource "railway_service" "api" {
  project_id = var.railway_project_id
  name       = "upcoach-api-${var.environment}"
}

resource "railway_deployment" "api" {
  service_id = railway_service.api.id

  source = {
    repo   = "upcoach/upcoach"
    branch = var.environment == "production" ? "main" : "develop"
  }

  builder = "dockerfile"
  dockerfile_path = "services/api/Dockerfile.production"

  healthcheck_path = "/health"
  healthcheck_timeout = 30

  replicas = var.environment == "production" ? 2 : 1

  restart_policy_type = "on_failure"
  restart_policy_max_retries = 3
}

# ===========================================
# Environment Variables
# ===========================================

resource "railway_variable" "database_url" {
  service_id = railway_service.api.id
  name       = "DATABASE_URL"
  value      = var.database_url
}

resource "railway_variable" "redis_url" {
  service_id = railway_service.api.id
  name       = "REDIS_URL"
  value      = var.redis_url
}

resource "railway_variable" "jwt_secret" {
  service_id = railway_service.api.id
  name       = "JWT_SECRET"
  value      = var.jwt_secret
}

resource "railway_variable" "node_env" {
  service_id = railway_service.api.id
  name       = "NODE_ENV"
  value      = var.environment
}

resource "railway_variable" "stripe_secret_key" {
  service_id = railway_service.api.id
  name       = "STRIPE_SECRET_KEY"
  value      = var.stripe_secret_key
}

resource "railway_variable" "stripe_webhook_secret" {
  service_id = railway_service.api.id
  name       = "STRIPE_WEBHOOK_SECRET"
  value      = var.stripe_webhook_secret
}

resource "railway_variable" "openai_api_key" {
  service_id = railway_service.api.id
  name       = "OPENAI_API_KEY"
  value      = var.openai_api_key
}

resource "railway_variable" "sentry_dsn" {
  service_id = railway_service.api.id
  name       = "SENTRY_DSN"
  value      = var.sentry_dsn
}

# ===========================================
# Custom Domain (Production Only)
# ===========================================

resource "railway_custom_domain" "api" {
  count      = var.environment == "production" ? 1 : 0
  service_id = railway_service.api.id
  domain     = "api.upcoach.app"
}

# ===========================================
# Outputs
# ===========================================

output "api_url" {
  description = "API URL"
  value       = var.environment == "production" ? "https://api.upcoach.app" : railway_service.api.url
}

output "service_name" {
  description = "Railway service name"
  value       = railway_service.api.name
}

output "service_id" {
  description = "Railway service ID"
  value       = railway_service.api.id
}

# ===========================================
# Variables
# ===========================================

variable "environment" {
  type = string
}

variable "railway_project_id" {
  type = string
}

variable "database_url" {
  type      = string
  sensitive = true
}

variable "redis_url" {
  type      = string
  sensitive = true
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "stripe_secret_key" {
  type      = string
  sensitive = true
}

variable "stripe_webhook_secret" {
  type      = string
  sensitive = true
}

variable "openai_api_key" {
  type      = string
  sensitive = true
}

variable "sentry_dsn" {
  type = string
}

variable "tags" {
  type = map(string)
}
