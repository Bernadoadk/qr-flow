import { json, type ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/db.server";
import { requireMerchantSession } from "~/utils/auth.server";
import QRCode from "qrcode";
// Dynamic import to reduce bundle size
async function getSharp() {
  return (await import("sharp")).default;
}
import JSZip from "jszip";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // Require merchant authentication
    const { merchant } = await requireMerchantSession(request);

    const body = await request.json();
    const { qrCodeIds, format = "png", size = 300, includeMetadata = false } = body;

    if (!qrCodeIds || !Array.isArray(qrCodeIds) || qrCodeIds.length === 0) {
      return json({ error: "QR Code IDs are required" }, { status: 400 });
    }

    if (qrCodeIds.length > 50) {
      return json({ error: "Maximum 50 QR codes can be exported at once" }, { status: 400 });
    }

    // Get QR codes
    const qrCodes = await prisma.qRCode.findMany({
      where: {
        id: { in: qrCodeIds },
        merchantId: merchant.id,
      },
      include: {
        campaign: true,
      },
    });

    if (qrCodes.length === 0) {
      return json({ error: "No QR codes found" }, { status: 404 });
    }

    // Create ZIP file
    const zip = new JSZip();
    const qrFolder = zip.folder("qr-codes");

    // Generate QR codes
    for (const qrCode of qrCodes) {
      try {
        let qrBuffer: Buffer;
        let filename: string;

        if (format === "svg") {
          const svgString = await QRCode.toString(qrCode.destination, {
            type: "svg",
            width: size,
            margin: 2,
            color: {
              dark: qrCode.color || "#000000",
              light: "#FFFFFF",
            },
          });
          qrBuffer = Buffer.from(svgString, 'utf-8');
          filename = `${qrCode.title.replace(/[^a-zA-Z0-9]/g, '_')}-${qrCode.id}.svg`;
        } else if (format === "pdf") {
          const qrDataURL = await QRCode.toDataURL(qrCode.destination, {
            width: size,
            margin: 2,
            color: {
              dark: qrCode.color || "#000000",
              light: "#FFFFFF",
            },
          });
          const base64Data = qrDataURL.replace(/^data:image\/png;base64,/, "");
          const pngBuffer = Buffer.from(base64Data, "base64");
          const sharp = await getSharp();
          qrBuffer = await sharp(pngBuffer)
            .resize(size, size)
            .toFormat("pdf")
            .toBuffer();
          filename = `${qrCode.title.replace(/[^a-zA-Z0-9]/g, '_')}-${qrCode.id}.pdf`;
        } else {
          // Default to PNG
          const qrDataURL = await QRCode.toDataURL(qrCode.destination, {
            width: size,
            margin: 2,
            color: {
              dark: qrCode.color || "#000000",
              light: "#FFFFFF",
            },
          });
          const base64Data = qrDataURL.replace(/^data:image\/png;base64,/, "");
          const pngBuffer = Buffer.from(base64Data, "base64");
          const sharp = await getSharp();
          qrBuffer = await sharp(pngBuffer)
            .resize(size, size)
            .png()
            .toBuffer();
          filename = `${qrCode.title.replace(/[^a-zA-Z0-9]/g, '_')}-${qrCode.id}.png`;
        }

        // Add QR code to ZIP
        qrFolder?.file(filename, qrBuffer);

        // Add metadata if requested
        if (includeMetadata) {
          const metadata = {
            id: qrCode.id,
            title: qrCode.title,
            destination: qrCode.destination,
            type: qrCode.type,
            color: qrCode.color,
            scanCount: qrCode.scanCount,
            active: qrCode.active,
            createdAt: qrCode.createdAt,
            updatedAt: qrCode.updatedAt,
            campaign: qrCode.campaign ? {
              id: qrCode.campaign.id,
              name: qrCode.campaign.name,
            } : null,
          };

          const metadataFilename = `${qrCode.title.replace(/[^a-zA-Z0-9]/g, '_')}-${qrCode.id}.json`;
          qrFolder?.file(metadataFilename, JSON.stringify(metadata, null, 2));
        }
      } catch (error) {
        console.error(`Error generating QR code for ${qrCode.id}:`, error);
        // Continue with other QR codes
      }
    }

    // Add summary file
    const summary = {
      exportDate: new Date().toISOString(),
      merchantId: merchant.id,
      totalQRCodes: qrCodes.length,
      format,
      size,
      qrCodes: qrCodes.map(qr => ({
        id: qr.id,
        title: qr.title,
        type: qr.type,
        scanCount: qr.scanCount,
      })),
    };

    qrFolder?.file("export-summary.json", JSON.stringify(summary, null, 2));

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    // Return ZIP file
    return new Response(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="qr-codes-batch-export-${new Date().toISOString().split('T')[0]}.zip"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error("Error in batch export:", error);
    return json({ error: "Export failed" }, { status: 500 });
  }
};

