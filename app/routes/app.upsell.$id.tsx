import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigation, useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { Page } from "@shopify/polaris";
import React, { useState, useEffect } from 'react';
import { prisma } from "../db.server";
import { getOrCreateMerchant } from "../utils/merchant.server";
import { UpsellService } from "../utils/upsell.server";
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingButton } from '../components/ui/LoadingButton';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/ui/Toast';
import { useLoading } from '../hooks/useLoading';
import {
  ArrowLeft,
  Settings,
  Plus,
  Trash2,
  Save,
  Eye,
  ShoppingCart,
  Gift,
  Tag,
  Star,
  Target,
  TrendingUp,
} from 'lucide-react';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const { id } = params;
  
  if (!id) {
    throw new Response("QR Code ID required", { status: 400 });
  }

  // Get or create merchant
  const merchant = await getOrCreateMerchant(
    session?.shop || (admin as any).shopifyDomain || (admin as any).shop || (admin as any).domain,
    session?.accessToken
  );

  // Get QR code
  const qrCode = await prisma.qRCode.findFirst({
    where: {
      id,
      merchantId: merchant.id,
    },
    include: {
      campaign: true,
    },
  });

  if (!qrCode) {
    throw new Response("QR Code not found", { status: 404 });
  }

  // Get products from Shopify
  const products = await admin.graphql(
    `#graphql
      query getProducts($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              title
              handle
              variants(first: 1) {
                edges {
                  node {
                    price
                  }
                }
              }
            }
          }
        }
      }`,
    {
      variables: { first: 50 },
    }
  );

  const productsData = await products.json();
  const productsList = productsData.data?.products?.edges?.map((edge: any) => edge.node) || [];

  // Get current upsell config
  const upsellConfig = await UpsellService.getUpsellConfig(qrCode.id);

  return json({
    qrCode,
    merchant,
    products: productsList,
    upsellConfig,
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const { id } = params;
  const formData = await request.formData();
  const action = formData.get("action") as string;

  // Get or create merchant
  const merchant = await getOrCreateMerchant(
    session?.shop || (admin as any).shopifyDomain || (admin as any).shop || (admin as any).domain,
    session?.accessToken
  );

  try {
    switch (action) {
      case "update_upsell_config": {
        const enabled = formData.get("enabled") === "true";
        const showLandingPage = formData.get("showLandingPage") === "true";
        const title = formData.get("title") as string;
        const subtitle = formData.get("subtitle") as string;
        const primaryButtonText = formData.get("primaryButtonText") as string;
        const secondaryButtonText = formData.get("secondaryButtonText") as string;
        const backgroundColor = formData.get("backgroundColor") as string;
        const textColor = formData.get("textColor") as string;
        const logoUrl = formData.get("logoUrl") as string;
        const autoApplyPromo = formData.get("autoApplyPromo") === "true";
        const promoCode = formData.get("promoCode") as string;

        // Parse upsell products
        const upsellProducts = JSON.parse(formData.get("upsellProducts") as string || "[]");
        const crossSellProducts = JSON.parse(formData.get("crossSellProducts") as string || "[]");

        const config = {
          enabled,
          showLandingPage,
          landingPageConfig: {
            title,
            subtitle,
            primaryButtonText,
            secondaryButtonText,
            backgroundColor,
            textColor,
            logoUrl,
          },
          upsellProducts,
          crossSellProducts,
          autoApplyPromo,
          promoCode,
        };

        const success = await UpsellService.updateUpsellConfig(id!, config);

        if (success) {
          return json({ success: true, message: "Configuration upsell mise à jour avec succès" });
        } else {
          return json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
        }
      }

      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Upsell config action error:", error);
    return json({ error: "An error occurred" }, { status: 500 });
  }
};

export default function UpsellConfigRoute() {
  const { qrCode, merchant, products, upsellConfig } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [config, setConfig] = useState({
    enabled: upsellConfig?.enabled || false,
    showLandingPage: upsellConfig?.showLandingPage || false,
    title: upsellConfig?.landingPageConfig?.title || "Bienvenue !",
    subtitle: upsellConfig?.landingPageConfig?.subtitle || "",
    primaryButtonText: upsellConfig?.landingPageConfig?.primaryButtonText || "Acheter maintenant",
    secondaryButtonText: upsellConfig?.landingPageConfig?.secondaryButtonText || "",
    backgroundColor: upsellConfig?.landingPageConfig?.backgroundColor || "#ffffff",
    textColor: upsellConfig?.landingPageConfig?.textColor || "#000000",
    logoUrl: upsellConfig?.landingPageConfig?.logoUrl || "",
    autoApplyPromo: upsellConfig?.autoApplyPromo || false,
    promoCode: upsellConfig?.promoCode || "",
    upsellProducts: upsellConfig?.upsellProducts || [],
    crossSellProducts: upsellConfig?.crossSellProducts || [],
  });

  const isLoading = navigation.state === "loading";
  const { success, error: showError } = useToast();
  const { isLoading: isSaving, withLoading } = useLoading();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Handle action results
  useEffect(() => {
    if (actionData && 'success' in actionData && actionData.success) {
      success('Configuration sauvegardée!', actionData.message);
    } else if (actionData && 'error' in actionData && actionData.error) {
      showError('Erreur', actionData.error);
    }
  }, [actionData, success, showError]);

  const addUpsellProduct = () => {
    setConfig({
      ...config,
      upsellProducts: [
        ...config.upsellProducts,
        {
          productId: "",
          productHandle: "",
          discount: 10,
          discountType: "percentage",
          promoCode: "",
          position: "top",
        },
      ],
    });
  };

  const removeUpsellProduct = (index: number) => {
    setConfig({
      ...config,
      upsellProducts: config.upsellProducts.filter((_, i) => i !== index),
    });
  };

  const updateUpsellProduct = (index: number, field: string, value: any) => {
    const updated = [...config.upsellProducts];
    updated[index] = { ...updated[index], [field]: value };
    setConfig({ ...config, upsellProducts: updated });
  };

  const addCrossSellProduct = () => {
    setConfig({
      ...config,
      crossSellProducts: [
        ...config.crossSellProducts,
        {
          productId: "",
          productHandle: "",
          discount: 5,
          discountType: "percentage",
          promoCode: "",
          category: "",
        },
      ],
    });
  };

  const removeCrossSellProduct = (index: number) => {
    setConfig({
      ...config,
      crossSellProducts: config.crossSellProducts.filter((_, i) => i !== index),
    });
  };

  const updateCrossSellProduct = (index: number, field: string, value: any) => {
    const updated = [...config.crossSellProducts];
    updated[index] = { ...updated[index], [field]: value };
    setConfig({ ...config, crossSellProducts: updated });
  };

  const saveConfig = async () => {
    try {
      await withLoading('save', async () => {
        const formData = new FormData();
        formData.append("action", "update_upsell_config");
        formData.append("enabled", config.enabled.toString());
        formData.append("showLandingPage", config.showLandingPage.toString());
        formData.append("title", config.title);
        formData.append("subtitle", config.subtitle);
        formData.append("primaryButtonText", config.primaryButtonText);
        formData.append("secondaryButtonText", config.secondaryButtonText);
        formData.append("backgroundColor", config.backgroundColor);
        formData.append("textColor", config.textColor);
        formData.append("logoUrl", config.logoUrl);
        formData.append("autoApplyPromo", config.autoApplyPromo.toString());
        formData.append("promoCode", config.promoCode);
        formData.append("upsellProducts", JSON.stringify(config.upsellProducts));
        formData.append("crossSellProducts", JSON.stringify(config.crossSellProducts));

        const response = await fetch(`/app/upsell/${qrCode.id}`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
        }
      });
    } catch (error) {
      console.error("Error saving upsell config:", error);
      showError('Erreur de sauvegarde', error instanceof Error ? error.message : 'Une erreur est survenue.');
    }
  };

  return (
    <Page>
      <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center space-x-4 mb-6">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/app/qr-manager')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Configuration Upsell/Cross-sell
                </h1>
                <p className={`mt-2 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  QR Code: {qrCode.title}
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Configuration */}
            <div className="lg:col-span-2 space-y-6">
              {/* Enable/Disable */}
              <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
                <CardHeader>
                  <CardTitle className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Settings className="h-5 w-5 mr-2 inline" />
                    Activation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                        className="rounded"
                      />
                      <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Activer l'upsell/cross-sell
                      </span>
                    </label>
                  </div>
                  
                  {config.enabled && (
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={config.showLandingPage}
                          onChange={(e) => setConfig({ ...config, showLandingPage: e.target.checked })}
                          className="rounded"
                        />
                        <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Afficher une page d'atterrissage personnalisée
                        </span>
                      </label>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Landing Page Configuration */}
              {config.enabled && config.showLandingPage && (
                <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
                  <CardHeader>
                    <CardTitle className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      <Eye className="h-5 w-5 mr-2 inline" />
                      Page d'atterrissage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Titre principal
                        </label>
                        <Input
                          value={config.title}
                          onChange={(e) => setConfig({ ...config, title: e.target.value })}
                          placeholder="Bienvenue !"
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Sous-titre
                        </label>
                        <Input
                          value={config.subtitle}
                          onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
                          placeholder="Découvrez nos offres spéciales"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Texte bouton principal
                        </label>
                        <Input
                          value={config.primaryButtonText}
                          onChange={(e) => setConfig({ ...config, primaryButtonText: e.target.value })}
                          placeholder="Acheter maintenant"
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Texte bouton secondaire
                        </label>
                        <Input
                          value={config.secondaryButtonText}
                          onChange={(e) => setConfig({ ...config, secondaryButtonText: e.target.value })}
                          placeholder="Voir plus"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Couleur de fond
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={config.backgroundColor}
                            onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                            className="w-12 h-10 rounded-lg border border-gray-300"
                          />
                          <Input
                            value={config.backgroundColor}
                            onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Couleur du texte
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={config.textColor}
                            onChange={(e) => setConfig({ ...config, textColor: e.target.value })}
                            className="w-12 h-10 rounded-lg border border-gray-300"
                          />
                          <Input
                            value={config.textColor}
                            onChange={(e) => setConfig({ ...config, textColor: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          URL du logo
                        </label>
                        <Input
                          value={config.logoUrl}
                          onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                          placeholder="https://example.com/logo.png"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Promo Code Configuration */}
              {config.enabled && (
                <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
                  <CardHeader>
                    <CardTitle className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      <Tag className="h-5 w-5 mr-2 inline" />
                      Code promo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={config.autoApplyPromo}
                          onChange={(e) => setConfig({ ...config, autoApplyPromo: e.target.checked })}
                          className="rounded"
                        />
                        <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Appliquer automatiquement le code promo
                        </span>
                      </label>
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Code promo
                      </label>
                      <Input
                        value={config.promoCode}
                        onChange={(e) => setConfig({ ...config, promoCode: e.target.value })}
                        placeholder="WELCOME10"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Upsell Products */}
              {config.enabled && (
                <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <TrendingUp className="h-5 w-5 mr-2 inline" />
                        Produits Upsell
                      </CardTitle>
                      <Button onClick={addUpsellProduct} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {config.upsellProducts.map((product, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">Produit {index + 1}</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeUpsellProduct(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium mb-1">Produit</label>
                            <Select
                              value={product.productHandle}
                              onChange={(e) => {
                                const selectedProduct = products.find(p => p.handle === e.target.value);
                                updateUpsellProduct(index, 'productHandle', e.target.value);
                                updateUpsellProduct(index, 'productId', selectedProduct?.id || '');
                              }}
                            >
                              <option value="">Sélectionner un produit</option>
                              {products.map((product: any) => (
                                <option key={product.id} value={product.handle}>
                                  {product.title}
                                </option>
                              ))}
                            </Select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Position</label>
                            <Select
                              value={product.position}
                              onChange={(e) => updateUpsellProduct(index, 'position', e.target.value)}
                            >
                              <option value="top">En haut</option>
                              <option value="bottom">En bas</option>
                              <option value="sidebar">Barre latérale</option>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-sm font-medium mb-1">Remise</label>
                            <Input
                              type="number"
                              value={product.discount}
                              onChange={(e) => updateUpsellProduct(index, 'discount', parseInt(e.target.value))}
                              min="0"
                              max="100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Type</label>
                            <Select
                              value={product.discountType}
                              onChange={(e) => updateUpsellProduct(index, 'discountType', e.target.value)}
                            >
                              <option value="percentage">Pourcentage (%)</option>
                              <option value="fixed">Montant fixe (€)</option>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Code promo</label>
                            <Input
                              value={product.promoCode}
                              onChange={(e) => updateUpsellProduct(index, 'promoCode', e.target.value)}
                              placeholder="UPSELL10"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Cross-sell Products */}
              {config.enabled && (
                <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <Gift className="h-5 w-5 mr-2 inline" />
                        Produits Cross-sell
                      </CardTitle>
                      <Button onClick={addCrossSellProduct} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {config.crossSellProducts.map((product, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">Produit {index + 1}</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeCrossSellProduct(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium mb-1">Produit</label>
                            <Select
                              value={product.productHandle}
                              onChange={(e) => {
                                const selectedProduct = products.find(p => p.handle === e.target.value);
                                updateCrossSellProduct(index, 'productHandle', e.target.value);
                                updateCrossSellProduct(index, 'productId', selectedProduct?.id || '');
                              }}
                            >
                              <option value="">Sélectionner un produit</option>
                              {products.map((product: any) => (
                                <option key={product.id} value={product.handle}>
                                  {product.title}
                                </option>
                              ))}
                            </Select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Catégorie</label>
                            <Input
                              value={product.category}
                              onChange={(e) => updateCrossSellProduct(index, 'category', e.target.value)}
                              placeholder="Compléments"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-sm font-medium mb-1">Remise</label>
                            <Input
                              type="number"
                              value={product.discount}
                              onChange={(e) => updateCrossSellProduct(index, 'discount', parseInt(e.target.value))}
                              min="0"
                              max="100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Type</label>
                            <Select
                              value={product.discountType}
                              onChange={(e) => updateCrossSellProduct(index, 'discountType', e.target.value)}
                            >
                              <option value="percentage">Pourcentage (%)</option>
                              <option value="fixed">Montant fixe (€)</option>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Code promo</label>
                            <Input
                              value={product.promoCode}
                              onChange={(e) => updateCrossSellProduct(index, 'promoCode', e.target.value)}
                              placeholder="CROSS10"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Preview & Actions */}
            <div className="space-y-6">
              {/* Save Button */}
              <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
                <CardContent className="p-6">
                  <LoadingButton
                    onClick={saveConfig}
                    loading={isSaving('save')}
                    loadingText="Sauvegarde..."
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3 rounded-xl"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    Sauvegarder la configuration
                  </LoadingButton>
                </CardContent>
              </Card>

              {/* Preview */}
              {config.enabled && config.showLandingPage && (
                <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
                  <CardHeader>
                    <CardTitle className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      <Eye className="h-5 w-5 mr-2 inline" />
                      Aperçu
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="p-4 rounded-lg border-2 border-dashed"
                      style={{ 
                        backgroundColor: config.backgroundColor,
                        color: config.textColor
                      }}
                    >
                      <div className="text-center">
                        <h3 className="text-lg font-bold mb-2">{config.title}</h3>
                        {config.subtitle && (
                          <p className="text-sm opacity-75 mb-4">{config.subtitle}</p>
                        )}
                        <div className="space-y-2">
                          <div className="w-full h-8 bg-gray-300 rounded"></div>
                          {config.secondaryButtonText && (
                            <div className="w-24 h-6 bg-gray-200 rounded mx-auto"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Stats */}
              <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
                <CardHeader>
                  <CardTitle className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Target className="h-5 w-5 mr-2 inline" />
                    Statistiques
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Produits upsell:</span>
                    <Badge variant="secondary">{config.upsellProducts.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Produits cross-sell:</span>
                    <Badge variant="secondary">{config.crossSellProducts.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Code promo:</span>
                    <Badge variant={config.promoCode ? "default" : "secondary"}>
                      {config.promoCode || "Aucun"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}

