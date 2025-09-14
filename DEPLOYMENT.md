# UpCoach Platform Deployment Guide

## Port Configuration (1000-1999 Range)

### Service Ports
- **Backend API**: 1080
- **PostgreSQL**: 1433
- **Redis**: 1003
- **Landing Page**: 1005
- **Admin Panel**: 1006
- **CMS Panel**: 1007

## Deployment Challenges

### Docker Build Issues
- Platform-specific dependencies causing build failures
- Node.js version and architecture incompatibilities

### Recommended Deployment Steps

1. **Local Development Setup**
   ```bash
   # Ensure prerequisites
   brew install node@18  # Use Homebrew to install specific Node version
   nvm use 18.20.8      # Ensure consistent Node version

   # Install global dependencies
   npm install -g npm@10.8.2
   npm install -g yarn
   ```

2. **Dependency Management**
   ```bash
   # In each service directory (landing-page, admin-panel, etc.)
   npm install --legacy-peer-deps
   npm rebuild
   ```

3. **Manual Service Start**
   ```bash
   # Start services individually
   cd services/api && npm run start
   cd apps/landing-page && npm run dev
   cd apps/admin-panel && npm run dev
   ```

4. **Docker Deployment Workarounds**
   - Use multi-stage builds
   - Explicitly specify platform compatibility
   - Use `--platform linux/amd64` during build

## Troubleshooting

### Common Errors
- `EBADPLATFORM`: Indicates architecture/OS mismatch
- Dependency resolution conflicts
- Node.js version incompatibilities

### Diagnostic Commands
```bash
# Check Node.js and NPM versions
node -v
npm -v

# Verify package compatibility
npm ls next
npm ls @clerk/nextjs
```

## Security Notes
- Always use `--legacy-peer-deps`
- Regularly update dependencies
- Monitor security advisories

## Performance Considerations
- Use `npm ci` for clean installs
- Leverage Docker's multi-stage builds
- Minimize layer complexity

## Recommended Environment
- macOS/Linux
- Node.js 18.x LTS
- npm 10.x
- Docker Desktop 4.20+