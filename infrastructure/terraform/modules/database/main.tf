# UpCoach Database Module - PostgreSQL RDS

# ===========================================
# RDS Subnet Group
# ===========================================

resource "aws_db_subnet_group" "main" {
  name        = "${var.environment}-upcoach-db-subnet-group"
  description = "Subnet group for UpCoach RDS"
  subnet_ids  = var.subnet_ids

  tags = merge(var.tags, {
    Name = "${var.environment}-upcoach-db-subnet-group"
  })
}

# ===========================================
# RDS Parameter Group
# ===========================================

resource "aws_db_parameter_group" "main" {
  name        = "${var.environment}-upcoach-pg15-params"
  family      = "postgres15"
  description = "PostgreSQL 15 parameter group for UpCoach"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"  # Log queries taking more than 1 second
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  tags = var.tags
}

# ===========================================
# RDS Instance
# ===========================================

resource "aws_db_instance" "main" {
  identifier = "${var.environment}-upcoach-postgres"

  # Engine configuration
  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = var.db_instance_class
  allocated_storage    = var.db_allocated_storage
  max_allocated_storage = var.db_allocated_storage * 2
  storage_type         = "gp3"
  storage_encrypted    = true

  # Database configuration
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = var.security_group_ids
  publicly_accessible    = false
  multi_az              = var.environment == "production"

  # Parameter and option groups
  parameter_group_name = aws_db_parameter_group.main.name

  # Backup configuration
  backup_retention_period = var.environment == "production" ? 30 : 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "Sun:04:00-Sun:05:00"

  # Monitoring
  performance_insights_enabled          = true
  performance_insights_retention_period = 7
  monitoring_interval                   = 60
  monitoring_role_arn                   = aws_iam_role.rds_monitoring.arn
  enabled_cloudwatch_logs_exports       = ["postgresql", "upgrade"]

  # Security
  deletion_protection = var.environment == "production"
  skip_final_snapshot = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "${var.environment}-upcoach-final-snapshot" : null

  # Updates
  auto_minor_version_upgrade = true
  apply_immediately         = var.environment != "production"

  tags = merge(var.tags, {
    Name = "${var.environment}-upcoach-postgres"
  })
}

# ===========================================
# IAM Role for RDS Monitoring
# ===========================================

resource "aws_iam_role" "rds_monitoring" {
  name = "${var.environment}-upcoach-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ===========================================
# Outputs
# ===========================================

output "endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "connection_string" {
  description = "PostgreSQL connection string"
  value       = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.main.endpoint}/${var.db_name}"
  sensitive   = true
}

output "instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.main.id
}

# ===========================================
# Variables
# ===========================================

variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "security_group_ids" {
  type = list(string)
}

variable "db_instance_class" {
  type = string
}

variable "db_allocated_storage" {
  type = number
}

variable "db_name" {
  type = string
}

variable "db_username" {
  type      = string
  sensitive = true
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "tags" {
  type = map(string)
}
