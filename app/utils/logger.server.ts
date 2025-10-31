import { prisma } from '../db.server';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  merchantId?: string;
  metadata?: any;
  timestamp?: Date;
}

export class Logger {
  private static instance: Logger;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Log error message
   */
  async error(message: string, merchantId?: string, metadata?: any): Promise<void> {
    await this.log(LogLevel.ERROR, message, merchantId, metadata);
  }

  /**
   * Log warning message
   */
  async warn(message: string, merchantId?: string, metadata?: any): Promise<void> {
    await this.log(LogLevel.WARN, message, merchantId, metadata);
  }

  /**
   * Log info message
   */
  async info(message: string, merchantId?: string, metadata?: any): Promise<void> {
    await this.log(LogLevel.INFO, message, merchantId, metadata);
  }

  /**
   * Log debug message
   */
  async debug(message: string, merchantId?: string, metadata?: any): Promise<void> {
    if (this.isDevelopment) {
      await this.log(LogLevel.DEBUG, message, merchantId, metadata);
    }
  }

  /**
   * Log QR code scan event
   */
  async logQRScan(
    qrId: string,
    merchantId: string,
    metadata: {
      ip?: string;
      userAgent?: string;
      country?: string;
      device?: string;
    }
  ): Promise<void> {
    await this.info(
      `QR code scanned: ${qrId}`,
      merchantId,
      {
        type: 'qr_scan',
        qrId,
        ...metadata,
      }
    );
  }

  /**
   * Log campaign creation
   */
  async logCampaignCreation(
    campaignId: string,
    merchantId: string,
    campaignName: string
  ): Promise<void> {
    await this.info(
      `Campaign created: ${campaignName}`,
      merchantId,
      {
        type: 'campaign_created',
        campaignId,
        campaignName,
      }
    );
  }

  /**
   * Log QR code creation
   */
  async logQRCodeCreation(
    qrId: string,
    merchantId: string,
    qrTitle: string,
    qrType: string
  ): Promise<void> {
    await this.info(
      `QR code created: ${qrTitle}`,
      merchantId,
      {
        type: 'qr_created',
        qrId,
        qrTitle,
        qrType,
      }
    );
  }

  /**
   * Log plan upgrade
   */
  async logPlanUpgrade(
    merchantId: string,
    oldPlan: string,
    newPlan: string
  ): Promise<void> {
    await this.info(
      `Plan upgraded from ${oldPlan} to ${newPlan}`,
      merchantId,
      {
        type: 'plan_upgrade',
        oldPlan,
        newPlan,
      }
    );
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    event: string,
    merchantId: string,
    metadata: any
  ): Promise<void> {
    await this.warn(
      `Security event: ${event}`,
      merchantId,
      {
        type: 'security_event',
        event,
        ...metadata,
      }
    );
  }

  /**
   * Log API error
   */
  async logAPIError(
    endpoint: string,
    error: Error,
    merchantId?: string,
    requestData?: any
  ): Promise<void> {
    await this.error(
      `API error in ${endpoint}: ${error.message}`,
      merchantId,
      {
        type: 'api_error',
        endpoint,
        error: error.message,
        stack: error.stack,
        requestData,
      }
    );
  }

  /**
   * Log webhook event
   */
  async logWebhookEvent(
    topic: string,
    merchantId: string,
    payload: any,
    success: boolean
  ): Promise<void> {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    const message = `Webhook ${success ? 'processed' : 'failed'}: ${topic}`;
    
    await this.log(level, message, merchantId, {
      type: 'webhook_event',
      topic,
      success,
      payload,
    });
  }

  /**
   * Log performance metrics
   */
  async logPerformance(
    operation: string,
    duration: number,
    merchantId?: string,
    metadata?: any
  ): Promise<void> {
    await this.info(
      `Performance: ${operation} took ${duration}ms`,
      merchantId,
      {
        type: 'performance',
        operation,
        duration,
        ...metadata,
      }
    );
  }

  /**
   * Internal log method
   */
  private async log(
    level: LogLevel,
    message: string,
    merchantId?: string,
    metadata?: any
  ): Promise<void> {
    const logEntry: LogEntry = {
      level,
      message,
      merchantId,
      metadata,
      timestamp: new Date(),
    };

    // Console logging for development
    if (this.isDevelopment) {
      const timestamp = logEntry.timestamp?.toISOString() || new Date().toISOString();
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
      const merchantPrefix = merchantId ? ` [${merchantId}]` : '';
      
      console.log(`${prefix}${merchantPrefix} ${message}`);
      
      if (metadata) {
        console.log('Metadata:', JSON.stringify(metadata, null, 2));
      }
    }

    // Database logging for production
    try {
      await prisma.webhookLog.create({
        data: {
          merchantId: merchantId || null,
          topic: `log_${level}`,
          payload: JSON.parse(JSON.stringify(logEntry)),
        },
      });
    } catch (error) {
      // Fallback to console if database logging fails
      console.error('Failed to log to database:', error);
      console.error('Original log entry:', logEntry);
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

/**
 * Utility function to log errors with context
 */
export function logError(
  error: Error,
  context: string,
  merchantId?: string,
  additionalData?: any
): void {
  logger.error(
    `Error in ${context}: ${error.message}`,
    merchantId,
    {
      type: 'error',
      context,
      error: error.message,
      stack: error.stack,
      ...additionalData,
    }
  );
}

/**
 * Utility function to log API requests
 */
export function logAPIRequest(
  method: string,
  url: string,
  merchantId?: string,
  responseTime?: number
): void {
  logger.info(
    `${method} ${url}${responseTime ? ` (${responseTime}ms)` : ''}`,
    merchantId,
    {
      type: 'api_request',
      method,
      url,
      responseTime,
    }
  );
}

/**
 * Utility function to log database operations
 */
export function logDatabaseOperation(
  operation: string,
  table: string,
  merchantId?: string,
  duration?: number
): void {
  logger.debug(
    `DB ${operation} on ${table}${duration ? ` (${duration}ms)` : ''}`,
    merchantId,
    {
      type: 'database_operation',
      operation,
      table,
      duration,
    }
  );
}

/**
 * Utility function to log user actions
 */
export function logUserAction(
  action: string,
  merchantId: string,
  details?: any
): void {
  logger.info(
    `User action: ${action}`,
    merchantId,
    {
      type: 'user_action',
      action,
      ...details,
    }
  );
}
