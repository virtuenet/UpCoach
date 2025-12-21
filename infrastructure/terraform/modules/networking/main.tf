# UpCoach Networking Module - VPC and Security Groups

# ===========================================
# VPC
# ===========================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "${var.environment}-upcoach-vpc"
  })
}

# ===========================================
# Internet Gateway
# ===========================================

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.environment}-upcoach-igw"
  })
}

# ===========================================
# Public Subnets
# ===========================================

resource "aws_subnet" "public" {
  count = min(length(var.availability_zones), 3)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${var.environment}-upcoach-public-${count.index + 1}"
    Type = "public"
  })
}

# ===========================================
# Private Subnets
# ===========================================

resource "aws_subnet" "private" {
  count = min(length(var.availability_zones), 3)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 3)
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${var.environment}-upcoach-private-${count.index + 1}"
    Type = "private"
  })
}

# ===========================================
# NAT Gateways
# ===========================================

resource "aws_eip" "nat" {
  count  = var.environment == "production" ? min(length(var.availability_zones), 3) : 1
  domain = "vpc"

  tags = merge(var.tags, {
    Name = "${var.environment}-upcoach-nat-eip-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "main" {
  count = var.environment == "production" ? min(length(var.availability_zones), 3) : 1

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.tags, {
    Name = "${var.environment}-upcoach-nat-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

# ===========================================
# Route Tables
# ===========================================

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-upcoach-public-rt"
  })
}

resource "aws_route_table" "private" {
  count  = var.environment == "production" ? min(length(var.availability_zones), 3) : 1
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[var.environment == "production" ? count.index : 0].id
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-upcoach-private-rt-${count.index + 1}"
  })
}

# ===========================================
# Route Table Associations
# ===========================================

resource "aws_route_table_association" "public" {
  count = min(length(var.availability_zones), 3)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = min(length(var.availability_zones), 3)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[var.environment == "production" ? count.index : 0].id
}

# ===========================================
# Security Groups
# ===========================================

# Database Security Group
resource "aws_security_group" "database" {
  name        = "${var.environment}-upcoach-database-sg"
  description = "Security group for UpCoach database"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from VPC"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    cidr_blocks     = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-upcoach-database-sg"
  })
}

# Cache Security Group
resource "aws_security_group" "cache" {
  name        = "${var.environment}-upcoach-cache-sg"
  description = "Security group for UpCoach cache"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Redis from VPC"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    cidr_blocks     = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-upcoach-cache-sg"
  })
}

# ===========================================
# Outputs
# ===========================================

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "database_security_group_id" {
  description = "Database security group ID"
  value       = aws_security_group.database.id
}

output "cache_security_group_id" {
  description = "Cache security group ID"
  value       = aws_security_group.cache.id
}

# ===========================================
# Variables
# ===========================================

variable "environment" {
  type = string
}

variable "vpc_cidr" {
  type = string
}

variable "availability_zones" {
  type = list(string)
}

variable "tags" {
  type = map(string)
}
