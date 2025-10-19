import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { prisma } from "~/db.server";

export async function action({ request }: ActionFunctionArgs) {
  // Vérifier que c'est une requête POST avec JSON
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const contentType = request.headers.get("Content-Type");
  if (!contentType || !contentType.includes("application/json")) {
    return json({ error: "Invalid content type" }, { status: 400 });
  }

  try {
    const payload = await request.json();
    const { shop_id, shop_domain } = payload;

    console.log("Received shop/redact webhook:", {
      shop_id,
      shop_domain
    });

    // Trouver la boutique dans notre base de données
    const merchant = await prisma.merchant.findUnique({
      where: { shopifyDomain: shop_domain }
    });

    if (!merchant) {
      console.log(`Merchant not found: ${shop_domain}`);
      return json({ message: "Merchant not found" }, { status: 404 });
    }

    let redactionResults = {
      merchant_deleted: false,
      qr_codes_deleted: 0,
      campaigns_deleted: 0,
      analytics_events_deleted: 0,
      loyalty_programs_deleted: 0,
      customer_points_deleted: 0,
      webhook_logs_deleted: 0,
      rate_limits_deleted: 0,
      errors: [] as string[]
    };

    try {
      // 1. Supprimer tous les QR codes
      const deletedQRCodes = await prisma.qRCode.deleteMany({
        where: { merchantId: merchant.id }
      });
      redactionResults.qr_codes_deleted = deletedQRCodes.count;

      // 2. Supprimer toutes les campagnes
      const deletedCampaigns = await prisma.campaign.deleteMany({
        where: { merchantId: merchant.id }
      });
      redactionResults.campaigns_deleted = deletedCampaigns.count;

      // 3. Supprimer tous les événements analytics
      // Note: AnalyticsEvent n'a pas de champ merchantId direct, on doit passer par QRCode
      const qrCodes = await prisma.qRCode.findMany({
        where: { merchantId: merchant.id },
        select: { id: true }
      });
      
      const qrCodeIds = qrCodes.map(qr => qr.id);
      const deletedAnalyticsEvents = await prisma.analyticsEvent.deleteMany({
        where: { qrId: { in: qrCodeIds } }
      });
      redactionResults.analytics_events_deleted = deletedAnalyticsEvents.count;

      // 4. Supprimer tous les programmes de fidélité
      const deletedLoyaltyPrograms = await prisma.loyaltyProgram.deleteMany({
        where: { merchantId: merchant.id }
      });
      redactionResults.loyalty_programs_deleted = deletedLoyaltyPrograms.count;

      // 5. Supprimer tous les points clients
      const deletedCustomerPoints = await prisma.customerPoints.deleteMany({
        where: { merchantId: merchant.id }
      });
      redactionResults.customer_points_deleted = deletedCustomerPoints.count;

      // 6. Supprimer tous les logs de webhooks
      const deletedWebhookLogs = await prisma.webhookLog.deleteMany({
        where: { merchantId: merchant.id }
      });
      redactionResults.webhook_logs_deleted = deletedWebhookLogs.count;

      // 7. Supprimer tous les rate limits
      const deletedRateLimits = await prisma.rateLimit.deleteMany({
        where: { merchantId: merchant.id }
      });
      redactionResults.rate_limits_deleted = deletedRateLimits.count;

      // 8. Enfin, supprimer le merchant lui-même
      await prisma.merchant.delete({
        where: { id: merchant.id }
      });
      redactionResults.merchant_deleted = true;

      // Log pour audit
      console.log(`Shop redaction completed for ${shop_domain}:`, redactionResults);

      return json({
        message: "Shop redaction processed successfully",
        shop_domain,
        redaction_results: redactionResults
      });

    } catch (error) {
      console.error(`Error during shop redaction for ${shop_domain}:`, error);
      redactionResults.errors.push(`Critical error during shop redaction: ${error}`);
      
      return json({
        message: "Shop redaction completed with errors",
        shop_domain,
        redaction_results: redactionResults
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Error processing shop/redact webhook:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

