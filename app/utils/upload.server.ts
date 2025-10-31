import sharp from "sharp";

export interface UploadResult {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
  format?: string;
  size?: number;
  base64?: string;
}

export class UploadService {
  /**
   * Process and store image as Base64 in database
   */
  static async uploadImage(
    file: Buffer,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      maxSizeKB?: number;
    } = {}
  ): Promise<UploadResult> {
    try {
      // Default options
      const maxWidth = options.maxWidth || 500;
      const maxHeight = options.maxHeight || 500;
      const quality = options.quality || 85;
      const maxSizeKB = options.maxSizeKB || 200; // 200KB max

      // Process image with Sharp
      let processedBuffer = file;
      let metadata;

      try {
        // Get original metadata
        metadata = await sharp(file).metadata();
        
        // Resize if needed
        if (metadata.width && metadata.height) {
          const sharpInstance = sharp(file);
          
          // Resize to fit within max dimensions
          sharpInstance.resize(maxWidth, maxHeight, {
            fit: "inside",
            withoutEnlargement: true,
          });
          
          // Optimize quality
          sharpInstance.jpeg({ 
            quality,
            progressive: true,
            mozjpeg: true
          });
          
          processedBuffer = await sharpInstance.toBuffer();
        }
      } catch (error) {
        console.warn("Error processing image with Sharp:", error);
        // Fallback to original buffer if Sharp fails
        processedBuffer = file;
        metadata = { width: 0, height: 0, format: 'unknown' };
      }

      // Check file size
      const sizeKB = processedBuffer.length / 1024;
      if (sizeKB > maxSizeKB) {
        throw new Error(`Image too large: ${sizeKB.toFixed(1)}KB (max: ${maxSizeKB}KB)`);
      }

      // Convert to Base64
      const base64 = `data:image/jpeg;base64,${processedBuffer.toString('base64')}`;
      
      // Generate a simple ID for reference
      const publicId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        url: base64, // Use Base64 as URL for direct display
        publicId,
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'jpeg',
        size: processedBuffer.length,
        base64,
      };
    } catch (error) {
      console.error("Error processing image:", error);
      throw error;
    }
  }

  /**
   * Validate image file
   */
  static validateImage(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'File must be an image' };
    }

    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }

    // Check supported formats
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!supportedTypes.includes(file.type)) {
      return { valid: false, error: 'Unsupported image format. Use JPEG, PNG, or WebP' };
    }

    return { valid: true };
  }

  /**
   * Get image info from Base64
   */
  static getImageInfo(base64: string): { width: number; height: number; size: number } {
    try {
      // Remove data URL prefix
      const base64Data = base64.replace(/^data:image\/[a-z]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      return {
        width: 0, // Would need to decode to get actual dimensions
        height: 0,
        size: buffer.length,
      };
    } catch (error) {
      return { width: 0, height: 0, size: 0 };
    }
  }

  /**
   * Compress Base64 image further if needed
   */
  static async compressBase64Image(
    base64: string,
    maxSizeKB: number = 100
  ): Promise<string> {
    try {
      // Remove data URL prefix
      const base64Data = base64.replace(/^data:image\/[a-z]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      const sizeKB = buffer.length / 1024;
      if (sizeKB <= maxSizeKB) {
        return base64; // Already small enough
      }

      // Compress with Sharp
      const compressedBuffer = await sharp(buffer)
        .jpeg({ 
          quality: 70,
          progressive: true,
          mozjpeg: true
        })
        .toBuffer();

      return `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;
    } catch (error) {
      console.error("Error compressing image:", error);
      return base64; // Return original if compression fails
    }
  }
}
