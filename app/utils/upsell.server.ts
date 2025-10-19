import { prisma } from "~/db.server";

export interface UpsellConfig {
  enabled: boolean;
  showLandingPage: boolean;
  landingPageConfig?: {
    title: string;
    subtitle?: string;
    primaryButtonText: string;
    secondaryButtonText?: string;
    backgroundColor?: string;
    textColor?: string;
    logoUrl?: string;
  };
  upsellProducts?: {
    productId: string;
    productHandle: string;
    discount?: number;
    discountType?: 'percentage' | 'fixed';
    promoCode?: string;
    position: 'top' | 'bottom' | 'sidebar';
  }[];
  crossSellProducts?: {
    productId: string;
    productHandle: string;
    discount?: number;
    discountType?: 'percentage' | 'fixed';
    promoCode?: string;
    category?: string;
  }[];
  autoApplyPromo?: boolean;
  promoCode?: string;
  promoExpiry?: Date;
}

export interface LandingPageData {
  qrCode: any;
  merchant: any;
  upsellConfig: UpsellConfig;
  products: any[];
  primaryProduct?: any;
  upsellProducts: any[];
  crossSellProducts: any[];
}

export class UpsellService {
  /**
   * Get upsell configuration for a QR code
   */
  static async getUpsellConfig(qrCodeId: string): Promise<UpsellConfig | null> {
    try {
      const qrCode = await prisma.qRCode.findUnique({
        where: { id: qrCodeId },
        select: { 
          id: true,
          // @ts-ignore - New field not yet recognized by Prisma client
          upsellConfig: true 
        },
      });

      if (!qrCode || !(qrCode as any).upsellConfig) {
        return null;
      }

      return (qrCode as any).upsellConfig as UpsellConfig;
    } catch (error) {
      console.error("Error getting upsell config:", error);
      return null;
    }
  }

  /**
   * Update upsell configuration for a QR code
   */
  static async updateUpsellConfig(
    qrCodeId: string,
    config: UpsellConfig
  ): Promise<boolean> {
    try {
      await prisma.qRCode.update({
        where: { id: qrCodeId },
        data: { 
          // @ts-ignore - New field not yet recognized by Prisma client
          upsellConfig: config 
        },
      });

      return true;
    } catch (error) {
      console.error("Error updating upsell config:", error);
      return false;
    }
  }

  /**
   * Get landing page data for a QR code
   */
  static async getLandingPageData(qrCodeId: string): Promise<LandingPageData | null> {
    try {
      const qrCode = await prisma.qRCode.findUnique({
        where: { id: qrCodeId },
        include: {
          merchant: true,
          campaign: true,
        },
      });

      if (!qrCode) {
        return null;
      }

      const upsellConfig = (qrCode as any).upsellConfig as UpsellConfig;
      if (!upsellConfig?.enabled) {
        return null;
      }

      // Get products from Shopify (this would need to be implemented with Shopify API)
      const products = await this.getShopifyProducts(qrCode.merchant.shopifyDomain);
      
      // Get primary product if it's a product QR
      let primaryProduct = null;
      if (qrCode.type === "PRODUCT") {
        primaryProduct = products.find(p => p.handle === qrCode.destination);
      }

      // Get upsell products
      const upsellProducts = [];
      if (upsellConfig.upsellProducts) {
        for (const upsell of upsellConfig.upsellProducts) {
          const product = products.find(p => p.handle === upsell.productHandle);
          if (product) {
            upsellProducts.push({
              ...product,
              discount: upsell.discount,
              discountType: upsell.discountType,
              promoCode: upsell.promoCode,
              position: upsell.position,
            });
          }
        }
      }

      // Get cross-sell products
      const crossSellProducts = [];
      if (upsellConfig.crossSellProducts) {
        for (const crossSell of upsellConfig.crossSellProducts) {
          const product = products.find(p => p.handle === crossSell.productHandle);
          if (product) {
            crossSellProducts.push({
              ...product,
              discount: crossSell.discount,
              discountType: crossSell.discountType,
              promoCode: crossSell.promoCode,
              category: crossSell.category,
            });
          }
        }
      }

      return {
        qrCode,
        merchant: qrCode.merchant,
        upsellConfig,
        products,
        primaryProduct,
        upsellProducts,
        crossSellProducts,
      };
    } catch (error) {
      console.error("Error getting landing page data:", error);
      return null;
    }
  }

