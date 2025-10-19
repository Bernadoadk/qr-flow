import { AnalyticsService } from '../analytics.server';
import { prisma } from '~/db.server';

describe('AnalyticsService', () => {
  let testMerchant: any;
  let testQRCode: any;

  beforeAll(async () => {
    // Create test merchant
    testMerchant = await global.testUtils.createTestMerchant();
    testQRCode = await global.testUtils.createTestQRCode(testMerchant.id);
  });

  afterAll(async () => {
    await global.testUtils.cleanup();
  });

  describe('recordScan', () => {
    it('should record a scan event with metadata', async () => {
      const metadata = {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        country: 'US',
        device: 'desktop',
        browser: 'Chrome',
      };

      const result = await AnalyticsService.recordScan(testQRCode.id, 'SCAN', metadata);

      expect(result).toBeDefined();
      expect(result.qrId).toBe(testQRCode.id);
      expect(result.type).toBe('SCAN');
      expect(result.meta).toMatchObject(metadata);

      // Verify scan count was incremented
      const updatedQRCode = await prisma.qRCode.findUnique({
        where: { id: testQRCode.id },
      });
      expect(updatedQRCode?.scanCount).toBe(1);
    });

    it('should handle missing metadata gracefully', async () => {
      const result = await AnalyticsService.recordScan(testQRCode.id, 'SCAN');

      expect(result).toBeDefined();
      expect(result.qrId).toBe(testQRCode.id);
      expect(result.type).toBe('SCAN');
    });
  });

  describe('getStatsForMerchant', () => {
    it('should return analytics statistics for a merchant', async () => {
      // Create some test analytics events
      await prisma.analyticsEvent.createMany({
        data: [
          {
            qrId: testQRCode.id,
            type: 'SCAN',
            meta: { ip: '192.168.1.1', country: 'US' },
          },
          {
            qrId: testQRCode.id,
            type: 'SCAN',
            meta: { ip: '192.168.1.2', country: 'CA' },
          },
        ],
      });

      const stats = await AnalyticsService.getStatsForMerchant(testMerchant.id);

      expect(stats).toBeDefined();
      expect(stats.totalScans).toBeGreaterThan(0);
      expect(stats.scansByDay).toBeInstanceOf(Array);
      expect(stats.topQRCodes).toBeInstanceOf(Array);
      expect(stats.scansByCountry).toBeInstanceOf(Array);
      expect(stats.scansByDevice).toBeInstanceOf(Array);
      expect(stats.scansByBrowser).toBeInstanceOf(Array);
    });

    it('should handle date range filtering', async () => {
      const from = new Date();
      from.setDate(from.getDate() - 7);
      const to = new Date();

      const stats = await AnalyticsService.getStatsForMerchant(testMerchant.id, { from, to });

      expect(stats).toBeDefined();
      expect(stats.totalScans).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getQRCodeAnalytics', () => {
    it('should return analytics for a specific QR code', async () => {
      const analytics = await AnalyticsService.getQRCodeAnalytics(testQRCode.id);

      expect(analytics).toBeDefined();
      expect(analytics.qrCode).toBeDefined();
      expect(analytics.qrCode.id).toBe(testQRCode.id);
      expect(analytics.totalScans).toBeGreaterThanOrEqual(0);
      expect(analytics.recentScans).toBeInstanceOf(Array);
    });
  });
});





