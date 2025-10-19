import { logger } from './logger.server';

export interface AppConfig {
  database: {
    url: string;
    maxConnections: number;
    connectionTimeout: number;
  };
  server: {
    port: number;
    host: string;
    environment: string;
  };
  shopify: {
    apiKey: string;
    apiSecret: string;
    scopes: string[];
    appUrl: string;
  };
  security: {
    sessionSecret: string;
    corsOrigins: string[];
    rateLimits: {
      qrScan: {
        window: number;
        max: number;
      };
      apiCalls: {
        window: number;
        max: number;
      };
    };
  };
  features: {
    loyaltyProgram: boolean;
    campaigns: boolean;
    analytics: boolean;
    qrCustomization: boolean;
    bulkOperations: boolean;
    apiAccess: boolean;
    whiteLabel: boolean;
  };
  limits: {
    free: {
      qrCodes: number;
      campaigns: number;
      analyticsDays: number;
    };
    basic: {
      qrCodes: number;
      campaigns: number;
      analyticsDays: number;
    };
    pro: {
      qrCodes: number;
      campaigns: number;
      analyticsDays: number;
    };
    enterprise: {
      qrCodes: number;
      campaigns: number;
      analyticsDays: number;
    };
  };
  monitoring: {
    enabled: boolean;
    logLevel: string;
    metricsInterval: number;
  };
  maintenance: {
    enabled: boolean;
    schedule: string;
    cleanupDays: number;
  };
  backup: {
    enabled: boolean;
    schedule: string;
    retentionDays: number;
  };
}

