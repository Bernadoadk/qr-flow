import { prisma } from '../db.server';

export interface CacheEntry<T = any> {
  data: T;
  expiresAt: Date;
  createdAt: Date;
}

export class CacheManager {
  private static instance: CacheManager;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && memoryEntry.expiresAt > new Date()) {
      return memoryEntry.data as T;
    }

    // Remove expired entry
    if (memoryEntry) {
      this.memoryCache.delete(key);
    }

    return null;
  }

  /**
   * Set cached data
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const expiresAt = new Date(Date.now() + (ttl || this.defaultTTL));
    const entry: CacheEntry<T> = {
      data,
      expiresAt,
      createdAt: new Date(),
    };

    this.memoryCache.set(key, entry);
  }

  /**
   * Delete cached data
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    entries: Array<{
      key: string;
      expiresAt: Date;
      createdAt: Date;
    }>;
  } {
    const entries = Array.from(this.memoryCache.entries()).map(([key, entry]) => ({
      key,
      expiresAt: entry.expiresAt,
      createdAt: entry.createdAt,
    }));

    return {
      size: this.memoryCache.size,
      entries,
    };
  }

  /**
   * Clean expired entries
   */
  cleanExpired(): void {
    const now = new Date();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt <= now) {
        this.memoryCache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const cache = CacheManager.getInstance();

/**
 * Cache key generators
 */
export const CacheKeys = {
  merchant: (merchantId: string) => `merchant:${merchantId}`,
  qrCode: (qrId: string) => `qr:${qrId}`,
  qrCodes: (merchantId: string) => `qr_codes:${merchantId}`,
  campaign: (campaignId: string) => `campaign:${campaignId}`,
  campaigns: (merchantId: string) => `campaigns:${merchantId}`,
  loyalty: (merchantId: string) => `loyalty:${merchantId}`,
  analytics: (merchantId: string, period: string) => `analytics:${merchantId}:${period}`,
  stats: (merchantId: string) => `stats:${merchantId}`,
  planLimits: (merchantId: string) => `plan_limits:${merchantId}`,
};

/**
 * Cache TTL values (in milliseconds)
 */
export const CacheTTL = {
  SHORT: 1 * 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 15 * 60 * 1000, // 15 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
};

/**
 * Cached merchant data
 */
export async function getCachedMerchant(merchantId: string) {
  const cacheKey = CacheKeys.merchant(merchantId);
  let merchant = await cache.get(cacheKey);

  if (!merchant) {
    merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (merchant) {
      await cache.set(cacheKey, merchant, CacheTTL.MEDIUM);
    }
  }

  return merchant;
}

/**
 * Cached QR codes
 */
export async function getCachedQRCodes(merchantId: string) {
  const cacheKey = CacheKeys.qrCodes(merchantId);
  let qrCodes = await cache.get(cacheKey);

  if (!qrCodes) {
    qrCodes = await prisma.qRCode.findMany({
      where: { merchantId },
      include: {
        campaign: true,
        analytics: {
          select: {
            type: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (qrCodes) {
      await cache.set(cacheKey, qrCodes, CacheTTL.MEDIUM);
    }
  }

  return qrCodes;
}

/**
 * Cached campaigns
 */
export async function getCachedCampaigns(merchantId: string) {
  const cacheKey = CacheKeys.campaigns(merchantId);
  let campaigns = await cache.get(cacheKey);

  if (!campaigns) {
    campaigns = await prisma.campaign.findMany({
      where: { merchantId },
      include: {
        qrcodes: {
          select: {
            id: true,
            title: true,
            scanCount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (campaigns) {
      await cache.set(cacheKey, campaigns, CacheTTL.MEDIUM);
    }
  }

  return campaigns;
}

/**
 * Cached loyalty program
 */
export async function getCachedLoyaltyProgram(merchantId: string) {
  const cacheKey = CacheKeys.loyalty(merchantId);
  let loyalty = await cache.get(cacheKey);

  if (!loyalty) {
    loyalty = await prisma.loyaltyProgram.findUnique({
      where: { merchantId },
    });

    if (loyalty) {
      await cache.set(cacheKey, loyalty, CacheTTL.LONG);
    }
  }

  return loyalty;
}

/**
 * Cached analytics data
 */
export async function getCachedAnalytics(merchantId: string, period: string) {
  const cacheKey = CacheKeys.analytics(merchantId, period);
  let analytics = await cache.get(cacheKey);

  if (!analytics) {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [dailyAnalytics, analyticsByType, topQRCodes] = await Promise.all([
      prisma.analyticsEvent.groupBy({
        by: ['createdAt'],
        where: {
          qr: { merchantId },
          createdAt: { gte: startDate },
        },
        _count: { type: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.analyticsEvent.groupBy({
        by: ['type'],
        where: {
          qr: { merchantId },
          createdAt: { gte: startDate },
        },
        _count: { type: true },
      }),
      prisma.qRCode.findMany({
        where: { merchantId },
        include: {
          analytics: {
            where: {
              createdAt: { gte: startDate },
            },
            select: {
              type: true,
              createdAt: true,
            },
          },
        },
        orderBy: { scanCount: 'desc' },
        take: 10,
      }),
    ]);

    analytics = {
      dailyAnalytics,
      analyticsByType,
      topQRCodes,
    };

    await cache.set(cacheKey, analytics, CacheTTL.SHORT);
  }

  return analytics;
}

/**
 * Cached merchant statistics
 */
export async function getCachedMerchantStats(merchantId: string) {
  const cacheKey = CacheKeys.stats(merchantId);
  let stats = await cache.get(cacheKey);

  if (!stats) {
    const [
      qrCount,
      campaignCount,
      totalScans,
      activeQRCodes,
    ] = await Promise.all([
      prisma.qRCode.count({ where: { merchantId } }),
      prisma.campaign.count({ where: { merchantId } }),
      prisma.analyticsEvent.count({
        where: {
          qr: { merchantId },
          type: 'SCAN',
        },
      }),
      prisma.qRCode.count({
        where: { merchantId, active: true },
      }),
    ]);

    stats = {
      qrCount,
      campaignCount,
      totalScans,
      activeQRCodes,
    };

    await cache.set(cacheKey, stats, CacheTTL.MEDIUM);
  }

  return stats;
}

/**
 * Invalidate cache for merchant
 */
export async function invalidateMerchantCache(merchantId: string): Promise<void> {
  const keys = [
    CacheKeys.merchant(merchantId),
    CacheKeys.qrCodes(merchantId),
    CacheKeys.campaigns(merchantId),
    CacheKeys.loyalty(merchantId),
    CacheKeys.stats(merchantId),
    CacheKeys.planLimits(merchantId),
  ];

  for (const key of keys) {
    await cache.delete(key);
  }

  // Also invalidate analytics cache for all periods
  const periods = ['7d', '30d', '90d'];
  for (const period of periods) {
    await cache.delete(CacheKeys.analytics(merchantId, period));
  }
}

/**
 * Invalidate cache for specific QR code
 */
export async function invalidateQRCodeCache(qrId: string, merchantId: string): Promise<void> {
  await cache.delete(CacheKeys.qrCode(qrId));
  await cache.delete(CacheKeys.qrCodes(merchantId));
  await cache.delete(CacheKeys.stats(merchantId));
}

/**
 * Invalidate cache for specific campaign
 */
export async function invalidateCampaignCache(campaignId: string, merchantId: string): Promise<void> {
  await cache.delete(CacheKeys.campaign(campaignId));
  await cache.delete(CacheKeys.campaigns(merchantId));
}

/**
 * Invalidate analytics cache
 */
export async function invalidateAnalyticsCache(merchantId: string): Promise<void> {
  const periods = ['7d', '30d', '90d'];
  for (const period of periods) {
    await cache.delete(CacheKeys.analytics(merchantId, period));
  }
  await cache.delete(CacheKeys.stats(merchantId));
}

/**
 * Clean expired cache entries periodically
 */
export function startCacheCleanup(): void {
  setInterval(() => {
    cache.cleanExpired();
  }, 5 * 60 * 1000); // Clean every 5 minutes
}
