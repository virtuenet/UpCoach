#!/bin/bash

# UpCoach Platform Dependency Resolution Fix Script
# This script fixes workspace dependency linking issues

set -e

echo "🔧 UpCoach Platform Dependency Resolution Fix"
echo "============================================="

PROJECT_ROOT="/Users/ardisetiadharma/CURSOR Repository/UpCoach/upcoach-project"
cd "$PROJECT_ROOT"

# Function to create symlinks for a service
create_service_links() {
    local service_path="$1"
    local service_name="$2"

    echo "📦 Fixing dependencies for $service_name..."

    # Create node_modules directory if it doesn't exist
    mkdir -p "$service_path/node_modules"
    cd "$service_path/node_modules"

    # Common dependencies that all services need
    common_deps=(
        "typescript"
        "@types/node"
        "@types/jest"
        "jest"
        "prettier"
        "eslint"
    )

    # Create symlinks for common dependencies
    for dep in "${common_deps[@]}"; do
        if [ -d "../../../node_modules/$dep" ]; then
            ln -sf "../../../node_modules/$dep" . 2>/dev/null || true
        fi
    done
}

# Function to fix specific service dependencies
fix_landing_page() {
    echo "🌐 Fixing Landing Page (Next.js) dependencies..."

    service_path="$PROJECT_ROOT/apps/landing-page"
    cd "$service_path"

    # Create node_modules if it doesn't exist
    mkdir -p node_modules
    cd node_modules

    # Landing page specific dependencies
    landing_deps=(
        "next"
        "react"
        "react-dom"
        "tailwindcss"
        "autoprefixer"
        "postcss"
        "framer-motion"
        "lucide-react"
        "@tailwindcss"
        "clsx"
        "axios"
        "zod"
        "web-vitals"
        "@clerk/nextjs"
        "@hookform/resolvers"
        "react-hook-form"
        "react-intersection-observer"
        "tailwind-merge"
    )

    for dep in "${landing_deps[@]}"; do
        if [ -d "../../../node_modules/$dep" ]; then
            ln -sf "../../../node_modules/$dep" . 2>/dev/null || true
            echo "  ✓ Linked $dep"
        else
            echo "  ⚠ Missing $dep in root node_modules"
        fi
    done

    # Special handling for .framer-motion folder
    framer_dir=$(find "../../../node_modules" -name ".framer-motion*" -type d | head -1)
    if [ -n "$framer_dir" ]; then
        ln -sf "$framer_dir" framer-motion 2>/dev/null || true
        echo "  ✓ Linked framer-motion from $framer_dir"
    fi
}

fix_backend_api() {
    echo "🚀 Fixing Backend API dependencies..."

    service_path="$PROJECT_ROOT/services/api"
    cd "$service_path"

    mkdir -p node_modules
    cd node_modules

    # Backend API specific dependencies
    api_deps=(
        "express"
        "cors"
        "compression"
        "dotenv"
        "morgan"
        "bcrypt"
        "bcryptjs"
        "jsonwebtoken"
        "sequelize"
        "pg"
        "helmet"
        "nodemon"
        "ts-node"
        "@anthropic-ai/sdk"
        "@supabase/supabase-js"
        "@sentry/node"
        "@types/express"
        "@types/cors"
        "@types/compression"
        "@types/morgan"
        "@types/bcrypt"
        "@types/bcryptjs"
        "@types/jsonwebtoken"
        "@types/pg"
    )

    for dep in "${api_deps[@]}"; do
        if [ -d "../../../node_modules/$dep" ]; then
            ln -sf "../../../node_modules/$dep" . 2>/dev/null || true
            echo "  ✓ Linked $dep"
        else
            echo "  ⚠ Missing $dep in root node_modules"
        fi
    done
}

fix_admin_panel() {
    echo "⚙️ Fixing Admin Panel dependencies..."

    service_path="$PROJECT_ROOT/apps/admin-panel"
    cd "$service_path"

    mkdir -p node_modules
    cd node_modules

    # Admin panel specific dependencies (React/Vite)
    admin_deps=(
        "react"
        "react-dom"
        "vite"
        "@vitejs/plugin-react"
        "tailwindcss"
        "autoprefixer"
        "postcss"
        "lucide-react"
        "@tailwindcss"
        "clsx"
        "axios"
        "@types/react"
        "@types/react-dom"
    )

    for dep in "${admin_deps[@]}"; do
        if [ -d "../../../node_modules/$dep" ]; then
            ln -sf "../../../node_modules/$dep" . 2>/dev/null || true
            echo "  ✓ Linked $dep"
        else
            echo "  ⚠ Missing $dep in root node_modules"
        fi
    done
}

fix_cms_panel() {
    echo "📝 Fixing CMS Panel dependencies..."

    service_path="$PROJECT_ROOT/apps/cms-panel"
    cd "$service_path"

    mkdir -p node_modules
    cd node_modules

    # CMS panel specific dependencies (React/Vite)
    cms_deps=(
        "react"
        "react-dom"
        "vite"
        "@vitejs/plugin-react"
        "tailwindcss"
        "autoprefixer"
        "postcss"
        "lucide-react"
        "@tailwindcss"
        "clsx"
        "axios"
        "@types/react"
        "@types/react-dom"
    )

    for dep in "${cms_deps[@]}"; do
        if [ -d "../../../node_modules/$dep" ]; then
            ln -sf "../../../node_modules/$dep" . 2>/dev/null || true
            echo "  ✓ Linked $dep"
        else
            echo "  ⚠ Missing $dep in root node_modules"
        fi
    done
}

# Main execution
echo "Starting dependency resolution fix..."

# Fix each service
fix_landing_page
fix_backend_api
fix_admin_panel
fix_cms_panel

# Create common service links
create_service_links "$PROJECT_ROOT/apps/landing-page" "Landing Page"
create_service_links "$PROJECT_ROOT/services/api" "Backend API"
create_service_links "$PROJECT_ROOT/apps/admin-panel" "Admin Panel"
create_service_links "$PROJECT_ROOT/apps/cms-panel" "CMS Panel"

echo ""
echo "✅ Dependency resolution fix completed!"
echo ""
echo "📋 Next steps:"
echo "1. Try building each service"
echo "2. Start development servers"
echo "3. Run tests to verify functionality"
echo ""
echo "🚀 To start services:"
echo "  Landing Page: cd apps/landing-page && npm run dev"
echo "  Backend API:  cd services/api && npm run dev"
echo "  Admin Panel:  cd apps/admin-panel && npm run dev"
echo "  CMS Panel:    cd apps/cms-panel && npm run dev"