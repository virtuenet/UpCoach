#!/bin/bash

###############################################################################
# UpCoach Production Backup Script
#
# Performs automated backups of PostgreSQL database and Redis data
# Retention: 7 daily, 4 weekly, 12 monthly backups
# Uploads to S3 for offsite storage
###############################################################################

set -e  # Exit on error
set -o pipefail  # Catch errors in pipes

# Configuration
BACKUP_DIR="/backups"
DB_NAME="${POSTGRES_DB:-upcoach}"
DB_USER="${POSTGRES_USER:-upcoach}"
DB_HOST="${POSTGRES_HOST:-postgres}"
DB_PORT="5432"
S3_BUCKET="${BACKUP_S3_BUCKET:-upcoach-backups}"
RETENTION_DAYS=7
RETENTION_WEEKS=4
RETENTION_MONTHS=12

# Timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE=$(date +"%Y-%m-%d")

# Logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

# Create backup directories
mkdir -p "${BACKUP_DIR}/daily"
mkdir -p "${BACKUP_DIR}/weekly"
mkdir -p "${BACKUP_DIR}/monthly"

###############################################################################
# PostgreSQL Backup
###############################################################################

log "Starting PostgreSQL backup..."

# Full database dump
BACKUP_FILE="${BACKUP_DIR}/daily/${DB_NAME}_${TIMESTAMP}.sql.gz"
pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
    --no-owner --no-acl --clean --if-exists \
    | gzip > "${BACKUP_FILE}"

BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
log "PostgreSQL backup completed: ${BACKUP_FILE} (${BACKUP_SIZE})"

# Weekly backup (Sunday)
if [ "$(date +%u)" -eq 7 ]; then
    WEEKLY_FILE="${BACKUP_DIR}/weekly/${DB_NAME}_${DATE}.sql.gz"
    cp "${BACKUP_FILE}" "${WEEKLY_FILE}"
    log "Weekly backup created: ${WEEKLY_FILE}"
fi

# Monthly backup (1st of month)
if [ "$(date +%d)" -eq 01 ]; then
    MONTHLY_FILE="${BACKUP_DIR}/monthly/${DB_NAME}_$(date +%Y-%m).sql.gz"
    cp "${BACKUP_FILE}" "${MONTHLY_FILE}"
    log "Monthly backup created: ${MONTHLY_FILE}"
fi

###############################################################################
# Redis Backup
###############################################################################

log "Starting Redis backup..."

# Trigger Redis BGSAVE
redis-cli -h redis --raw BGSAVE

# Wait for BGSAVE to complete
while [ "$(redis-cli -h redis --raw LASTSAVE)" -eq "$(date +%s)" ]; do
    sleep 1
done

# Copy Redis dump file
REDIS_BACKUP="${BACKUP_DIR}/daily/redis_${TIMESTAMP}.rdb.gz"
if [ -f "/data/dump.rdb" ]; then
    gzip -c /data/dump.rdb > "${REDIS_BACKUP}"
    log "Redis backup completed: ${REDIS_BACKUP}"
else
    log "WARNING: Redis dump file not found"
fi

###############################################################################
# Upload to S3
###############################################################################

log "Uploading backups to S3..."

if command -v aws &> /dev/null; then
    # Upload daily backup
    aws s3 cp "${BACKUP_FILE}" "s3://${S3_BUCKET}/daily/" \
        --storage-class STANDARD_IA \
        --server-side-encryption AES256

    if [ -f "${REDIS_BACKUP}" ]; then
        aws s3 cp "${REDIS_BACKUP}" "s3://${S3_BUCKET}/daily/" \
            --storage-class STANDARD_IA \
            --server-side-encryption AES256
    fi

    # Upload weekly/monthly if they exist
    if [ -f "${WEEKLY_FILE}" ]; then
        aws s3 cp "${WEEKLY_FILE}" "s3://${S3_BUCKET}/weekly/" \
            --storage-class STANDARD_IA
    fi

    if [ -f "${MONTHLY_FILE}" ]; then
        aws s3 cp "${MONTHLY_FILE}" "s3://${S3_BUCKET}/monthly/" \
            --storage-class GLACIER
    fi

    log "S3 upload completed"
else
    log "WARNING: AWS CLI not found, skipping S3 upload"
fi

###############################################################################
# Cleanup Old Backups
###############################################################################

log "Cleaning up old backups..."

# Daily backups - keep last 7 days
find "${BACKUP_DIR}/daily" -name "*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete
find "${BACKUP_DIR}/daily" -name "*.rdb.gz" -type f -mtime +${RETENTION_DAYS} -delete

# Weekly backups - keep last 4 weeks
find "${BACKUP_DIR}/weekly" -name "*.sql.gz" -type f -mtime +$((RETENTION_WEEKS * 7)) -delete

# Monthly backups - keep last 12 months
find "${BACKUP_DIR}/monthly" -name "*.sql.gz" -type f -mtime +$((RETENTION_MONTHS * 30)) -delete

log "Cleanup completed"

###############################################################################
# Backup Verification
###############################################################################

log "Verifying backup integrity..."

# Test PostgreSQL backup can be decompressed
if gzip -t "${BACKUP_FILE}"; then
    log "PostgreSQL backup integrity: OK"
else
    log "ERROR: PostgreSQL backup integrity check failed!"
    exit 1
fi

# Test Redis backup if exists
if [ -f "${REDIS_BACKUP}" ]; then
    if gzip -t "${REDIS_BACKUP}"; then
        log "Redis backup integrity: OK"
    else
        log "ERROR: Redis backup integrity check failed!"
        exit 1
    fi
fi

###############################################################################
# Notifications
###############################################################################

# Send success notification (if Slack webhook configured)
if [ -n "${SLACK_WEBHOOK_URL}" ]; then
    curl -X POST "${SLACK_WEBHOOK_URL}" \
        -H 'Content-Type: application/json' \
        -d "{
            \"text\": \"✅ UpCoach Backup Completed\",
            \"attachments\": [{
                \"color\": \"good\",
                \"fields\": [
                    {\"title\": \"Database\", \"value\": \"${DB_NAME}\", \"short\": true},
                    {\"title\": \"Size\", \"value\": \"${BACKUP_SIZE}\", \"short\": true},
                    {\"title\": \"Timestamp\", \"value\": \"${TIMESTAMP}\", \"short\": false}
                ]
            }]
        }" || true
fi

log "Backup process completed successfully"
exit 0
