import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "../db.server";
import { LoyaltyService } from "../utils/loyalty.server";
import { AnalyticsService } from "../utils/analytics.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { id } = params;
  const startTime = Date.now();
  
  if (!id) {
    return new Response("QR Code not found", { status: 404 });
  }

  try {
    // Log scan attempt
    console.log(`[SCAN] Attempting to scan QR code: ${id}`);
    
    // Extract QR code ID from the scan URL format
    // Format: /api/scan/product-handle, /api/scan/campaign-name, etc.
    let foundQrCode = null;
    
    // If it's a prefixed ID (like product-handle), we need to find the QR code differently
    if (id.includes('-')) {
      const cleanId = id.replace(/^(product|campaign|video|loyalty|link)-/, '');
      const qrType = id.split('-')[0].toUpperCase();
      
      console.log(`[SCAN] Looking for ${qrType} QR code with ID: ${id}, cleanId: ${cleanId}`);
      
      // First, let's see what QR codes exist for this type
      const existingQRCodes = await prisma.qRCode.findMany({
        where: { type: qrType as any },
        select: { id: true, title: true, destination: true, campaignId: true, active: true }
      });
      console.log(`[SCAN] Existing ${qrType} QR codes:`, existingQRCodes);
      
      // Try multiple search strategies
      const searchStrategies = [
        // Strategy 1: Exact slug match
        { slug: id },
        // Strategy 2: Title contains cleanId
        { title: { contains: cleanId } },
        // Strategy 3: Destination contains cleanId
        { destination: { contains: cleanId } },
        // Strategy 4: Type-specific searches
        ...(qrType === 'LOYALTY' ? [
          { 
            AND: [
              { type: 'LOYALTY' as const },
              { destination: { contains: `/loyalty/${cleanId}` } }
            ]
          }
        ] : []),
        ...(qrType === 'CAMPAIGN' ? [
          { 
            AND: [
              { type: 'CAMPAIGN' as const },
              { campaignId: cleanId }
            ]
          },
          { 
            AND: [
              { type: 'CAMPAIGN' as const },
              { destination: cleanId }
            ]
          }
        ] : [])
      ];
      
      // Try to find QR code with multiple strategies
      for (const strategy of searchStrategies) {
        foundQrCode = await prisma.qRCode.findFirst({
          where: {
            ...strategy,
            active: true,
          },
          include: {
            merchant: true,
            campaign: true,
          },
        });
        
        if (foundQrCode) {
          console.log(`[SCAN] Found QR code with strategy:`, { 
            strategy: Object.keys(strategy)[0], 
            qrCode: { id: foundQrCode.id, title: foundQrCode.title, type: foundQrCode.type, destination: foundQrCode.destination } 
          });
          break;
        }
      }
      
      if (!foundQrCode) {
        console.log(`[SCAN] No QR code found with any strategy, trying fallback search...`);
        
        // Fallback: Try to find any QR code that might match
        foundQrCode = await prisma.qRCode.findFirst({
          where: {
            active: true,
            OR: [
              { title: { contains: cleanId } },
              { destination: { contains: cleanId } },
              { slug: { contains: cleanId } }
            ]
          },
          include: {
            merchant: true,
            campaign: true,
          },
        });
        
        if (foundQrCode) {
          console.log(`[SCAN] Found fallback QR code:`, { id: foundQrCode.id, title: foundQrCode.title, destination: foundQrCode.destination });
        }
      }
      
      if (!foundQrCode) {
        console.log(`[SCAN] No QR code found for ID: ${id}`);
        return new Response("QR Code not found or inactive", { status: 404 });
      }
      
      // Continue with the found QR code
      return handleQRCodeScan(foundQrCode, request);
    }

    // Find QR code by ID or slug (original logic)
    const directQrCode = await prisma.qRCode.findFirst({
      where: {
        OR: [
          { id: id },
          { slug: id },
        ],
        active: true,
      },
      include: {
        merchant: true,
      },
    });

    if (!directQrCode) {
      return new Response("QR Code not found or inactive", { status: 404 });
    }

    return handleQRCodeScan(directQrCode, request);

  } catch (error) {
    console.error("QR scan error:", error);
    return new Response("Internal server error", { status: 500 });
  }
};

/**
 * Handle QR code scan logic
 */
