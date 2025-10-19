import { VALIDATION_RULES, ERROR_MESSAGES } from './constants';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate QR code data
 */
export function validateQRCode(data: any): ValidationResult {
  const errors: string[] = [];

  // Title validation
  if (!data.title || typeof data.title !== 'string') {
    errors.push(ERROR_MESSAGES.REQUIRED_FIELD);
  } else if (data.title.length < VALIDATION_RULES.QR_TITLE.MIN_LENGTH) {
    errors.push(`Le titre doit contenir au moins ${VALIDATION_RULES.QR_TITLE.MIN_LENGTH} caractère`);
  } else if (data.title.length > VALIDATION_RULES.QR_TITLE.MAX_LENGTH) {
    errors.push(`Le titre ne peut pas dépasser ${VALIDATION_RULES.QR_TITLE.MAX_LENGTH} caractères`);
  }

  // Destination validation
  if (!data.destination || typeof data.destination !== 'string') {
    errors.push('La destination est requise');
  } else if (data.destination.length < VALIDATION_RULES.QR_DESTINATION.MIN_LENGTH) {
    errors.push(`La destination doit contenir au moins ${VALIDATION_RULES.QR_DESTINATION.MIN_LENGTH} caractère`);
  } else if (data.destination.length > VALIDATION_RULES.QR_DESTINATION.MAX_LENGTH) {
    errors.push(`La destination ne peut pas dépasser ${VALIDATION_RULES.QR_DESTINATION.MAX_LENGTH} caractères`);
  } else if (!isValidURL(data.destination)) {
    errors.push(ERROR_MESSAGES.INVALID_URL);
  }

  // Type validation
  if (!data.type || !['LINK', 'PRODUCT', 'VIDEO', 'LOYALTY', 'CAMPAIGN'].includes(data.type)) {
    errors.push('Type de QR code invalide');
  }

  // Color validation (optional)
  if (data.color && !isValidColor(data.color)) {
    errors.push('Couleur invalide');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate campaign data
 */
export function validateCampaign(data: any): ValidationResult {
  const errors: string[] = [];

  // Name validation
  if (!data.name || typeof data.name !== 'string') {
    errors.push(ERROR_MESSAGES.REQUIRED_FIELD);
  } else if (data.name.length < VALIDATION_RULES.CAMPAIGN_NAME.MIN_LENGTH) {
    errors.push(`Le nom doit contenir au moins ${VALIDATION_RULES.CAMPAIGN_NAME.MIN_LENGTH} caractère`);
  } else if (data.name.length > VALIDATION_RULES.CAMPAIGN_NAME.MAX_LENGTH) {
    errors.push(`Le nom ne peut pas dépasser ${VALIDATION_RULES.CAMPAIGN_NAME.MAX_LENGTH} caractères`);
  }

  // Description validation (optional)
  if (data.description && data.description.length > VALIDATION_RULES.CAMPAIGN_DESCRIPTION.MAX_LENGTH) {
    errors.push(`La description ne peut pas dépasser ${VALIDATION_RULES.CAMPAIGN_DESCRIPTION.MAX_LENGTH} caractères`);
  }

  // Date validation
  if (!data.startDate || !isValidDate(data.startDate)) {
    errors.push('Date de début invalide');
  }

  if (data.endDate && !isValidDate(data.endDate)) {
    errors.push('Date de fin invalide');
  }

  // Date range validation
  if (data.startDate && data.endDate) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    
    if (endDate <= startDate) {
      errors.push('La date de fin doit être postérieure à la date de début');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate loyalty program data
 */
export function validateLoyaltyProgram(data: any): ValidationResult {
  const errors: string[] = [];

  // Name validation
  if (!data.name || typeof data.name !== 'string') {
    errors.push(ERROR_MESSAGES.REQUIRED_FIELD);
  } else if (data.name.length < VALIDATION_RULES.CAMPAIGN_NAME.MIN_LENGTH) {
    errors.push(`Le nom doit contenir au moins ${VALIDATION_RULES.CAMPAIGN_NAME.MIN_LENGTH} caractère`);
  } else if (data.name.length > VALIDATION_RULES.CAMPAIGN_NAME.MAX_LENGTH) {
    errors.push(`Le nom ne peut pas dépasser ${VALIDATION_RULES.CAMPAIGN_NAME.MAX_LENGTH} caractères`);
  }

  // Points per scan validation
  if (data.pointsPerScan !== undefined) {
    if (typeof data.pointsPerScan !== 'number' || data.pointsPerScan < 1 || data.pointsPerScan > 1000) {
      errors.push('Les points par scan doivent être entre 1 et 1000');
    }
  }

  // Rewards validation (optional)
  if (data.rewards) {
    try {
      const rewards = typeof data.rewards === 'string' ? JSON.parse(data.rewards) : data.rewards;
      
      if (!Array.isArray(rewards.tiers) || !Array.isArray(rewards.rewards)) {
        errors.push('Format de récompenses invalide');
      }
    } catch {
      errors.push('Format de récompenses invalide');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate merchant settings
 */
export function validateMerchantSettings(data: any): ValidationResult {
  const errors: string[] = [];

  // Theme validation
  if (data.theme && !['light', 'dark', 'auto'].includes(data.theme)) {
    errors.push('Thème invalide');
  }

  // Primary color validation
  if (data.primaryColor && !isValidColor(data.primaryColor)) {
    errors.push('Couleur principale invalide');
  }

  // Notifications validation
  if (data.notifications) {
    if (typeof data.notifications.email !== 'boolean') {
      errors.push('Paramètre de notification email invalide');
    }
    if (typeof data.notifications.push !== 'boolean') {
      errors.push('Paramètre de notification push invalide');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: File): ValidationResult {
  const errors: string[] = [];

  // File size validation
  if (file.size > 5 * 1024 * 1024) { // 5MB
    errors.push(ERROR_MESSAGES.FILE_TOO_LARGE);
  }

  // File type validation
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    errors.push(ERROR_MESSAGES.FILE_TYPE_NOT_ALLOWED);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL
 */
export function isValidURL(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Validate color (hex format)
 */
export function isValidColor(color: string): boolean {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
}

/**
 * Validate date string
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

/**
 * Sanitize URL
 */
export function sanitizeURL(url: string): string {
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      throw new Error('Invalid protocol');
    }
    return urlObj.toString();
  } catch {
    throw new Error('Invalid URL');
  }
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page: number, limit: number): ValidationResult {
  const errors: string[] = [];

  if (page < 1) {
    errors.push('Le numéro de page doit être supérieur à 0');
  }

  if (limit < 1 || limit > 100) {
    errors.push('La limite doit être entre 1 et 100');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate search query
 */
export function validateSearchQuery(query: string): ValidationResult {
  const errors: string[] = [];

  if (query && query.length > 100) {
    errors.push('La requête de recherche ne peut pas dépasser 100 caractères');
  }

  // Check for potential SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(--|\/\*|\*\/|;)/,
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(query)) {
      errors.push('Requête de recherche invalide');
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
