import { prisma } from "~/db.server";
import geoip from "geoip-lite";
import { UAParser } from "ua-parser-js";
import type { EventType, QRCode } from "@prisma/client";

export interface ScanMetadata {
  ip?: string;
  userAgent?: string;
  country?: string;
  city?: string;
  device?: string;
  browser?: string;
  os?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
  language?: string;
}

export interface AnalyticsStats {
  totalScans: number;
  uniqueScans: number;
  scansByDay: Array<{ date: string; count: number }>;
  topQRCodes: Array<{ id: string; title: string; scans: number }>;
  scansByCountry: Array<{ country: string; count: number }>;
  scansByDevice: Array<{ device: string; count: number }>;
  scansByBrowser: Array<{ browser: string; count: number }>;
}

export class AnalyticsService {
  /**
   * Record a scan event with metadata
   */
  static async recordScan(
    qrId: string,
    type: EventType = "SCAN",
    metadata: ScanMetadata = {}
  ) {
    try {
      // Parse user agent if provided
      let deviceInfo = {};
      if (metadata.userAgent) {
        const parser = new UAParser(metadata.userAgent);
        const result = parser.getResult();
        deviceInfo = {
          device: result.device.type || "desktop",
          browser: result.browser.name,
          os: result.os.name,
        };
      }

      // Get geolocation from IP
      let geoInfo = {};
      if (metadata.ip) {
        const geo = geoip.lookup(metadata.ip);
        if (geo) {
          geoInfo = {
            country: geo.country,
            city: geo.city,
            region: geo.region,
          };
        }
      }

      // Combine all metadata
      const fullMetadata = {
        ...metadata,
        ...deviceInfo,
        ...geoInfo,
        timestamp: new Date().toISOString(),
      };

      // Use transaction to ensure consistency
      const result = await prisma.$transaction(async (tx) => {
        // Record the analytics event
        const event = await tx.analyticsEvent.create({
          data: {
            qrId,
            type,
            meta: fullMetadata,
          },
        });

        // Increment scan count on QR code
        await tx.qRCode.update({
          where: { id: qrId },
          data: {
            scanCount: {
              increment: 1,
            },
          },
        });

        return event;
      });

      return result;
    } catch (error) {
      console.error("Error recording scan:", error);
      throw error;
    }
  }

