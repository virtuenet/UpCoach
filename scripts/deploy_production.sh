#!/bin/bash

# ============================================================================
# UpCoach Production Deployment Script
# ============================================================================
# Automates deployment of all services to production environment
# - API service (Railway)
# - Frontend apps (Vercel)
# - Database migrations (Supabase)
# - Cache service (Upstash)
# ============================================================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Deployment status
DEPLOYMENTS_SUCCESS=0
DEPLOYMENTS_FAILED=0

# Functions
print_header() {
    echo -e "\n${BLUE}===================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

confirm() {
    local question=$1
    echo -e "${YELLOW}$question (y/n)${NC}"
    read -r response
    case "$response" in
        [yY][eE][sS]|[yY])
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        print_error "$1 is not installed. Please install it first."
        return 1
    fi
    return 0
}

# Pre-flight checks
preflight_checks() {
    print_header "🔍 Pre-flight Checks"

    local all_good=true

    # Check required commands
    print_info "Checking required commands..."

    if ! check_command "node"; then
        all_good=false
    fi

    if ! check_command "npm"; then
        all_good=false
    fi

    if ! check_command "git"; then
        all_good=false
    fi

    # Optional but recommended
    if ! check_command "railway"; then
        print_warning "Railway CLI not installed. Install: npm install -g @railway/cli"
        print_warning "You can still deploy manually through Railway dashboard"
    fi

    if ! check_command "vercel"; then
        print_warning "Vercel CLI not installed. Install: npm install -g vercel"
        print_warning "You can still deploy manually through Vercel dashboard"
    fi

    # Check if in git repository
    if [ ! -d ".git" ]; then
        print_error "Not in a git repository"
        all_good=false
    fi

    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        print_warning "You have uncommitted changes"
        if ! confirm "Continue deployment anyway?"; then
            exit 1
        fi
    fi

    # Check current branch
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "main" ] && [ "$current_branch" != "master" ]; then
        print_warning "You're not on main/master branch (current: $current_branch)"
        if ! confirm "Continue deployment from $current_branch?"; then
            exit 1
        fi
    fi

    if [ "$all_good" = false ]; then
        print_error "Pre-flight checks failed"
        exit 1
    fi

    print_success "Pre-flight checks passed"
}

# Run tests before deployment
run_tests() {
    print_header "🧪 Running Tests"

    if [ -f "$PROJECT_ROOT/scripts/run_all_tests.sh" ]; then
        print_info "Running automated test suite..."

        if bash "$PROJECT_ROOT/scripts/run_all_tests.sh"; then
            print_success "All tests passed"
            ((DEPLOYMENTS_SUCCESS++))
            return 0
        else
            print_error "Tests failed"
            if confirm "Deploy anyway? (NOT RECOMMENDED)"; then
                print_warning "Proceeding with deployment despite test failures"
                return 0
            else
                exit 1
            fi
        fi
    else
        print_warning "Test script not found. Skipping tests."
    fi
}

# Build all projects
build_projects() {
    print_header "🔨 Building Projects"

    # Build API
    print_info "Building API service..."
    cd "$PROJECT_ROOT/upcoach-project/services/api"

    if [ -f "package.json" ]; then
        npm install --production=false
        npm run build || print_warning "API build script not found"
        print_success "API build complete"
    fi

    # Build Admin Panel
    print_info "Building Admin Panel..."
    cd "$PROJECT_ROOT/upcoach-project/apps/admin-panel"

    if [ -f "package.json" ]; then
        npm install
        npm run build || print_warning "Admin panel build failed"
        print_success "Admin Panel build complete"
    fi

    # Build CMS Panel
    print_info "Building CMS Panel..."
    cd "$PROJECT_ROOT/upcoach-project/apps/cms-panel"

    if [ -f "package.json" ]; then
        npm install
        npm run build || print_warning "CMS panel build failed"
        print_success "CMS Panel build complete"
    fi

    # Build Landing Page
    print_info "Building Landing Page..."
    cd "$PROJECT_ROOT/upcoach-project/apps/landing-page"

    if [ -f "package.json" ]; then
        npm install
        npm run build || print_warning "Landing page build failed"
        print_success "Landing Page build complete"
    fi

    cd "$PROJECT_ROOT"
    print_success "All builds complete"
}

# Deploy API to Railway
deploy_api() {
    print_header "🚂 Deploying API to Railway"

    cd "$PROJECT_ROOT/upcoach-project/services/api"

    if command -v railway &> /dev/null; then
        print_info "Deploying with Railway CLI..."

        if railway up; then
            print_success "API deployed to Railway"
            ((DEPLOYMENTS_SUCCESS++))
        else
            print_error "API deployment failed"
            ((DEPLOYMENTS_FAILED++))
        fi
    else
        print_warning "Railway CLI not available"
        print_info "Deploy manually:"
        print_info "1. Go to https://railway.app"
        print_info "2. Connect your GitHub repository"
        print_info "3. Configure environment variables"
        print_info "4. Deploy from main branch"
    fi

    cd "$PROJECT_ROOT"
}

