import { prisma } from "~/db.server";
import type { LoyaltyProgram, CustomerPoints } from "@prisma/client";

export interface LoyaltyReward {
  points: number;
  reward: string;
  description?: string;
}

export interface LoyaltyTier {
  name: string;
  minPoints: number;
  maxPoints?: number;
  discount: number;
  benefits: string[];
}

export interface LoyaltyStats {
  totalCustomers: number;
  totalPointsAwarded: number;
  totalPointsRedeemed: number;
  activeRewards: number;
  topCustomers: Array<{
    customerId: string;
    points: number;
    tier: string;
  }>;
}

export class LoyaltyService {
  /**
   * Get or create loyalty program for merchant
   */
  static async getOrCreateLoyaltyProgram(merchantId: string): Promise<LoyaltyProgram> {
    try {
      let program = await prisma.loyaltyProgram.findUnique({
        where: { merchantId },
      });

      if (!program) {
        program = await prisma.loyaltyProgram.create({
          data: {
            merchantId,
            name: "Programme de fidélité",
            description: "Gagnez des points à chaque scan de QR code",
            pointsPerScan: 10,
            rewards: {
              tiers: [
                {
                  name: "Bronze",
                  minPoints: 0,
                  maxPoints: 499,
                  discount: 5,
                  benefits: ["5% de réduction"],
                },
                {
                  name: "Silver",
                  minPoints: 500,
                  maxPoints: 999,
                  discount: 10,
                  benefits: ["10% de réduction", "Livraison gratuite"],
                },
                {
                  name: "Gold",
                  minPoints: 1000,
                  maxPoints: 2499,
                  discount: 15,
                  benefits: ["15% de réduction", "Livraison gratuite", "Accès anticipé aux ventes"],
                },
                {
                  name: "Platinum",
                  minPoints: 2500,
                  maxPoints: 99999,
                  discount: 20,
                  benefits: ["20% de réduction", "Livraison gratuite", "Accès anticipé aux ventes", "Support prioritaire"],
                },
              ],
              rewards: [
                { points: 100, reward: "Réduction 5%", description: "Code promo 5% de réduction" },
                { points: 500, reward: "Livraison gratuite", description: "Livraison gratuite sur votre prochaine commande" },
                { points: 1000, reward: "Réduction 10%", description: "Code promo 10% de réduction" },
                { points: 2500, reward: "Produit gratuit", description: "Choisissez un produit gratuit jusqu'à 50€" },
              ],
            },
          },
        });
      }

      return program;
    } catch (error) {
      console.error("Error getting/creating loyalty program:", error);
      throw error;
    }
  }

  /**
   * Award points to customer
   */
  static async awardPoints(
    merchantId: string,
    customerId: string,
    points: number,
    source: string = "qr_scan"
  ): Promise<CustomerPoints> {
    try {
      const customerPoints = await prisma.customerPoints.upsert({
        where: {
          id: `${merchantId}_${customerId}`,
        },
        update: {
          points: {
            increment: points,
          },
          meta: {
            lastScanAt: new Date().toISOString(),
            source,
          },
        },
        create: {
          id: `${merchantId}_${customerId}`,
          merchantId,
          customerId,
          points,
          meta: {
            lastScanAt: new Date().toISOString(),
            source,
          },
        },
      });

      return customerPoints;
    } catch (error) {
      console.error("Error awarding points:", error);
      throw error;
    }
  }

  /**
   * Redeem points for reward
   */
  static async redeemPoints(
    merchantId: string,
    customerId: string,
    pointsToRedeem: number,
    reward: string
  ): Promise<CustomerPoints> {
    try {
      const customerPoints = await prisma.customerPoints.findUnique({
        where: {
          id: `${merchantId}_${customerId}`,
        },
      });

      if (!customerPoints || customerPoints.points < pointsToRedeem) {
        throw new Error("Insufficient points");
      }

      const updatedCustomerPoints = await prisma.customerPoints.update({
        where: {
          id: `${merchantId}_${customerId}`,
        },
        data: {
          points: {
            decrement: pointsToRedeem,
          },
          meta: {
            ...(customerPoints.meta as any || {}),
            lastRedemption: {
              points: pointsToRedeem,
              reward,
              date: new Date().toISOString(),
            },
          },
        },
      });

      return updatedCustomerPoints;
    } catch (error) {
      console.error("Error redeeming points:", error);
      throw error;
    }
  }

