import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigation, useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { Page } from "@shopify/polaris";
import React, { useState, useEffect } from 'react';
import { prisma } from "../db.server";
import { getOrCreateMerchant } from "../utils/merchant.server";
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingButton } from '../components/ui/LoadingButton';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/ui/Toast';
import { useLoading } from '../hooks/useLoading';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Palette,
  Upload,
  Eye,
  Download,
  Copy,
  Check,
  Sparkles,
  Link,
  Package,
  Gift,
  Video,
  FileText,
  Smartphone,
  Globe,
  ArrowLeft,
  Zap,
  Star,
  Heart,
  Settings,
} from 'lucide-react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  
  // Get or create merchant
  const merchant = await getOrCreateMerchant(
    session?.shop || (admin as any).shopifyDomain || (admin as any).shop || (admin as any).domain,
    session?.accessToken
  );

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

  // Get campaigns for QR code creation
  const campaigns = await prisma.campaign.findMany({
    where: { merchantId: merchant.id },
    orderBy: { createdAt: 'desc' },
  });

  return json({
    shop: session?.shop || (admin as any).shopifyDomain || (admin as any).shop || (admin as any).domain,
    merchant,
    products: productsList,
    campaigns,
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
      case "create_qr_code": {
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const type = formData.get("type") as string;
        const destination = formData.get("destination") as string;
        const color = formData.get("color") as string;
        const backgroundColor = formData.get("backgroundColor") as string;
        const size = Number(formData.get("size"));

        const qrCode = await prisma.qRCode.create({
          data: {
            title,
            type: type as any,
            destination,
            color,
            merchantId: merchant.id,
            campaignId: type === 'CAMPAIGN' ? destination : null,
          },
        });

        return json({ success: true, qrCode });
      }

      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Create QR code action error:", error);
    return json({ error: "An error occurred" }, { status: 500 });
  }
};

