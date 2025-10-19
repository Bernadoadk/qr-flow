import { json, type ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/db.server";
import { verifyWebhookSignature } from "~/utils/security.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // Verify webhook signature
    const signature = request.headers.get("X-Shopify-Hmac-Sha256");
    const body = await request.text();
    
    if (!signature || !process.env.SHOPIFY_WEBHOOK_SECRET) {
      return json({ error: "Missing signature or secret" }, { status: 401 });
    }

    if (!verifyWebhookSignature(body, signature, process.env.SHOPIFY_WEBHOOK_SECRET)) {
      return json({ error: "Invalid signature" }, { status: 401 });
    }

    const appData = JSON.parse(body);
    const shopDomain = request.headers.get("X-Shopify-Shop-Domain");

    if (!shopDomain) {
      return json({ error: "Missing shop domain" }, { status: 400 });
    }

    // Find merchant
    const merchant = await prisma.merchant.findUnique({
      where: { shopifyDomain: shopDomain },
    });

    if (!merchant) {
      return json({ error: "Merchant not found" }, { status: 404 });
    }

    // Log webhook
    await prisma.webhookLog.create({
      data: {
        merchantId: merchant.id,
        topic: "app/uninstalled",
        payload: appData,
      },
    });

    // Clean up merchant data (optional - you might want to keep data for reinstall)
    await cleanupMerchantData(merchant.id);

    return json({ success: true });

  } catch (error) {
    console.error("Error processing app/uninstalled webhook:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Clean up merchant data when app is uninstalled
 */
async function cleanupMerchantData(merchantId: string) {
  try {
    // Option 1: Soft delete - mark as inactive
    await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        accessToken: null, // Remove access token
        // You could add an 'active' field to mark as inactive instead of deleting
      },
    });

    // Option 2: Hard delete - completely remove data
    // Uncomment the following lines if you want to completely remove data
    /*
    await prisma.$transaction([
      prisma.analyticsEvent.deleteMany({ where: { qr: { merchantId } } }),
      prisma.customerPoints.deleteMany({ where: { merchantId } }),
      prisma.webhookLog.deleteMany({ where: { merchantId } }),
      prisma.rateLimit.deleteMany({ where: { merchantId } }),
      prisma.qRCode.deleteMany({ where: { merchantId } }),
      prisma.campaign.deleteMany({ where: { merchantId } }),
      prisma.loyaltyProgram.deleteMany({ where: { merchantId } }),
      prisma.merchant.delete({ where: { id: merchantId } }),
    ]);
    */
  } catch (error) {
    console.error("Error cleaning up merchant data:", error);
  }
}