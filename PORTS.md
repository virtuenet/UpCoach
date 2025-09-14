# UpCoach Platform Port Mapping

## Services Port Configuration (1000-1999 Range)

### Core Services
- **Backend API**: 1080
- **PostgreSQL Database**: 1433
- **Redis Cache**: 1003

### Frontend Services
- **Landing Page**: 1005
- **Admin Panel**: 1006
- **CMS Panel**: 1007

### Development & Monitoring
- **PgAdmin**: 1004
- **Mailhog SMTP**: 1025
- **Mailhog Web UI**: 1026

## Connection Details

### PostgreSQL
- Host: localhost
- Port: 1433
- Database: upcoach_db

### Redis
- Host: localhost
- Port: 1003

### Web Services
- Landing Page: http://localhost:1005
- Admin Panel: http://localhost:1006
- CMS Panel: http://localhost:1007
- API Endpoint: http://localhost:1080

## Notes
- All services are configured to use ports in the 1000-1999 range
- Ensure no conflicts with other local development environments
- Update firewall and network configurations accordingly