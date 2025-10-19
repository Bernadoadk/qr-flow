import { redirect } from "@remix-run/node";
import { getMerchantById, getMerchantSession, type MerchantSession } from "./merchant.server";
import type { Merchant } from "@prisma/client";

export interface AuthenticatedRequest {
  merchant: Merchant;
  session: MerchantSession;
}

/**
 * Require merchant authentication for protected routes
 */
export async function requireMerchantSession(
  request: Request,
  redirectTo: string = "/auth/login"
): Promise<AuthenticatedRequest> {
  // This would typically get the session from Shopify's session storage
  // For now, we'll implement a basic version that can be enhanced
  
  const url = new URL(request.url);
  const merchantId = url.searchParams.get("merchantId");
  
  if (!merchantId) {
    throw redirect(redirectTo);
  }

  const merchant = await getMerchantById(merchantId);
  
  if (!merchant) {
    throw redirect(redirectTo);
  }

  const session = getMerchantSession(merchant);
  
  return {
    merchant,
    session,
  };
}

/**
 * Get merchant from Shopify session (to be used with Shopify's authenticate function)
 */
export async function getMerchantFromShopifySession(
  shopifySession: any
): Promise<AuthenticatedRequest | null> {
  try {
    if (!shopifySession?.shop) {
      return null;
    }

    const merchant = await getMerchantById(shopifySession.shop);
    
    if (!merchant) {
      return null;
    }

    const session = getMerchantSession(merchant);
    
    return {
      merchant,
      session,
    };
  } catch (error) {
    console.error("Error getting merchant from Shopify session:", error);
    return null;
  }
}

/**
 * Check if merchant has required plan
 */
export function hasRequiredPlan(
  merchant: Merchant,
  requiredPlan: "FREE" | "BASIC" | "PRO" | "ENTERPRISE"
): boolean {
  const planHierarchy = {
    FREE: 0,
    BASIC: 1,
    PRO: 2,
    ENTERPRISE: 3,
  };

  return planHierarchy[merchant.plan] >= planHierarchy[requiredPlan];
}

/**
 * Get plan limits
 */
export function getPlanLimits(plan: Merchant["plan"]) {
  const limits = {
    FREE: {
      maxQRCodes: 10,
      maxScansPerMonth: 1000,
      maxCampaigns: 3,
      hasAnalytics: true,
      hasCustomBranding: false,
      hasAPI: false,
    },
    BASIC: {
      maxQRCodes: 100,
      maxScansPerMonth: 10000,
      maxCampaigns: 20,
      hasAnalytics: true,
      hasCustomBranding: true,
      hasAPI: false,
    },
    PRO: {
      maxQRCodes: 1000,
      maxScansPerMonth: 100000,
      maxCampaigns: 100,
      hasAnalytics: true,
      hasCustomBranding: true,
      hasAPI: true,
    },
    ENTERPRISE: {
      maxQRCodes: -1, // unlimited
      maxScansPerMonth: -1, // unlimited
      maxCampaigns: -1, // unlimited
      hasAnalytics: true,
      hasCustomBranding: true,
      hasAPI: true,
    },
  };

  return limits[plan];
}




