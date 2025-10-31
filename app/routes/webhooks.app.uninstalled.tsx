import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { payload, session, topic, shop } = await authenticate.webhook(request);
    console.log(`Received ${topic} webhook for ${shop}`);

    // Find merchant
    const merchant = await prisma.merchant.findUnique({
      where: { shopifyDomain: shop },
    });

    if (merchant) {
      // Log webhook
      try {
        await prisma.webhookLog.create({
          data: {
            merchantId: merchant.id,
            topic: "app/uninstalled",
            payload: payload as any,
          },
        });
      } catch (logError) {
        // Continue even if logging fails
        console.error("Error logging webhook:", logError);
      }

      // Clean up merchant data (optional - you might want to keep data for reinstall)
      await cleanupMerchantData(merchant.id);
    }

    // Delete session if it exists
    if (session) {
      try {
        await prisma.session.delete({
          where: { id: session.id },
        });
      } catch (sessionError) {
        console.error("Error deleting session:", sessionError);
      }
    }

    return new Response("OK", { status: 200 });

  } catch (error) {
    console.error("Error processing app/uninstalled webhook:", error);
    return new Response("Error processing webhook", { status: 500 });
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