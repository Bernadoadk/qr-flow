import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockApi } from '../utils/mockApi';

// Types
export interface QRCode {
  id: string;
  name: string;
  type: string;
  url: string;
  scans: number;
  status: 'active' | 'inactive' | 'expired';
  createdAt: string;
  lastScanned?: string;
  campaignId?: string;
  customization: {
    foregroundColor: string;
    backgroundColor: string;
    logo?: string;
    style: string;
  };
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'completed' | 'draft';
  startDate: string;
  endDate: string;
  createdAt: string;
  qrCodes: string[];
  metrics: {
    totalScans: number;
    conversionRate: number;
    revenue: number;
  };
  budget: number;
  spent: number;
}

export interface Analytics {
  dailyScans: Array<{ date: string; scans: number }>;
  weeklyScans: Array<{ week: string; scans: number }>;
  monthlyScans: Array<{ month: string; scans: number }>;
  topQRCodes: Array<{ id: string; name: string; scans: number; conversionRate: number }>;
  geographicData: Array<{ country: string; scans: number; percentage: number }>;
  deviceTypes: Array<{ type: string; scans: number; percentage: number }>;
  hourlyDistribution: Array<{ hour: string; scans: number }>;
  summary: {
    totalScans: number;
    todayScans: number;
    conversionRate: number;
    averageScansPerDay: number;
    growthRate: number;
  };
}

export interface LoyaltyData {
  loyaltyProgram: {
    id: string;
    name: string;
    description: string;
    status: string;
    createdAt: string;
    settings: {
      pointsPerScan: number;
      pointsPerEuro: number;
      minimumRedemption: number;
      pointsExpirationDays: number;
    };
  };
  rewards: Array<{
    id: string;
    name: string;
    description: string;
    type: string;
    pointsRequired: number;
    value: number;
    status: string;
    usageLimit?: number;
    usedCount: number;
  }>;
  customerStats: Array<{
    customerId: string;
    email: string;
    totalPoints: number;
    availablePoints: number;
    totalScans: number;
    totalOrders: number;
    lastActivity: string;
    tier: string;
  }>;
  tiers: Array<{
    name: string;
    displayName: string;
    minPoints: number;
    maxPoints: number;
    benefits: string[];
  }>;
  summary: {
    totalCustomers: number;
    activeCustomers: number;
    totalPointsDistributed: number;
    totalPointsRedeemed: number;
    averagePointsPerCustomer: number;
    topTier: string;
  };
}

export interface Settings {
  theme: 'light' | 'dark';
  branding: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
  };
  plan: 'free' | 'pro' | 'enterprise';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

// Store interface
interface QRFlowStore {
  // State
  qrCodes: QRCode[];
  campaigns: Campaign[];
  analytics: Analytics | null;
  loyaltyData: LoyaltyData | null;
  settings: Settings;
  loading: boolean;
  error: string | null;

  // Actions
  fetchQRCodes: () => Promise<void>;
  createQRCode: (qrData: Partial<QRCode>) => Promise<void>;
  updateQRCode: (id: string, updates: Partial<QRCode>) => Promise<void>;
  deleteQRCode: (id: string) => Promise<void>;
  
  fetchCampaigns: () => Promise<void>;
  createCampaign: (campaignData: Partial<Campaign>) => Promise<void>;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
  
  fetchAnalytics: () => Promise<void>;
  fetchLoyaltyData: () => Promise<void>;
  updateLoyaltySettings: (settings: any) => Promise<void>;
  
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Theme
  toggleTheme: () => void;
}

