import { prisma } from "~/db.server";
import type { Merchant, Plan } from "@prisma/client";

export interface MerchantSession {
  id: string;
  shopifyDomain: string;
  accessToken: string | null;
  plan: Plan;
}

/**
 * Get or create a merchant from Shopify session
 */
export async function getOrCreateMerchant(
  shopifyDomain: string,
  accessToken?: string
): Promise<Merchant> {
  try {
    // Try to find existing merchant
    let merchant = await prisma.merchant.findUnique({
      where: { shopifyDomain },
    });

    if (!merchant) {
      // Create new merchant
      merchant = await prisma.merchant.create({
        data: {
          shopifyDomain,
          accessToken,
          plan: "FREE",
        },
      });
    } else if (accessToken && merchant.accessToken !== accessToken) {
      // Update access token if provided and different
      merchant = await prisma.merchant.update({
        where: { id: merchant.id },
        data: { accessToken },
      });
    }

    return merchant;
  } catch (error) {
    console.error("Error getting/creating merchant:", error);
    throw error;
  }
}

/**
 * Get merchant by ID
 */
export async function getMerchantById(id: string): Promise<Merchant | null> {
  try {
    return await prisma.merchant.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error("Error getting merchant by ID:", error);
    throw error;
  }
}

/**
 * Update merchant settings
 */
export async function updateMerchantSettings(
  merchantId: string,
  settings: Record<string, any>
): Promise<Merchant> {
  try {
    return await prisma.merchant.update({
      where: { id: merchantId },
      data: { settings },
    });
  } catch (error) {
    console.error("Error updating merchant settings:", error);
    throw error;
  }
}

/**
 * Update merchant plan
 */
export async function updateMerchantPlan(
  merchantId: string,
  plan: Plan
): Promise<Merchant> {
  try {
    return await prisma.merchant.update({
      where: { id: merchantId },
      data: { plan },
    });
  } catch (error) {
    console.error("Error updating merchant plan:", error);
    throw error;
  }
}

/**
 * Get merchant session data for authentication
 */
export function getMerchantSession(merchant: Merchant): MerchantSession {
  return {
    id: merchant.id,
    shopifyDomain: merchant.shopifyDomain,
    accessToken: merchant.accessToken,
    plan: merchant.plan,
  };
}