export class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Load configuration from environment variables
   */
  private loadConfig(): AppConfig {
    return {
      database: {
        url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/qrflow-db',
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
        connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
      },
      server: {
        port: parseInt(process.env.PORT || '3000'),
        host: process.env.HOST || 'localhost',
        environment: process.env.NODE_ENV || 'development',
      },
      shopify: {
        apiKey: process.env.SHOPIFY_API_KEY || '',
        apiSecret: process.env.SHOPIFY_API_SECRET || '',
        scopes: (process.env.SCOPES || 'read_products,write_products,read_orders,write_orders').split(','),
        appUrl: process.env.APP_URL || 'https://example.com',
      },
      security: {
        sessionSecret: process.env.SESSION_SECRET || 'your-session-secret-key',
        corsOrigins: (process.env.CORS_ORIGINS || 'localhost:3000,127.0.0.1:3000').split(','),
        rateLimits: {
          qrScan: {
            window: parseInt(process.env.RATE_LIMIT_QR_SCAN_WINDOW || '60000'),
            max: parseInt(process.env.RATE_LIMIT_QR_SCAN_MAX || '100'),
          },
          apiCalls: {
            window: parseInt(process.env.RATE_LIMIT_API_WINDOW || '60000'),
            max: parseInt(process.env.RATE_LIMIT_API_MAX || '1000'),
          },
        },
      },
      features: {
        loyaltyProgram: process.env.FEATURE_LOYALTY_PROGRAM === 'true',
        campaigns: process.env.FEATURE_CAMPAIGNS === 'true',
        analytics: process.env.FEATURE_ANALYTICS === 'true',
        qrCustomization: process.env.FEATURE_QR_CUSTOMIZATION === 'true',
        bulkOperations: process.env.FEATURE_BULK_OPERATIONS === 'true',
        apiAccess: process.env.FEATURE_API_ACCESS === 'true',
        whiteLabel: process.env.FEATURE_WHITE_LABEL === 'true',
      },
      limits: {
        free: {
          qrCodes: parseInt(process.env.LIMIT_FREE_QR_CODES || '5'),
          campaigns: parseInt(process.env.LIMIT_FREE_CAMPAIGNS || '1'),
          analyticsDays: parseInt(process.env.LIMIT_FREE_ANALYTICS_DAYS || '7'),
        },
        basic: {
          qrCodes: parseInt(process.env.LIMIT_BASIC_QR_CODES || '50'),
          campaigns: parseInt(process.env.LIMIT_BASIC_CAMPAIGNS || '10'),
          analyticsDays: parseInt(process.env.LIMIT_BASIC_ANALYTICS_DAYS || '30'),
        },
        pro: {
          qrCodes: parseInt(process.env.LIMIT_PRO_QR_CODES || '-1'),
          campaigns: parseInt(process.env.LIMIT_PRO_CAMPAIGNS || '-1'),
          analyticsDays: parseInt(process.env.LIMIT_PRO_ANALYTICS_DAYS || '90'),
        },
        enterprise: {
          qrCodes: parseInt(process.env.LIMIT_ENTERPRISE_QR_CODES || '-1'),
          campaigns: parseInt(process.env.LIMIT_ENTERPRISE_CAMPAIGNS || '-1'),
          analyticsDays: parseInt(process.env.LIMIT_ENTERPRISE_ANALYTICS_DAYS || '365'),
        },
      },
      monitoring: {
        enabled: process.env.MONITORING_ENABLED === 'true',
        logLevel: process.env.LOG_LEVEL || 'info',
        metricsInterval: parseInt(process.env.METRICS_INTERVAL || '300000'),
      },
      maintenance: {
        enabled: process.env.MAINTENANCE_ENABLED === 'true',
        schedule: process.env.MAINTENANCE_SCHEDULE || '0 2 * * *',
        cleanupDays: parseInt(process.env.MAINTENANCE_CLEANUP_DAYS || '30'),
      },
      backup: {
        enabled: process.env.BACKUP_ENABLED === 'true',
        schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *',
        retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
      },
    };
  }

  /**
   * Get configuration value
   */
  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  /**
   * Get nested configuration value
   */
  getNested<K extends keyof AppConfig, T extends keyof AppConfig[K]>(
    key: K,
    nestedKey: T
  ): AppConfig[K][T] {
    return this.config[key][nestedKey];
  }

  /**
   * Get all configuration
   */
  getAll(): AppConfig {
    return { ...this.config };
  }

  /**
   * Validate configuration
   */
  async validateConfig(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Validate required environment variables
      if (!process.env.DATABASE_URL) {
        errors.push('DATABASE_URL is required');
      }

      if (!process.env.SHOPIFY_API_KEY) {
        errors.push('SHOPIFY_API_KEY is required');
      }

      if (!process.env.SHOPIFY_API_SECRET) {
        errors.push('SHOPIFY_API_SECRET is required');
      }

      if (!process.env.SESSION_SECRET) {
        errors.push('SESSION_SECRET is required');
      }

      // Validate database URL format
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
        errors.push('DATABASE_URL must be a valid PostgreSQL connection string');
      }

      // Validate numeric values
      const numericFields = [
        'PORT', 'DB_MAX_CONNECTIONS', 'DB_CONNECTION_TIMEOUT',
        'RATE_LIMIT_QR_SCAN_WINDOW', 'RATE_LIMIT_QR_SCAN_MAX',
        'RATE_LIMIT_API_WINDOW', 'RATE_LIMIT_API_MAX',
        'LIMIT_FREE_QR_CODES', 'LIMIT_FREE_CAMPAIGNS', 'LIMIT_FREE_ANALYTICS_DAYS',
        'LIMIT_BASIC_QR_CODES', 'LIMIT_BASIC_CAMPAIGNS', 'LIMIT_BASIC_ANALYTICS_DAYS',
        'LIMIT_PRO_QR_CODES', 'LIMIT_PRO_CAMPAIGNS', 'LIMIT_PRO_ANALYTICS_DAYS',
        'LIMIT_ENTERPRISE_QR_CODES', 'LIMIT_ENTERPRISE_CAMPAIGNS', 'LIMIT_ENTERPRISE_ANALYTICS_DAYS',
        'METRICS_INTERVAL', 'MAINTENANCE_CLEANUP_DAYS', 'BACKUP_RETENTION_DAYS',
      ];

      for (const field of numericFields) {
        const value = process.env[field];
        if (value && isNaN(parseInt(value))) {
          errors.push(`${field} must be a valid number`);
        }
      }

      // Validate boolean values
      const booleanFields = [
        'FEATURE_LOYALTY_PROGRAM', 'FEATURE_CAMPAIGNS', 'FEATURE_ANALYTICS',
        'FEATURE_QR_CUSTOMIZATION', 'FEATURE_BULK_OPERATIONS', 'FEATURE_API_ACCESS',
        'FEATURE_WHITE_LABEL', 'MONITORING_ENABLED', 'MAINTENANCE_ENABLED', 'BACKUP_ENABLED',
      ];

      for (const field of booleanFields) {
        const value = process.env[field];
        if (value && !['true', 'false'].includes(value.toLowerCase())) {
          errors.push(`${field} must be 'true' or 'false'`);
        }
      }

      // Validate environment
      if (!['development', 'production', 'test'].includes(process.env.NODE_ENV || '')) {
        errors.push('NODE_ENV must be development, production, or test');
      }

      // Validate log level
      if (!['error', 'warn', 'info', 'debug'].includes(process.env.LOG_LEVEL || '')) {
        errors.push('LOG_LEVEL must be error, warn, info, or debug');
      }

      await logger.info(
        `Configuration validation completed: ${errors.length} errors found`,
        undefined,
        {
          type: 'config_validation',
          errors,
        }
      );

    } catch (error) {
      errors.push(`Configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Reload configuration
   */
  async reloadConfig(): Promise<void> {
    try {
      this.config = this.loadConfig();
      
      await logger.info('Configuration reloaded successfully', undefined, {
        type: 'config_reload',
      });
    } catch (error) {
      await logger.error(
        'Failed to reload configuration',
        undefined,
        {
          type: 'config_reload_error',
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
    }
  }

  /**
   * Get configuration summary
   */
  getConfigSummary(): {
    environment: string;
    features: string[];
    limits: Record<string, any>;
    monitoring: boolean;
    maintenance: boolean;
    backup: boolean;
  } {
    const features = Object.entries(this.config.features)
      .filter(([, enabled]) => enabled)
      .map(([feature]) => feature);

    return {
      environment: this.config.server.environment,
      features,
      limits: this.config.limits,
      monitoring: this.config.monitoring.enabled,
      maintenance: this.config.maintenance.enabled,
      backup: this.config.backup.enabled,
    };
  }
}

// Export singleton instance
export const configManager = ConfigManager.getInstance();

/**
 * Utility function to validate configuration on startup
 */
export async function validateStartupConfig(): Promise<boolean> {
  try {
    const { valid, errors } = await configManager.validateConfig();
    
    if (!valid) {
      await logger.error(
        'Configuration validation failed',
        undefined,
        {
          type: 'startup_config_validation_failed',
          errors,
        }
      );
      return false;
    }

    await logger.info('Configuration validation passed', undefined, {
      type: 'startup_config_validation_passed',
    });
    
    return true;
  } catch (error) {
    await logger.error(
      'Configuration validation failed',
      undefined,
      {
        type: 'startup_config_validation_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    );
    return false;
  }
}