  /**
   * Record upsell/cross-sell click
   */
  static async recordUpsellClick(
    qrCodeId: string,
    productId: string,
    type: 'upsell' | 'cross_sell',
    metadata: any = {}
  ): Promise<boolean> {
    try {
      await prisma.analyticsEvent.create({
        data: {
          qrId: qrCodeId,
          // @ts-ignore - New event types not yet recognized by Prisma client
          type: type === 'upsell' ? 'UPSELL_CLICK' : 'CROSS_SELL_CLICK',
          meta: {
            productId,
            ...metadata,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return true;
    } catch (error) {
      console.error("Error recording upsell click:", error);
      return false;
    }
  }

  /**
   * Record promo code usage
   */
  static async recordPromoCodeUsage(
    qrCodeId: string,
    promoCode: string,
    metadata: any = {}
  ): Promise<boolean> {
    try {
      await prisma.analyticsEvent.create({
        data: {
          qrId: qrCodeId,
          // @ts-ignore - New event types not yet recognized by Prisma client
          type: 'PROMO_CODE_USED',
          meta: {
            promoCode,
            ...metadata,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return true;
    } catch (error) {
      console.error("Error recording promo code usage:", error);
      return false;
    }
  }

  /**
   * Get conversion rate for a QR code
   */
  static async getConversionRate(qrCodeId: string, dateRange?: { from: Date; to: Date }): Promise<{
    totalScans: number;
    totalConversions: number;
    conversionRate: number;
    upsellClicks: number;
    crossSellClicks: number;
    promoCodeUsages: number;
  }> {
    try {
      const whereClause = {
        qrId: qrCodeId,
        ...(dateRange && {
          createdAt: {
            gte: dateRange.from,
            lte: dateRange.to,
          },
        }),
      };

      const [totalScans, conversions, upsellClicks, crossSellClicks, promoUsages] = await Promise.all([
        prisma.analyticsEvent.count({
          where: { ...whereClause, type: 'SCAN' },
        }),
        prisma.analyticsEvent.count({
          where: { ...whereClause, type: 'PURCHASE' },
        }),
        prisma.analyticsEvent.count({
          where: { ...whereClause, type: 'UPSELL_CLICK' },
        }),
        prisma.analyticsEvent.count({
          where: { ...whereClause, type: 'CROSS_SELL_CLICK' },
        }),
        prisma.analyticsEvent.count({
          where: { ...whereClause, type: 'PROMO_CODE_USED' },
        }),
      ]);

      const conversionRate = totalScans > 0 ? (conversions / totalScans) * 100 : 0;

      return {
        totalScans,
        totalConversions: conversions,
        conversionRate,
        upsellClicks,
        crossSellClicks,
        promoCodeUsages: promoUsages,
      };
    } catch (error) {
      console.error("Error getting conversion rate:", error);
      return {
        totalScans: 0,
        totalConversions: 0,
        conversionRate: 0,
        upsellClicks: 0,
        crossSellClicks: 0,
        promoCodeUsages: 0,
      };
    }
  }

  /**
   * Mock function to get Shopify products
   * In a real implementation, this would use the Shopify API
   */
  private static async getShopifyProducts(shopDomain: string): Promise<any[]> {
    // This is a mock implementation
    // In reality, you would call the Shopify API here
    return [
      {
        id: "1",
        handle: "product-1",
        title: "Produit Principal",
        price: 29.99,
        image: "https://via.placeholder.com/300x300",
        description: "Description du produit principal",
      },
      {
        id: "2",
        handle: "product-2",
        title: "Produit Upsell",
        price: 49.99,
        image: "https://via.placeholder.com/300x300",
        description: "Produit premium à suggérer",
      },
      {
        id: "3",
        handle: "product-3",
        title: "Produit Cross-sell",
        price: 19.99,
        image: "https://via.placeholder.com/300x300",
        description: "Produit complémentaire",
      },
    ];
  }
}

