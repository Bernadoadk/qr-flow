import { PrismaClient } from '@prisma/client';

declare global {
  var __db: PrismaClient | undefined;
}

export {};

// Types pour les données de l'application
export interface QRCodeData {
  id: string;
  title: string;
  destination: string;
  type: 'LINK' | 'PRODUCT' | 'VIDEO' | 'LOYALTY' | 'CAMPAIGN';
  color?: string;
  logoUrl?: string;
  scanCount: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  campaignId?: string;
  campaign?: {
    id: string;
    name: string;
  };
}

export interface CampaignData {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'paused' | 'ended';
  createdAt: string;
  updatedAt: string;
  qrCodes?: QRCodeData[];
}

export interface AnalyticsData {
  totalScans: number;
  totalQRCodes: number;
  activeQRCodes: number;
  totalCampaigns: number;
  dailyData: Array<{
    date: string;
    scans: number;
    clicks: number;
    conversions: number;
  }>;
  topQRCodes: QRCodeData[];
  deviceData: Record<string, number>;
  countryData: Record<string, number>;
}

export interface LoyaltyData {
  id: string;
  name: string;
  description?: string;
  pointsPerScan: number;
  active: boolean;
  rewards?: {
    tiers: Array<{
      name: string;
      minPoints: number;
      maxPoints: number;
      discount: number;
    }>;
    rewards: Array<{
      points: number;
      reward: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MerchantData {
  id: string;
  shopifyDomain: string;
  plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  settings?: {
    theme: 'light' | 'dark' | 'auto';
    primaryColor: string;
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
}

// Types pour les formulaires
export interface CreateQRCodeForm {
  title: string;
  destination: string;
  type: 'LINK' | 'PRODUCT' | 'VIDEO' | 'LOYALTY' | 'CAMPAIGN';
  color: string;
  campaignId?: string;
}

export interface CreateCampaignForm {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
}

export interface UpdateMerchantSettingsForm {
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  notifications: {
    email: boolean;
    push: boolean;
  };
}

// Types pour les réponses API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Types pour les analytics
export interface AnalyticsEvent {
  id: string;
  qrId: string;
  type: 'SCAN' | 'REDIRECT' | 'PURCHASE' | 'CLICK';
  meta?: {
    ip?: string;
    userAgent?: string;
    country?: string;
    device?: 'mobile' | 'desktop' | 'tablet';
    timestamp?: string;
    orderId?: string;
    orderNumber?: string;
    totalPrice?: string;
    currency?: string;
    customerEmail?: string;
  };
  createdAt: string;
}

// Types pour les webhooks
export interface WebhookPayload {
  shop_domain: string;
  [key: string]: any;
}

export interface OrderWebhookPayload extends WebhookPayload {
  order: {
    id: string;
    order_number: string;
    total_price: string;
    currency: string;
    customer?: {
      email: string;
    };
    landing_site_ref?: string;
    note_attributes?: Array<{
      name: string;
      value: string;
    }>;
  };
}

// Types pour les plans de pricing
export interface PlanLimits {
  qrCodes: number; // -1 = unlimited
  campaigns: number; // -1 = unlimited
  analyticsDays: number;
  features: string[];
  price: number; // in cents
  currency: string;
}

// Types pour les erreurs
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ValidationError[];
}
