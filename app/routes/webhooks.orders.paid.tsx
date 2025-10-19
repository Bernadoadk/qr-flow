import { json, type ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/db.server";
import { verifyWebhookSignature } from "~/utils/security.server";
import { getOrCreateMerchant } from "~/utils/merchant.server";
import { AnalyticsService } from "~/utils/analytics.server";

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

    const orderData = JSON.parse(body);
    const shopDomain = request.headers.get("X-Shopify-Shop-Domain");

    if (!shopDomain) {
      return json({ error: "Missing shop domain" }, { status: 400 });
    }

    // Get or create merchant
    const merchant = await getOrCreateMerchant(shopDomain);

    // Log webhook
    await prisma.webhookLog.create({
      data: {
        merchantId: merchant.id,
        topic: "orders/paid",
        payload: orderData,
      },
    });

    // Process order for loyalty points if applicable
    if (orderData.customer && orderData.customer.id) {
      await processOrderForLoyalty(merchant.id, orderData);
    }

    // Process order for conversion tracking
    await processOrderForConversionTracking(merchant.id, orderData);

    return json({ success: true });

  } catch (error) {
    console.error("Error processing orders/paid webhook:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Process order for loyalty points
 */
async function processOrderForLoyalty(merchantId: string, orderData: any) {
  try {
    // Check if merchant has loyalty program
    const loyaltyProgram = await prisma.loyaltyProgram.findUnique({
      where: { merchantId },
    });

    if (!loyaltyProgram || !loyaltyProgram.active) {
      return;
    }

    const customerId = orderData.customer.id.toString();
    const orderTotal = parseFloat(orderData.total_price);

    // Calculate points based on order total (example: 1 point per dollar)
    const pointsToAward = Math.floor(orderTotal * loyaltyProgram.pointsPerScan);

    if (pointsToAward > 0) {
      // Update or create customer points
      await prisma.customerPoints.upsert({
        where: {
          id: `${merchantId}_${customerId}`,
        },
        update: {
          points: {
            increment: pointsToAward,
          },
          meta: {
            lastOrderId: orderData.id,
            lastOrderDate: new Date().toISOString(),
          },
        },
        create: {
          id: `${merchantId}_${customerId}`,
          merchantId,
          customerId,
          points: pointsToAward,
          meta: {
            lastOrderId: orderData.id,
            lastOrderDate: new Date().toISOString(),
          },
        },
      });
    }
  } catch (error) {
    console.error("Error processing loyalty points:", error);
  }
}

/**
 * Process order for conversion tracking
 */
async function processOrderForConversionTracking(merchantId: string, orderData: any) {
  try {
    // Extract UTM parameters from order attributes or note
    const orderAttributes = orderData.note_attributes || [];
    const utmSource = orderAttributes.find((attr: any) => attr.name === 'utm_source')?.value;
    const utmMedium = orderAttributes.find((attr: any) => attr.name === 'utm_medium')?.value;
    const utmCampaign = orderAttributes.find((attr: any) => attr.name === 'utm_campaign')?.value;
    const qrId = orderAttributes.find((attr: any) => attr.name === 'qr_id')?.value;

    // If we have a QR ID, record the conversion
    if (qrId) {
      const products = orderData.line_items?.map((item: any) => ({
        id: item.product_id?.toString() || '',
        title: item.title || '',
        quantity: item.quantity || 1,
        price: parseFloat(item.price) || 0,
      })) || [];

      await AnalyticsService.recordPurchase(qrId, {
        orderId: orderData.id?.toString() || '',
        orderValue: parseFloat(orderData.total_price) || 0,
        customerId: orderData.customer?.id?.toString(),
        customerEmail: orderData.customer?.email,
        products,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
      });

      console.log(`Conversion recorded for QR code ${qrId}, order ${orderData.id}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error processing order for conversion tracking:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}