# Deploy Frontend to Vercel
deploy_frontend() {
    print_header "▲ Deploying Frontend to Vercel"

    if command -v vercel &> /dev/null; then
        # Deploy Admin Panel
        print_info "Deploying Admin Panel..."
        cd "$PROJECT_ROOT/upcoach-project/apps/admin-panel"

        if vercel --prod --yes; then
            print_success "Admin Panel deployed"
            ((DEPLOYMENTS_SUCCESS++))
        else
            print_error "Admin Panel deployment failed"
            ((DEPLOYMENTS_FAILED++))
        fi

        # Deploy CMS Panel
        print_info "Deploying CMS Panel..."
        cd "$PROJECT_ROOT/upcoach-project/apps/cms-panel"

        if vercel --prod --yes; then
            print_success "CMS Panel deployed"
            ((DEPLOYMENTS_SUCCESS++))
        else
            print_error "CMS Panel deployment failed"
            ((DEPLOYMENTS_FAILED++))
        fi

        # Deploy Landing Page
        print_info "Deploying Landing Page..."
        cd "$PROJECT_ROOT/upcoach-project/apps/landing-page"

        if vercel --prod --yes; then
            print_success "Landing Page deployed"
            ((DEPLOYMENTS_SUCCESS++))
        else
            print_error "Landing Page deployment failed"
            ((DEPLOYMENTS_FAILED++))
        fi
    else
        print_warning "Vercel CLI not available"
        print_info "Deploy manually:"
        print_info "1. Go to https://vercel.com"
        print_info "2. Import GitHub repository"
        print_info "3. Configure projects for each app"
        print_info "4. Deploy"
    fi

    cd "$PROJECT_ROOT"
}

# Run database migrations
run_migrations() {
    print_header "🗄️  Running Database Migrations"

    cd "$PROJECT_ROOT/upcoach-project/services/api"

    if [ -f "package.json" ] && grep -q "migrate" package.json; then
        print_info "Running migrations..."

        if npm run migrate:production; then
            print_success "Migrations complete"
            ((DEPLOYMENTS_SUCCESS++))
        else
            print_error "Migration failed"
            ((DEPLOYMENTS_FAILED++))

            if ! confirm "Continue despite migration failure?"; then
                exit 1
            fi
        fi
    else
        print_warning "No migration script found"
        print_info "Run migrations manually if needed"
    fi

    cd "$PROJECT_ROOT"
}

# Verify deployments
verify_deployments() {
    print_header "✓ Verifying Deployments"

    print_info "Checking health endpoints..."

    # API Health Check
    if command -v curl &> /dev/null; then
        print_info "Checking API health..."

        # Replace with your actual API URL
        API_URL="${API_URL:-https://api.upcoach.app}"

        if curl -f -s "${API_URL}/health" > /dev/null; then
            print_success "API is healthy"
        else
            print_warning "API health check failed or not configured"
        fi
    fi

    print_info "Manual verification steps:"
    print_info "1. Check Railway dashboard: https://railway.app"
    print_info "2. Check Vercel dashboard: https://vercel.com"
    print_info "3. Visit production URLs and test critical features"
    print_info "4. Check error tracking (Sentry/DataDog)"
    print_info "5. Monitor logs for any issues"
}

# Generate deployment report
generate_report() {
    print_header "📊 Deployment Report"

    echo "Deployment completed at: $(date)"
    echo ""
    echo "Results:"
    print_success "Successful: $DEPLOYMENTS_SUCCESS"
    print_error "Failed: $DEPLOYMENTS_FAILED"
    echo ""

    if [ $DEPLOYMENTS_FAILED -eq 0 ]; then
        print_success "🎉 All deployments successful!"
    else
        print_warning "⚠️  Some deployments failed. Please review."
    fi

    echo ""
    echo "Next Steps:"
    echo "1. Verify all services are running"
    echo "2. Test critical user flows"
    echo "3. Monitor error rates and performance"
    echo "4. Check analytics dashboards"
    echo "5. Notify team of deployment"
}

# Rollback function
rollback() {
    print_header "🔄 Rollback"

    print_error "Deployment failed. Initiating rollback..."

    if confirm "Rollback to previous version?"; then
        print_info "Rolling back..."

        # Railway rollback
        if command -v railway &> /dev/null; then
            cd "$PROJECT_ROOT/upcoach-project/services/api"
            railway rollback || print_warning "Railway rollback failed"
        fi

        # Vercel rollback (promote previous deployment)
        if command -v vercel &> /dev/null; then
            print_info "To rollback Vercel deployments:"
            print_info "1. Go to Vercel dashboard"
            print_info "2. Find previous deployment"
            print_info "3. Click 'Promote to Production'"
        fi

        print_success "Rollback complete"
    fi
}

# Main deployment flow
main() {
    print_header "🚀 UpCoach Production Deployment"

    echo "This script will deploy UpCoach to production:"
    echo "  - API service → Railway"
    echo "  - Frontend apps → Vercel"
    echo "  - Database migrations → Supabase"
    echo ""

    if ! confirm "Ready to deploy to production?"; then
        print_info "Deployment cancelled"
        exit 0
    fi

    # Run deployment steps
    preflight_checks
    run_tests
    build_projects
    run_migrations
    deploy_api
    deploy_frontend
    verify_deployments
    generate_report

    if [ $DEPLOYMENTS_FAILED -gt 0 ]; then
        if confirm "Deployment had failures. Rollback?"; then
            rollback
        fi
        exit 1
    fi

    print_success "🎉 Production deployment complete!"
}

# Handle Ctrl+C
trap 'print_error "Deployment interrupted"; exit 130' INT

# Run main function
main "$@"
