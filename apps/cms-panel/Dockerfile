# CMS Panel Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 1082

# Start the application
CMD ["npm", "run", "preview"]