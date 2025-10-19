// Mock API pour simuler les appels backend
export interface MockApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Simule un délai de réseau
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Stockage local pour persister les données
const getStorageKey = (key: string) => `qrflow_${key}`;

export const mockApi = {
  // QR Codes
  async getQRCodes(): Promise<MockApiResponse<any[]>> {
    await delay(300);
    const stored = localStorage.getItem(getStorageKey('qrCodes'));
    if (stored) {
      return { data: JSON.parse(stored), success: true };
    }
    
    const response = await fetch('/app/mocks/qrData.json');
    const data = await response.json();
    localStorage.setItem(getStorageKey('qrCodes'), JSON.stringify(data.qrCodes));
    return { data: data.qrCodes, success: true };
  },

  async createQRCode(qrData: any): Promise<MockApiResponse<any>> {
    await delay(500);
    const stored = localStorage.getItem(getStorageKey('qrCodes'));
    const qrCodes = stored ? JSON.parse(stored) : [];
    
    const newQR = {
      ...qrData,
      id: `qr_${Date.now()}`,
      scans: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastScanned: null,
    };
    
    qrCodes.push(newQR);
    localStorage.setItem(getStorageKey('qrCodes'), JSON.stringify(qrCodes));
    
    return { data: newQR, success: true, message: 'QR Code créé avec succès' };
  },

  async updateQRCode(id: string, updates: any): Promise<MockApiResponse<any>> {
    await delay(400);
    const stored = localStorage.getItem(getStorageKey('qrCodes'));
    const qrCodes = stored ? JSON.parse(stored) : [];
    
    const index = qrCodes.findIndex((qr: any) => qr.id === id);
    if (index === -1) {
      return { data: null, success: false, message: 'QR Code non trouvé' };
    }
    
    qrCodes[index] = { ...qrCodes[index], ...updates };
    localStorage.setItem(getStorageKey('qrCodes'), JSON.stringify(qrCodes));
    
    return { data: qrCodes[index], success: true, message: 'QR Code mis à jour' };
  },

  async deleteQRCode(id: string): Promise<MockApiResponse<boolean>> {
    await delay(300);
    const stored = localStorage.getItem(getStorageKey('qrCodes'));
    const qrCodes = stored ? JSON.parse(stored) : [];
    
    const filtered = qrCodes.filter((qr: any) => qr.id !== id);
    localStorage.setItem(getStorageKey('qrCodes'), JSON.stringify(filtered));
    
    return { data: true, success: true, message: 'QR Code supprimé' };
  },

  // Analytics
  async getAnalytics(): Promise<MockApiResponse<any>> {
    await delay(400);
    const response = await fetch('/app/mocks/analytics.json');
    const data = await response.json();
    return { data, success: true };
  },

  // Campaigns
  async getCampaigns(): Promise<MockApiResponse<any[]>> {
    await delay(300);
    const stored = localStorage.getItem(getStorageKey('campaigns'));
    if (stored) {
      return { data: JSON.parse(stored), success: true };
    }
    
    const response = await fetch('/app/mocks/campaigns.json');
    const data = await response.json();
    localStorage.setItem(getStorageKey('campaigns'), JSON.stringify(data.campaigns));
    return { data: data.campaigns, success: true };
  },

  async createCampaign(campaignData: any): Promise<MockApiResponse<any>> {
    await delay(500);
    const stored = localStorage.getItem(getStorageKey('campaigns'));
    const campaigns = stored ? JSON.parse(stored) : [];
    
    const newCampaign = {
      ...campaignData,
      id: `camp_${Date.now()}`,
      createdAt: new Date().toISOString(),
      qrCodes: [],
      metrics: {
        totalScans: 0,
        conversionRate: 0,
        revenue: 0,
      },
      spent: 0,
    };
    
    campaigns.push(newCampaign);
    localStorage.setItem(getStorageKey('campaigns'), JSON.stringify(campaigns));
    
    return { data: newCampaign, success: true, message: 'Campagne créée avec succès' };
  },

  async updateCampaign(id: string, updates: any): Promise<MockApiResponse<any>> {
    await delay(400);
    const stored = localStorage.getItem(getStorageKey('campaigns'));
    const campaigns = stored ? JSON.parse(stored) : [];
    
    const index = campaigns.findIndex((camp: any) => camp.id === id);
    if (index === -1) {
      return { data: null, success: false, message: 'Campagne non trouvée' };
    }
    
    campaigns[index] = { ...campaigns[index], ...updates };
    localStorage.setItem(getStorageKey('campaigns'), JSON.stringify(campaigns));
    
    return { data: campaigns[index], success: true, message: 'Campagne mise à jour' };
  },

  // Loyalty
  async getLoyaltyData(): Promise<MockApiResponse<any>> {
    await delay(300);
    const response = await fetch('/app/mocks/loyalty.json');
    const data = await response.json();
    return { data, success: true };
  },

  async updateLoyaltySettings(settings: any): Promise<MockApiResponse<any>> {
    await delay(400);
    const stored = localStorage.getItem(getStorageKey('loyaltySettings'));
    const currentSettings = stored ? JSON.parse(stored) : {};
    
    const updatedSettings = { ...currentSettings, ...settings };
    localStorage.setItem(getStorageKey('loyaltySettings'), JSON.stringify(updatedSettings));
    
    return { data: updatedSettings, success: true, message: 'Paramètres mis à jour' };
  },

  // Settings
  async getSettings(): Promise<MockApiResponse<any>> {
    await delay(200);
    const stored = localStorage.getItem(getStorageKey('settings'));
    const defaultSettings = {
      theme: 'light',
      branding: {
        logo: null,
        primaryColor: '#6366f1',
        secondaryColor: '#8b5cf6',
      },
      plan: 'free',
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
    };
    
    const settings = stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    return { data: settings, success: true };
  },

  async updateSettings(settings: any): Promise<MockApiResponse<any>> {
    await delay(300);
    const stored = localStorage.getItem(getStorageKey('settings'));
    const currentSettings = stored ? JSON.parse(stored) : {};
    
    const updatedSettings = { ...currentSettings, ...settings };
    localStorage.setItem(getStorageKey('settings'), JSON.stringify(updatedSettings));
    
    return { data: updatedSettings, success: true, message: 'Paramètres sauvegardés' };
  },

  // Simule un scan de QR code
  async simulateQRScan(qrId: string): Promise<MockApiResponse<any>> {
    await delay(200);
    const stored = localStorage.getItem(getStorageKey('qrCodes'));
    const qrCodes = stored ? JSON.parse(stored) : [];
    
    const qrIndex = qrCodes.findIndex((qr: any) => qr.id === qrId);
    if (qrIndex !== -1) {
      qrCodes[qrIndex].scans += 1;
      qrCodes[qrIndex].lastScanned = new Date().toISOString();
      localStorage.setItem(getStorageKey('qrCodes'), JSON.stringify(qrCodes));
    }
    
    return { data: { qrId, timestamp: new Date().toISOString() }, success: true };
  },
};

// Hook personnalisé pour utiliser l'API mock
export const useMockApi = () => {
  return mockApi;
};
