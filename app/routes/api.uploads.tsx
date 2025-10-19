import { json, type ActionFunctionArgs } from "@remix-run/node";
import { UploadService } from "~/utils/upload.server";
import { requireMerchantSession } from "~/utils/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // Require merchant authentication
    const { merchant } = await requireMerchantSession(request);

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return json({ error: "File must be an image" }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return json({ error: "File size must be less than 5MB" }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload image
    const uploadResult = await UploadService.uploadImage(buffer, {
      folder: `qrflow/logos/${merchant.id}`,
      publicId: `${Date.now()}-${file.name}`,
      maxWidth: 500,
      maxHeight: 500,
      quality: 85,
    });

    return json({
      success: true,
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      width: uploadResult.width,
      height: uploadResult.height,
    });

  } catch (error) {
    console.error("Error uploading file:", error);
    return json({ error: "Upload failed" }, { status: 500 });
  }
}

// Handle GET requests for presigned URLs (if using S3)
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { merchant } = await requireMerchantSession(request);
    
    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    
    if (action === "presigned-url") {
      const key = `qrflow/logos/${merchant.id}/${Date.now()}.jpg`;
      const presignedUrl = await UploadService.generatePresignedUrl(key);
      
      return json({
        success: true,
        presignedUrl,
        key,
      });
    }
    
    return json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return json({ error: "Failed to generate presigned URL" }, { status: 500 });
  }
}