  /**
   * Get customer points and tier
   */
  static async getCustomerPoints(merchantId: string, customerId: string): Promise<{
    points: number;
    tier: string;
    nextTier?: string;
    pointsToNextTier?: number;
  }> {
    try {
      const customerPoints = await prisma.customerPoints.findUnique({
        where: {
          id: `${merchantId}_${customerId}`,
        },
      });

      const loyaltyProgram = await prisma.loyaltyProgram.findUnique({
        where: { merchantId },
      });

      if (!loyaltyProgram) {
        return {
          points: 0,
          tier: "Bronze",
        };
      }

      const points = customerPoints?.points || 0;
      const tiers = (loyaltyProgram.rewards as any)?.tiers || [];
      
      // Default tiers if none configured
      const defaultTiers = [
        { name: "Bronze", minPoints: 0 },
        { name: "Silver", minPoints: 100 },
        { name: "Gold", minPoints: 300 },
        { name: "Platinum", minPoints: 600 }
      ];
      
      const tierList = tiers.length > 0 ? tiers : defaultTiers;
      let currentTier = tierList[0];
      let nextTier = null;

      for (let i = 0; i < tierList.length; i++) {
        if (points >= tierList[i].minPoints) {
          currentTier = tierList[i];
          if (i < tierList.length - 1) {
            nextTier = tierList[i + 1];
          }
        }
      }

      return {
        points,
        tier: currentTier?.name || "Bronze",
        nextTier: nextTier?.name,
        pointsToNextTier: nextTier ? nextTier.minPoints - points : 0,
      };
    } catch (error) {
      console.error("Error getting customer points:", error);
      throw error;
    }
  }

  /**
   * Get loyalty program statistics
   */
  static async getLoyaltyStats(merchantId: string): Promise<LoyaltyStats> {
    try {
      const [totalCustomers, customerPoints, topCustomers] = await Promise.all([
        prisma.customerPoints.count({
          where: { merchantId },
        }),
        prisma.customerPoints.findMany({
          where: { merchantId },
          select: { points: true },
        }),
        prisma.customerPoints.findMany({
          where: { merchantId },
          orderBy: { points: "desc" },
          take: 10,
          select: {
            customerId: true,
            points: true,
            meta: true,
          },
        }),
      ]);

      const totalPointsAwarded = customerPoints.reduce((sum, cp) => sum + cp.points, 0);
      const totalPointsRedeemed = 0; // This would need to be tracked separately

      const loyaltyProgram = await prisma.loyaltyProgram.findUnique({
        where: { merchantId },
      });

      const activeRewards = (loyaltyProgram?.rewards as any)?.rewards?.length || 0;

      return {
        totalCustomers,
        totalPointsAwarded,
        totalPointsRedeemed,
        activeRewards,
        topCustomers: topCustomers.map(cp => ({
          customerId: cp.customerId,
          points: cp.points,
          tier: (cp.meta as any)?.tier || "Bronze",
        })),
      };
    } catch (error) {
      console.error("Error getting loyalty stats:", error);
      throw error;
    }
  }

  /**
   * Update loyalty program settings
   */
  static async updateLoyaltyProgram(
    merchantId: string,
    updates: {
      name?: string;
      description?: string;
      pointsPerScan?: number;
      rewards?: any;
      active?: boolean;
    }
  ): Promise<LoyaltyProgram> {
    try {
      return await prisma.loyaltyProgram.update({
        where: { merchantId },
        data: updates,
      });
    } catch (error) {
      console.error("Error updating loyalty program:", error);
      throw error;
    }
  }

  /**
   * Create discount code for reward redemption
   */
  static async createDiscountCode(
    merchantId: string,
    customerId: string,
    discountType: "percentage" | "fixed_amount",
    value: number,
    reward: string
  ): Promise<string> {
    try {
      // This would integrate with Shopify's Discount API
      // For now, we'll generate a simple code
      const code = `LOYALTY-${customerId.slice(-6)}-${Date.now().toString(36).toUpperCase()}`;
      
      // In a real implementation, you would:
      // 1. Call Shopify Admin API to create a discount code
      // 2. Store the discount code ID in the database
      // 3. Return the actual discount code
      
      return code;
    } catch (error) {
      console.error("Error creating discount code:", error);
      throw error;
    }
  }
}


