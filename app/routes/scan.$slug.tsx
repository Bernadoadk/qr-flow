import { json, type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prisma } from "~/db.server";
import { AnalyticsService } from "~/utils/analytics.server";
import { RateLimitService } from "~/utils/rateLimit.server";
import { getClientIP } from "~/utils/security.server";
import { UpsellService } from "~/utils/upsell.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { slug } = params;
  
  if (!slug) {
    throw new Response("QR Code not found", { status: 404 });
  }

  try {
    // Find QR code by slug
    const qrCode = await prisma.qRCode.findUnique({
      where: { slug },
      include: {
        merchant: true,
        campaign: true,
      },
    });

    if (!qrCode || !qrCode.active) {
      throw new Response("QR Code not found or inactive", { status: 404 });
    }

    // Check if QR code has expired
    if (qrCode.expiresAt && qrCode.expiresAt < new Date()) {
      throw new Response("QR Code has expired", { status: 410 });
    }

    // Rate limiting
    const rateLimitResult = await RateLimitService.checkRateLimit(qrCode.merchantId);
    
    if (!rateLimitResult.allowed) {
      throw new Response("Rate limit exceeded", { 
        status: 429,
        headers: {
          "Retry-After": Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000).toString(),
        },
      });
    }

    // Get client information
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get("User-Agent") || "";
    const referrer = request.headers.get("Referer") || "";
    const acceptLanguage = request.headers.get("Accept-Language") || "";
    
    // Parse URL parameters for UTM tracking
    const url = new URL(request.url);
    const utmSource = url.searchParams.get("utm_source");
    const utmMedium = url.searchParams.get("utm_medium");
    const utmCampaign = url.searchParams.get("utm_campaign");

    // Record analytics event
    await AnalyticsService.recordScan(qrCode.id, "SCAN", {
      ip: clientIP,
      userAgent,
      referrer,
      language: acceptLanguage,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
    });

    // Check if upsell is configured and enabled
    const upsellConfig = await UpsellService.getUpsellConfig(qrCode.id);
    
    if (upsellConfig?.enabled && upsellConfig.showLandingPage) {
      // Redirect to landing page with upsell
      return redirect(`/landing/${slug}`, 302);
    }

    // Determine redirect destination based on QR type and rules
    let finalDestination = qrCode.destination;

    // Apply dynamic redirect rules if any
    if (qrCode.type === "LINK") {
      // For now, simple redirect to destination
      // In the future, this could include geo-based redirects, A/B testing, etc.
      finalDestination = qrCode.destination;
    } else if (qrCode.type === "PRODUCT") {
      // Build Shopify product URL
      finalDestination = `https://${qrCode.merchant.shopifyDomain}/products/${qrCode.destination}`;
    } else if (qrCode.type === "CAMPAIGN" && qrCode.campaign) {
      // Campaign-specific landing page
      finalDestination = qrCode.destination;
    }

    // Validate destination to prevent open redirects
    if (!isValidRedirectDestination(finalDestination, qrCode.merchant.shopifyDomain)) {
      throw new Response("Invalid redirect destination", { status: 400 });
    }

    // Redirect to final destination
    return redirect(finalDestination, 302);

  } catch (error) {
    console.error("Error in scan route:", error);
    
    if (error instanceof Response) {
      throw error;
    }
    
    throw new Response("Internal Server Error", { status: 500 });
  }
}

/**
 * Validate redirect destination to prevent open redirects
 */
function isValidRedirectDestination(destination: string, shopifyDomain: string): boolean {
  try {
    const url = new URL(destination);
    
    // Allow same domain redirects
    if (url.hostname === shopifyDomain || url.hostname.endsWith(`.${shopifyDomain}`)) {
      return true;
    }
    
    // Allow HTTPS redirects to trusted domains
    if (url.protocol === "https:") {
      // Add your trusted domains here
      const trustedDomains = [
        "shopify.com",
        "youtube.com",
        "vimeo.com",
        "instagram.com",
        "facebook.com",
        "twitter.com",
        "linkedin.com",
        "tiktok.com",
      ];
      
      return trustedDomains.some(domain => 
        url.hostname === domain || url.hostname.endsWith(`.${domain}`)
      );
    }
    
    return false;
  } catch {
    // Invalid URL
    return false;
  }
}

// This component should never render since we always redirect
export default function ScanRoute() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        <p className="text-gray-600">Please wait while we redirect you.</p>
      </div>
    </div>
  );
}

