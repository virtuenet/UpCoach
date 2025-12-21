# UpCoach Admin Panel Module - Vercel Deployment

# ===========================================
# Vercel Project Configuration
# ===========================================

resource "vercel_project" "admin_panel" {
  name      = "upcoach-admin-${var.environment}"
  framework = "vite"

  git_repository = {
    type = "github"
    repo = "upcoach/upcoach"
  }

  root_directory = "apps/admin-panel"
  build_command  = "npm run build"
  output_directory = "dist"

  install_command = "npm ci"
}

# ===========================================
# Environment Variables
# ===========================================

resource "vercel_project_environment_variable" "api_url" {
  project_id = vercel_project.admin_panel.id
  key        = "VITE_API_URL"
  value      = var.api_url
  target     = [var.environment == "production" ? "production" : "preview"]
}

resource "vercel_project_environment_variable" "stripe_public_key" {
  project_id = vercel_project.admin_panel.id
  key        = "VITE_STRIPE_PUBLIC_KEY"
  value      = var.stripe_public_key
  target     = [var.environment == "production" ? "production" : "preview"]
}

resource "vercel_project_environment_variable" "sentry_dsn" {
  project_id = vercel_project.admin_panel.id
  key        = "VITE_SENTRY_DSN"
  value      = var.sentry_dsn
  target     = [var.environment == "production" ? "production" : "preview"]
}

resource "vercel_project_environment_variable" "environment" {
  project_id = vercel_project.admin_panel.id
  key        = "VITE_ENVIRONMENT"
  value      = var.environment
  target     = [var.environment == "production" ? "production" : "preview"]
}

# ===========================================
# Custom Domain (Production Only)
# ===========================================

resource "vercel_project_domain" "admin" {
  count      = var.environment == "production" ? 1 : 0
  project_id = vercel_project.admin_panel.id
  domain     = "admin.upcoach.app"
}

resource "vercel_project_domain" "admin_www" {
  count      = var.environment == "production" ? 1 : 0
  project_id = vercel_project.admin_panel.id
  domain     = "www.admin.upcoach.app"
  redirect   = vercel_project_domain.admin[0].domain
}

# ===========================================
# Outputs
# ===========================================

output "panel_url" {
  description = "Admin panel URL"
  value       = var.environment == "production" ? "https://admin.upcoach.app" : "https://${vercel_project.admin_panel.name}.vercel.app"
}

output "project_id" {
  description = "Vercel project ID"
  value       = vercel_project.admin_panel.id
}

# ===========================================
# Variables
# ===========================================

variable "environment" {
  type = string
}

variable "vercel_project_id" {
  type = string
}

variable "api_url" {
  type = string
}

variable "stripe_public_key" {
  type = string
}

variable "sentry_dsn" {
  type = string
}

variable "tags" {
  type = map(string)
}
