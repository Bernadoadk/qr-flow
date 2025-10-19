import { prisma } from "~/db.server";

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export class RateLimitService {
  private static defaultConfig: RateLimitConfig = {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"), // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
  };

  /**
   * Check if request is within rate limit
   */
  static async checkRateLimit(
    merchantId: string,
    config: RateLimitConfig = this.defaultConfig
  ): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    try {
      const now = new Date();
      const windowStart = new Date(now.getTime() - config.windowMs);

      // Get or create rate limit record
      let rateLimit = await prisma.rateLimit.findFirst({
        where: {
          merchantId,
          windowStart: {
            gte: windowStart,
          },
        },
      });

      if (!rateLimit) {
        // Create new rate limit record
        rateLimit = await prisma.rateLimit.create({
          data: {
            merchantId,
            windowStart: now,
            requests: 1,
          },
        });
      } else {
        // Update existing record
        rateLimit = await prisma.rateLimit.update({
          where: { id: rateLimit.id },
          data: {
            requests: {
              increment: 1,
            },
          },
        });
      }

      const allowed = rateLimit.requests <= config.maxRequests;
      const remaining = Math.max(0, config.maxRequests - rateLimit.requests);
      const resetTime = new Date(rateLimit.windowStart.getTime() + config.windowMs);

      return {
        allowed,
        remaining,
        resetTime,
      };
    } catch (error) {
      console.error("Error checking rate limit:", error);
      // On error, allow the request but log it
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: new Date(Date.now() + config.windowMs),
      };
    }
  }

  /**
   * Clean up old rate limit records
   */
  static async cleanupOldRecords(): Promise<void> {
    try {
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      
      await prisma.rateLimit.deleteMany({
        where: {
          windowStart: {
            lt: cutoffTime,
          },
        },
      });
    } catch (error) {
      console.error("Error cleaning up rate limit records:", error);
    }
  }

  /**
   * Get rate limit status for a merchant
   */
  static async getRateLimitStatus(merchantId: string): Promise<{
    current: number;
    limit: number;
    resetTime: Date;
  }> {
    try {
      const now = new Date();
      const windowStart = new Date(now.getTime() - this.defaultConfig.windowMs);

      const rateLimit = await prisma.rateLimit.findFirst({
        where: {
          merchantId,
          windowStart: {
            gte: windowStart,
          },
        },
      });

      const current = rateLimit?.requests || 0;
      const resetTime = rateLimit 
        ? new Date(rateLimit.windowStart.getTime() + this.defaultConfig.windowMs)
        : new Date(now.getTime() + this.defaultConfig.windowMs);

      return {
        current,
        limit: this.defaultConfig.maxRequests,
        resetTime,
      };
    } catch (error) {
      console.error("Error getting rate limit status:", error);
      return {
        current: 0,
        limit: this.defaultConfig.maxRequests,
        resetTime: new Date(Date.now() + this.defaultConfig.windowMs),
      };
    }
  }
}





