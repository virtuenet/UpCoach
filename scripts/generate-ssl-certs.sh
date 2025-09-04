#!/bin/bash

# Generate Self-Signed SSL Certificates for Staging
# This script creates SSL certificates for the staging environment

set -e

# Configuration
SSL_DIR="/Users/ardisetiadharma/CURSOR Repository/UpCoach/upcoach-project/nginx/ssl"
DAYS=365
KEY_SIZE=2048

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${YELLOW}[SSL Generator] $1${NC}"
}

success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Ensure SSL directory exists
mkdir -p "$SSL_DIR"

log "Generating SSL certificates for staging environment..."

# Generate private key for staging.upcoach.ai
log "Generating private key for staging.upcoach.ai..."
openssl genrsa -out "$SSL_DIR/staging.upcoach.ai.key" $KEY_SIZE

# Generate certificate signing request
log "Generating certificate signing request..."
openssl req -new -key "$SSL_DIR/staging.upcoach.ai.key" \
    -out "$SSL_DIR/staging.upcoach.ai.csr" \
    -subj "/C=US/ST=California/L=San Francisco/O=UpCoach/OU=Engineering/CN=staging.upcoach.ai/emailAddress=admin@upcoach.ai"

# Generate self-signed certificate
log "Generating self-signed certificate..."
openssl x509 -req -days $DAYS \
    -in "$SSL_DIR/staging.upcoach.ai.csr" \
    -signkey "$SSL_DIR/staging.upcoach.ai.key" \
    -out "$SSL_DIR/staging.upcoach.ai.crt" \
    -extensions v3_req \
    -extfile <(printf "[v3_req]\nkeyUsage=keyEncipherment,dataEncipherment\nextendedKeyUsage=serverAuth\nsubjectAltName=@alt_names\n[alt_names]\nDNS.1=staging.upcoach.ai\nDNS.2=*.staging.upcoach.ai\nDNS.3=localhost\nIP.1=127.0.0.1")

# Generate wildcard certificate for subdomains
log "Generating wildcard certificate for subdomains..."
openssl req -new -key "$SSL_DIR/staging.upcoach.ai.key" \
    -out "$SSL_DIR/wildcard.staging.upcoach.ai.csr" \
    -subj "/C=US/ST=California/L=San Francisco/O=UpCoach/OU=Engineering/CN=*.staging.upcoach.ai/emailAddress=admin@upcoach.ai"

openssl x509 -req -days $DAYS \
    -in "$SSL_DIR/wildcard.staging.upcoach.ai.csr" \
    -signkey "$SSL_DIR/staging.upcoach.ai.key" \
    -out "$SSL_DIR/wildcard.staging.upcoach.ai.crt" \
    -extensions v3_req \
    -extfile <(printf "[v3_req]\nkeyUsage=keyEncipherment,dataEncipherment\nextendedKeyUsage=serverAuth\nsubjectAltName=@alt_names\n[alt_names]\nDNS.1=*.staging.upcoach.ai\nDNS.2=staging.upcoach.ai\nDNS.3=localhost\nIP.1=127.0.0.1")

# Create default certificate (fallback)
log "Creating default certificate..."
cp "$SSL_DIR/staging.upcoach.ai.key" "$SSL_DIR/default.key"
cp "$SSL_DIR/staging.upcoach.ai.crt" "$SSL_DIR/default.crt"

# Set proper permissions
chmod 600 "$SSL_DIR"/*.key
chmod 644 "$SSL_DIR"/*.crt

# Clean up CSR files
rm -f "$SSL_DIR"/*.csr

success "SSL certificates generated successfully!"
echo
log "Generated certificates:"
echo "  - $SSL_DIR/staging.upcoach.ai.key"
echo "  - $SSL_DIR/staging.upcoach.ai.crt"
echo "  - $SSL_DIR/wildcard.staging.upcoach.ai.crt"
echo "  - $SSL_DIR/default.key"
echo "  - $SSL_DIR/default.crt"
echo
log "Note: These are self-signed certificates for staging only."
log "For production, use certificates from a trusted CA like Let's Encrypt."

# Verify certificates
log "Verifying certificates..."
openssl x509 -in "$SSL_DIR/staging.upcoach.ai.crt" -text -noout | grep -E "(Subject:|Not After:|DNS:)" || true

success "SSL certificate setup complete!"