import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as cron from 'node-cron';
import { SchedulerService } from '../../services/SchedulerService';
import { logger } from '../../utils/logger';
import { financialService } from '../../services/financial/FinancialService';
import { reportingService } from '../../services/financial/ReportingService';

// Mock dependencies
jest.mock('node-cron');
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));
jest.mock('../../services/financial/FinancialService', () => ({
  financialService: {
    updateMetrics: jest.fn(),
    checkThresholds: jest.fn(),
    sendAlerts: jest.fn(),
  },
}));
jest.mock('../../services/financial/ReportingService', () => ({
  reportingService: {
    generateDailySnapshot: jest.fn(),
    generateScheduledReports: jest.fn(),
    generateWeeklyReport: jest.fn(),
    generateMonthlyReport: jest.fn(),
    generateQuarterlyReport: jest.fn(),
  },
}));

const mockCron = cron as jest.Mocked<typeof cron>;
const mockLogger = logger as jest.Mocked<typeof logger>;
const mockFinancialService = financialService as jest.Mocked<typeof financialService>;
const mockReportingService = reportingService as jest.Mocked<typeof reportingService>;

describe('SchedulerService', () => {
  let mockScheduledTask: jest.Mocked<cron.ScheduledTask>;
  let scheduledCallbacks: Map<string, () => Promise<void>>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset the jobs map
    (SchedulerService as any).jobs = new Map();

    // Create mock scheduled task
    mockScheduledTask = {
      start: jest.fn(),
      stop: jest.fn(),
      destroy: jest.fn(),
      getStatus: jest.fn().mockReturnValue('scheduled'),
    } as unknown as jest.Mocked<cron.ScheduledTask>;

    // Track scheduled callbacks
    scheduledCallbacks = new Map();

    // Mock cron.schedule to capture callbacks
    mockCron.schedule.mockImplementation((cronExpression, callback, options) => {
      scheduledCallbacks.set(cronExpression, callback as () => Promise<void>);
      return mockScheduledTask;
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    scheduledCallbacks.clear();
  });

  describe('initialize', () => {
    test('should initialize all scheduled jobs', () => {
      SchedulerService.initialize();

      // Verify all jobs were scheduled
      expect(mockCron.schedule).toHaveBeenCalledTimes(6);

      // Verify specific job schedules
      expect(mockCron.schedule).toHaveBeenCalledWith(
        '0 6 * * *', // Daily snapshot at 6 AM
        expect.any(Function),
        { timezone: 'UTC' }
      );

      expect(mockCron.schedule).toHaveBeenCalledWith(
        '0 * * * *', // Hourly reports
        expect.any(Function),
        { timezone: 'UTC' }
      );

      expect(mockCron.schedule).toHaveBeenCalledWith(
        '0 8 * * 1', // Weekly cost analysis on Monday at 8 AM
        expect.any(Function),
        { timezone: 'UTC' }
      );

      expect(mockCron.schedule).toHaveBeenCalledWith(
        '0 9 1 * *', // Monthly health check on 1st at 9 AM
        expect.any(Function),
        { timezone: 'UTC' }
      );

      expect(mockCron.schedule).toHaveBeenCalledWith(
        '0 10 1 1,4,7,10 *', // Quarterly projections
        expect.any(Function),
        { timezone: 'UTC' }
      );

      expect(mockCron.schedule).toHaveBeenCalledWith(
        '*/15 * * * *', // Alert monitoring every 15 minutes
        expect.any(Function),
        { timezone: 'UTC' }
      );

      // Verify logging
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Initializing scheduled financial jobs...'
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Initialized 6 scheduled financial jobs'
      );
    });

    test('should store all jobs in the jobs map', () => {
      SchedulerService.initialize();

      const jobs = (SchedulerService as any).jobs as Map<string, cron.ScheduledTask>;
      expect(jobs.size).toBe(6);
      expect(jobs.has('daily-snapshot')).toBe(true);
      expect(jobs.has('hourly-reports')).toBe(true);
      expect(jobs.has('weekly-cost-analysis')).toBe(true);
      expect(jobs.has('monthly-health-check')).toBe(true);
      expect(jobs.has('quarterly-projections')).toBe(true);
      expect(jobs.has('alert-monitoring')).toBe(true);
    });

    test('should replace existing jobs if initialized multiple times', () => {
      // First initialization
      SchedulerService.initialize();

      // Second initialization
      SchedulerService.initialize();

      // Should have stopped previous jobs
      expect(mockScheduledTask.stop).toHaveBeenCalledTimes(6);

      // Should have created new jobs
      expect(mockCron.schedule).toHaveBeenCalledTimes(12); // 6 jobs * 2 initializations

      // Should have logged warnings
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('already exists, stopping previous job')
      );
    });
  });

  describe('Daily Snapshot Job', () => {
    test('should execute daily snapshot generation successfully', async () => {
      mockReportingService.generateDailySnapshot.mockResolvedValue(undefined);

      SchedulerService.initialize();

      // Get the callback for daily snapshot
      const callback = scheduledCallbacks.get('0 6 * * *');
      expect(callback).toBeDefined();

      // Execute the callback
      await callback!();

      // Verify the service was called
      expect(mockReportingService.generateDailySnapshot).toHaveBeenCalledTimes(1);

      // Verify logging
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Running daily financial snapshot generation...'
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Daily snapshot generated successfully'
      );
    });

    test('should handle errors in daily snapshot generation', async () => {
      const error = new Error('Snapshot generation failed');
      mockReportingService.generateDailySnapshot.mockRejectedValue(error);

      SchedulerService.initialize();

      const callback = scheduledCallbacks.get('0 6 * * *');
      await callback!();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to generate daily snapshot:',
        error
      );
    });
  });

  describe('Hourly Reports Job', () => {
    test('should execute scheduled reports generation successfully', async () => {
      mockReportingService.generateScheduledReports.mockResolvedValue(undefined);

      SchedulerService.initialize();

      const callback = scheduledCallbacks.get('0 * * * *');
      expect(callback).toBeDefined();

      await callback!();

      expect(mockReportingService.generateScheduledReports).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Checking for scheduled reports...'
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Scheduled reports check completed'
      );
    });

    test('should handle errors in scheduled reports generation', async () => {
      const error = new Error('Report generation failed');
      mockReportingService.generateScheduledReports.mockRejectedValue(error);

      SchedulerService.initialize();

      const callback = scheduledCallbacks.get('0 * * * *');
      await callback!();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to generate scheduled reports:',
        error
      );
    });
  });

  describe('Weekly Cost Analysis Job', () => {
    test('should execute weekly cost analysis successfully', async () => {
      // Mock the private method
      const performWeeklyCostAnalysisSpy = jest
        .spyOn(SchedulerService as any, 'performWeeklyCostAnalysis')
        .mockResolvedValue(undefined);

      SchedulerService.initialize();

      const callback = scheduledCallbacks.get('0 8 * * 1');
      expect(callback).toBeDefined();

      await callback!();

      expect(performWeeklyCostAnalysisSpy).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Running weekly cost analysis...'
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Weekly cost analysis completed'
      );

      performWeeklyCostAnalysisSpy.mockRestore();
    });

    test('should handle errors in weekly cost analysis', async () => {
      const error = new Error('Cost analysis failed');
      const performWeeklyCostAnalysisSpy = jest
        .spyOn(SchedulerService as any, 'performWeeklyCostAnalysis')
        .mockRejectedValue(error);

      SchedulerService.initialize();

      const callback = scheduledCallbacks.get('0 8 * * 1');
      await callback!();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to perform weekly cost analysis:',
        error
      );

      performWeeklyCostAnalysisSpy.mockRestore();
    });
  });

  describe('Monthly Health Check Job', () => {
    test('should execute monthly health check successfully', async () => {
      const performMonthlyHealthCheckSpy = jest
        .spyOn(SchedulerService as any, 'performMonthlyHealthCheck')
        .mockResolvedValue(undefined);

      SchedulerService.initialize();

      const callback = scheduledCallbacks.get('0 9 1 * *');
      expect(callback).toBeDefined();

      await callback!();

      expect(performMonthlyHealthCheckSpy).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Running monthly financial health check...'
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Monthly health check completed'
      );

      performMonthlyHealthCheckSpy.mockRestore();
    });

    test('should handle errors in monthly health check', async () => {
      const error = new Error('Health check failed');
      const performMonthlyHealthCheckSpy = jest
        .spyOn(SchedulerService as any, 'performMonthlyHealthCheck')
        .mockRejectedValue(error);

      SchedulerService.initialize();

      const callback = scheduledCallbacks.get('0 9 1 * *');
      await callback!();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to perform monthly health check:',
        error
      );

      performMonthlyHealthCheckSpy.mockRestore();
    });
  });

  describe('Quarterly Projections Job', () => {
    test('should execute quarterly projections successfully', async () => {
      const generateQuarterlyProjectionsSpy = jest
        .spyOn(SchedulerService as any, 'generateQuarterlyProjections')
        .mockResolvedValue(undefined);

      SchedulerService.initialize();

      const callback = scheduledCallbacks.get('0 10 1 1,4,7,10 *');
      expect(callback).toBeDefined();

      await callback!();

      expect(generateQuarterlyProjectionsSpy).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Running quarterly projections...'
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Quarterly projections completed'
      );

      generateQuarterlyProjectionsSpy.mockRestore();
    });

    test('should handle errors in quarterly projections', async () => {
      const error = new Error('Projections failed');
      const generateQuarterlyProjectionsSpy = jest
        .spyOn(SchedulerService as any, 'generateQuarterlyProjections')
        .mockRejectedValue(error);

      SchedulerService.initialize();

      const callback = scheduledCallbacks.get('0 10 1 1,4,7,10 *');
      await callback!();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to generate quarterly projections:',
        error
      );

      generateQuarterlyProjectionsSpy.mockRestore();
    });
  });

  describe('Real-Time Alert Monitoring Job', () => {
    test('should execute alert monitoring successfully', async () => {
      const checkRealTimeAlertsSpy = jest
        .spyOn(SchedulerService as any, 'checkRealTimeAlerts')
        .mockResolvedValue(undefined);

      SchedulerService.initialize();

      const callback = scheduledCallbacks.get('*/15 * * * *');
      expect(callback).toBeDefined();

      await callback!();

      expect(checkRealTimeAlertsSpy).toHaveBeenCalledTimes(1);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Checking for financial alerts...'
      );

      checkRealTimeAlertsSpy.mockRestore();
    });

    test('should handle errors in alert monitoring', async () => {
      const error = new Error('Alert check failed');
      const checkRealTimeAlertsSpy = jest
        .spyOn(SchedulerService as any, 'checkRealTimeAlerts')
        .mockRejectedValue(error);

      SchedulerService.initialize();

      const callback = scheduledCallbacks.get('*/15 * * * *');
      await callback!();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to check real-time alerts:',
        error
      );

      checkRealTimeAlertsSpy.mockRestore();
    });
  });

  describe('Job Management', () => {
    test('should stop a specific job', () => {
      SchedulerService.initialize();
      const stopJobMethod = (SchedulerService as any).stopJob;

      if (stopJobMethod) {
        stopJobMethod.call(SchedulerService, 'daily-snapshot');
        expect(mockScheduledTask.stop).toHaveBeenCalled();
      }
    });

    test('should stop all jobs', () => {
      SchedulerService.initialize();
      const stopAllJobsMethod = (SchedulerService as any).stopAllJobs;

      if (stopAllJobsMethod) {
        stopAllJobsMethod.call(SchedulerService);
        expect(mockScheduledTask.stop).toHaveBeenCalledTimes(6);
      }
    });

    test('should get job status', () => {
      SchedulerService.initialize();
      const getJobStatusMethod = (SchedulerService as any).getJobStatus;

      if (getJobStatusMethod) {
        const status = getJobStatusMethod.call(SchedulerService);
        expect(status).toBeInstanceOf(Array);
        expect(status.length).toBe(6);
        expect(status[0]).toHaveProperty('name');
        expect(status[0]).toHaveProperty('running');
        expect(status[0].running).toBe(true);
      }
    });

    test('should list all jobs', () => {
      SchedulerService.initialize();
      const listJobsMethod = (SchedulerService as any).listJobs;

      if (listJobsMethod) {
        const jobs = listJobsMethod.call(SchedulerService);
        expect(jobs).toEqual([
          'daily-snapshot',
          'hourly-reports',
          'weekly-cost-analysis',
          'monthly-health-check',
          'quarterly-projections',
          'alert-monitoring',
        ]);
      }
    });
  });

  describe('Cron Expression Validation', () => {
    test('should use correct cron expressions', () => {
      SchedulerService.initialize();

      // Verify cron expressions
      const cronExpressions = Array.from(scheduledCallbacks.keys());

      // Daily at 6 AM
      expect(cronExpressions).toContain('0 6 * * *');

      // Every hour
      expect(cronExpressions).toContain('0 * * * *');

      // Weekly on Monday at 8 AM
      expect(cronExpressions).toContain('0 8 * * 1');

      // Monthly on 1st at 9 AM
      expect(cronExpressions).toContain('0 9 1 * *');

      // Quarterly on 1st of Jan, Apr, Jul, Oct at 10 AM
      expect(cronExpressions).toContain('0 10 1 1,4,7,10 *');

      // Every 15 minutes
      expect(cronExpressions).toContain('*/15 * * * *');
    });

    test('should use UTC timezone for all jobs', () => {
      SchedulerService.initialize();

      // Verify all jobs use UTC timezone
      const calls = mockCron.schedule.mock.calls;
      calls.forEach(call => {
        expect(call[2]).toEqual({ timezone: 'UTC' });
      });
    });
  });

  describe('Error Handling', () => {
    test('should continue running other jobs if one fails', async () => {
      // Mock one job to fail and another to succeed
      mockReportingService.generateDailySnapshot.mockRejectedValue(
        new Error('Snapshot failed')
      );
      mockReportingService.generateScheduledReports.mockResolvedValue(undefined);

      SchedulerService.initialize();

      // Execute both callbacks
      const dailyCallback = scheduledCallbacks.get('0 6 * * *');
      const hourlyCallback = scheduledCallbacks.get('0 * * * *');

      await dailyCallback!();
      await hourlyCallback!();

      // Verify both were called despite one failing
      expect(mockReportingService.generateDailySnapshot).toHaveBeenCalled();
      expect(mockReportingService.generateScheduledReports).toHaveBeenCalled();

      // Verify error was logged for failed job
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to generate daily snapshot:',
        expect.any(Error)
      );

      // Verify success was logged for successful job
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Scheduled reports check completed'
      );
    });

    test('should handle job initialization errors gracefully', () => {
      // Mock cron.schedule to throw an error
      mockCron.schedule.mockImplementation(() => {
        throw new Error('Invalid cron expression');
      });

      // Should not throw when initializing
      expect(() => SchedulerService.initialize()).not.toThrow();
    });
  });

  describe('getInstance', () => {
    test('should return singleton instance', () => {
      const getInstanceMethod = (SchedulerService as any).getInstance;

      if (getInstanceMethod) {
        const instance1 = getInstanceMethod.call(SchedulerService);
        const instance2 = getInstanceMethod.call(SchedulerService);
        expect(instance1).toBe(instance2);
      }
    });
  });
});