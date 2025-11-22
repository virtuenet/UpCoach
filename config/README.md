# UpCoach Configuration Directory

This directory contains all centralized configuration files for the UpCoach project.

## Directory Structure

```
config/
├── README.md                           # This file
├── environments/                       # Environment configurations
│   ├── .env.template                   # Template for all environments
│   ├── .env.development                # Development environment
│   ├── .env.staging                    # Staging environment
│   └── .env.production                 # Production environment
├── docker/                            # Docker configurations
│   ├── docker-compose.base.yml        # Base services (DB, Redis, API)
│   ├── docker-compose.development.yml # Development with hot reload
│   ├── docker-compose.production.yml  # Production optimized
│   ├── docker-compose.testing.yml     # Testing services
│   └── docker-compose.override.yml    # Local development overrides
├── scripts/                           # Management scripts
│   ├── docker-dev.sh                  # Development environment management
│   └── docker-prod.sh                 # Production environment management
└── archive/                           # Archived old configurations
    ├── docker-compose.*.yml           # Old Docker compose files
    └── .env.*                         # Old environment files
```

## Usage

### Environment Configuration

1. Copy the appropriate environment template:
   ```bash
   cp config/environments/.env.development .env
   ```

2. Update the values in `.env` with your specific configuration

3. For production, ensure all placeholder values are replaced with actual credentials

### Docker Management

#### Development
```bash
# Start development environment
./config/scripts/docker-dev.sh up

# View logs
./config/scripts/docker-dev.sh logs

# Stop environment
./config/scripts/docker-dev.sh down
```

#### Production
```bash
# Deploy to production
./config/scripts/docker-prod.sh deploy

# Check health
./config/scripts/docker-prod.sh health

# Create backup
./config/scripts/docker-prod.sh backup
```

#### Testing
```bash
# Run all tests
./config/scripts/docker-dev.sh test
```

### Manual Docker Compose

You can also use Docker Compose directly with the centralized configurations:

```bash
# Development
docker compose -f config/docker/docker-compose.base.yml \
                -f config/docker/docker-compose.development.yml up

# Production
docker compose -f config/docker/docker-compose.base.yml \
                -f config/docker/docker-compose.production.yml up

# Testing
docker compose -f config/docker/docker-compose.base.yml \
                -f config/docker/docker-compose.testing.yml up
```

## Configuration Principles

1. **Environment Separation**: Each environment has its own configuration file
2. **Security**: Production configurations use environment variables for secrets
3. **Modularity**: Docker configurations are split by purpose (base, development, production, testing)
4. **Consistency**: All configurations follow the same structure and naming conventions
5. **Documentation**: All configurations are well-documented and include examples

## Migration from Old Configurations

Old configuration files have been moved to `config/archive/`. To migrate:

1. Compare your existing `.env` files with the new templates
2. Copy your specific values to the appropriate new environment files
3. Update any scripts or documentation to use the new paths
4. Test your setup with the new configurations
5. Remove old files once everything is working

## Security Notes

- Never commit `.env.production` or any file containing real secrets
- Use environment variables for all sensitive data in production
- Regularly rotate secrets and API keys
- Review access permissions for configuration files

## Troubleshooting

### Common Issues

1. **Environment variables not loading**: Ensure you're sourcing the correct `.env` file
2. **Docker services not starting**: Check that all required environment variables are set
3. **Port conflicts**: Ensure the ports defined in your environment files are available

### Getting Help

- Check the logs: `./config/scripts/docker-dev.sh logs [service_name]`
- View service status: `./config/scripts/docker-dev.sh status`
- For production issues: `./config/scripts/docker-prod.sh health`