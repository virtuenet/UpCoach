# UpCoach Monitoring Module - CloudWatch and Alerting

# ===========================================
# CloudWatch Log Groups
# ===========================================

resource "aws_cloudwatch_log_group" "api" {
  name              = "/upcoach/${var.environment}/api"
  retention_in_days = var.log_retention_days

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "application" {
  name              = "/upcoach/${var.environment}/application"
  retention_in_days = var.log_retention_days

  tags = var.tags
}

# ===========================================
# SNS Topic for Alerts
# ===========================================

resource "aws_sns_topic" "alerts" {
  name = "${var.environment}-upcoach-alerts"

  tags = var.tags
}

resource "aws_sns_topic_subscription" "email_alerts" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# ===========================================
# CloudWatch Alarms
# ===========================================

# High Error Rate Alarm
resource "aws_cloudwatch_metric_alarm" "api_errors" {
  alarm_name          = "${var.environment}-upcoach-api-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "High error rate detected in UpCoach API"

  dimensions = {
    ApiName = "${var.environment}-upcoach-api"
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = var.tags
}

# High Latency Alarm
resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "${var.environment}-upcoach-api-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = 300
  extended_statistic  = "p95"
  threshold           = 2000  # 2 seconds
  alarm_description   = "High API latency detected"

  dimensions = {
    ApiName = "${var.environment}-upcoach-api"
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = var.tags
}

# Database CPU Alarm
resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "${var.environment}-upcoach-database-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "High CPU utilization on UpCoach database"

  dimensions = {
    DBInstanceIdentifier = "${var.environment}-upcoach-postgres"
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = var.tags
}

# Database Storage Alarm
resource "aws_cloudwatch_metric_alarm" "database_storage" {
  alarm_name          = "${var.environment}-upcoach-database-low-storage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 5368709120  # 5GB in bytes
  alarm_description   = "Low storage space on UpCoach database"

  dimensions = {
    DBInstanceIdentifier = "${var.environment}-upcoach-postgres"
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = var.tags
}

# Redis Memory Alarm
resource "aws_cloudwatch_metric_alarm" "redis_memory" {
  alarm_name          = "${var.environment}-upcoach-redis-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "High memory usage on UpCoach Redis"

  dimensions = {
    ReplicationGroupId = "${var.environment}-upcoach-redis"
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = var.tags
}

# ===========================================
# CloudWatch Dashboard
# ===========================================

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.environment}-upcoach-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiName", "${var.environment}-upcoach-api"]
          ]
          title  = "API Requests"
          region = "us-east-1"
          period = 60
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Latency", "ApiName", "${var.environment}-upcoach-api", { stat = "p95" }]
          ]
          title  = "API Latency (p95)"
          region = "us-east-1"
          period = 60
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "${var.environment}-upcoach-postgres"]
          ]
          title  = "Database CPU"
          region = "us-east-1"
          period = 60
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ElastiCache", "DatabaseMemoryUsagePercentage", "ReplicationGroupId", "${var.environment}-upcoach-redis"]
          ]
          title  = "Redis Memory Usage"
          region = "us-east-1"
          period = 60
        }
      }
    ]
  })
}

# ===========================================
# Outputs
# ===========================================

output "alert_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "api_log_group" {
  description = "API log group name"
  value       = aws_cloudwatch_log_group.api.name
}

# ===========================================
# Variables
# ===========================================

variable "environment" {
  type = string
}

variable "log_retention_days" {
  type = number
}

variable "alert_email" {
  type = string
}

variable "api_service_name" {
  type = string
}

variable "tags" {
  type = map(string)
}
