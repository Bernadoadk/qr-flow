import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Checkbox } from '../ui/Checkbox';
import { motion } from 'framer-motion';
import GradientEditor from '../ui/GradientEditor';
import BackgroundSelector from '../ui/BackgroundSelector';
import {
  Palette,
  Image,
  Type,
  Target,
  DollarSign,
  BarChart3,
  Link,
  Upload,
  Eye,
  Save,
  RefreshCw,
  Plus,
  X,
  Star,
  Gift,
  Zap,
  ShoppingBag,
  Trash2,
  Move,
  CheckCircle,
} from 'lucide-react';

interface CampaignPersonalizationProps {
  campaign: any;
  onSave: (data: any) => void;
  onSaveForPreview?: (data: any) => void;
  onPreview: () => void;
  onClose?: () => void;
  isLoading?: boolean;
  shopifyProducts?: any[];
  saveSuccess?: boolean;
  previewSuccess?: boolean;
}

export default function CampaignPersonalization({ 
  campaign, 
  onSave, 
  onSaveForPreview,
  onPreview, 
  onClose,
  isLoading = false,
  shopifyProducts = [],
  saveSuccess = false,
  previewSuccess = false
}: CampaignPersonalizationProps) {
  const [activeTab, setActiveTab] = useState('design');
  const [dragOver, setDragOver] = useState(false);
  const [gradientEditor, setGradientEditor] = useState<{isOpen: boolean, field: string}>({isOpen: false, field: ''});
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [backgroundSelector, setBackgroundSelector] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState(() => ({
    // 🎨 Design et branding
    primaryColor: campaign?.primaryColor || '#007b5c',
    primaryColorGradient: campaign?.primaryColorGradient || false,
    primaryGradientColors: Array.isArray(campaign?.primaryGradientColors) ? campaign.primaryGradientColors : ['#007b5c', '#00a86b'],
    primaryGradientDirection: campaign?.primaryGradientDirection || 'to right',
    secondaryColor: campaign?.secondaryColor || '#ffffff',
    secondaryColorGradient: campaign?.secondaryColorGradient || false,
    secondaryGradientColors: Array.isArray(campaign?.secondaryGradientColors) ? campaign.secondaryGradientColors : ['#ffffff', '#f0f0f0'],
    secondaryGradientDirection: campaign?.secondaryGradientDirection || 'to right',
    backgroundColor: campaign?.backgroundColor || '#f8f9fa',
    backgroundColorGradient: campaign?.backgroundColorGradient || false,
    backgroundGradientColors: Array.isArray(campaign?.backgroundGradientColors) ? campaign.backgroundGradientColors : ['#f8f9fa', '#e9ecef'],
    backgroundGradientDirection: campaign?.backgroundGradientDirection || 'to right',
    logoUrl: campaign?.logoUrl || '',
    bannerUrl: campaign?.bannerUrl || '',
    backgroundImage: campaign?.backgroundImage || '',
    
    // 🎨 Personnalisation des cartes
    cardBackgroundColor: campaign?.cardBackgroundColor || '#ffffff',
    cardBackgroundGradient: campaign?.cardBackgroundGradient || false,
    cardBackgroundGradientColors: Array.isArray(campaign?.cardBackgroundGradientColors) ? campaign.cardBackgroundGradientColors : ['#ffffff', '#f8f9fa'],
    cardBackgroundGradientDirection: campaign?.cardBackgroundGradientDirection || 'to right',
    cardBorderColor: campaign?.cardBorderColor || '#e5e7eb',
    cardBorderWidth: campaign?.cardBorderWidth || 1,
    cardBorderRadius: campaign?.cardBorderRadius || 8,
    cardShadow: campaign?.cardShadow || 'lg',
    
    // 🎨 Personnalisation des mini-cartes (produits et offres)
    miniCardBackgroundColor: campaign?.miniCardBackgroundColor || '#ffffff',
    miniCardBackgroundGradient: campaign?.miniCardBackgroundGradient || false,
    miniCardBackgroundGradientColors: Array.isArray(campaign?.miniCardBackgroundGradientColors) ? campaign.miniCardBackgroundGradientColors : ['#ffffff', '#f8f9fa'],
    miniCardBackgroundGradientDirection: campaign?.miniCardBackgroundGradientDirection || 'to right',
    miniCardBorderColor: campaign?.miniCardBorderColor || '#e5e7eb',
    miniCardBorderWidth: campaign?.miniCardBorderWidth || 1,
    miniCardBorderRadius: campaign?.miniCardBorderRadius || 8,
    miniCardShadow: campaign?.miniCardShadow || 'md',
    
    fontFamily: campaign?.fontFamily || 'Inter',
    fontSize: campaign?.fontSize || 16,
    fontWeight: campaign?.fontWeight || 'normal',
    
    // 📝 Contenu dynamique
    mainOffer: campaign?.mainOffer || '',
    ctaText: campaign?.ctaText || 'Découvrir les offres',
    ctaButtonColor: campaign?.ctaButtonColor || '#007b5c',
    ctaButtonColorGradient: campaign?.ctaButtonColorGradient || false,
    ctaButtonColorGradientColors: Array.isArray(campaign?.ctaButtonColorGradientColors) ? campaign.ctaButtonColorGradientColors : ['#007b5c', '#00a86b'],
    ctaButtonColorGradientDirection: campaign?.ctaButtonColorGradientDirection || 'to right',
    
    // 🛍️ Produits vedettes
    featuredProducts: Array.isArray(campaign?.featuredProducts) ? campaign.featuredProducts : [],
    
    // 🎁 Offres exceptionnelles
    specialOffers: Array.isArray(campaign?.specialOffers) ? campaign.specialOffers : [
      { id: 1, title: 'Réduction jusqu\'à -70%', description: 'Sur une sélection de produits', icon: 'Star', color: 'purple', enabled: true },
      { id: 2, title: 'Cadeaux offerts', description: 'Avec tout achat supérieur à 50€', icon: 'Gift', color: 'blue', enabled: true },
      { id: 3, title: 'Livraison gratuite', description: 'Sur toute la France métropolitaine', icon: 'Zap', color: 'green', enabled: true },
    ],
    
    // 🎯 Objectifs et KPIs
    targetScans: campaign?.targetScans || 1000,
    targetSignups: campaign?.targetSignups || 200,
    budget: campaign?.budget || 0,
    expectedROI: campaign?.expectedROI || 0,
    
    // 🔗 Intégrations
    googleAnalyticsId: campaign?.googleAnalyticsId || '',
    mailchimpListId: campaign?.mailchimpListId || '',
    klaviyoListId: campaign?.klaviyoListId || '',
    facebookPixelId: campaign?.facebookPixelId || '',
  }));

  // Log initial pour déboguer
  console.log("🎨 Campaign data reçue:", campaign);
  console.log("📝 FormData initial:", formData);

  // Mettre à jour le formData quand la campagne change (après sauvegarde)
  React.useEffect(() => {
    if (campaign) {
      setFormData({
        // 🎨 Design et branding
        primaryColor: campaign.primaryColor || '#007b5c',
        primaryColorGradient: campaign.primaryColorGradient || false,
        primaryGradientColors: Array.isArray(campaign.primaryGradientColors) ? campaign.primaryGradientColors : ['#007b5c', '#00a86b'],
        primaryGradientDirection: campaign.primaryGradientDirection || 'to right',
        secondaryColor: campaign.secondaryColor || '#ffffff',
        secondaryColorGradient: campaign.secondaryColorGradient || false,
        secondaryGradientColors: Array.isArray(campaign.secondaryGradientColors) ? campaign.secondaryGradientColors : ['#ffffff', '#f0f0f0'],
        secondaryGradientDirection: campaign.secondaryGradientDirection || 'to right',
        backgroundColor: campaign.backgroundColor || '#f8f9fa',
        backgroundColorGradient: campaign.backgroundColorGradient || false,
        backgroundGradientColors: Array.isArray(campaign.backgroundGradientColors) ? campaign.backgroundGradientColors : ['#f8f9fa', '#e9ecef'],
        backgroundGradientDirection: campaign.backgroundGradientDirection || 'to right',
        logoUrl: campaign.logoUrl || '',
        bannerUrl: campaign.bannerUrl || '',
        backgroundImage: campaign.backgroundImage || '',
        
        // 🎨 Personnalisation des cartes
        cardBackgroundColor: campaign.cardBackgroundColor || '#ffffff',
        cardBackgroundGradient: campaign.cardBackgroundGradient || false,
        cardBackgroundGradientColors: Array.isArray(campaign.cardBackgroundGradientColors) ? campaign.cardBackgroundGradientColors : ['#ffffff', '#f8f9fa'],
        cardBackgroundGradientDirection: campaign.cardBackgroundGradientDirection || 'to right',
        cardBorderColor: campaign.cardBorderColor || '#e5e7eb',
        cardBorderWidth: campaign.cardBorderWidth || 1,
        cardBorderRadius: campaign.cardBorderRadius || 8,
        cardShadow: campaign.cardShadow || 'lg',
        
        // 🎨 Personnalisation des mini-cartes (produits et offres)
        miniCardBackgroundColor: campaign.miniCardBackgroundColor || '#ffffff',
        miniCardBackgroundGradient: campaign.miniCardBackgroundGradient || false,
        miniCardBackgroundGradientColors: Array.isArray(campaign.miniCardBackgroundGradientColors) ? campaign.miniCardBackgroundGradientColors : ['#ffffff', '#f8f9fa'],
        miniCardBackgroundGradientDirection: campaign.miniCardBackgroundGradientDirection || 'to right',
        miniCardBorderColor: campaign.miniCardBorderColor || '#e5e7eb',
        miniCardBorderWidth: campaign.miniCardBorderWidth || 1,
        miniCardBorderRadius: campaign.miniCardBorderRadius || 8,
        miniCardShadow: campaign.miniCardShadow || 'md',
        
        fontFamily: campaign.fontFamily || 'Inter',
        fontSize: campaign.fontSize || 16,
        fontWeight: campaign.fontWeight || 'normal',
        
        // 📝 Contenu dynamique
        mainOffer: campaign.mainOffer || '',
        ctaText: campaign.ctaText || 'Découvrir les offres',
        ctaButtonColor: campaign.ctaButtonColor || '#007b5c',
        ctaButtonColorGradient: campaign.ctaButtonColorGradient || false,
        ctaButtonColorGradientColors: Array.isArray(campaign.ctaButtonColorGradientColors) ? campaign.ctaButtonColorGradientColors : ['#007b5c', '#00a86b'],
        ctaButtonColorGradientDirection: campaign.ctaButtonColorGradientDirection || 'to right',
        
        // 🛍️ Produits vedettes
        featuredProducts: Array.isArray(campaign.featuredProducts) ? campaign.featuredProducts : [],
        
        // 🎁 Offres exceptionnelles
        specialOffers: Array.isArray(campaign.specialOffers) ? campaign.specialOffers : [
          { id: 1, title: 'Réduction jusqu\'à -70%', description: 'Sur une sélection de produits', icon: 'Star', color: 'purple', enabled: true },
          { id: 2, title: 'Cadeaux offerts', description: 'Avec tout achat supérieur à 50€', icon: 'Gift', color: 'blue', enabled: true },
          { id: 3, title: 'Livraison gratuite', description: 'Sur toute la France métropolitaine', icon: 'Zap', color: 'green', enabled: true },
        ],
        
        // 🎯 Objectifs et KPIs
        targetScans: campaign.targetScans || 1000,
        targetSignups: campaign.targetSignups || 200,
        budget: campaign.budget || 0,
        expectedROI: campaign.expectedROI || 0,
        
        // 🔗 Intégrations
        googleAnalyticsId: campaign.googleAnalyticsId || '',
        mailchimpListId: campaign.mailchimpListId || '',
        klaviyoListId: campaign.klaviyoListId || '',
        facebookPixelId: campaign.facebookPixelId || '',
      });
    }
  }, [campaign]);

  const tabs = [
    { id: 'design', label: 'Design', icon: Palette },
    { id: 'content', label: 'Contenu', icon: Type },
    { id: 'goals', label: 'Objectifs', icon: Target },
    { id: 'integrations', label: 'Intégrations', icon: Link },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 🎨 Gestion de l'éditeur de couleurs/dégradés
  const openGradientEditor = (field: string) => {
    setGradientEditor({ isOpen: true, field });
  };

  const closeGradientEditor = () => {
    setGradientEditor({ isOpen: false, field: '' });
  };

  const handleGradientSave = (result: { color: string; direction: string; colors: string[]; isGradient: boolean }) => {
    const field = gradientEditor.field;
    console.log("🎨 Sauvegarde dégradé:", { field, result });
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [`${field}Gradient`]: result.isGradient,
        [`${field}GradientColors`]: result.colors,
        [`${field}GradientDirection`]: result.direction,
        [field]: result.color
      } as any;
      
      console.log("🎨 Nouvelles données:", newData);
      console.log("🎨 Champ spécifique:", field, "=", newData[field]);
      console.log("🎨 Gradient:", newData[`${field}Gradient`]);
      console.log("🎨 Colors:", newData[`${field}GradientColors`]);
      
      return newData;
    });
    closeGradientEditor();
  };

  // 📁 Gestion du drag & drop pour les images
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent, target: string) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string;
          // Extraire l'ID du produit du target (format: "product-{id}-image")
          const productId = target.split('-')[1];
          updateFeaturedProduct(parseInt(productId), 'image', imageUrl);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // 🛍️ Fonction pour récupérer les images d'un produit Shopify
  const getShopifyProductImages = (shopifyId: string) => {
    const product = shopifyProducts.find(p => p.id === shopifyId);
    return product?.images?.edges?.map((edge: any) => edge.node) || [];
  };

  // 🖼️ Gestion du sélecteur de background
  const handleBackgroundSelect = (backgroundUrl: string) => {
    setFormData(prev => ({ ...prev, backgroundImage: backgroundUrl }));
  };


  const handleSave = () => {
    console.log("💾 Sauvegarde formData:", formData);
    onSave(formData);
  };

  const handlePreview = () => {
    setIsPreviewing(true);
    // Sauvegarder d'abord les données actuelles (sans fermer la modal)
    if (onSaveForPreview) {
      onSaveForPreview(formData);
    } else {
      onSave(formData);
    }
    // Puis ouvrir l'aperçu après un court délai
    setTimeout(() => {
      onPreview();
      setIsPreviewing(false);
    }, 200);
  };


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        handleInputChange(field, event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    // Reset the input value to allow selecting the same file again
    e.target.value = '';
  };

  // 🛍️ Gestion des produits vedettes
  const addFeaturedProduct = (shopifyProduct?: any) => {
    const newProduct = shopifyProduct ? {
      id: Date.now(),
      shopifyId: shopifyProduct.id,
      name: shopifyProduct.title,
      originalPrice: parseFloat(shopifyProduct.variants?.edges?.[0]?.node?.price || '0'),
      discountPrice: 0,
      image: shopifyProduct.featuredImage?.url || '',
      description: shopifyProduct.description || '',
      handle: shopifyProduct.handle,
      selected: false
    } : {
      id: Date.now(),
      shopifyId: '',
      name: '',
      originalPrice: 0,
      discountPrice: 0,
      image: '',
      description: '',
      handle: '',
      selected: false
    };
    setFormData(prev => ({
      ...prev,
      featuredProducts: [...prev.featuredProducts, newProduct]
    }));
  };

  const updateFeaturedProduct = (id: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      featuredProducts: prev.featuredProducts.map((product: any) =>
        product.id === id ? { ...product, [field]: value } : product
      )
    }));
  };

  const removeFeaturedProduct = (id: number) => {
    setFormData(prev => ({
      ...prev,
      featuredProducts: prev.featuredProducts.filter((product: any) => product.id !== id)
    }));
  };

  // 🎁 Gestion des offres exceptionnelles
  const addSpecialOffer = () => {
    const newOffer = {
      id: Date.now(),
      title: '',
      description: '',
      icon: 'Star',
      color: 'purple',
      enabled: true
    };
    setFormData(prev => ({
      ...prev,
      specialOffers: [...prev.specialOffers, newOffer]
    }));
  };

  const updateSpecialOffer = (id: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      specialOffers: prev.specialOffers.map((offer: any) =>
        offer.id === id ? { ...offer, [field]: value } : offer
      )
    }));
  };

  const removeSpecialOffer = (id: number) => {
    setFormData(prev => ({
      ...prev,
      specialOffers: prev.specialOffers.filter((offer: any) => offer.id !== id)
    }));
  };

  const toggleSpecialOffer = (id: number) => {
    setFormData(prev => ({
      ...prev,
      specialOffers: prev.specialOffers.map((offer: any) =>
        offer.id === id ? { ...offer, enabled: !offer.enabled } : offer
      )
    }));
  };

  // 🎨 Gestion des dégradés

  return (
    <div className="space-y-6">
      {/* Messages de succès */}
      {saveSuccess && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">Personnalisation sauvegardée avec succès !</span>
          </div>
        </div>
      )}
      
      {previewSuccess && (
        <div className="p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg">
          <div className="flex items-center">
            <Eye className="h-5 w-5 mr-2" />
            <span className="font-medium">Aperçu généré ! La page s'ouvre dans un nouvel onglet.</span>
          </div>
        </div>
      )}

      {/* Navigation des onglets */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenu des onglets */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'design' && (
          <div className="space-y-6">
            {/* Fond d'écran */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Image className="h-5 w-5" />
                  <span>Fond d'écran</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image de fond
                    </label>
                    <div className="flex items-center space-x-3">
                      {formData.backgroundImage && (
                        <div className="w-16 h-12 rounded border border-gray-300 overflow-hidden">
                          <img
                            src={formData.backgroundImage}
                            alt="Fond actuel"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setBackgroundSelector(true)}
                        className="flex items-center space-x-2"
                      >
                        <Image className="h-4 w-4" />
                        <span>
                          {formData.backgroundImage ? 'Changer le fond' : 'Sélectionner un fond'}
                        </span>
                      </Button>
                      {formData.backgroundImage && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setFormData(prev => ({ ...prev, backgroundImage: '' }))}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Choisissez parmi nos fonds prédéfinis ou uploadez votre propre image
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>Couleurs et branding</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Couleurs de base */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Couleur principale
                    </label>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer flex items-center justify-center"
                        style={{ 
                          background: formData.primaryColor // Le CSS généré est déjà dans primaryColor
                        }}
                        onClick={() => {
                          console.log("🎨 Opening primaryColor editor");
                          console.log("🎨 Current data:", {
                            color: formData.primaryColor,
                            gradient: formData.primaryColorGradient,
                            colors: formData.primaryGradientColors,
                            direction: formData.primaryGradientDirection
                          });
                          openGradientEditor('primaryColor');
                        }}
                        title="Cliquer pour éditer la couleur"
                      >
                        {formData.primaryColorGradient && (
                          <div className="w-6 h-6 bg-white rounded shadow-sm flex items-center justify-center">
                            <div 
                              className="w-4 h-4 rounded"
                              style={{
                                background: `linear-gradient(${formData.primaryGradientDirection}, ${formData.primaryGradientColors.join(', ')})`
                              }}
                            ></div>
                          </div>
                        )}
                      </div>
                      <Input
                        value={formData.primaryColor}
                        onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                        placeholder="#007b5c"
                        className="flex-1"
                        readOnly
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Couleur secondaire
                    </label>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer flex items-center justify-center"
                        style={{ 
                          background: formData.secondaryColor // Le CSS généré est déjà dans secondaryColor
                        }}
                        onClick={() => openGradientEditor('secondaryColor')}
                        title="Cliquer pour éditer la couleur"
                      >
                        {formData.secondaryColorGradient && (
                          <div className="w-6 h-6 bg-white rounded shadow-sm flex items-center justify-center">
                            <div 
                              className="w-4 h-4 rounded"
                              style={{
                                background: `linear-gradient(${formData.secondaryGradientDirection}, ${formData.secondaryGradientColors.join(', ')})`
                              }}
                            ></div>
                          </div>
                        )}
                      </div>
                      <Input
                        value={formData.secondaryColor}
                        onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                        placeholder="#ffffff"
                        className="flex-1"
                        readOnly
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Couleur de fond
                    </label>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer flex items-center justify-center"
                        style={{ 
                          background: formData.backgroundColor // Le CSS généré est déjà dans backgroundColor
                        }}
                        onClick={() => openGradientEditor('backgroundColor')}
                        title="Cliquer pour éditer la couleur"
                      >
                        {formData.backgroundColorGradient && (
                          <div className="w-6 h-6 bg-white rounded shadow-sm flex items-center justify-center">
                            <div 
                              className="w-4 h-4 rounded"
                              style={{
                                background: `linear-gradient(${formData.backgroundGradientDirection}, ${formData.backgroundGradientColors.join(', ')})`
                              }}
                            ></div>
                          </div>
                        )}
                      </div>
                      <Input
                        value={formData.backgroundColor}
                        onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                        placeholder="#f8f9fa"
                        className="flex-1"
                        readOnly
                      />
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Image className="h-5 w-5" />
                  <span>Images et logo</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Logo avec drag & drop */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo de l'entreprise
                    </label>
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                        dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'logoUrl')}
                      onClick={() => logoInputRef.current?.click()}
                    >
                      {formData.logoUrl ? (
                        <div className="space-y-2">
                          <img
                            src={formData.logoUrl}
                            alt="Logo preview"
                            className="mx-auto h-16 w-auto object-contain"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInputChange('logoUrl', '');
                            }}
                          >
                            Supprimer
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="mx-auto h-8 w-8 text-gray-400" />
                          <p className="text-sm text-gray-600">
                            Glissez-déposez votre logo ici
                          </p>
                          <p className="text-xs text-gray-500">ou cliquez pour sélectionner</p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, 'logoUrl')}
                    />
                  </div>
                  
                  {/* Bannière avec drag & drop */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image de bannière
                    </label>
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                        dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'bannerUrl')}
                      onClick={() => bannerInputRef.current?.click()}
                    >
                      {formData.bannerUrl ? (
                        <div className="space-y-2">
                          <img
                            src={formData.bannerUrl}
                            alt="Banner preview"
                            className="mx-auto h-16 w-auto object-cover rounded"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInputChange('bannerUrl', '');
                            }}
                          >
                            Supprimer
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="mx-auto h-8 w-8 text-gray-400" />
                          <p className="text-sm text-gray-600">
                            Glissez-déposez votre bannière ici
                          </p>
                          <p className="text-xs text-gray-500">ou cliquez pour sélectionner</p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, 'bannerUrl')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personnalisation des cartes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>Style des cartes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Couleur de fond des cartes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Couleur de fond des cartes
                    </label>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer flex items-center justify-center"
                        style={{ 
                          background: formData.cardBackgroundColor // Le CSS généré est déjà dans cardBackgroundColor
                        }}
                        onClick={() => openGradientEditor('cardBackgroundColor')}
                        title="Cliquer pour éditer la couleur"
                      >
                        {formData.cardBackgroundGradient && (
                          <div className="w-6 h-6 bg-white rounded shadow-sm flex items-center justify-center">
                            <div 
                              className="w-4 h-4 rounded"
                              style={{
                                background: `linear-gradient(${formData.cardBackgroundGradientDirection}, ${formData.cardBackgroundGradientColors.join(', ')})`
                              }}
                            ></div>
                          </div>
                        )}
                      </div>
                      <Input
                        value={formData.cardBackgroundColor}
                        onChange={(e) => handleInputChange('cardBackgroundColor', e.target.value)}
                        placeholder="#ffffff"
                        className="flex-1"
                        readOnly
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Couleur des bordures
                    </label>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        style={{ backgroundColor: formData.cardBorderColor }}
                        onClick={() => openGradientEditor('cardBorderColor')}
                        title="Cliquer pour éditer la couleur"
                      ></div>
                      <Input
                        value={formData.cardBorderColor}
                        onChange={(e) => handleInputChange('cardBorderColor', e.target.value)}
                        placeholder="#e5e7eb"
                        className="flex-1"
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Options de bordure */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Épaisseur de bordure (px)
                    </label>
                    <Input
                      type="number"
                      value={formData.cardBorderWidth}
                      onChange={(e) => handleInputChange('cardBorderWidth', parseInt(e.target.value) || 1)}
                      min="0"
                      max="10"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rayon des coins (px)
                    </label>
                    <Input
                      type="number"
                      value={formData.cardBorderRadius}
                      onChange={(e) => handleInputChange('cardBorderRadius', parseInt(e.target.value) || 8)}
                      min="0"
                      max="50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ombre
                    </label>
                    <Select
                      value={formData.cardShadow}
                      onChange={(e) => handleInputChange('cardShadow', e.target.value)}
                    >
                      <option value="none">Aucune</option>
                      <option value="sm">Petite</option>
                      <option value="md">Moyenne</option>
                      <option value="lg">Grande</option>
                      <option value="xl">Très grande</option>
                    </Select>
                  </div>
                </div>

                {/* Aperçu de la carte */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aperçu de la carte
                  </label>
                  <div 
                    className="p-4 rounded-lg border-2"
                    style={{
                      background: formData.cardBackgroundColor, // Le CSS généré est déjà dans cardBackgroundColor
                      borderColor: formData.cardBorderColor,
                      borderWidth: `${formData.cardBorderWidth}px`,
                      borderRadius: `${formData.cardBorderRadius}px`,
                      boxShadow: formData.cardShadow === 'none' ? 'none' : 
                                 formData.cardShadow === 'sm' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' :
                                 formData.cardShadow === 'md' ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' :
                                 formData.cardShadow === 'lg' ? '0 10px 15px -3px rgb(0 0 0 / 0.1)' :
                                 '0 25px 50px -12px rgb(0 0 0 / 0.25)'
                    }}
                  >
                    <h3 className="font-semibold text-gray-800 mb-2">Exemple de carte</h3>
                    <p className="text-sm text-gray-600">
                      Ceci est un aperçu de l'apparence de vos cartes avec les paramètres actuels.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personnalisation des mini-cartes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>Style des mini-cartes (produits et offres)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Couleur de fond des mini-cartes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Couleur de fond des mini-cartes
                    </label>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer flex items-center justify-center"
                        style={{ 
                          background: formData.miniCardBackgroundColor // Le CSS généré est déjà dans miniCardBackgroundColor
                        }}
                        onClick={() => openGradientEditor('miniCardBackgroundColor')}
                        title="Cliquer pour éditer la couleur"
                      >
                        {formData.miniCardBackgroundGradient && (
                          <div className="w-6 h-6 bg-white rounded shadow-sm flex items-center justify-center">
                            <div 
                              className="w-4 h-4 rounded"
                              style={{
                                background: `linear-gradient(${formData.miniCardBackgroundGradientDirection}, ${formData.miniCardBackgroundGradientColors.join(', ')})`
                              }}
                            ></div>
                          </div>
                        )}
                      </div>
                      <Input
                        value={formData.miniCardBackgroundColor}
                        onChange={(e) => handleInputChange('miniCardBackgroundColor', e.target.value)}
                        placeholder="#ffffff"
                        className="flex-1"
                        readOnly
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Couleur des bordures
                    </label>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        style={{ backgroundColor: formData.miniCardBorderColor }}
                        onClick={() => openGradientEditor('miniCardBorderColor')}
                        title="Cliquer pour éditer la couleur"
                      ></div>
                      <Input
                        value={formData.miniCardBorderColor}
                        onChange={(e) => handleInputChange('miniCardBorderColor', e.target.value)}
                        placeholder="#e5e7eb"
                        className="flex-1"
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Options de bordure des mini-cartes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Épaisseur de bordure (px)
                    </label>
                    <Input
                      type="number"
                      value={formData.miniCardBorderWidth}
                      onChange={(e) => handleInputChange('miniCardBorderWidth', parseInt(e.target.value) || 1)}
                      min="0"
                      max="10"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rayon des coins (px)
                    </label>
                    <Input
                      type="number"
                      value={formData.miniCardBorderRadius}
                      onChange={(e) => handleInputChange('miniCardBorderRadius', parseInt(e.target.value) || 8)}
                      min="0"
                      max="50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ombre
                    </label>
                    <Select
                      value={formData.miniCardShadow}
                      onChange={(e) => handleInputChange('miniCardShadow', e.target.value)}
                    >
                      <option value="none">Aucune</option>
                      <option value="sm">Petite</option>
                      <option value="md">Moyenne</option>
                      <option value="lg">Grande</option>
                      <option value="xl">Très grande</option>
                    </Select>
                  </div>
                </div>

                {/* Aperçu des mini-cartes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aperçu des mini-cartes
                  </label>
                  <div 
                    className="p-4 rounded-lg border-2"
                    style={{
                      background: formData.miniCardBackgroundColor, // Le CSS généré est déjà dans miniCardBackgroundColor
                      borderColor: formData.miniCardBorderColor,
                      borderWidth: `${formData.miniCardBorderWidth}px`,
                      borderRadius: `${formData.miniCardBorderRadius}px`,
                      boxShadow: formData.miniCardShadow === 'none' ? 'none' : 
                                formData.miniCardShadow === 'sm' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' :
                                formData.miniCardShadow === 'md' ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' :
                                formData.miniCardShadow === 'lg' ? '0 10px 15px -3px rgb(0 0 0 / 0.1)' :
                                '0 25px 50px -12px rgb(0 0 0 / 0.25)'
                    }}
                  >
                    <h3 className="font-semibold text-gray-800 mb-2">Exemple de mini-carte</h3>
                    <p className="text-sm text-gray-600">
                      Ceci est un aperçu de l'apparence de vos mini-cartes avec les paramètres actuels.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Type className="h-5 w-5" />
                  <span>Typographie</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Paramètres de typographie */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Police de caractères
                      </label>
                      <Select
                        value={formData.fontFamily}
                        onChange={(e) => handleInputChange('fontFamily', e.target.value)}
                      >
                        {/* Polices système */}
                        <optgroup label="Polices système">
                          <option value="Inter">Inter (Moderne)</option>
                          <option value="Roboto">Roboto (Google)</option>
                          <option value="Open Sans">Open Sans (Lisible)</option>
                          <option value="Montserrat">Montserrat (Élégant)</option>
                          <option value="Poppins">Poppins (Arrondi)</option>
                          <option value="Lato">Lato (Professionnel)</option>
                          <option value="Playfair Display">Playfair Display (Serif)</option>
                          <option value="Source Sans Pro">Source Sans Pro (Clean)</option>
                        </optgroup>
                        
                        {/* Polices personnalisées - Base */}
                        <optgroup label="Polices personnalisées">
                          <option value="Lava">Lava (Volcanique)</option>
                          <option value="Dacherry">Dacherry (Élégant)</option>
                          <option value="BebasNeue">BebasNeue (Bold)</option>
                          <option value="Garet">Garet (Moderne)</option>
                          <option value="LemonMilk">LemonMilk (Frais)</option>
                        </optgroup>
                        
                        {/* Polices thématiques */}
                        <optgroup label="Thématiques">
                          <option value="Christmas">Christmas (Noël)</option>
                          <option value="Halloween">Halloween (Épouvantable)</option>
                          <option value="Easter">Easter (Pâques)</option>
                          <option value="Valentine">Valentine (Romantique)</option>
                          <option value="Valentine Script">Valentine Script (Script romantique)</option>
                        </optgroup>
                        
                        {/* Polices fun */}
                        <optgroup label="Fun & Créatif">
                          <option value="Bouncy">Bouncy (Rebondissant)</option>
                          <option value="PastelPalooza">PastelPalooza (Pastel)</option>
                          <option value="Super Squad">Super Squad (Héros)</option>
                          <option value="Magic Funk">Magic Funk (Magique)</option>
                          <option value="Magic Sound">Magic Sound (Son magique)</option>
                          <option value="Starborn">Starborn (Étoile)</option>
                          <option value="Starbim">Starbim (Étoile brillante)</option>
                        </optgroup>
                        
                        {/* Polices élégantes */}
                        <optgroup label="Élégant & Luxe">
                          <option value="Vogue">Vogue (Mode)</option>
                          <option value="Woman">Woman (Féminin)</option>
                          <option value="Beauty">Beauty (Beauté)</option>
                          <option value="Beauty Display">Beauty Display (Beauté affichage)</option>
                        </optgroup>
                        
                        {/* Polices gaming */}
                        <optgroup label="Gaming">
                          <option value="Pokemon">Pokemon (Solide)</option>
                          <option value="Pokemon Hollow">Pokemon Hollow (Creux)</option>
                          <option value="Super Mario">Super Mario (Nintendo)</option>
                        </optgroup>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Taille (px)
                        </label>
                        <Input
                          type="number"
                          value={formData.fontSize}
                          onChange={(e) => handleInputChange('fontSize', parseInt(e.target.value))}
                          min="8"
                          max="72"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Poids
                        </label>
                        <Select
                          value={formData.fontWeight}
                          onChange={(e) => handleInputChange('fontWeight', e.target.value)}
                        >
                          <option value="normal">Normal (400)</option>
                          <option value="medium">Medium (500)</option>
                          <option value="semibold">Semi-bold (600)</option>
                          <option value="bold">Bold (700)</option>
                          <option value="extrabold">Extra-bold (800)</option>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Aperçu de la typographie */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aperçu
                    </label>
                    <div 
                      className="p-4 border rounded-lg bg-gray-50"
                      style={{
                        fontFamily: formData.fontFamily,
                        fontSize: `${formData.fontSize}px`,
                        fontWeight: formData.fontWeight,
                        color: formData.primaryColor
                      }}
                    >
                      <div className="space-y-2">
                        <h3 
                          style={{
                            fontFamily: formData.fontFamily,
                            fontSize: `${formData.fontSize}px`,
                            fontWeight: formData.fontWeight,
                            color: formData.primaryColor
                          }}
                        >
                          Titre de votre campagne
                        </h3>
                        <p 
                          style={{
                            fontFamily: formData.fontFamily,
                            fontSize: `${Math.max(formData.fontSize - 2, 10)}px`,
                            fontWeight: formData.fontWeight,
                            color: formData.primaryColor
                          }}
                        >
                          Ceci est un exemple de texte avec votre police sélectionnée. 
                          Vous pouvez voir comment elle s'affichera dans votre campagne.
                        </p>
                        <div 
                          style={{
                            fontFamily: formData.fontFamily,
                            fontSize: `${Math.max(formData.fontSize - 4, 8)}px`,
                            fontWeight: formData.fontWeight,
                            color: '#6b7280'
                          }}
                        >
                          Texte secondaire - {formData.fontFamily} {formData.fontSize}px
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-6">
            {/* Contenu dynamique */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Type className="h-5 w-5" />
                  <span>Contenu dynamique</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Offre principale
                  </label>
                  <Input
                    value={formData.mainOffer}
                    onChange={(e) => handleInputChange('mainOffer', e.target.value)}
                    placeholder="Jusqu'à -70% sur tous les produits !"
                  />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Texte du bouton CTA
                    </label>
                    <Input
                      value={formData.ctaText}
                      onChange={(e) => handleInputChange('ctaText', e.target.value)}
                      placeholder="Découvrir les offres"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Couleur du bouton CTA
                    </label>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer flex items-center justify-center"
                        style={{ 
                          background: formData.ctaButtonColor // Le CSS généré est déjà dans ctaButtonColor
                        }}
                        onClick={() => openGradientEditor('ctaButtonColor')}
                        title="Cliquer pour éditer la couleur"
                      >
                        {formData.ctaButtonColorGradient && (
                          <div className="w-6 h-6 bg-white rounded shadow-sm flex items-center justify-center">
                            <div 
                              className="w-4 h-4 rounded"
                              style={{
                                background: `linear-gradient(${formData.ctaButtonColorGradientDirection}, ${formData.ctaButtonColorGradientColors.join(', ')})`
                              }}
                            ></div>
                          </div>
                        )}
                      </div>
                      <Input
                        value={formData.ctaButtonColor}
                        onChange={(e) => handleInputChange('ctaButtonColor', e.target.value)}
                        placeholder="#007b5c"
                        className="flex-1"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Produits vedettes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShoppingBag className="h-5 w-5" />
                    <span>Produits vedettes</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addFeaturedProduct()}
                    className="flex items-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Ajouter manuellement</span>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Sélection de produits Shopify */}
                {shopifyProducts.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Sélectionner des produits de votre boutique
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto border rounded-lg p-4">
                      {shopifyProducts.map((product) => (
                        <div
                          key={product.id}
                          className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => addFeaturedProduct(product)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                              {product.featuredImage?.url ? (
                                <img
                                  src={product.featuredImage.url}
                                  alt={product.title}
                                  className="w-full h-full object-cover rounded"
                                />
                              ) : (
                                <ShoppingBag className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {product.title}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {product.variants?.edges?.[0]?.node?.price ? 
                                  `${parseFloat(product.variants.edges[0].node.price).toFixed(2)}€` : 
                                  'Prix non disponible'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Produits sélectionnés */}
                <div className="space-y-4">
                  {formData.featuredProducts.map((product: any, index: number) => (
                    <div key={product.id} className="border rounded-lg p-4">
                      <div className="flex items-start space-x-4">
                        {/* Image du produit */}
                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <ShoppingBag className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        
                        {/* Informations du produit */}
                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom du produit
                              </label>
                              <Input
                                value={product.name}
                                onChange={(e) => updateFeaturedProduct(product.id, 'name', e.target.value)}
                                placeholder="Nom du produit"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Image du produit
                              </label>
                              <Select
                                value={product.imageSource || 'url'}
                                onChange={(e) => updateFeaturedProduct(product.id, 'imageSource', e.target.value)}
                              >
                                <option value="url">Image URL</option>
                                <option value="shopify">Image dans la boutique</option>
                                <option value="upload">Upload d'image</option>
                              </Select>
                              
                              {product.imageSource === 'url' && (
                                <Input
                                  value={product.image}
                                  onChange={(e) => updateFeaturedProduct(product.id, 'image', e.target.value)}
                                  placeholder="https://..."
                                  className="mt-2"
                                />
                              )}
                              
                              {product.imageSource === 'shopify' && product.shopifyId && (
                                <div className="mt-2">
                                  <label className="block text-sm text-gray-600 mb-1">Sélectionner une image :</label>
                                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                                    {getShopifyProductImages(product.shopifyId).map((image: any, index: number) => (
                                      <div
                                        key={index}
                                        className={`cursor-pointer rounded border-2 p-1 transition-colors ${
                                          product.image === image.url ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                        onClick={() => updateFeaturedProduct(product.id, 'image', image.url)}
                                      >
                                        <img
                                          src={image.url}
                                          alt={image.altText || `Image ${index + 1}`}
                                          className="w-full h-16 object-cover rounded"
                                        />
                                      </div>
                                    ))}
                                    {getShopifyProductImages(product.shopifyId).length === 0 && (
                                      <div className="col-span-2 text-sm text-gray-500 text-center py-4">
                                        Aucune image disponible pour ce produit
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {product.imageSource === 'upload' && (
                                <div className="mt-2">
                                  <div
                                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                                      dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                                    }`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, `product-${product.id}-image`)}
                                    onClick={() => {
                                      const input = document.createElement('input');
                                      input.type = 'file';
                                      input.accept = 'image/*';
                                      input.onchange = (e: any) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = (event) => {
                                            updateFeaturedProduct(product.id, 'image', event.target?.result as string);
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      };
                                      input.click();
                                    }}
                                  >
                                    {product.image ? (
                                      <div className="space-y-2">
                                        <img
                                          src={product.image}
                                          alt="Product preview"
                                          className="mx-auto h-16 w-auto object-cover rounded"
                                        />
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateFeaturedProduct(product.id, 'image', '');
                                          }}
                                        >
                                          Supprimer
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                        <p className="text-sm text-gray-600">
                                          Glissez-déposez votre image ici
                                        </p>
                                        <p className="text-xs text-gray-500">ou cliquez pour sélectionner</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Prix original (€)
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                value={product.originalPrice}
                                onChange={(e) => updateFeaturedProduct(product.id, 'originalPrice', parseFloat(e.target.value))}
                                placeholder="0.00"
                                disabled={product.shopifyId} // Prix original verrouillé pour les produits Shopify
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Prix de réduction (€)
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                value={product.discountPrice}
                                onChange={(e) => updateFeaturedProduct(product.id, 'discountPrice', parseFloat(e.target.value))}
                                placeholder="0.00"
                              />
                            </div>
                            
                            <div className="flex items-end">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeFeaturedProduct(product.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <Input
                              value={product.description}
                              onChange={(e) => updateFeaturedProduct(product.id, 'description', e.target.value)}
                              placeholder="Description du produit"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {formData.featuredProducts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingBag className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                      <p>Aucun produit vedette ajouté</p>
                      <p className="text-sm">Sélectionnez des produits ci-dessus ou ajoutez-en manuellement</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Offres exceptionnelles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5" />
                    <span>Offres exceptionnelles</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSpecialOffer}
                    className="flex items-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Ajouter</span>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formData.specialOffers.map((offer: any, index: number) => (
                    <div key={offer.id} className="border rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Checkbox
                          checked={offer.enabled}
                          onChange={() => toggleSpecialOffer(offer.id)}
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Activer cette offre
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Titre de l'offre
                          </label>
                          <Input
                            value={offer.title}
                            onChange={(e) => updateSpecialOffer(offer.id, 'title', e.target.value)}
                            placeholder="Ex: Réduction jusqu'à -70%"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <Input
                            value={offer.description}
                            onChange={(e) => updateSpecialOffer(offer.id, 'description', e.target.value)}
                            placeholder="Ex: Sur une sélection de produits"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Couleur
                          </label>
                          <Select
                            value={offer.color}
                            onChange={(e) => updateSpecialOffer(offer.id, 'color', e.target.value)}
                          >
                            <option value="purple">Violet</option>
                            <option value="blue">Bleu</option>
                            <option value="green">Vert</option>
                            <option value="orange">Orange</option>
                            <option value="red">Rouge</option>
                            <option value="pink">Rose</option>
                          </Select>
                        </div>
                        
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeSpecialOffer(offer.id)}
                            className="text-red-600 hover:text-red-700 w-full"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Objectifs et KPIs</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Objectif de scans
                    </label>
                    <Input
                      type="number"
                      value={formData.targetScans}
                      onChange={(e) => handleInputChange('targetScans', parseInt(e.target.value))}
                      placeholder="1000"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Objectif d'inscriptions
                    </label>
                    <Input
                      type="number"
                      value={formData.targetSignups}
                      onChange={(e) => handleInputChange('targetSignups', parseInt(e.target.value))}
                      placeholder="200"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Budget (€)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.budget}
                      onChange={(e) => handleInputChange('budget', parseFloat(e.target.value))}
                      placeholder="500.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ROI attendu (%)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.expectedROI}
                      onChange={(e) => handleInputChange('expectedROI', parseFloat(e.target.value))}
                      placeholder="300.00"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Link className="h-5 w-5" />
                  <span>Intégrations tierces</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Google Analytics ID
                    </label>
                    <Input
                      value={formData.googleAnalyticsId}
                      onChange={(e) => handleInputChange('googleAnalyticsId', e.target.value)}
                      placeholder="G-XXXXXXXXXX"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facebook Pixel ID
                    </label>
                    <Input
                      value={formData.facebookPixelId}
                      onChange={(e) => handleInputChange('facebookPixelId', e.target.value)}
                      placeholder="123456789012345"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mailchimp List ID
                    </label>
                    <Input
                      value={formData.mailchimpListId}
                      onChange={(e) => handleInputChange('mailchimpListId', e.target.value)}
                      placeholder="abc123def456"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Klaviyo List ID
                    </label>
                    <Input
                      value={formData.klaviyoListId}
                      onChange={(e) => handleInputChange('klaviyoListId', e.target.value)}
                      placeholder="XyZ123AbC456"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>

      {/* Actions */}
      <div className="flex justify-between pt-6 border-t">
        <div>
          {onClose && (
            <Button
              variant="outline"
              onClick={onClose}
              className="flex items-center space-x-2"
            >
              <X className="h-4 w-4" />
              <span>Terminer</span>
            </Button>
          )}
        </div>
        
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={isLoading || isPreviewing}
            className="flex items-center space-x-2"
          >
            {isPreviewing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            <span>{isPreviewing ? 'Préparation...' : 'Aperçu'}</span>
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isLoading ? 'Sauvegarde...' : 'Sauvegarder'}</span>
          </Button>
        </div>
      </div>


        {/* Éditeur de couleurs/dégradés */}
        <GradientEditor
          isOpen={gradientEditor.isOpen}
          onClose={closeGradientEditor}
          currentColor={formData[gradientEditor.field as keyof typeof formData] as string || '#007b5c'}
          currentGradient={{
            direction: formData[`${gradientEditor.field}GradientDirection` as keyof typeof formData] as string || 'to right',
            colors: formData[`${gradientEditor.field}GradientColors` as keyof typeof formData] as string[] || ['#007b5c', '#00a86b'],
            isGradient: formData[`${gradientEditor.field}Gradient` as keyof typeof formData] as boolean || false
          }}
          onSave={handleGradientSave}
          fieldName={gradientEditor.field}
        />
        
        {/* Debug logs */}
        {gradientEditor.isOpen && (
          <div className="fixed bottom-4 right-4 bg-black text-white p-2 text-xs rounded">
            <div>Field: {gradientEditor.field}</div>
            <div>Color: {formData[gradientEditor.field as keyof typeof formData] as string}</div>
            <div>Gradient: {formData[`${gradientEditor.field}Gradient` as keyof typeof formData] ? 'true' : 'false'}</div>
            <div>Colors: {JSON.stringify(formData[`${gradientEditor.field}GradientColors` as keyof typeof formData])}</div>
          </div>
        )}

        {/* Sélecteur de fond d'écran */}
        <BackgroundSelector
          isOpen={backgroundSelector}
          onClose={() => setBackgroundSelector(false)}
          currentBackground={formData.backgroundImage}
          onSelect={handleBackgroundSelect}
        />
      </div>
    );
  }

