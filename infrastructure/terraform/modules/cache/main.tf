# UpCoach Cache Module - ElastiCache Redis

# ===========================================
# ElastiCache Subnet Group
# ===========================================

resource "aws_elasticache_subnet_group" "main" {
  name        = "${var.environment}-upcoach-cache-subnet-group"
  description = "Subnet group for UpCoach ElastiCache"
  subnet_ids  = var.subnet_ids

  tags = var.tags
}

# ===========================================
# ElastiCache Parameter Group
# ===========================================

resource "aws_elasticache_parameter_group" "main" {
  name        = "${var.environment}-upcoach-redis7-params"
  family      = "redis7"
  description = "Redis 7 parameter group for UpCoach"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "notify-keyspace-events"
    value = "Ex"
  }

  tags = var.tags
}

# ===========================================
# ElastiCache Cluster
# ===========================================

resource "aws_elasticache_replication_group" "main" {
  replication_group_id       = "${var.environment}-upcoach-redis"
  description                = "UpCoach Redis cluster for ${var.environment}"

  node_type            = var.redis_node_type
  num_cache_clusters   = var.redis_num_cache_nodes
  parameter_group_name = aws_elasticache_parameter_group.main.name
  port                 = 6379

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = var.security_group_ids

  engine               = "redis"
  engine_version       = "7.0"

  automatic_failover_enabled = var.environment == "production" && var.redis_num_cache_nodes > 1
  multi_az_enabled          = var.environment == "production" && var.redis_num_cache_nodes > 1

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  snapshot_retention_limit = var.environment == "production" ? 7 : 1
  snapshot_window         = "05:00-06:00"
  maintenance_window      = "sun:06:00-sun:07:00"

  auto_minor_version_upgrade = true

  tags = merge(var.tags, {
    Name = "${var.environment}-upcoach-redis"
  })
}

# ===========================================
# Outputs
# ===========================================

output "endpoint" {
  description = "Redis primary endpoint"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "connection_string" {
  description = "Redis connection string"
  value       = "rediss://${aws_elasticache_replication_group.main.primary_endpoint_address}:6379"
  sensitive   = true
}

output "replication_group_id" {
  description = "ElastiCache replication group ID"
  value       = aws_elasticache_replication_group.main.id
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

variable "redis_node_type" {
  type = string
}

variable "redis_num_cache_nodes" {
  type = number
}

variable "tags" {
  type = map(string)
}
