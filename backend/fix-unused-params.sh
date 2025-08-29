#!/bin/bash

# Fix unused parameter warnings in backend TypeScript files

echo "Fixing unused parameter warnings..."

# Fix unused 'req' parameters - prefix with underscore
find src -name "*.ts" -type f | while read file; do
  # Fix patterns like (req: Request, res: Response) where req is unused
  sed -i '' 's/(\([^)]*\)req: \(Request\|AuthenticatedRequest\)/(\1_req: \2/g' "$file"
  
  # Fix patterns in async functions
  sed -i '' 's/async (\([^)]*\)req: \(Request\|AuthenticatedRequest\)/async (\1_req: \2/g' "$file"
done

# Fix unused 'res' parameters - prefix with underscore
find src -name "*.ts" -type f | while read file; do
  sed -i '' 's/, res: Response/, _res: Response/g' "$file"
done

# Fix other specific unused parameters
sed -i '' 's/resource: string/_resource: string/g' src/middleware/resourceAccess.ts
sed -i '' 's/userId: string/_userId: string/g' src/middleware/resourceAccess.ts
sed -i '' 's/userRole: string/_userRole: string/g' src/middleware/resourceAccess.ts
sed -i '' 's/_maxSize:/_maxSize:/g' src/middleware/upload.ts

echo "Unused parameter warnings fixed!"