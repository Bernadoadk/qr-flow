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
    const { shop_id, shop_domain, customer, orders_requested, data_request } = payload;

    console.log("Received customers/data_request webhook:", {
      shop_id,
      shop_domain,
      customer_id: customer?.id,
      customer_email: customer?.email,
      orders_requested,
      data_request_id: data_request?.id
    });

    // Trouver la boutique dans notre base de données
    const merchant = await prisma.merchant.findUnique({
      where: { shopifyDomain: shop_domain }
    });

    if (!merchant) {
      console.log(`Merchant not found: ${shop_domain}`);
      return json({ message: "Merchant not found" }, { status: 404 });
    }

    // Collecter toutes les données liées à ce client
    const customerData: any = {
      merchant_info: {
        merchant_id: merchant.id,
        shopify_domain: merchant.shopifyDomain,
        created_at: merchant.createdAt,
        plan: merchant.plan
      },
      customer_info: {
        shopify_customer_id: customer?.id,
        email: customer?.email,
        phone: customer?.phone
      },
      qr_codes: [],
      campaigns: [],
      analytics_events: [],
      loyalty_points: []
    };

    // Récupérer les QR codes liés à ce client
    if (customer?.id) {
      const qrCodes = await prisma.qRCode.findMany({
        where: {
          merchantId: merchant.id,
          // Rechercher par email du client si disponible dans les champs
          ...(customer?.email && {
            OR: [
              { destination: { contains: customer.email } },
              { title: { contains: customer.email } }
            ]
          })
        },
        orderBy: { createdAt: 'desc' }
      });

      customerData.qr_codes = qrCodes.map((qrCode: any) => ({
        id: qrCode.id,
        slug: qrCode.slug,
        title: qrCode.title,
        destination: qrCode.destination,
        type: qrCode.type,
        scanCount: qrCode.scanCount,
        createdAt: qrCode.createdAt,
        expiresAt: qrCode.expiresAt,
        active: qrCode.active
      }));
    }

    // Récupérer les campagnes liées à ce client
    if (customer?.id) {
      const campaigns = await prisma.campaign.findMany({
        where: {
          merchantId: merchant.id,
          // Rechercher par email du client dans les champs de campagne
          ...(customer?.email && {
            OR: [
              { name: { contains: customer.email } },
              { description: { contains: customer.email } }
            ]
          })
        },
        orderBy: { createdAt: 'desc' }
      });

      customerData.campaigns = campaigns.map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        status: campaign.status,
        createdAt: campaign.createdAt,
        startDate: campaign.startDate,
        endDate: campaign.endDate
      }));
    }

    // Récupérer les événements analytics liés à ce client
    if (customer?.id) {
      // D'abord récupérer les QR codes du merchant
      const qrCodes = await prisma.qRCode.findMany({
        where: { merchantId: merchant.id },
        select: { id: true }
      });
      
      const qrCodeIds = qrCodes.map(qr => qr.id);
      
      const analyticsEvents = await prisma.analyticsEvent.findMany({
        where: {
          qrId: { in: qrCodeIds },
          // Rechercher par email du client dans les métadonnées JSON
          ...(customer?.email && {
            meta: {
              path: [],
              string_contains: customer.email
            }
          })
        },
        orderBy: { createdAt: 'desc' },
        take: 100 // Limiter pour éviter des réponses trop volumineuses
      });

      customerData.analytics_events = analyticsEvents.map((event: any) => ({
        id: event.id,
        type: event.type,
        qrId: event.qrId,
        meta: event.meta,
        createdAt: event.createdAt
      }));
    }

    // Récupérer les points de fidélité du client
    if (customer?.id) {
      const loyaltyPoints = await prisma.customerPoints.findMany({
        where: {
          merchantId: merchant.id,
          customerId: customer.email
        },
        orderBy: { createdAt: 'desc' }
      });

      customerData.loyalty_points = loyaltyPoints.map((point: any) => ({
        id: point.id,
        customerId: point.customerId,
        points: point.points,
        meta: point.meta,
        createdAt: point.createdAt
      }));
    }

    // Log pour audit
    console.log(`Customer data request processed for merchant ${shop_domain}, customer ${customer?.id}`);

    // Retourner les données collectées
    return json({
      message: "Customer data request processed successfully",
      data_request_id: data_request?.id,
      customer_id: customer?.id,
      shop_domain,
      data_summary: {
        qr_codes_count: customerData.qr_codes.length,
        campaigns_count: customerData.campaigns.length,
        analytics_events_count: customerData.analytics_events.length,
        loyalty_points_count: customerData.loyalty_points.length
      }
    });

  } catch (error) {
    console.error("Error processing customers/data_request webhook:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

