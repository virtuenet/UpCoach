# UpCoach Project Makefile

.PHONY: help
help: ## Show this help message
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Environment setup
.PHONY: setup
setup: ## Initial project setup
	@echo "Setting up UpCoach project..."
	@cp env.example .env
	@echo "Please edit .env file with your configuration"
	@mkdir -p credentials
	@echo "Environment setup complete!"

# Docker commands
.PHONY: build
build: ## Build all Docker containers
	docker-compose build

.PHONY: up
up: ## Start all services
	docker-compose up -d

.PHONY: down
down: ## Stop all services
	docker-compose down

.PHONY: restart
restart: down up ## Restart all services

.PHONY: logs
logs: ## View logs from all services
	docker-compose logs -f

.PHONY: logs-landing
logs-landing: ## View landing page logs
	docker-compose logs -f landing-page

.PHONY: logs-admin
logs-admin: ## View admin panel logs
	docker-compose logs -f admin-panel

.PHONY: logs-cms
logs-cms: ## View CMS panel logs
	docker-compose logs -f cms-panel

.PHONY: logs-api
logs-api: ## View backend API logs
	docker-compose logs -f backend-api

# Database commands
.PHONY: db-migrate
db-migrate: ## Run database migrations
	docker-compose exec postgres psql -U upcoach -d upcoach_db -f /docker-entrypoint-initdb.d/001_initial_schema.sql

.PHONY: db-seed
db-seed: ## Seed database with sample data
	docker-compose exec postgres psql -U upcoach -d upcoach_db -f /docker-entrypoint-initdb.d/002_seed_data.sql

.PHONY: db-reset
db-reset: ## Reset database (drop and recreate)
	docker-compose exec postgres psql -U upcoach -c "DROP DATABASE IF EXISTS upcoach_db;"
	docker-compose exec postgres psql -U upcoach -c "CREATE DATABASE upcoach_db;"
	make db-migrate
	make db-seed

.PHONY: db-backup
db-backup: ## Backup database
	@mkdir -p backups
	docker-compose exec postgres pg_dump -U upcoach upcoach_db > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql

.PHONY: db-console
db-console: ## Access PostgreSQL console
	docker-compose exec postgres psql -U upcoach -d upcoach_db

# Testing commands
.PHONY: test
test: test-unit test-e2e ## Run all tests

.PHONY: test-unit
test-unit: ## Run unit tests
	cd landing-page && npm test
	cd admin-panel && npm test
	cd cms-panel && npm test

.PHONY: test-e2e
test-e2e: ## Run E2E tests with Playwright
	docker-compose --profile testing run playwright npm test

.PHONY: test-flutter
test-flutter: ## Run Flutter tests
	docker-compose --profile testing run flutter-test flutter test

.PHONY: test-coverage
test-coverage: ## Generate test coverage report
	cd landing-page && npm run test:coverage
	cd admin-panel && npm run test:coverage
	cd cms-panel && npm run test:coverage

# Development commands
.PHONY: dev
dev: ## Start development environment
	docker-compose --profile development up

.PHONY: dev-landing
dev-landing: ## Start only landing page in dev mode
	cd landing-page && npm run dev

.PHONY: dev-admin
dev-admin: ## Start only admin panel in dev mode
	cd admin-panel && npm run dev

.PHONY: dev-cms
dev-cms: ## Start only CMS panel in dev mode
	cd cms-panel && npm run dev

.PHONY: dev-mobile
dev-mobile: ## Start Flutter mobile app
	cd mobile-app && flutter run

# Code quality commands
.PHONY: lint
lint: ## Run linters on all projects
	cd landing-page && npm run lint
	cd admin-panel && npm run lint
	cd cms-panel && npm run lint
	cd backend && npm run lint

.PHONY: format
format: ## Format code in all projects
	cd landing-page && npm run format
	cd admin-panel && npm run format
	cd cms-panel && npm run format
	cd backend && npm run format

.PHONY: type-check
type-check: ## Run TypeScript type checking
	cd landing-page && npm run type-check
	cd admin-panel && npm run type-check
	cd cms-panel && npm run type-check
	cd backend && npm run type-check

# Security commands
.PHONY: security-scan
security-scan: ## Run security vulnerability scan
	cd landing-page && npm audit
	cd admin-panel && npm audit
	cd cms-panel && npm audit
	cd backend && npm audit
	cd mobile-app && flutter pub audit

# Utility commands
.PHONY: clean
clean: ## Clean up generated files and dependencies
	docker-compose down -v
	find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
	find . -name ".next" -type d -prune -exec rm -rf '{}' +
	find . -name "dist" -type d -prune -exec rm -rf '{}' +
	find . -name "build" -type d -prune -exec rm -rf '{}' +

.PHONY: install
install: ## Install all dependencies
	cd landing-page && npm install
	cd admin-panel && npm install
	cd cms-panel && npm install
	cd backend && npm install
	cd mobile-app && flutter pub get

.PHONY: update
update: ## Update all dependencies
	cd landing-page && npm update
	cd admin-panel && npm update
	cd cms-panel && npm update
	cd backend && npm update
	cd mobile-app && flutter pub upgrade

# Production commands
.PHONY: build-prod
build-prod: ## Build for production
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

.PHONY: deploy-staging
deploy-staging: ## Deploy to staging environment
	@echo "Deploying to staging..."
	# Add your staging deployment commands here

.PHONY: deploy-prod
deploy-prod: ## Deploy to production environment
	@echo "Deploying to production..."
	# Add your production deployment commands here

# Monitoring commands
.PHONY: status
status: ## Check status of all services
	docker-compose ps

.PHONY: health
health: ## Check health of all services
	@echo "Checking service health..."
	@curl -f http://localhost:3000/api/health || echo "Landing page is down"
	@curl -f http://localhost:3001/api/health || echo "Admin panel is down"
	@curl -f http://localhost:3002/api/health || echo "CMS panel is down"
	@curl -f http://localhost:8080/api/health || echo "Backend API is down"

.PHONY: metrics
metrics: ## View service metrics
	@echo "Opening monitoring dashboard..."
	@open http://localhost:3000/metrics 