import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/db.server";
import { RateLimitService } from "~/utils/rateLimit.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // Verify this is a cron request from Vercel
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("🧹 Starting cleanup cron job...");

    // Clean up old rate limit records (older than 24 hours)
    await RateLimitService.cleanupOldRecords();

    // Clean up old analytics events (older than 1 year)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const deletedAnalytics = await prisma.analyticsEvent.deleteMany({
      where: {
        createdAt: {
          lt: oneYearAgo,
        },
      },
    });

    // Clean up old webhook logs (older than 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const deletedWebhooks = await prisma.webhookLog.deleteMany({
      where: {
        receivedAt: {
          lt: sixMonthsAgo,
        },
      },
    });

    // Clean up expired QR codes
    const deletedExpiredQR = await prisma.qRCode.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
        active: false,
      },
    });

    console.log("✅ Cleanup completed:", {
      analyticsEvents: deletedAnalytics.count,
      webhookLogs: deletedWebhooks.count,
      expiredQRCodes: deletedExpiredQR.count,
    });

    return json({
      success: true,
      cleaned: {
        analyticsEvents: deletedAnalytics.count,
        webhookLogs: deletedWebhooks.count,
        expiredQRCodes: deletedExpiredQR.count,
      },
    });

  } catch (error) {
    console.error("❌ Cleanup cron job failed:", error);
    return json(
      { 
        error: "Cleanup failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}


