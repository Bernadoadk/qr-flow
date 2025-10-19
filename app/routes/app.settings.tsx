import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { Page } from "@shopify/polaris";
import React, { useState, useEffect } from 'react';
import { prisma } from "../db.server";
import { getOrCreateMerchant } from "../utils/merchant.server";
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { formatNumber, formatDate } from '../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Database,
  Download,
  Upload,
  Save,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Monitor,
  Check,
  AlertCircle,
  Info,
  Zap,
  Lock,
  Trash2,
  Edit,
  Plus,
  X,
  CreditCard,
  Smartphone,
  Mail,
  MessageSquare,
} from 'lucide-react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  
  // Get or create merchant
  const merchant = await getOrCreateMerchant(
    session?.shop || (admin as any).shopifyDomain || (admin as any).shop || (admin as any).domain,
    session?.accessToken
  );

  return json({
    shop: session?.shop || (admin as any).shopifyDomain || (admin as any).shop || (admin as any).domain,
    merchant,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action") as string;

  // Get or create merchant
  const merchant = await getOrCreateMerchant(
    session?.shop || (admin as any).shopifyDomain || (admin as any).shop || (admin as any).domain,
    session?.accessToken
  );

  try {
    switch (action) {
      case "update_settings": {
        const settings = JSON.parse(formData.get("settings") as string);

        const updatedMerchant = await prisma.merchant.update({
          where: { id: merchant.id },
          data: {
            settings: settings,
          },
        });

        return json({ success: true, merchant: updatedMerchant });
      }

      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Settings action error:", error);
    return json({ error: "An error occurred" }, { status: 500 });
  }
};

export default function SettingsRoute() {
  const { shop, merchant } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('general');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showToast, setShowToast] = useState(false);
  // Initialize settings with merchant data or defaults
  const defaultSettings = {
    general: {
      appName: 'QR Connect',
      timezone: 'Europe/Paris',
      language: 'fr',
      currency: 'EUR',
    },
    notifications: {
      email: true,
      push: true,
      sms: false,
      marketing: false,
    },
    security: {
      twoFactor: false,
      sessionTimeout: 30,
      passwordExpiry: 90,
    },
    appearance: {
      theme: 'auto',
      primaryColor: '#6366f1',
      fontSize: 'medium',
    },
    billing: {
      plan: 'free',
      autoRenew: true,
      invoiceEmail: 'admin@example.com',
    },
  };
  
  const [settings, setSettings] = useState(() => {
    if (merchant?.settings) {
      return { ...defaultSettings, ...merchant.settings };
    }
    return defaultSettings;
  });

  const isLoading = navigation.state === "loading";

  // Load settings from merchant data
  useEffect(() => {
    if (merchant?.settings) {
      setSettings({ ...defaultSettings, ...merchant.settings });
    }
  }, [merchant]);

  useEffect(() => {
    // Detect dark mode preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const tabs = [
    { id: 'general', name: 'Général', icon: SettingsIcon, description: 'Paramètres de base' },
    { id: 'notifications', name: 'Notifications', icon: Bell, description: 'Alertes et communications' },
    { id: 'security', name: 'Sécurité', icon: Shield, description: 'Protection et accès' },
    { id: 'appearance', name: 'Apparence', icon: Palette, description: 'Thème et personnalisation' },
    { id: 'billing', name: 'Facturation', icon: CreditCard, description: 'Plan et paiements' },
  ];

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("action", "update_settings");
    formData.append("settings", JSON.stringify(settings));

    try {
      const response = await fetch("/app/settings", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const ToggleSwitch = ({ checked, onChange, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
        checked ? 'bg-indigo-600' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <Page>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Paramètres
                </h1>
                <p className={`mt-2 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Configurez votre application QR Connect
                </p>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={handleSave}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
              </motion.div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
                  <CardContent className="p-0">
                    <nav className="space-y-1 p-4">
                      {tabs.map((tab, index) => (
                        <motion.button
                          key={tab.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + index * 0.05 }}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-start px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                            activeTab === tab.id
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                              : `${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
                          }`}
                        >
                          <tab.icon className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                          <div className="text-left">
                            <div className="font-medium">{tab.name}</div>
                            <div className={`text-xs mt-1 ${
                              activeTab === tab.id ? 'text-blue-100' : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {tab.description}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </nav>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
                    <CardHeader>
                      <CardTitle className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {tabs.find(t => t.id === activeTab)?.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      {activeTab === 'general' && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Nom de l'application
                              </label>
                              <Input
                                value={settings.general.appName}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  general: { ...settings.general, appName: e.target.value }
                                })}
                                className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                              />
                            </div>
                            <div>
                              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Fuseau horaire
                              </label>
                              <Select
                                value={settings.general.timezone}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  general: { ...settings.general, timezone: e.target.value }
                                })}
                                className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                              >
                                <option value="Europe/Paris">Europe/Paris</option>
                                <option value="America/New_York">America/New_York</option>
                                <option value="Asia/Tokyo">Asia/Tokyo</option>
                              </Select>
                            </div>
                            <div>
                              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Langue
                              </label>
                              <Select
                                value={settings.general.language}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  general: { ...settings.general, language: e.target.value }
                                })}
                                className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                              >
                                <option value="fr">Français</option>
                                <option value="en">English</option>
                                <option value="es">Español</option>
                              </Select>
                            </div>
                            <div>
                              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Devise
                              </label>
                              <Select
                                value={settings.general.currency}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  general: { ...settings.general, currency: e.target.value }
                                })}
                                className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                              >
                                <option value="EUR">EUR (€)</option>
                                <option value="USD">USD ($)</option>
                                <option value="CAD">CAD (C$)</option>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'notifications' && (
                        <div className="space-y-6">
                          {[
                            { key: 'email', label: 'Notifications email', description: 'Recevoir des notifications par email', icon: Mail },
                            { key: 'push', label: 'Notifications push', description: 'Recevoir des notifications push', icon: Bell },
                            { key: 'sms', label: 'Notifications SMS', description: 'Recevoir des notifications par SMS', icon: Smartphone },
                            { key: 'marketing', label: 'Marketing', description: 'Recevoir des offres et actualités', icon: MessageSquare },
                          ].map((notification, index) => (
                            <motion.div
                              key={notification.key}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className={`flex items-center justify-between p-4 rounded-xl border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                            >
                              <div className="flex items-center space-x-4">
                                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-600' : 'bg-white'}`}>
                                  <notification.icon className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                  <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {notification.label}
                                  </h3>
                                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {notification.description}
                                  </p>
                                </div>
                              </div>
                              <ToggleSwitch
                                checked={settings.notifications[notification.key as keyof typeof settings.notifications] as boolean}
                                onChange={(checked) => setSettings({
                                  ...settings,
                                  notifications: { ...settings.notifications, [notification.key]: checked }
                                })}
                              />
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {activeTab === 'security' && (
                        <div className="space-y-6">
                          <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-600' : 'bg-white'}`}>
                                  <Shield className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                  <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Authentification à deux facteurs
                                  </h3>
                                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Ajouter une couche de sécurité supplémentaire
                                  </p>
                                </div>
                              </div>
                              <ToggleSwitch
                                checked={settings.security.twoFactor}
                                onChange={(checked) => setSettings({
                                  ...settings,
                                  security: { ...settings.security, twoFactor: checked }
                                })}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Délai d'expiration de session (minutes)
                              </label>
                              <Input
                                type="number"
                                value={settings.security.sessionTimeout}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  security: { ...settings.security, sessionTimeout: Number(e.target.value) }
                                })}
                                className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                              />
                            </div>
                            <div>
                              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Expiration du mot de passe (jours)
                              </label>
                              <Input
                                type="number"
                                value={settings.security.passwordExpiry}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  security: { ...settings.security, passwordExpiry: Number(e.target.value) }
                                })}
                                className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'appearance' && (
                        <div className="space-y-6">
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Thème
                            </label>
                            <div className="grid grid-cols-3 gap-4">
                              {[
                                { value: 'light', label: 'Clair', icon: Sun },
                                { value: 'dark', label: 'Sombre', icon: Moon },
                                { value: 'auto', label: 'Automatique', icon: Monitor },
                              ].map((theme) => (
                                <motion.button
                                  key={theme.value}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setSettings({
                                    ...settings,
                                    appearance: { ...settings.appearance, theme: theme.value }
                                  })}
                                  className={`p-4 rounded-xl border-2 transition-all ${
                                    settings.appearance.theme === theme.value
                                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                      : `${isDarkMode ? 'border-gray-600 bg-gray-700 hover:border-gray-500' : 'border-gray-200 bg-white hover:border-gray-300'}`
                                  }`}
                                >
                                  <theme.icon className={`h-6 w-6 mx-auto mb-2 ${
                                    settings.appearance.theme === theme.value ? 'text-indigo-600' : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                  }`} />
                                  <div className={`text-sm font-medium ${
                                    settings.appearance.theme === theme.value ? 'text-indigo-600' : isDarkMode ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {theme.label}
                                  </div>
                                </motion.button>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Couleur principale
                              </label>
                              <div className="flex items-center space-x-3">
                                <Input
                                  type="color"
                                  value={settings.appearance.primaryColor}
                                  onChange={(e) => setSettings({
                                    ...settings,
                                    appearance: { ...settings.appearance, primaryColor: e.target.value }
                                  })}
                                  className="w-16 h-12 rounded-lg border-0"
                                />
                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {settings.appearance.primaryColor}
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Taille de police
                              </label>
                              <Select
                                value={settings.appearance.fontSize}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  appearance: { ...settings.appearance, fontSize: e.target.value }
                                })}
                                className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                              >
                                <option value="small">Petite</option>
                                <option value="medium">Moyenne</option>
                                <option value="large">Grande</option>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'billing' && (
                        <div className="space-y-6">
                          <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  Plan actuel
                                </h3>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Vous utilisez actuellement le plan gratuit
                                </p>
                              </div>
                              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                                Gratuit
                              </Badge>
                            </div>
                            <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                              Passer au plan Pro
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Email de facturation
                              </label>
                              <Input
                                type="email"
                                value={settings.billing.invoiceEmail}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  billing: { ...settings.billing, invoiceEmail: e.target.value }
                                })}
                                className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  Renouvellement automatique
                                </h3>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Renouveler automatiquement l'abonnement
                                </p>
                              </div>
                              <ToggleSwitch
                                checked={settings.billing.autoRenew}
                                onChange={(checked) => setSettings({
                                  ...settings,
                                  billing: { ...settings.billing, autoRenew: checked }
                                })}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Toast Notification */}
          <AnimatePresence>
            {showToast && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                className="fixed bottom-4 right-4 z-50"
              >
                <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
                  <Check className="h-5 w-5" />
                  <span>Paramètres sauvegardés avec succès !</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
    </Page>
  );
}
