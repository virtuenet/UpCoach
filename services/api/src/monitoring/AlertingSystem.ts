import { EventEmitter } from 'events';

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

/**
 * Alerting System
 *
 * Multi-channel alerting with intelligent routing.
 */
export class AlertingSystem extends EventEmitter {
  private alerts: Map<string, Alert> = new Map();

  async sendAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'acknowledged'>): Promise<Alert> {
    const newAlert: Alert = {
      ...alert,
      id: `ALERT-${Date.now()}`,
      timestamp: new Date(),
      acknowledged: false,
    };

    this.alerts.set(newAlert.id, newAlert);
    this.emit('alert:sent', newAlert);

    return newAlert;
  }
}

export default AlertingSystem;
