/**
 * Logging Services Index
 *
 * Centralized exports for structured logging, alerting, and audit trail.
 */

// Structured Logger
export {
  StructuredLogger,
  getLogger,
  createRequestLogger,
  ConsoleTransport,
  MemoryTransport,
  LogLevel,
  type LogEntry,
  type LogContext,
  type LoggerConfig,
  type LogTransport,
} from './StructuredLogger';

// Alerting Service
export {
  AlertingService,
  getAlertingService,
  type AlertSeverity,
  type AlertStatus,
  type AlertChannel,
  type AlertCondition,
  type AlertRule,
  type Alert,
  type AlertNotification,
  type AlertingConfig,
  type ChannelConfig,
  type AlertStats,
} from './AlertingService';

// Audit Logger
export {
  AuditLogger,
  getAuditLogger,
  type AuditEventType,
  type AuditEvent,
  type AuditConfig,
  type AuditStats,
} from './AuditLogger';

// Initialize all logging services
export function initializeLogging(): {
  logger: InstanceType<typeof StructuredLogger>;
  alerting: InstanceType<typeof AlertingService>;
  audit: InstanceType<typeof AuditLogger>;
} {
  const logger = getLogger();
  const alerting = getAlertingService();
  const audit = getAuditLogger();

  logger.info('Logging services initialized');

  return { logger, alerting, audit };
}
