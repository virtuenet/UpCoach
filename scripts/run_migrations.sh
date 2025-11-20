#!/bin/bash

# ============================================================================
# Database Migration Runner
# ============================================================================
# Safely runs database migrations with backup and rollback support
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$PROJECT_ROOT/upcoach-project/services/api"

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
    echo -e "${BLUE}ℹ️  $1${NC}"
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

# Check environment
check_environment() {
    print_header "🔍 Checking Environment"

    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL environment variable not set"
        print_info "Set it with: export DATABASE_URL='postgresql://...'"
        exit 1
    fi

    print_success "DATABASE_URL is set"

    # Detect environment from DATABASE_URL
    if [[ $DATABASE_URL == *"localhost"* ]] || [[ $DATABASE_URL == *"127.0.0.1"* ]]; then
        ENV="development"
    else
        ENV="production"
    fi

    print_info "Detected environment: $ENV"

    if [ "$ENV" == "production" ]; then
        print_warning "⚠️  You are running migrations on PRODUCTION database!"
        if ! confirm "Are you absolutely sure you want to continue?"; then
            print_info "Migration cancelled"
            exit 0
        fi
    fi
}

# Create database backup
create_backup() {
    print_header "💾 Creating Database Backup"

    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="backup_${ENV}_${timestamp}.sql"

    print_info "Creating backup: $backup_file"

    # Extract database connection info from DATABASE_URL
    # Format: postgresql://user:pass@host:port/database

    if command -v pg_dump &> /dev/null; then
        if pg_dump "$DATABASE_URL" > "$backup_file"; then
            print_success "Backup created: $backup_file"
            echo "$backup_file" > .last_backup
        else
            print_error "Backup failed"
            if ! confirm "Continue without backup? (NOT RECOMMENDED)"; then
                exit 1
            fi
        fi
    else
        print_warning "pg_dump not available. Skipping backup."
        print_info "Install PostgreSQL client tools for backup support"

        if [ "$ENV" == "production" ] && ! confirm "Continue without backup in production?"; then
            exit 1
        fi
    fi
}

# Show pending migrations
show_pending() {
    print_header "📋 Pending Migrations"

    cd "$API_DIR"

    if [ -f "package.json" ] && grep -q "migrate:status" package.json; then
        npm run migrate:status || true
    else
        print_warning "No migrate:status script found"
    fi
}

# Run migrations
run_migrations() {
    print_header "🚀 Running Migrations"

    cd "$API_DIR"

    if [ ! -f "package.json" ]; then
        print_error "package.json not found in $API_DIR"
        exit 1
    fi

    if grep -q "migrate:up" package.json; then
        print_info "Running migrations..."

        if npm run migrate:up; then
            print_success "Migrations completed successfully"
            return 0
        else
            print_error "Migration failed"
            return 1
        fi
    elif grep -q "migrate" package.json; then
        print_info "Running migrations..."

        if npm run migrate; then
            print_success "Migrations completed successfully"
            return 0
        else
            print_error "Migration failed"
            return 1
        fi
    else
        print_error "No migration script found in package.json"
        print_info "Add a 'migrate' or 'migrate:up' script to package.json"
        exit 1
    fi
}

# Rollback migrations
rollback_migrations() {
    print_header "🔄 Rolling Back Migrations"

    cd "$API_DIR"

    if grep -q "migrate:down" package.json; then
        print_info "Rolling back last migration..."

        if npm run migrate:down; then
            print_success "Rollback successful"
        else
            print_error "Rollback failed"
            print_info "You may need to restore from backup"
        fi
    else
        print_warning "No migrate:down script found"
        print_info "Restore from backup manually if needed"
    fi
}

# Restore from backup
restore_backup() {
    print_header "♻️  Restoring from Backup"

    if [ -f ".last_backup" ]; then
        local backup_file=$(cat .last_backup)

        if [ -f "$backup_file" ]; then
            print_info "Restoring from: $backup_file"

            if confirm "This will overwrite the current database. Continue?"; then
                if command -v psql &> /dev/null; then
                    if psql "$DATABASE_URL" < "$backup_file"; then
                        print_success "Database restored from backup"
                    else
                        print_error "Restore failed"
                    fi
                else
                    print_error "psql not available"
                    print_info "Install PostgreSQL client tools"
                fi
            fi
        else
            print_error "Backup file not found: $backup_file"
        fi
    else
        print_error "No backup file reference found"
    fi
}

# Verify database connection
verify_connection() {
    print_header "🔌 Verifying Database Connection"

    if command -v psql &> /dev/null; then
        if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
            print_success "Database connection successful"
        else
            print_error "Cannot connect to database"
            exit 1
        fi
    else
        print_warning "psql not available, skipping connection test"
    fi
}

# Main function
main() {
    local command=${1:-up}

    case "$command" in
        up|migrate)
            print_header "🗄️  Database Migration Runner"
            check_environment
            verify_connection
            create_backup
            show_pending

            if confirm "Run migrations now?"; then
                if run_migrations; then
                    print_success "✅ Migration complete!"
                else
                    print_error "❌ Migration failed!"

                    if confirm "Attempt rollback?"; then
                        rollback_migrations
                    fi

                    if confirm "Restore from backup?"; then
                        restore_backup
                    fi

                    exit 1
                fi
            else
                print_info "Migration cancelled"
            fi
            ;;

        down|rollback)
            print_header "🔄 Migration Rollback"
            check_environment
            verify_connection
            create_backup

            if confirm "Rollback last migration?"; then
                rollback_migrations
            fi
            ;;

        status)
            print_header "📊 Migration Status"
            check_environment
            show_pending
            ;;

        restore)
            check_environment
            restore_backup
            ;;

        *)
            echo "Usage: $0 {up|down|status|restore}"
            echo ""
            echo "Commands:"
            echo "  up|migrate  - Run pending migrations"
            echo "  down|rollback - Rollback last migration"
            echo "  status      - Show migration status"
            echo "  restore     - Restore from last backup"
            exit 1
            ;;
    esac
}

# Run main
main "$@"