async function handleQRCodeScan(qrCode: any, request: Request) {
  const startTime = Date.now();
  
  try {
    console.log(`[SCAN] Processing QR code: ${qrCode.id} (${qrCode.type})`);
    
    // Check if QR code has expired
    if (qrCode.expiresAt && qrCode.expiresAt < new Date()) {
      console.log(`[SCAN] QR code ${qrCode.id} has expired`);
      return new Response("QR Code has expired", { status: 410 });
    }

    // Get client information
    const userAgent = request.headers.get("user-agent") || "";
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "unknown";
    const referer = request.headers.get("referer") || "";
    
    // Extract country from headers (if using Cloudflare or similar)
    const country = request.headers.get("cf-ipcountry") || 
                   request.headers.get("x-country") || 
                   "unknown";

    console.log(`[SCAN] Client info: IP=${ip}, Country=${country}, Device=${getDeviceType(userAgent)}`);

    // Create analytics event
    await prisma.analyticsEvent.create({
      data: {
        qrId: qrCode.id,
        type: "SCAN",
        meta: {
          ip,
          userAgent,
          referer,
          country,
          device: getDeviceType(userAgent),
          timestamp: new Date().toISOString(),
          scanDuration: Date.now() - startTime,
        },
      },
    });

    // Increment scan count
    await prisma.qRCode.update({
      where: { id: qrCode.id },
      data: {
        scanCount: {
          increment: 1,
        },
      },
    });

    console.log(`[SCAN] Analytics recorded for QR code: ${qrCode.id}`);
  } catch (error) {
    console.error(`[SCAN] Error recording analytics for QR code ${qrCode.id}:`, error);
    // Continue even if analytics fails
  }

  // Handle different QR code types
  let redirectUrl = qrCode.destination;
  console.log(`[SCAN] Processing ${qrCode.type} QR code, destination: ${redirectUrl}`);

  switch (qrCode.type) {
    case "PRODUCT":
      // If it's a product, ensure it's a full Shopify URL
      if (!redirectUrl.startsWith("http")) {
        redirectUrl = `https://${qrCode.merchant.shopifyDomain}/products/${redirectUrl}`;
        console.log(`[SCAN] Built product URL: ${redirectUrl}`);
      }
      break;
      
    case "LOYALTY":
      console.log(`[SCAN] Processing loyalty QR code`);
      
      // Get loyalty program for this merchant
      const loyaltyProgram = await prisma.loyaltyProgram.findUnique({
        where: { merchantId: qrCode.merchantId }
      });

      if (loyaltyProgram && loyaltyProgram.active) {
        console.log(`[SCAN] Loyalty program found: ${loyaltyProgram.name}, awarding ${loyaltyProgram.pointsPerScan} points`);
        
        // Generate a customer ID based on IP and user agent for anonymous users
        const customerId = generateCustomerId(request);
        console.log(`[SCAN] Generated customer ID: ${customerId}`);
        
        // Award points for scanning the QR code
        try {
          await LoyaltyService.awardPoints(
            qrCode.merchantId,
            customerId,
            loyaltyProgram.pointsPerScan,
            "qr_scan"
          );
          console.log(`[SCAN] Successfully awarded ${loyaltyProgram.pointsPerScan} points to customer ${customerId}`);
        } catch (error) {
          console.error(`[SCAN] Error awarding loyalty points:`, error);
          // Continue even if points awarding fails
        }
      } else {
        console.log(`[SCAN] No active loyalty program found for merchant ${qrCode.merchantId}`);
      }

      // For loyalty QR codes, redirect to the loyalty page
      const loyaltyHost = request.headers.get("host") || "localhost:3000";
      const loyaltyProtocol = request.headers.get("x-forwarded-proto") || "http";
      const loyaltyBaseUrl = `${loyaltyProtocol}://${loyaltyHost}`;
      
      const loyaltyParams = new URLSearchParams({
        utm_source: "qr_code",
        utm_medium: "loyalty",
        utm_campaign: qrCode.campaignId || "direct",
        customer_id: generateCustomerId(request), // Pass customer ID to the page
      });
      redirectUrl = `${loyaltyBaseUrl}/loyalty/${qrCode.destination}?${loyaltyParams.toString()}`;
      console.log(`[SCAN] Loyalty redirect URL: ${redirectUrl}`);
      break;
      
    case "CAMPAIGN":
      console.log(`[SCAN] Processing campaign QR code`);
      
      // Get campaign details
      const campaign = await prisma.campaign.findUnique({
        where: { id: qrCode.campaignId || qrCode.destination }
      });
      
      if (!campaign || campaign.status !== 'active') {
        console.log(`[SCAN] Campaign not found or inactive: ${qrCode.campaignId}`);
        return new Response("Campaign not found or inactive", { status: 404 });
      }
      
      // For campaign QR codes, redirect to the campaign page
      const campaignHost = request.headers.get("host") || "localhost:3000";
      const campaignProtocol = request.headers.get("x-forwarded-proto") || "http";
      const campaignBaseUrl = `${campaignProtocol}://${campaignHost}`;
      
      const campaignParams = new URLSearchParams({
        utm_source: "qr_code",
        utm_medium: "campaign",
        utm_campaign: campaign.id,
        customer_id: generateCustomerId(request),
      });
      redirectUrl = `${campaignBaseUrl}/campaign/${campaign.id}?${campaignParams.toString()}`;
      console.log(`[SCAN] Campaign redirect URL: ${redirectUrl}`);
      break;
      
    case "VIDEO":
      console.log(`[SCAN] Processing video QR code`);
      // For video QR codes, redirect to the video URL
      if (!redirectUrl.startsWith("http")) {
        redirectUrl = `https://youtube.com/watch?v=${redirectUrl}`;
      }
      console.log(`[SCAN] Video redirect URL: ${redirectUrl}`);
      break;
      
    case "LINK":
      console.log(`[SCAN] Processing link QR code`);
      // For link QR codes, use the destination as-is
      console.log(`[SCAN] Link redirect URL: ${redirectUrl}`);
      break;
      
    default:
      console.log(`[SCAN] Unknown QR code type: ${qrCode.type}, using destination as-is`);
      break;
  }

  // Add general tracking parameters
  const trackingParams = new URLSearchParams({
    utm_source: "qr_code",
    utm_medium: "qr_scan",
    qr_id: qrCode.id,
  });

  // Append tracking parameters to URL
  const url = new URL(redirectUrl);
  trackingParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const finalUrl = url.toString();
  console.log(`[SCAN] Final redirect URL: ${finalUrl}`);
  console.log(`[SCAN] Total scan processing time: ${Date.now() - startTime}ms`);

  // Redirect to the destination
  return new Response(null, {
    status: 302,
    headers: {
      Location: finalUrl,
      'X-QR-Scan-Time': `${Date.now() - startTime}ms`,
      'X-QR-Code-ID': qrCode.id,
      'X-QR-Code-Type': qrCode.type,
    },
  });
}

