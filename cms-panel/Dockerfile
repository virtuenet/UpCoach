# Stage 1: Build dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy dependency files
COPY package*.json ./
RUN npm ci

# Stage 2: Build the application
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the app
RUN npm run build

# Stage 3: Production runtime
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S cms -u 1001

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

USER cms

EXPOSE 3002

# For production, serve the built files
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3002"]

# For development, use this instead:
# CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3002"] 