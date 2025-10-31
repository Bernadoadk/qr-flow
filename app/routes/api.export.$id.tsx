import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/db.server";
import { requireMerchantSession } from "~/utils/auth.server";
// Dynamic import to reduce bundle size
async function getSharp() {
  return (await import("sharp")).default;
}
import QRCode from "qrcode";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { id } = params;
  const url = new URL(request.url);
  const format = url.searchParams.get("format") || "png";
  const size = parseInt(url.searchParams.get("size") || "300");

  if (!id) {
    return json({ error: "QR Code ID required" }, { status: 400 });
  }

  try {
    // Require merchant authentication
    const { merchant } = await requireMerchantSession(request);

    // Get QR code
    const qrCode = await prisma.qRCode.findFirst({
      where: {
        id,
        merchantId: merchant.id,
      },
    });

    if (!qrCode) {
      return json({ error: "QR Code not found" }, { status: 404 });
    }

    // Generate QR code data URL
    const qrDataURL = await QRCode.toDataURL(qrCode.destination, {
      width: size,
      margin: 2,
      color: {
        dark: qrCode.color || "#000000",
        light: "#FFFFFF",
      },
    });

    // Convert data URL to buffer
    const base64Data = qrDataURL.replace(/^data:image\/png;base64,/, "");
    const qrBuffer = Buffer.from(base64Data, "base64");

    if (format === "svg") {
      // Generate SVG
      const svgString = await QRCode.toString(qrCode.destination, {
        type: "svg",
        width: size,
        margin: 2,
        color: {
          dark: qrCode.color || "#000000",
          light: "#FFFFFF",
        },
      });

      return new Response(svgString, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Content-Disposition": `attachment; filename="${qrCode.title}-${id}.svg"`,
        },
      });
    } else if (format === "pdf") {
      // Generate PDF using sharp
      const sharp = await getSharp();
      const pdfBuffer = await sharp(qrBuffer)
        .resize(size, size)
        .toFormat("pdf")
        .toBuffer();

      return new Response(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${qrCode.title}-${id}.pdf"`,
        },
      });
    } else {
      // Default to PNG
      const sharp = await getSharp();
      const pngBuffer = await sharp(qrBuffer)
        .resize(size, size)
        .png()
        .toBuffer();

      return new Response(pngBuffer, {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="${qrCode.title}-${id}.png"`,
        },
      });
    }

  } catch (error) {
    console.error("Error exporting QR code:", error);
    return json({ error: "Export failed" }, { status: 500 });
  }
}


