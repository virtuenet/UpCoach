#!/bin/bash

PROJECT_DIR="/Users/ardisetiadharma/CURSOR Repository/UpCoach/upcoach-project"

echo "🔧 Final TypeScript Error Resolution Script"
echo "==========================================="

# Phase 1: Fix error variable references in backend
echo "📝 Phase 1: Fixing error variable references..."
echo "-------------------------------------------"

# Fix 'error' to '_error' in catch blocks (backend already has many fixed)
echo "  Checking remaining unfixed error references..."
find "$PROJECT_DIR/backend/src" -name "*.ts" -type f | while IFS= read -r file; do
    # Check if file has unfixed error references
    if grep -q "} catch (error)" "$file"; then
        echo "  Fixing: $(basename "$file")"
        sed -i '' 's/} catch (error)/} catch (_error)/g' "$file"
        # Also need to update references within the catch block
        sed -i '' '/} catch (_error)/,/^[[:space:]]*}/ s/\berror\b/_error/g' "$file"
    fi
done

# Fix '__res' typo to '_res' 
echo "  Fixing __res typos..."
find "$PROJECT_DIR/backend/src" -name "*.ts" -type f | while IFS= read -r file; do
    if grep -q "__res" "$file"; then
        echo "  Fixing: $(basename "$file")"
        sed -i '' 's/__res/_res/g' "$file"
    fi
done

# Phase 2: Fix test file imports
echo ""
echo "📚 Phase 2: Fixing test file imports..."
echo "-------------------------------------------"

# Fix admin-panel test imports
echo "  Fixing admin-panel test imports..."
find "$PROJECT_DIR/admin-panel/src" -name "*.test.ts" -o -name "*.test.tsx" | while IFS= read -r file; do
    # Check if vitest imports are missing
    if ! grep -q "import.*from ['\"]vitest['\"]" "$file"; then
        echo "  Adding vitest imports to: $(basename "$file")"
        sed -i '' '1i\
import { describe, it, expect, beforeEach, afterEach, vi, Mock } from "vitest";
' "$file"
    fi
    
    # Check if testing-library imports are missing
    if grep -q "render\|screen\|waitFor" "$file"; then
        if ! grep -q "from ['\"]@testing-library/react['\"]" "$file"; then
            echo "  Adding testing-library imports to: $(basename "$file")"
            sed -i '' '2i\
import { render, screen, waitFor } from "@testing-library/react";
' "$file"
        fi
    fi
    
    # Check if MemoryRouter is needed
    if grep -q "MemoryRouter" "$file"; then
        if ! grep -q "import.*MemoryRouter.*from ['\"]react-router-dom['\"]" "$file"; then
            echo "  Adding MemoryRouter import to: $(basename "$file")"
            sed -i '' '3i\
import { MemoryRouter } from "react-router-dom";
' "$file"
        fi
    fi
done

# Fix useAuthStore imports in test files
echo "  Fixing useAuthStore imports..."
find "$PROJECT_DIR/admin-panel/src" -name "*.test.ts" -o -name "*.test.tsx" | while IFS= read -r file; do
    if grep -q "useAuthStore" "$file"; then
        if ! grep -q "import.*useAuthStore" "$file"; then
            echo "  Adding useAuthStore import to: $(basename "$file")"
            # Check the correct relative path based on file location
            if [[ "$file" == *"/components/"* ]]; then
                sed -i '' '4i\
import { useAuthStore } from "../stores/authStore";
' "$file"
            else
                sed -i '' '4i\
import { useAuthStore } from "./stores/authStore";
' "$file"
            fi
        fi
    fi
done

# Phase 3: Create Express middleware utilities
echo ""
echo "🛠️ Phase 3: Creating Express middleware utilities..."
echo "-------------------------------------------"

cat > "$PROJECT_DIR/backend/src/utils/express-helpers.ts" << 'EOF'
/**
 * Express middleware helper utilities
 */

import { Request, Response, NextFunction } from 'express';
import { AsyncRequestHandler } from '../types/express-extended';
import { logger } from './logger';

/**
 * Wrapper for async route handlers to properly catch errors
 */
export function asyncHandler<P = any, ResBody = any, ReqBody = any, ReqQuery = any>(
  handler: AsyncRequestHandler<P, ResBody, ReqBody, ReqQuery>
) {
  return (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response<ResBody>, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

/**
 * Standard error handler wrapper
 */
export function errorWrapper(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      logger.error('Route handler error:', error);
      next(error);
    }
  };
}

/**
 * Response helper methods
 */
export function attachResponseHelpers(req: Request, res: Response, next: NextFunction) {
  res.success = function(data?: any, message?: string) {
    return this.json({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    });
  };

  res.error = function(error: string | Error, statusCode: number = 500) {
    return this.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : error,
      timestamp: new Date().toISOString()
    });
  };

  res.paginated = function<T>(items: T[], total: number, page: number, pageSize: number) {
    const totalPages = Math.ceil(total / pageSize);
    return this.json({
      success: true,
      data: items,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  };

  next();
}

/**
 * Validate request parameters
 */
export function validateParams(params: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const missing = params.filter(param => !req.params[param]);
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required parameters: ${missing.join(', ')}`
      });
    }
    next();
  };
}

/**
 * Validate request body
 */
export function validateBody(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const missing = fields.filter(field => !req.body[field]);
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missing.join(', ')}`
      });
    }
    next();
  };
}
EOF

echo "  Created Express helper utilities"

# Phase 4: Resolve Playwright conflicts
echo ""
echo "🎭 Phase 4: Resolving Playwright conflicts..."
echo "-------------------------------------------"

# Remove global playwright if exists and install locally
echo "  Installing @playwright/test in landing-page..."
cd "$PROJECT_DIR/landing-page"
npm uninstall -g @playwright/test 2>/dev/null || true
npm install --save-dev @playwright/test@latest

# Phase 5: Run auto-fixers
echo ""
echo "🔄 Phase 5: Running auto-fixers..."
echo "-------------------------------------------"

# Run ESLint fix
echo "  Running ESLint auto-fix in backend..."
cd "$PROJECT_DIR/backend"
npx eslint --fix "src/**/*.ts" --quiet 2>/dev/null || true

echo "  Running ESLint auto-fix in admin-panel..."
cd "$PROJECT_DIR/admin-panel"
npx eslint --fix "src/**/*.{ts,tsx}" --quiet 2>/dev/null || true

echo "  Running ESLint auto-fix in cms-panel..."
cd "$PROJECT_DIR/cms-panel"
npx eslint --fix "src/**/*.{ts,tsx}" --quiet 2>/dev/null || true

# Run Prettier
echo "  Running Prettier formatting..."
cd "$PROJECT_DIR"
npx prettier --write "**/*.{ts,tsx,js,jsx}" --ignore-path .gitignore 2>/dev/null || true

echo ""
echo "✅ Final TypeScript error resolution complete!"
echo ""
echo "📊 Next steps:"
echo "1. Run 'npm run build' in each service to check remaining errors"
echo "2. Review and test the changes"
echo "3. Commit the fixes"