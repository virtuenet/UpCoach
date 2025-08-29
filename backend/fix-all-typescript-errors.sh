#!/bin/bash

echo "Fixing remaining TypeScript errors..."

# Fix middleware/auth.ts - change 'res' to '_res' and fix references
echo "Fixing middleware/auth.ts..."
sed -i '' 's/async (req: Request, res: Response, next: NextFunction)/async (req: Request, _res: Response, next: NextFunction)/g' src/middleware/auth.ts
sed -i '' 's/_res\.status/_res.status/g' src/middleware/auth.ts

# Fix middleware/cdn.ts
echo "Fixing middleware/cdn.ts..."
sed -i '' 's/export function serveCDNContent() {/export function serveCDNContent() {/g' src/middleware/cdn.ts
sed -i '' 's/return async (req: Request, res: Response)/return async (_req: Request, res: Response)/g' src/middleware/cdn.ts
sed -i '' 's/export function optimizeImages() {/export function optimizeImages() {/g' src/middleware/cdn.ts
sed -i '' 's/return async (req: Request, res: Response, next: NextFunction)/return async (_req: Request, res: Response, next: NextFunction)/g' src/middleware/cdn.ts

# Fix middleware/error.ts
echo "Fixing middleware/error.ts..."
sed -i '' 's/export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction)/export const errorHandler = (err: any, req: Request, _res: Response, next: NextFunction)/g' src/middleware/error.ts
sed -i '' 's/export const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction)/export const asyncHandler = (fn: any) => (req: Request, _res: Response, next: NextFunction)/g' src/middleware/error.ts

# Fix middleware/errorHandler.ts
echo "Fixing middleware/errorHandler.ts..."
sed -i '' 's/export function globalErrorHandler(err: any, req: Request, res: Response, next: NextFunction)/export function globalErrorHandler(err: any, req: Request, _res: Response, next: NextFunction)/g' src/middleware/errorHandler.ts

# Fix middleware/i18n.ts
echo "Fixing middleware/i18n.ts..."
sed -i '' 's/return (req: Request, res: Response, next: NextFunction)/return (_req: Request, res: Response, next: NextFunction)/g' src/middleware/i18n.ts

# Fix middleware/performance.ts
echo "Fixing middleware/performance.ts..."
sed -i '' 's/return (req: Request, res: Response, next: NextFunction)/return (_req: Request, res: Response, next: NextFunction)/g' src/middleware/performance.ts
sed -i '' 's/return async (req: Request, res: Response, next: NextFunction)/return async (_req: Request, res: Response, next: NextFunction)/g' src/middleware/performance.ts

# Fix controllers - prefix unused req parameters
echo "Fixing controllers..."
find src/controllers -name "*.ts" -exec sed -i '' 's/async (req: Request, res: Response)/async (_req: Request, res: Response)/g' {} \;
find src/controllers -name "*.ts" -exec sed -i '' 's/(req: Request, res: Response)/(_req: Request, res: Response)/g' {} \;

# Fix middleware/resourceAccess.ts - remove unused userRole
echo "Fixing middleware/resourceAccess.ts..."
sed -i '' 's/const { userId, userRole } = req.user;/const { userId } = req.user;/g' src/middleware/resourceAccess.ts

echo "TypeScript error fixes completed!"