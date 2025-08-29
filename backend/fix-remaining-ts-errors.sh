#!/bin/bash

echo "Fixing remaining TypeScript errors comprehensively..."

# Fix middleware/cdn.ts
echo "Fixing middleware/cdn.ts..."
sed -i '' 's/res\.setHeader/_res.setHeader/g' src/middleware/cdn.ts
sed -i '' 's/(req: Request, res: Response)/(_req: Request, _res: Response)/g' src/middleware/cdn.ts

# Fix middleware/error.ts
echo "Fixing middleware/error.ts..."
sed -i '' 's/_res\.status(statusCode)\.json/res.status(statusCode).json/g' src/middleware/error.ts
sed -i '' 's/export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction)/export const errorHandler = (err: any, req: Request, _res: Response, next: NextFunction)/g' src/middleware/error.ts
sed -i '' 's/export const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction)/export const asyncHandler = (fn: any) => (req: Request, _res: Response, next: NextFunction)/g' src/middleware/error.ts

# Fix middleware/errorHandler.ts
echo "Fixing middleware/errorHandler.ts..."
sed -i '' 's/res\.status/_res.status/g' src/middleware/errorHandler.ts

# Fix middleware/performance.ts
echo "Fixing middleware/performance.ts..."
sed -i '' 's/res\.setHeader/_res.setHeader/g' src/middleware/performance.ts
sed -i '' 's/(req: Request, res: Response, next: NextFunction)/(_req: Request, _res: Response, next: NextFunction)/g' src/middleware/performance.ts

# Fix middleware/resourceAccess.ts
echo "Fixing middleware/resourceAccess.ts..."
sed -i '' 's/_res\.status(403)/res.status(403)/g' src/middleware/resourceAccess.ts
sed -i '' 's/_res\.status(404)/res.status(404)/g' src/middleware/resourceAccess.ts
sed -i '' 's/const userId = req.user.userId;/const { userId } = req.user;/g' src/middleware/resourceAccess.ts

# Fix all controller files - ensure consistent parameter naming
echo "Fixing controller parameter consistency..."
find src/controllers -name "*.ts" -exec sed -i '' 's/return res\./return _res./g' {} \;
find src/controllers -name "*.ts" -exec sed -i '' 's/res\.status/_res.status/g' {} \;
find src/controllers -name "*.ts" -exec sed -i '' 's/res\.json/_res.json/g' {} \;
find src/controllers -name "*.ts" -exec sed -i '' 's/res\.send/_res.send/g' {} \;

# Fix WebAuthnService Buffer issues
echo "Fixing WebAuthnService Buffer issues..."
sed -i '' 's/credentialID: Buffer/credentialID: Uint8Array/g' src/services/WebAuthnService.ts
sed -i '' 's/credentialPublicKey: Buffer/credentialPublicKey: Uint8Array/g' src/services/WebAuthnService.ts
sed -i '' 's/Buffer\.from/Uint8Array.from/g' src/services/WebAuthnService.ts

echo "TypeScript error fixes completed!"