/**
 * Generate a customer ID for anonymous users
 */
function generateCustomerId(request: Request): string {
  const ip = request.headers.get("x-forwarded-for") || 
             request.headers.get("x-real-ip") || 
             "unknown";
  const userAgent = request.headers.get("user-agent") || "";
  
  // Create a hash-like ID based on IP and user agent
  const combined = `${ip}_${userAgent}`;
  return `anon_${Buffer.from(combined).toString('base64').substring(0, 16)}`;
}

/**
 * Detect device type from user agent
 */
function getDeviceType(userAgent: string): string {
  if (!userAgent) return "unknown";
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
    return "mobile";
  }
  
  if (ua.includes("tablet") || ua.includes("ipad")) {
    return "tablet";
  }
  
  if (ua.includes("desktop") || ua.includes("windows") || ua.includes("macintosh") || ua.includes("linux")) {
    return "desktop";
  }
  
  return "unknown";
}


/**
 * Handle POST requests for additional analytics
 */
export const action = async ({ request, params }: LoaderFunctionArgs) => {
  const { id } = params;
  
  if (!id) {
    return json({ error: "QR Code not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { type = "CLICK", meta = {} } = body;

    // Find QR code
    const qrCode = await prisma.qRCode.findFirst({
      where: {
        OR: [
          { id: id },
          { slug: id },
        ],
        active: true,
      },
    });

    if (!qrCode) {
      return json({ error: "QR Code not found" }, { status: 404 });
    }

    // Create analytics event
    await prisma.analyticsEvent.create({
      data: {
        qrId: qrCode.id,
        type: type as any,
        meta: {
          ...meta,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return json({ success: true });

  } catch (error) {
    console.error("QR analytics error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};
