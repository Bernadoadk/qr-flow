import QRCodeStyling from 'qr-code-styling';

export interface QRCodeOptions {
  width?: number;
  height?: number;
  type?: 'svg' | 'canvas';
  data: string;
  image?: string;
  dotsOptions?: {
    color?: string;
    type?: 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded';
  };
  backgroundOptions?: {
    color?: string;
  };
  imageOptions?: {
    crossOrigin?: string;
    margin?: number;
  };
  cornersSquareOptions?: {
    color?: string;
    type?: 'dot' | 'square' | 'extra-rounded';
  };
  cornersDotOptions?: {
    color?: string;
    type?: 'dot' | 'square';
  };
}

export const defaultQRCodeOptions: QRCodeOptions = {
  width: 300,
  height: 300,
  type: 'svg',
  data: '',
  dotsOptions: {
    color: '#000000',
    type: 'rounded',
  },
  backgroundOptions: {
    color: '#ffffff',
  },
  imageOptions: {
    crossOrigin: 'anonymous',
    margin: 20,
  },
  cornersSquareOptions: {
    color: '#000000',
    type: 'square',
  },
  cornersDotOptions: {
    color: '#000000',
    type: 'dot',
  },
};

export const createQRCode = (options: QRCodeOptions): QRCodeStyling => {
  const qrCode = new QRCodeStyling({
    width: options.width || 300,
    height: options.height || 300,
    type: options.type || 'svg',
    data: options.data,
    image: options.image,
    dotsOptions: {
      color: options.dotsOptions?.color || '#000000',
      type: options.dotsOptions?.type || 'rounded',
    },
    backgroundOptions: {
      color: options.backgroundOptions?.color || '#ffffff',
    },
    imageOptions: {
      crossOrigin: options.imageOptions?.crossOrigin || 'anonymous',
      margin: options.imageOptions?.margin || 20,
    },
    cornersSquareOptions: {
      color: options.cornersSquareOptions?.color || '#000000',
      type: options.cornersSquareOptions?.type || 'square',
    },
    cornersDotOptions: {
      color: options.cornersDotOptions?.color || '#000000',
      type: options.cornersDotOptions?.type || 'dot',
    },
  });

  return qrCode;
};

export const downloadQRCode = (qrCode: QRCodeStyling, filename: string = 'qrcode'): void => {
  qrCode.download({ name: filename, extension: 'png' });
};

export const getQRCodeAsDataURL = async (qrCode: QRCodeStyling): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Créer un QR code temporaire en canvas pour obtenir l'image
      const tempQR = new QRCodeStyling({
        ...qrCode.getRawData(),
        type: 'canvas',
      });

      tempQR.append(canvas);
      
      setTimeout(() => {
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      }, 100);
    } catch (error) {
      reject(error);
    }
  });
};

export const validateQRData = (data: string): boolean => {
  if (!data || data.trim().length === 0) {
    return false;
  }

  // Vérifier si c'est une URL valide
  if (data.startsWith('http://') || data.startsWith('https://')) {
    try {
      new URL(data);
      return true;
    } catch {
      return false;
    }
  }

  // Vérifier si c'est un email valide
  if (data.includes('@')) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(data);
  }

  // Vérifier si c'est un numéro de téléphone
  if (data.startsWith('tel:') || data.startsWith('sms:')) {
    return true;
  }

  // Vérifier si c'est un WiFi
  if (data.startsWith('WIFI:')) {
    return true;
  }

  // Vérifier si c'est un vCard
  if (data.startsWith('BEGIN:VCARD')) {
    return true;
  }

  // Pour les autres types de données, accepter si non vide
  return data.trim().length > 0;
};

export const getQRCodeType = (data: string): string => {
  if (data.startsWith('http://') || data.startsWith('https://')) {
    return 'url';
  }
  if (data.includes('@')) {
    return 'email';
  }
  if (data.startsWith('tel:')) {
    return 'phone';
  }
  if (data.startsWith('sms:')) {
    return 'sms';
  }
  if (data.startsWith('WIFI:')) {
    return 'wifi';
  }
  if (data.startsWith('BEGIN:VCARD')) {
    return 'vcard';
  }
  if (data.startsWith('geo:')) {
    return 'location';
  }
  return 'text';
};

export const generateQRCodePreview = (
  data: string,
  container: HTMLElement,
  options: Partial<QRCodeOptions> = {}
): QRCodeStyling => {
  const qrOptions = { ...defaultQRCodeOptions, ...options, data };
  const qrCode = createQRCode(qrOptions);
  
  // Nettoyer le conteneur
  container.innerHTML = '';
  
  // Ajouter le QR code au conteneur
  qrCode.append(container);
  
  return qrCode;
};

export const getQRCodeSize = (data: string): number => {
  // Calculer la taille recommandée basée sur la longueur des données
  const baseSize = 200;
  const dataLength = data.length;
  
  if (dataLength < 50) return baseSize;
  if (dataLength < 100) return baseSize + 50;
  if (dataLength < 200) return baseSize + 100;
  return baseSize + 150;
};

export const getQRCodeErrorCorrectionLevel = (data: string): 'L' | 'M' | 'Q' | 'H' => {
  const dataLength = data.length;
  
  if (dataLength < 50) return 'L';
  if (dataLength < 100) return 'M';
  if (dataLength < 200) return 'Q';
  return 'H';
};

/**
 * Generate QR code URL for scanning
 */
export const generateQRCodeURL = (baseUrl: string, qrId: string): string => {
  return `${baseUrl}/api/scan/${qrId}`;
};

/**
 * Generate QR code with custom styling based on merchant preferences
 */
export const generateStyledQRCode = (
  data: string,
  merchantSettings: any,
  qrCodeData: any
): QRCodeStyling => {
  const options: QRCodeOptions = {
    data,
    width: 300,
    height: 300,
    type: 'svg',
    dotsOptions: {
      color: qrCodeData.color || merchantSettings?.primaryColor || '#007b5c',
      type: qrCodeData.style?.dots || 'rounded',
    },
    backgroundOptions: {
      color: '#ffffff',
    },
    cornersSquareOptions: {
      color: qrCodeData.color || merchantSettings?.primaryColor || '#007b5c',
      type: qrCodeData.style?.shape || 'square',
    },
    cornersDotOptions: {
      color: qrCodeData.color || merchantSettings?.primaryColor || '#007b5c',
      type: 'square',
    },
  };

  return createQRCode(options);
};

/**
 * Validate QR code data
 */
export const validateQRCodeData = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.title || data.title.trim().length === 0) {
    errors.push('Le titre est requis');
  }

  if (!data.destination || data.destination.trim().length === 0) {
    errors.push('La destination est requise');
  }

  if (data.destination && !isValidURL(data.destination)) {
    errors.push('La destination doit être une URL valide');
  }

  if (data.title && data.title.length > 100) {
    errors.push('Le titre ne peut pas dépasser 100 caractères');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Check if string is a valid URL
 */
const isValidURL = (string: string): boolean => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

/**
 * Generate QR code filename
 */
export const generateQRCodeFilename = (title: string, type: string): string => {
  const sanitizedTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `qr-${sanitizedTitle}-${type.toLowerCase()}`;
};
