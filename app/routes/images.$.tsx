import { LoaderFunctionArgs } from "@remix-run/node";
import { readFile } from "fs/promises";
import { join } from "path";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const imagePath = params["*"];
  
  if (!imagePath) {
    throw new Response("Image not found", { status: 404 });
  }

  try {
    const fullPath = join(process.cwd(), "public", "images", imagePath);
    const imageBuffer = await readFile(fullPath);
    
    // Determine content type based on file extension
    const extension = imagePath.split('.').pop()?.toLowerCase();
    let contentType = 'image/jpeg'; // default
    
    switch (extension) {
      case 'png':
        contentType = 'image/png';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'webp':
        contentType = 'image/webp';
        break;
      case 'svg':
        contentType = 'image/svg+xml';
        break;
      default:
        contentType = 'image/jpeg';
    }

    return new Response(imageBuffer as any, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
      },
    });
  } catch (error) {
    console.error("Error serving image:", error);
    throw new Response("Image not found", { status: 404 });
  }
}