  /**
   * Get analytics statistics for a merchant
   */
  static async getStatsForMerchant(
    merchantId: string,
    dateRange?: { from: Date; to: Date }
  ) {
    try {
      const whereClause = {
        qr: {
          merchantId,
        },
        ...(dateRange && {
          createdAt: {
            gte: dateRange.from,
            lte: dateRange.to,
          },
        }),
      };

      // Get total scans
      const totalScans = await prisma.analyticsEvent.count({
        where: whereClause,
      });

      // Get unique scans (by IP)
      const uniqueScans = await prisma.analyticsEvent.groupBy({
        by: ["meta"],
        where: whereClause,
        _count: true,
      });

      // Get scans by day
      const scansByDay = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM analytics_events ae
        JOIN qrcodes q ON ae.qr_id = q.id
        WHERE q.merchant_id = ${merchantId}
        ${dateRange ? `AND ae.created_at >= ${dateRange.from} AND ae.created_at <= ${dateRange.to}` : ""}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `;

      // Get top QR codes
      const topQRCodes = await prisma.qRCode.findMany({
        where: { merchantId },
        select: {
          id: true,
          title: true,
          scanCount: true,
        },
        orderBy: { scanCount: "desc" },
        take: 10,
      });

      // Get scans by country
      const scansByCountry = await prisma.$queryRaw<Array<{ country: string; count: bigint }>>`
        SELECT 
          (meta->>'country') as country,
          COUNT(*) as count
        FROM analytics_events ae
        JOIN qrcodes q ON ae.qr_id = q.id
        WHERE q.merchant_id = ${merchantId}
        AND meta->>'country' IS NOT NULL
        ${dateRange ? `AND ae.created_at >= ${dateRange.from} AND ae.created_at <= ${dateRange.to}` : ""}
        GROUP BY meta->>'country'
        ORDER BY count DESC
        LIMIT 10
      `;

      // Get scans by device
      const scansByDevice = await prisma.$queryRaw<Array<{ device: string; count: bigint }>>`
        SELECT 
          (meta->>'device') as device,
          COUNT(*) as count
        FROM analytics_events ae
        JOIN qrcodes q ON ae.qr_id = q.id
        WHERE q.merchant_id = ${merchantId}
        AND meta->>'device' IS NOT NULL
        ${dateRange ? `AND ae.created_at >= ${dateRange.from} AND ae.created_at <= ${dateRange.to}` : ""}
        GROUP BY meta->>'device'
        ORDER BY count DESC
        LIMIT 10
      `;

      // Get scans by browser
      const scansByBrowser = await prisma.$queryRaw<Array<{ browser: string; count: bigint }>>`
        SELECT 
          (meta->>'browser') as browser,
          COUNT(*) as count
        FROM analytics_events ae
        JOIN qrcodes q ON ae.qr_id = q.id
        WHERE q.merchant_id = ${merchantId}
        AND meta->>'browser' IS NOT NULL
        ${dateRange ? `AND ae.created_at >= ${dateRange.from} AND ae.created_at <= ${dateRange.to}` : ""}
        GROUP BY meta->>'browser'
        ORDER BY count DESC
        LIMIT 10
      `;

      return {
        totalScans,
        uniqueScans: uniqueScans.length,
        scansByDay: scansByDay.map((item) => ({
          date: item.date,
          count: Number(item.count),
        })),
        topQRCodes: topQRCodes.map((qr) => ({
          id: qr.id,
          title: qr.title,
          scans: qr.scanCount,
        })),
        scansByCountry: scansByCountry.map((item) => ({
          country: item.country || "Unknown",
          count: Number(item.count),
        })),
        scansByDevice: scansByDevice.map((item) => ({
          device: item.device || "Unknown",
          count: Number(item.count),
        })),
        scansByBrowser: scansByBrowser.map((item) => ({
          browser: item.browser || "Unknown",
          count: Number(item.count),
        })),
      } as AnalyticsStats;
    } catch (error) {
      console.error("Error getting analytics stats:", error);
      throw error;
    }
  }

  /**
   * Get real-time analytics for a specific QR code
   */
  static async getQRCodeAnalytics(qrId: string, dateRange?: { from: Date; to: Date }) {
    try {
      const whereClause = {
        qrId,
        ...(dateRange && {
          createdAt: {
            gte: dateRange.from,
            lte: dateRange.to,
          },
        }),
      };

      const [totalScans, recentScans, qrCode] = await Promise.all([
        prisma.analyticsEvent.count({ where: whereClause }),
        prisma.analyticsEvent.findMany({
          where: whereClause,
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            type: true,
            meta: true,
            createdAt: true,
          },
        }),
        prisma.qRCode.findUnique({
          where: { id: qrId },
          select: {
            id: true,
            title: true,
            scanCount: true,
            createdAt: true,
          },
        }),
      ]);

      return {
        qrCode,
        totalScans,
        recentScans,
      };
    } catch (error) {
      console.error("Error getting QR code analytics:", error);
      throw error;
    }
  }

  /**
   * Record a purchase/conversion event
   */
  static async recordPurchase(
    qrId: string,
    orderData: {
      orderId: string;
      orderValue: number;
      customerId?: string;
      customerEmail?: string;
      products: Array<{
        id: string;
        title: string;
        quantity: number;
        price: number;
      }>;
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
    }
  ): Promise<boolean> {
    try {
      await prisma.analyticsEvent.create({
        data: {
          qrId,
          // @ts-ignore - New event types not yet recognized by Prisma client
          type: 'PURCHASE',
          meta: {
            orderId: orderData.orderId,
            orderValue: orderData.orderValue,
            customerId: orderData.customerId,
            customerEmail: orderData.customerEmail,
            products: orderData.products,
            utm_source: orderData.utm_source,
            utm_medium: orderData.utm_medium,
            utm_campaign: orderData.utm_campaign,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return true;
    } catch (error) {
      console.error("Error recording purchase:", error);
      return false;
    }
  }

  /**
   * Get detailed conversion analytics for a merchant
   */
  static async getMerchantConversionAnalytics(
    merchantId: string,
    dateRange?: { from: Date; to: Date }
  ): Promise<{
    totalScans: number;
    totalConversions: number;
    conversionRate: number;
    totalRevenue: number;
    averageOrderValue: number;
    topConvertingQRCodes: Array<{
      qrId: string;
      title: string;
      scans: number;
      conversions: number;
      conversionRate: number;
      revenue: number;
    }>;
    conversionFunnel: {
      scans: number;
      clicks: number;
      upsellClicks: number;
      crossSellClicks: number;
      purchases: number;
    };
  }> {
    try {
      const whereClause = {
        qr: { merchantId },
        ...(dateRange && {
          createdAt: {
            gte: dateRange.from,
            lte: dateRange.to,
          },
        }),
      };

      // Get all events for the merchant
      const events = await prisma.analyticsEvent.findMany({
        where: whereClause,
        include: {
          qr: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      // Calculate basic metrics
      const totalScans = events.filter(e => e.type === 'SCAN').length;
      const totalConversions = events.filter(e => (e as any).type === 'PURCHASE').length;
      const conversionRate = totalScans > 0 ? (totalConversions / totalScans) * 100 : 0;

      // Calculate revenue
      const purchaseEvents = events.filter(e => (e as any).type === 'PURCHASE');
      const totalRevenue = purchaseEvents.reduce((total, event) => {
        const meta = event.meta as any;
        return total + (meta?.orderValue || 0);
      }, 0);

      const averageOrderValue = totalConversions > 0 ? totalRevenue / totalConversions : 0;

      // Get top converting QR codes
      const qrCodeStats = new Map();
      events.forEach(event => {
        const qrId = event.qrId;
        if (!qrCodeStats.has(qrId)) {
          qrCodeStats.set(qrId, {
            qrId,
            title: event.qr.title,
            scans: 0,
            conversions: 0,
            revenue: 0,
          });
        }

        const stats = qrCodeStats.get(qrId);
        if (event.type === 'SCAN') {
          stats.scans++;
        } else if ((event as any).type === 'PURCHASE') {
          stats.conversions++;
          const meta = event.meta as any;
          stats.revenue += meta?.orderValue || 0;
        }
      });

      const topConvertingQRCodes = Array.from(qrCodeStats.values())
        .map(stats => ({
          ...stats,
          conversionRate: stats.scans > 0 ? (stats.conversions / stats.scans) * 100 : 0,
        }))
        .sort((a, b) => b.conversionRate - a.conversionRate)
        .slice(0, 10);

      // Calculate conversion funnel
      const conversionFunnel = {
        scans: events.filter(e => e.type === 'SCAN').length,
        clicks: events.filter(e => e.type === 'CLICK').length,
        upsellClicks: events.filter(e => (e as any).type === 'UPSELL_CLICK').length,
        crossSellClicks: events.filter(e => (e as any).type === 'CROSS_SELL_CLICK').length,
        purchases: events.filter(e => (e as any).type === 'PURCHASE').length,
      };

      return {
        totalScans,
        totalConversions,
        conversionRate,
        totalRevenue,
        averageOrderValue,
        topConvertingQRCodes,
        conversionFunnel,
      };
    } catch (error) {
      console.error("Error getting merchant conversion analytics:", error);
      return {
        totalScans: 0,
        totalConversions: 0,
        conversionRate: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        topConvertingQRCodes: [],
        conversionFunnel: {
          scans: 0,
          clicks: 0,
          upsellClicks: 0,
          crossSellClicks: 0,
          purchases: 0,
        },
      };
    }
  }
}

