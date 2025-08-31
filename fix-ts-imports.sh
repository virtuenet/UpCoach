#!/bin/bash

# Fix TypeScript imports across all services

PROJECT_DIR="/Users/ardisetiadharma/CURSOR Repository/UpCoach/upcoach-project"

echo "Fixing TypeScript imports across all services..."

# Function to add React imports
fix_react_imports() {
    local dir="$1"
    echo "Fixing React imports in $dir..."
    
    find "$dir" -name "*.tsx" -o -name "*.ts" | while IFS= read -r file; do
        # Skip if file doesn't exist
        [ ! -f "$file" ] && continue
        
        # Check if file uses React hooks but doesn't import them
        if grep -q "useState\|useEffect\|useCallback\|useMemo\|useRef\|useContext" "$file"; then
            if ! grep -q "^import.*React\|^import.*{.*use" "$file"; then
                echo "  Adding React imports to: $(basename "$file")"
                sed -i '' '1s/^/import React, { useState, useEffect, useCallback, useMemo, useRef, useContext } from "react";\n/' "$file"
            fi
        fi
    done
}

# Function to add missing component imports  
fix_component_imports() {
    local dir="$1"
    echo "Fixing component imports in $dir..."
    
    # Fix missing error boundary imports
    find "$dir" -name "*.tsx" -type f | while IFS= read -r file; do
        if grep -q "GlobalErrorBoundary\|AsyncErrorBoundary\|RouteErrorBoundary" "$file"; then
            if ! grep -q "import.*ErrorBoundary" "$file"; then
                echo "  Adding ErrorBoundary import to: $(basename "$file")"
                sed -i '' '1s/^/import { GlobalErrorBoundary, AsyncErrorBoundary } from ".\/components\/ErrorBoundary";\n/' "$file"
            fi
        fi
    done
    
    # Fix missing accessibility hook imports
    find "$dir" -name "*.tsx" -type f | while IFS= read -r file; do
        if grep -q "useKeyboardNavigation\|useSkipLinks" "$file"; then
            if ! grep -q "import.*useKeyboardNavigation\|import.*useSkipLinks" "$file"; then
                echo "  Adding accessibility hooks to: $(basename "$file")"
                sed -i '' '1s/^/import { useKeyboardNavigation, useSkipLinks } from ".\/hooks\/useAccessibility";\n/' "$file"
            fi
        fi
    done
}

# Fix admin-panel
fix_react_imports "$PROJECT_DIR/admin-panel/src"
fix_component_imports "$PROJECT_DIR/admin-panel/src"

# Fix cms-panel  
fix_react_imports "$PROJECT_DIR/cms-panel/src"
fix_component_imports "$PROJECT_DIR/cms-panel/src"

echo "Import fixes completed!"