// Store implementation
export const useStore = create<QRFlowStore>()(
  persist(
    (set, get) => ({
      // Initial state
      qrCodes: [],
      campaigns: [],
      analytics: null,
      loyaltyData: null,
      settings: {
        theme: 'light',
        branding: {
          primaryColor: '#6366f1',
          secondaryColor: '#8b5cf6',
        },
        plan: 'free',
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
      },
      loading: false,
      error: null,

      // QR Codes actions
      fetchQRCodes: async () => {
        set({ loading: true, error: null });
        try {
          const response = await mockApi.getQRCodes();
          if (response.success) {
            set({ qrCodes: response.data, loading: false });
          } else {
            set({ error: response.message || 'Erreur lors du chargement des QR codes', loading: false });
          }
        } catch (error) {
          set({ error: 'Erreur lors du chargement des QR codes', loading: false });
        }
      },

      createQRCode: async (qrData) => {
        set({ loading: true, error: null });
        try {
          const response = await mockApi.createQRCode(qrData);
          if (response.success) {
            const newQRCode = response.data;
            set(state => ({
              qrCodes: [...state.qrCodes, newQRCode],
              loading: false,
            }));
          } else {
            set({ error: response.message || 'Erreur lors de la création du QR code', loading: false });
          }
        } catch (error) {
          set({ error: 'Erreur lors de la création du QR code', loading: false });
        }
      },

      updateQRCode: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const response = await mockApi.updateQRCode(id, updates);
          if (response.success) {
            set(state => ({
              qrCodes: state.qrCodes.map(qr => qr.id === id ? { ...qr, ...updates } : qr),
              loading: false,
            }));
          } else {
            set({ error: response.message || 'Erreur lors de la mise à jour du QR code', loading: false });
          }
        } catch (error) {
          set({ error: 'Erreur lors de la mise à jour du QR code', loading: false });
        }
      },

      deleteQRCode: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await mockApi.deleteQRCode(id);
          if (response.success) {
            set(state => ({
              qrCodes: state.qrCodes.filter(qr => qr.id !== id),
              loading: false,
            }));
          } else {
            set({ error: response.message || 'Erreur lors de la suppression du QR code', loading: false });
          }
        } catch (error) {
          set({ error: 'Erreur lors de la suppression du QR code', loading: false });
        }
      },

      // Campaigns actions
      fetchCampaigns: async () => {
        set({ loading: true, error: null });
        try {
          const response = await mockApi.getCampaigns();
          if (response.success) {
            set({ campaigns: response.data, loading: false });
          } else {
            set({ error: response.message || 'Erreur lors du chargement des campagnes', loading: false });
          }
        } catch (error) {
          set({ error: 'Erreur lors du chargement des campagnes', loading: false });
        }
      },

      createCampaign: async (campaignData) => {
        set({ loading: true, error: null });
        try {
          const response = await mockApi.createCampaign(campaignData);
          if (response.success) {
            const newCampaign = response.data;
            set(state => ({
              campaigns: [...state.campaigns, newCampaign],
              loading: false,
            }));
          } else {
            set({ error: response.message || 'Erreur lors de la création de la campagne', loading: false });
          }
        } catch (error) {
          set({ error: 'Erreur lors de la création de la campagne', loading: false });
        }
      },

      updateCampaign: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const response = await mockApi.updateCampaign(id, updates);
          if (response.success) {
            set(state => ({
              campaigns: state.campaigns.map(camp => camp.id === id ? { ...camp, ...updates } : camp),
              loading: false,
            }));
          } else {
            set({ error: response.message || 'Erreur lors de la mise à jour de la campagne', loading: false });
          }
        } catch (error) {
          set({ error: 'Erreur lors de la mise à jour de la campagne', loading: false });
        }
      },

      // Analytics actions
      fetchAnalytics: async () => {
        set({ loading: true, error: null });
        try {
          const response = await mockApi.getAnalytics();
          if (response.success) {
            set({ analytics: response.data, loading: false });
          } else {
            set({ error: response.message || 'Erreur lors du chargement des analytics', loading: false });
          }
        } catch (error) {
          set({ error: 'Erreur lors du chargement des analytics', loading: false });
        }
      },

      // Loyalty actions
      fetchLoyaltyData: async () => {
        set({ loading: true, error: null });
        try {
          const response = await mockApi.getLoyaltyData();
          if (response.success) {
            set({ loyaltyData: response.data, loading: false });
          } else {
            set({ error: response.message || 'Erreur lors du chargement des données de fidélité', loading: false });
          }
        } catch (error) {
          set({ error: 'Erreur lors du chargement des données de fidélité', loading: false });
        }
      },

      updateLoyaltySettings: async (settings) => {
        set({ loading: true, error: null });
        try {
          const response = await mockApi.updateLoyaltySettings(settings);
          if (response.success) {
            set(state => ({
              loyaltyData: state.loyaltyData ? {
                ...state.loyaltyData,
                loyaltyProgram: {
                  ...state.loyaltyData.loyaltyProgram,
                  settings: { ...state.loyaltyData.loyaltyProgram.settings, ...settings }
                }
              } : null,
              loading: false,
            }));
          } else {
            set({ error: response.message || 'Erreur lors de la mise à jour des paramètres', loading: false });
          }
        } catch (error) {
          set({ error: 'Erreur lors de la mise à jour des paramètres', loading: false });
        }
      },

      // Settings actions
      fetchSettings: async () => {
        set({ loading: true, error: null });
        try {
          const response = await mockApi.getSettings();
          if (response.success) {
            set({ settings: response.data, loading: false });
          } else {
            set({ error: response.message || 'Erreur lors du chargement des paramètres', loading: false });
          }
        } catch (error) {
          set({ error: 'Erreur lors du chargement des paramètres', loading: false });
        }
      },

      updateSettings: async (settings) => {
        set({ loading: true, error: null });
        try {
          const response = await mockApi.updateSettings(settings);
          if (response.success) {
            set({ settings: response.data, loading: false });
          } else {
            set({ error: response.message || 'Erreur lors de la mise à jour des paramètres', loading: false });
          }
        } catch (error) {
          set({ error: 'Erreur lors de la mise à jour des paramètres', loading: false });
        }
      },

      // Utility actions
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Theme actions
      toggleTheme: () => {
        set(state => ({
          settings: {
            ...state.settings,
            theme: state.settings.theme === 'light' ? 'dark' : 'light',
          },
        }));
      },
    }),
    {
      name: 'qrflow-store',
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
);
