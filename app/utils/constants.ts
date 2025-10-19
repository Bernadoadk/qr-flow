// Application constants
export const APP_NAME = 'QR Connect';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Application Shopify pour créer et gérer des QR codes interactifs';

// QR Code types
export const QR_TYPES = {
  LINK: 'LINK',
  PRODUCT: 'PRODUCT',
  VIDEO: 'VIDEO',
  LOYALTY: 'LOYALTY',
  CAMPAIGN: 'CAMPAIGN',
} as const;

export const QR_TYPE_LABELS = {
  LINK: 'Lien',
  PRODUCT: 'Produit',
  VIDEO: 'Vidéo',
  LOYALTY: 'Fidélité',
  CAMPAIGN: 'Campagne',
} as const;

// Event types
export const EVENT_TYPES = {
  SCAN: 'SCAN',
  REDIRECT: 'REDIRECT',
  PURCHASE: 'PURCHASE',
  CLICK: 'CLICK',
} as const;

export const EVENT_TYPE_LABELS = {
  SCAN: 'Scan',
  REDIRECT: 'Redirection',
  PURCHASE: 'Achat',
  CLICK: 'Clic',
} as const;

// Plan types
export const PLANS = {
  FREE: 'FREE',
  BASIC: 'BASIC',
  PRO: 'PRO',
  ENTERPRISE: 'ENTERPRISE',
} as const;

export const PLAN_LABELS = {
  FREE: 'Gratuit',
  BASIC: 'Basique',
  PRO: 'Pro',
  ENTERPRISE: 'Entreprise',
} as const;

// Campaign statuses
export const CAMPAIGN_STATUSES = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  ENDED: 'ended',
  DRAFT: 'draft',
} as const;

export const CAMPAIGN_STATUS_LABELS = {
  active: 'Actif',
  paused: 'En pause',
  ended: 'Terminé',
  draft: 'Brouillon',
} as const;

// Default colors
export const DEFAULT_COLORS = [
  '#007b5c', // Shopify green
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#84cc16', // Lime
] as const;

// QR Code styling options
export const QR_STYLE_OPTIONS = {
  dots: [
    { value: 'rounded', label: 'Arrondi' },
    { value: 'square', label: 'Carré' },
    { value: 'dots', label: 'Points' },
    { value: 'classy', label: 'Élégant' },
    { value: 'classy-rounded', label: 'Élégant arrondi' },
    { value: 'extra-rounded', label: 'Très arrondi' },
  ],
  shapes: [
    { value: 'square', label: 'Carré' },
    { value: 'dot', label: 'Point' },
    { value: 'extra-rounded', label: 'Très arrondi' },
  ],
} as const;

// Analytics periods
export const ANALYTICS_PERIODS = {
  '7d': { label: '7 derniers jours', days: 7 },
  '30d': { label: '30 derniers jours', days: 30 },
  '90d': { label: '90 derniers jours', days: 90 },
  '1y': { label: '1 an', days: 365 },
} as const;

// Device types
export const DEVICE_TYPES = {
  MOBILE: 'mobile',
  DESKTOP: 'desktop',
  TABLET: 'tablet',
} as const;

export const DEVICE_TYPE_LABELS = {
  mobile: 'Mobile',
  desktop: 'Desktop',
  tablet: 'Tablette',
} as const;

// File upload limits
export const FILE_LIMITS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
} as const;

// Rate limiting
export const RATE_LIMITS = {
  QR_SCAN: {
    window: 60 * 1000, // 1 minute
    max: 100, // 100 scans per minute
  },
  API_CALLS: {
    window: 60 * 1000, // 1 minute
    max: 1000, // 1000 calls per minute
  },
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Validation rules
export const VALIDATION_RULES = {
  QR_TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  QR_DESTINATION: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 2048,
  },
  CAMPAIGN_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  CAMPAIGN_DESCRIPTION: {
    MAX_LENGTH: 500,
  },
} as const;

// Error messages
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'Ce champ est requis',
  INVALID_URL: 'URL invalide',
  INVALID_EMAIL: 'Email invalide',
  INVALID_DATE: 'Date invalide',
  FILE_TOO_LARGE: 'Fichier trop volumineux',
  FILE_TYPE_NOT_ALLOWED: 'Type de fichier non autorisé',
  PLAN_LIMIT_REACHED: 'Limite du plan atteinte',
  QR_CODE_NOT_FOUND: 'QR code non trouvé',
  CAMPAIGN_NOT_FOUND: 'Campagne non trouvée',
  UNAUTHORIZED: 'Non autorisé',
  FORBIDDEN: 'Accès interdit',
  NOT_FOUND: 'Ressource non trouvée',
  INTERNAL_ERROR: 'Erreur interne du serveur',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  QR_CREATED: 'QR code créé avec succès',
  QR_UPDATED: 'QR code mis à jour avec succès',
  QR_DELETED: 'QR code supprimé avec succès',
  CAMPAIGN_CREATED: 'Campagne créée avec succès',
  CAMPAIGN_UPDATED: 'Campagne mise à jour avec succès',
  CAMPAIGN_DELETED: 'Campagne supprimée avec succès',
  SETTINGS_UPDATED: 'Paramètres mis à jour avec succès',
  PLAN_UPGRADED: 'Plan mis à niveau avec succès',
} as const;

// URLs and routes
export const ROUTES = {
  DASHBOARD: '/app',
  QR_MANAGER: '/app/qr-manager',
  CREATE_QR: '/app/create',
  ANALYTICS: '/app/analytics',
  CAMPAIGNS: '/app/campaigns',
  LOYALTY: '/app/loyalty',
  SETTINGS: '/app/settings',
  API_SCAN: '/api/scan',
} as const;

// External URLs
export const EXTERNAL_URLS = {
  SHOPIFY_PARTNER: 'https://partners.shopify.com',
  SHOPIFY_DOCS: 'https://shopify.dev/docs',
  SUPPORT_EMAIL: 'support@qrconnect.com',
  PRIVACY_POLICY: 'https://qrconnect.com/privacy',
  TERMS_OF_SERVICE: 'https://qrconnect.com/terms',
} as const;

// Feature flags
export const FEATURES = {
  LOYALTY_PROGRAM: true,
  CAMPAIGNS: true,
  ANALYTICS: true,
  QR_CUSTOMIZATION: true,
  BULK_OPERATIONS: false,
  API_ACCESS: false,
  WHITE_LABEL: false,
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  THEME: 'qrconnect_theme',
  SIDEBAR_COLLAPSED: 'qrconnect_sidebar_collapsed',
  DASHBOARD_LAYOUT: 'qrconnect_dashboard_layout',
  ANALYTICS_PERIOD: 'qrconnect_analytics_period',
} as const;
