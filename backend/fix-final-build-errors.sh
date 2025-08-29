#!/bin/bash

echo "Fixing final build errors..."

# Fix cdn.ts
sed -i '' "s/res\.set/_res.set/g" src/middleware/cdn.ts

# Fix error.ts
sed -i '' "s/res\.status(/_res.status(/g" src/middleware/error.ts

# Fix errorHandler.ts
sed -i '' "s/res\.status(/_res.status(/g" src/middleware/errorHandler.ts
sed -i '' "s/} catch (error) {/} catch (_error) {/g" src/middleware/errorHandler.ts

# Fix performance.ts
sed -i '' "s/res\.on/_res.on/g" src/middleware/performance.ts

# Fix resourceAccess.ts
sed -i '' "s/res\.status(/_res.status(/g" src/middleware/resourceAccess.ts
sed -i '' "s/res\.json(/_res.json(/g" src/middleware/resourceAccess.ts
sed -i '' "s/const userId = req\.user\?\.id/const userId = (req as any).user?.id/g" src/middleware/resourceAccess.ts

# Fix validation.ts
sed -i '' "s/res\.status(/_res.status(/g" src/middleware/validation.ts

# Fix zodValidation.ts
sed -i '' "s/res\.status(/_res.status(/g" src/middleware/zodValidation.ts
sed -i '' "s/res\.json(/_res.json(/g" src/middleware/zodValidation.ts

# Fix catchAsync.ts
sed -i '' "s/res\.status(/_res.status(/g" src/utils/catchAsync.ts

# Fix missing logger imports in migrations
for file in src/migrations/*.ts; do
  if ! grep -q "import { logger }" "$file"; then
    sed -i '' "1s/^/import { logger } from '..\/utils\/logger';\n/" "$file"
  fi
done

# Fix WebAuthnService Buffer issues
cat > /tmp/webauthn-fix.ts << 'EOF'
// Fix Buffer.from usage
sed -i '' "s/Uint8Array\.from(Buffer\.from(\([^)]*\), 'base64'))/Buffer.from(\1, 'base64')/g" src/services/WebAuthnService.ts
sed -i '' "s/credentialID: Buffer\.from(\([^)]*\))\.toString('base64')/credentialID: Buffer.from(\1).toString('base64')/g" src/services/WebAuthnService.ts
sed -i '' "s/credentialPublicKey: Buffer\.from(\([^)]*\))\.toString('base64')/credentialPublicKey: Buffer.from(\1).toString('base64')/g" src/services/WebAuthnService.ts
EOF
bash /tmp/webauthn-fix.ts

echo "Build error fixes complete!"