export default function CreateQRRoute() {
  const { shop, merchant, products, campaigns } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrData, setQrData] = useState({
    name: '',
    type: 'url',
    url: '',
    description: '',
    foregroundColor: '#000000',
    backgroundColor: '#ffffff',
    logo: null,
    size: 256,
    campaignId: '',
  });
  const [generatedUrl, setGeneratedUrl] = useState('');

  const isLoading = navigation.state === "loading";
  const { success, error: showError } = useToast();
  const { isLoading: isGenerating, withLoading } = useLoading();

  // Update generated URL when type or url changes
  useEffect(() => {
    setGeneratedUrl(generateQRCodeURL());
  }, [qrData.type, qrData.url]);

  const qrTypes = [
    { value: 'LINK', label: 'URL personnalisée', icon: Link },
    { value: 'PRODUCT', label: 'Page produit', icon: Package },
    { value: 'CAMPAIGN', label: 'Campagne', icon: Gift },
    { value: 'VIDEO', label: 'Vidéo', icon: Video },
    { value: 'LOYALTY', label: 'Fidélité', icon: Star },
  ];

  // Get the original destination URL (what the QR code should redirect to)
  const getOriginalDestination = () => {
    if (!qrData.url) return '';
    
    // For different types, generate the actual destination URLs
    switch (qrData.type) {
      case 'PRODUCT':
        return `https://${shop}/products/${qrData.url}`;
      case 'CAMPAIGN':
        // For campaign QR codes, store the campaign ID
        // The scan route will handle the redirection
        return qrData.campaignId;
      case 'VIDEO':
        return qrData.url.startsWith('http') ? qrData.url : `https://youtube.com/watch?v=${qrData.url}`;
      case 'LOYALTY':
        // For loyalty QR codes, store just the program name
        // The scan route will handle the redirection
        return qrData.url;
      default:
        return qrData.url.startsWith('http') ? qrData.url : `https://${qrData.url}`;
    }
  };

  // Generate QR code URL based on type and destination
  const generateQRCodeURL = () => {
    if (!qrData.url) return '';
    
    // IMPORTANT: All QR codes should go through our scan routes to check active status
    // This ensures inactive QR codes don't work
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    
    // For different types, we might want to generate different URLs
    switch (qrData.type) {
      case 'PRODUCT':
        return `${baseUrl}/api/scan/product-${qrData.url}`;
      case 'CAMPAIGN':
        return `${baseUrl}/api/scan/campaign-${qrData.campaignId}`;
      case 'VIDEO':
        return `${baseUrl}/api/scan/video-${qrData.url}`;
      case 'LOYALTY':
        return `${baseUrl}/api/scan/loyalty-${qrData.url}`;
      default:
        return `${baseUrl}/api/scan/link-${qrData.url}`;
    }
  };

  // Validate URL
  const isValidURL = (url: string) => {
    if (!url) return false;
    try {
      // For validation, we need to check if the original URL is valid
      // not the generated scan URL
      if (url.startsWith('http')) {
        new URL(url);
        return true;
      }
      // For non-http URLs, check if they're valid identifiers
      return url.length > 0;
    } catch {
      return false;
    }
  };

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
      success('QR Code créé avec succès!', 'Votre QR code a été généré et sauvegardé.');
    } else if (actionData && 'error' in actionData && actionData.error) {
      showError('Erreur lors de la création', actionData.error);
    }
  }, [actionData, success, showError]);

  const handleCopy = async () => {
    try {
      const urlToCopy = generatedUrl;
      if (!urlToCopy) {
        showError('Erreur de copie', 'Aucune URL valide à copier.');
        return;
      }
      
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      success('Copié!', 'L\'URL du QR code a été copiée dans le presse-papiers.');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showError('Erreur de copie', 'Impossible de copier le lien.');
    }
  };

  const handleDownload = async () => {
    try {
      await withLoading('download', async () => {
        // Create a download link for the QR code
        const canvas = document.querySelector('canvas');
        if (canvas) {
          const link = document.createElement('a');
          link.download = `qr-code-${qrData.name || 'generated'}.png`;
          link.href = canvas.toDataURL();
          link.click();
        }
        success('Téléchargement réussi!', 'Le QR code a été téléchargé.');
      });
    } catch (err) {
      showError('Erreur de téléchargement', 'Impossible de télécharger le QR code.');
    }
  };

  const generateQRCode = async () => {
    // Validation
    if (!qrData.name.trim()) {
      showError('Erreur de validation', 'Le nom du QR code est requis.');
      return;
    }

    if (!qrData.url.trim()) {
      showError('Erreur de validation', 'L\'URL de destination est requise.');
      return;
    }

    if (!isValidURL(qrData.url)) {
      showError('Erreur de validation', 'L\'URL saisie n\'est pas valide.');
      return;
    }

    try {
      await withLoading('generate', async () => {
        const formData = new FormData();
        formData.append("action", "create_qr_code");
        formData.append("title", qrData.name);
        formData.append("description", qrData.description);
        formData.append("type", qrData.type);
        // Store the original destination, not the scan URL
        const originalDestination = getOriginalDestination();
        formData.append("destination", originalDestination);
        
        // Also store the scan URL for the QR code itself
        const scanUrl = generateQRCodeURL();
        formData.append("scanUrl", scanUrl);
        formData.append("color", qrData.foregroundColor);
        formData.append("backgroundColor", qrData.backgroundColor);
        formData.append("size", qrData.size.toString());

        const response = await fetch("/app/create", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          console.log('QR code created:', result.qrCode);
          success('QR Code généré!', 'Votre QR code a été créé et sauvegardé avec succès.');
          
          // Optionally redirect to QR manager or reset form
          setTimeout(() => {
            navigate('/app/qr-manager');
          }, 2000);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la génération');
        }
      });
    } catch (error) {
      console.error("Error creating QR code:", error);
      showError('Erreur de génération', error instanceof Error ? error.message : 'Une erreur est survenue.');
    }
  };

  return (
    <Page>
      <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                onClick={() => navigate('/app')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Créer un QR Code
                </h1>
                <p className={`mt-2 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Personnalisez votre QR code et générez-le en temps réel
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
                <CardHeader>
                  <CardTitle className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Configuration du QR Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Nom du QR Code
                      </label>
                      <Input
                        value={qrData.name}
                        onChange={(e) => setQrData({ ...qrData, name: e.target.value })}
                        placeholder="Mon QR Code"
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Description (optionnelle)
                      </label>
                      <Input
                        value={qrData.description}
                        onChange={(e) => setQrData({ ...qrData, description: e.target.value })}
                        placeholder="Description du QR code"
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* QR Type */}
                  <div>
                    <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Type de contenu
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {qrTypes.map((type) => (
                        <motion.div
                          key={type.value}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <button
                            onClick={() => setQrData({ ...qrData, type: type.value })}
                            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                              qrData.type === type.value
                                ? 'border-blue-500 bg-blue-50'
                                : isDarkMode
                                ? 'border-gray-600 bg-gray-700 hover:border-gray-500'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <type.icon className={`h-5 w-5 ${
                                qrData.type === type.value ? 'text-blue-600' : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`} />
                              <span className={`font-medium ${
                                qrData.type === type.value ? 'text-blue-900' : isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {type.label}
                              </span>
                            </div>
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Content Configuration */}
                  {qrData.type === 'LINK' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          URL de destination
                        </label>
                        <Input
                          value={qrData.url}
                          onChange={(e) => setQrData({ ...qrData, url: e.target.value })}
                          placeholder="https://example.com"
                          className="w-full"
                        />
                      </div>
                    </motion.div>
                  )}

                  {qrData.type === 'CAMPAIGN' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Sélectionner une campagne
                        </label>
                        <Select
                          value={qrData.campaignId || ''}
                          onChange={(e) => setQrData({ ...qrData, campaignId: e.target.value, url: e.target.value })}
                          className="w-full"
                        >
                          <option value="">Choisir une campagne</option>
                          {campaigns.map((campaign: any) => (
                            <option key={campaign.id} value={campaign.id}>
                              {campaign.name} - {campaign.status === 'active' ? '🟢' : campaign.status === 'paused' ? '🟡' : '🔴'} {campaign.status}
                            </option>
                          ))}
                        </Select>
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Sélectionnez une campagne existante pour créer son QR code
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {qrData.type === 'VIDEO' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          URL de la vidéo ou ID YouTube
                        </label>
                        <Input
                          value={qrData.url}
                          onChange={(e) => setQrData({ ...qrData, url: e.target.value })}
                          placeholder="dQw4w9WgXcQ ou https://youtube.com/watch?v=..."
                          className="w-full"
                        />
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Entrez l'ID YouTube ou l'URL complète de la vidéo
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {qrData.type === 'LOYALTY' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Nom du programme de fidélité
                        </label>
                        <Input
                          value={qrData.url}
                          onChange={(e) => setQrData({ ...qrData, url: e.target.value })}
                          placeholder="programme-fidelite"
                          className="w-full"
                        />
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Utilisez des tirets au lieu d'espaces (ex: programme-fidelite)
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {qrData.type === 'PRODUCT' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Sélectionner un produit
                        </label>
                        <Select
                          value={qrData.url}
                          onChange={(e) => setQrData({ ...qrData, url: e.target.value })}
                          className="w-full"
                        >
                          <option value="">Choisir un produit</option>
                          {products.map((product: any) => (
                            <option key={product.id} value={product.handle}>
                              {product.title} - {product.variants?.[0]?.price || 'N/A'}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </motion.div>
                  )}

                  {/* Customization */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Personnalisation
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Couleur principale
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={qrData.foregroundColor}
                            onChange={(e) => setQrData({ ...qrData, foregroundColor: e.target.value })}
                            className="w-12 h-10 rounded-lg border border-gray-300"
                          />
                          <Input
                            value={qrData.foregroundColor}
                            onChange={(e) => setQrData({ ...qrData, foregroundColor: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Couleur de fond
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={qrData.backgroundColor}
                            onChange={(e) => setQrData({ ...qrData, backgroundColor: e.target.value })}
                            className="w-12 h-10 rounded-lg border border-gray-300"
                          />
                          <Input
                            value={qrData.backgroundColor}
                            onChange={(e) => setQrData({ ...qrData, backgroundColor: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Taille (px)
                      </label>
                      <Input
                        type="number"
                        value={qrData.size}
                        onChange={(e) => setQrData({ ...qrData, size: parseInt(e.target.value) })}
                        min="100"
                        max="1000"
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Generate Button */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <LoadingButton
                      onClick={generateQRCode}
                      loading={isGenerating('generate')}
                      loadingText="Génération en cours..."
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl"
                    >
                      <Zap className="h-5 w-5 mr-2" />
                      Générer le QR Code
                    </LoadingButton>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Preview Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
                <CardHeader>
                  <CardTitle className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Aperçu en temps réel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* QR Code Preview */}
                    <div className="flex justify-center">
                      <div className="p-8 bg-white rounded-2xl shadow-lg">
                        <div
                          className="w-64 h-64 flex items-center justify-center rounded-xl"
                          style={{ backgroundColor: qrData.backgroundColor }}
                        >
                          {qrData.url && isValidURL(qrData.url) ? (
                            <QRCodeSVG
                              value={generatedUrl}
                              size={qrData.size}
                              fgColor={qrData.foregroundColor}
                              bgColor={qrData.backgroundColor}
                              level="M"
                            />
                          ) : (
                            <div className="text-center text-gray-500">
                              <QrCode className="h-16 w-16 mx-auto mb-2" />
                              <p className="text-sm">
                                {qrData.url ? 'URL invalide' : 'Entrez une URL pour voir l\'aperçu'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* QR Code Info */}
                    <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Nom:
                          </span>
                          <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {qrData.name || 'Non défini'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Type:
                          </span>
                          <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {qrTypes.find(t => t.value === qrData.type)?.label}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Taille:
                          </span>
                          <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {qrData.size}px
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            URL générée:
                          </span>
                          <span className={`text-xs ${isDarkMode ? 'text-white' : 'text-gray-900'} break-all`}>
                            {qrData.url && isValidURL(qrData.url) ? generatedUrl : 'Non disponible'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <LoadingButton 
                          variant="outline" 
                          className="flex items-center justify-center"
                          onClick={handleDownload}
                          loading={isGenerating('download')}
                          loadingText="Téléchargement..."
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger
                        </LoadingButton>
                        <Button
                          variant="outline"
                          onClick={handleCopy}
                          className="flex items-center justify-center"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 mr-2 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4 mr-2" />
                          )}
                          {copied ? 'Copié!' : 'Copier'}
                        </Button>
                      </div>
                      
                      {qrData.url && isValidURL(qrData.url) && (
                        <Button
                          variant="outline"
                          onClick={() => window.open(generatedUrl, '_blank')}
                          className="w-full flex items-center justify-center"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Tester le QR Code
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </Page>
  );
}
