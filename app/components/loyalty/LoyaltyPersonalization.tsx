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
import { RewardsManager } from '../rewards/RewardsManager';
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
  Heart,
  Trophy,
  Crown,
  Award,
  Percent,
} from 'lucide-react';

interface LoyaltyPersonalizationProps {
  loyaltyProgram: any;
  onSave: (data: any) => void;
  onSaveForPreview?: (data: any) => void;
  onPreview: () => void;
  onClose?: () => void;
  isLoading?: boolean;
  saveSuccess?: boolean;
  previewSuccess?: boolean;
}

export default function LoyaltyPersonalization({ 
  loyaltyProgram, 
  onSave, 
  onSaveForPreview,
  onPreview, 
  onClose,
  isLoading = false,
  saveSuccess = false,
  previewSuccess = false
}: LoyaltyPersonalizationProps) {
  const [activeTab, setActiveTab] = useState('design');
  const [dragOver, setDragOver] = useState(false);
  const [gradientEditor, setGradientEditor] = useState<{isOpen: boolean, field: string}>({isOpen: false, field: ''});
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [backgroundSelector, setBackgroundSelector] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState(() => ({
    // 🎨 Design et branding
    primaryColor: loyaltyProgram?.primaryColor || '#007b5c',
    primaryColorGradient: loyaltyProgram?.primaryColorGradient || false,
    primaryGradientColors: Array.isArray(loyaltyProgram?.primaryGradientColors) ? loyaltyProgram.primaryGradientColors : ['#007b5c', '#00a86b'],
    primaryGradientDirection: loyaltyProgram?.primaryGradientDirection || 'to right',
    secondaryColor: loyaltyProgram?.secondaryColor || '#ffffff',
    secondaryColorGradient: loyaltyProgram?.secondaryColorGradient || false,
    secondaryGradientColors: Array.isArray(loyaltyProgram?.secondaryGradientColors) ? loyaltyProgram.secondaryGradientColors : ['#ffffff', '#f0f0f0'],
    secondaryGradientDirection: loyaltyProgram?.secondaryGradientDirection || 'to right',
    backgroundColor: loyaltyProgram?.backgroundColor || '#f8f9fa',
    backgroundColorGradient: loyaltyProgram?.backgroundColorGradient || false,
    backgroundGradientColors: Array.isArray(loyaltyProgram?.backgroundGradientColors) ? loyaltyProgram.backgroundGradientColors : ['#f8f9fa', '#e9ecef'],
    backgroundGradientDirection: loyaltyProgram?.backgroundGradientDirection || 'to right',
    backgroundImage: loyaltyProgram?.backgroundImage || '',
    
    // 🎨 Personnalisation des cartes
    cardBackgroundColor: loyaltyProgram?.cardBackgroundColor || '#ffffff',
    cardBackgroundGradient: loyaltyProgram?.cardBackgroundGradient || false,
    cardBackgroundGradientColors: Array.isArray(loyaltyProgram?.cardBackgroundGradientColors) ? loyaltyProgram.cardBackgroundGradientColors : ['#ffffff', '#f8f9fa'],
    cardBackgroundGradientDirection: loyaltyProgram?.cardBackgroundGradientDirection || 'to right',
    cardBorderColor: loyaltyProgram?.cardBorderColor || '#e5e7eb',
    cardBorderWidth: loyaltyProgram?.cardBorderWidth || 1,
    cardBorderRadius: loyaltyProgram?.cardBorderRadius || 8,
    cardShadow: loyaltyProgram?.cardShadow || 'lg',
    
    // 🎨 Personnalisation des mini-cartes (tiers)
    miniCardBackgroundColor: loyaltyProgram?.miniCardBackgroundColor || '#ffffff',
    miniCardBackgroundGradient: loyaltyProgram?.miniCardBackgroundGradient || false,
    miniCardBackgroundGradientColors: Array.isArray(loyaltyProgram?.miniCardBackgroundGradientColors) ? loyaltyProgram.miniCardBackgroundGradientColors : ['#ffffff', '#f8f9fa'],
    miniCardBackgroundGradientDirection: loyaltyProgram?.miniCardBackgroundGradientDirection || 'to right',
    miniCardBorderColor: loyaltyProgram?.miniCardBorderColor || '#e5e7eb',
    miniCardBorderWidth: loyaltyProgram?.miniCardBorderWidth || 1,
    miniCardBorderRadius: loyaltyProgram?.miniCardBorderRadius || 8,
    miniCardShadow: loyaltyProgram?.miniCardShadow || 'md',
    
    // 🎨 Typographie
    fontFamily: loyaltyProgram?.fontFamily || 'Inter',
    fontSize: loyaltyProgram?.fontSize || 16,
    fontWeight: loyaltyProgram?.fontWeight || 'normal',
    
    // 🎨 Boutons et CTA
    ctaButtonColor: loyaltyProgram?.ctaButtonColor || '#007b5c',
    ctaButtonColorGradient: loyaltyProgram?.ctaButtonColorGradient || false,
    ctaButtonColorGradientColors: Array.isArray(loyaltyProgram?.ctaButtonColorGradientColors) ? loyaltyProgram.ctaButtonColorGradientColors : ['#007b5c', '#00a86b'],
    ctaButtonColorGradientDirection: loyaltyProgram?.ctaButtonColorGradientDirection || 'to right',
    ctaText: loyaltyProgram?.ctaText || 'Découvrir la boutique',
    
    // 🎨 Images et branding
    logoUrl: loyaltyProgram?.logoUrl || '',
    bannerUrl: loyaltyProgram?.bannerUrl || '',
  }));

  // Mettre à jour le formData quand le loyaltyProgram change
  React.useEffect(() => {
    if (loyaltyProgram) {
      setFormData({
        // 🎨 Design et branding
        primaryColor: loyaltyProgram.primaryColor || '#007b5c',
        primaryColorGradient: loyaltyProgram.primaryColorGradient || false,
        primaryGradientColors: Array.isArray(loyaltyProgram.primaryGradientColors) ? loyaltyProgram.primaryGradientColors : ['#007b5c', '#00a86b'],
        primaryGradientDirection: loyaltyProgram.primaryGradientDirection || 'to right',
        secondaryColor: loyaltyProgram.secondaryColor || '#ffffff',
        secondaryColorGradient: loyaltyProgram.secondaryColorGradient || false,
        secondaryGradientColors: Array.isArray(loyaltyProgram.secondaryGradientColors) ? loyaltyProgram.secondaryGradientColors : ['#ffffff', '#f0f0f0'],
        secondaryGradientDirection: loyaltyProgram.secondaryGradientDirection || 'to right',
        backgroundColor: loyaltyProgram.backgroundColor || '#f8f9fa',
        backgroundColorGradient: loyaltyProgram.backgroundColorGradient || false,
        backgroundGradientColors: Array.isArray(loyaltyProgram.backgroundGradientColors) ? loyaltyProgram.backgroundGradientColors : ['#f8f9fa', '#e9ecef'],
        backgroundGradientDirection: loyaltyProgram.backgroundGradientDirection || 'to right',
        backgroundImage: loyaltyProgram.backgroundImage || '',
        
        // 🎨 Personnalisation des cartes
        cardBackgroundColor: loyaltyProgram.cardBackgroundColor || '#ffffff',
        cardBackgroundGradient: loyaltyProgram.cardBackgroundGradient || false,
        cardBackgroundGradientColors: Array.isArray(loyaltyProgram.cardBackgroundGradientColors) ? loyaltyProgram.cardBackgroundGradientColors : ['#ffffff', '#f8f9fa'],
        cardBackgroundGradientDirection: loyaltyProgram.cardBackgroundGradientDirection || 'to right',
        cardBorderColor: loyaltyProgram.cardBorderColor || '#e5e7eb',
        cardBorderWidth: loyaltyProgram.cardBorderWidth || 1,
        cardBorderRadius: loyaltyProgram.cardBorderRadius || 8,
        cardShadow: loyaltyProgram.cardShadow || 'lg',
        
        // 🎨 Personnalisation des mini-cartes (tiers)
        miniCardBackgroundColor: loyaltyProgram.miniCardBackgroundColor || '#ffffff',
        miniCardBackgroundGradient: loyaltyProgram.miniCardBackgroundGradient || false,
        miniCardBackgroundGradientColors: Array.isArray(loyaltyProgram.miniCardBackgroundGradientColors) ? loyaltyProgram.miniCardBackgroundGradientColors : ['#ffffff', '#f8f9fa'],
        miniCardBackgroundGradientDirection: loyaltyProgram.miniCardBackgroundGradientDirection || 'to right',
        miniCardBorderColor: loyaltyProgram.miniCardBorderColor || '#e5e7eb',
        miniCardBorderWidth: loyaltyProgram.miniCardBorderWidth || 1,
        miniCardBorderRadius: loyaltyProgram.miniCardBorderRadius || 8,
        miniCardShadow: loyaltyProgram.miniCardShadow || 'md',
        
        // 🎨 Typographie
        fontFamily: loyaltyProgram.fontFamily || 'Inter',
        fontSize: loyaltyProgram.fontSize || 16,
        fontWeight: loyaltyProgram.fontWeight || 'normal',
        
        // 🎨 Boutons et CTA
        ctaButtonColor: loyaltyProgram.ctaButtonColor || '#007b5c',
        ctaButtonColorGradient: loyaltyProgram.ctaButtonColorGradient || false,
        ctaButtonColorGradientColors: Array.isArray(loyaltyProgram.ctaButtonColorGradientColors) ? loyaltyProgram.ctaButtonColorGradientColors : ['#007b5c', '#00a86b'],
        ctaButtonColorGradientDirection: loyaltyProgram.ctaButtonColorGradientDirection || 'to right',
        ctaText: loyaltyProgram.ctaText || 'Découvrir la boutique',
        
        // 🎨 Images et branding
        logoUrl: loyaltyProgram.logoUrl || '',
        bannerUrl: loyaltyProgram.bannerUrl || '',
      });
    }
  }, [loyaltyProgram]);

  const tabs = [
    { id: 'design', label: 'Design', icon: Palette },
    { id: 'program', label: 'Programme', icon: Heart },
    { id: 'tiers', label: 'Paliers', icon: Trophy },
    { id: 'rewards', label: 'Récompenses', icon: Gift },
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
    console.log("🎨 Sauvegarde dégradé loyalty:", { field, result });
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [`${field}Gradient`]: result.isGradient,
        [`${field}GradientColors`]: result.colors,
        [`${field}GradientDirection`]: result.direction,
        [field]: result.color
      } as any;
      
      console.log("🎨 Nouvelles données loyalty:", newData);
      return newData;
    });
    closeGradientEditor();
  };

  // 🖼️ Gestion du sélecteur de background
  const handleBackgroundSelect = (backgroundUrl: string) => {
    setFormData(prev => ({ ...prev, backgroundImage: backgroundUrl }));
  };

  const handleSave = () => {
    console.log("💾 Sauvegarde loyalty formData:", formData);
    onSave(formData);
  };

  const handlePreview = () => {
    setIsPreviewing(true);
    if (onSaveForPreview) {
      onSaveForPreview(formData);
    } else {
      onSave(formData);
    }
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
    e.target.value = '';
  };

  // Fonction pour obtenir le style des mini-cartes (tiers)
  const getMiniCardStyle = () => {
    const background = formData.miniCardBackgroundColor;
    
    const shadowMap = {
      'none': 'none',
      'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      'md': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      'xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)'
    };

    return {
      background,
      borderColor: formData.miniCardBorderColor,
      borderWidth: `${formData.miniCardBorderWidth}px`,
      borderRadius: `${formData.miniCardBorderRadius}px`,
      boxShadow: shadowMap[formData.miniCardShadow as keyof typeof shadowMap] || shadowMap.md
    };
  };

  return (
    <div className="space-y-6">
      {/* Messages de succès */}
      {saveSuccess && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">Personnalisation loyalty sauvegardée avec succès !</span>
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

            {/* Couleurs et branding */}
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
                          background: formData.primaryColor
                        }}
                        onClick={() => openGradientEditor('primaryColor')}
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
                          background: formData.secondaryColor
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
                          background: formData.backgroundColor
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

            {/* Images et logo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Image className="h-5 w-5" />
                  <span>Images et logo</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Logo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo de l'entreprise
                    </label>
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                        dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
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
                            Cliquez pour sélectionner votre logo
                          </p>
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
                  
                  {/* Bannière */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image de bannière
                    </label>
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                        dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
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
                            Cliquez pour sélectionner votre bannière
                          </p>
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

            {/* Style des cartes */}
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
                          background: formData.cardBackgroundColor
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
                      background: formData.cardBackgroundColor,
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

            {/* Style des mini-cartes (tiers) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>Style des mini-cartes (paliers)</span>
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
                          background: formData.miniCardBackgroundColor
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
                    Aperçu des mini-cartes (paliers)
                  </label>
                  <div 
                    className="p-4 rounded-lg border-2"
                    style={{
                      background: formData.miniCardBackgroundColor,
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
                    <h3 className="font-semibold text-gray-800 mb-2">Exemple de mini-carte (palier)</h3>
                    <p className="text-sm text-gray-600">
                      Ceci est un aperçu de l'apparence de vos mini-cartes avec les paramètres actuels.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Typographie */}
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
                        <option value="Inter">Inter (Moderne)</option>
                        <option value="Roboto">Roboto (Google)</option>
                        <option value="Open Sans">Open Sans (Lisible)</option>
                        <option value="Montserrat">Montserrat (Élégant)</option>
                        <option value="Poppins">Poppins (Arrondi)</option>
                        <option value="Lato">Lato (Professionnel)</option>
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
                          Programme de fidélité
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
                          Vous pouvez voir comment elle s'affichera dans votre page loyalty.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'program' && (
          <div className="space-y-6">
            {/* Configuration du programme */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5" />
                  <span>Configuration du programme</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du programme
                    </label>
                    <Input
                      value={loyaltyProgram?.name || ''}
                      placeholder="Programme de fidélité"
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Le nom du programme ne peut pas être modifié ici
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Points par scan
                    </label>
                    <Input
                      type="number"
                      value={loyaltyProgram?.pointsPerScan || 1}
                      placeholder="1"
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Points attribués à chaque scan de QR code
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description du programme
                  </label>
                  <Input
                    value={loyaltyProgram?.description || ''}
                    placeholder="Gagnez des points à chaque scan de QR code"
                    readOnly
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
                      placeholder="Découvrir la boutique"
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
                          background: formData.ctaButtonColor
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
          </div>
        )}

        {activeTab === 'tiers' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5" />
                  <span>Configuration des paliers</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Bronze */}
                    <div 
                      className="p-4 border-2 border-amber-200 rounded-lg bg-amber-50"
                      style={getMiniCardStyle()}
                    >
                      <div className="flex items-center mb-2">
                        <Star className="h-5 w-5 text-amber-600 mr-2" />
                        <span className="font-medium">Bronze</span>
                      </div>
                      <p className="text-sm text-gray-600">0-99 points</p>
                      <p className="text-xs text-amber-700 mt-1">5% de réduction</p>
                    </div>

                    {/* Silver */}
                    <div 
                      className="p-4 border-2 border-gray-200 rounded-lg bg-gray-50"
                      style={getMiniCardStyle()}
                    >
                      <div className="flex items-center mb-2">
                        <Award className="h-5 w-5 text-gray-600 mr-2" />
                        <span className="font-medium">Silver</span>
                      </div>
                      <p className="text-sm text-gray-600">100-499 points</p>
                      <p className="text-xs text-gray-700 mt-1">10% de réduction</p>
                    </div>

                    {/* Gold */}
                    <div 
                      className="p-4 border-2 border-yellow-200 rounded-lg bg-yellow-50"
                      style={getMiniCardStyle()}
                    >
                      <div className="flex items-center mb-2">
                        <Trophy className="h-5 w-5 text-yellow-600 mr-2" />
                        <span className="font-medium">Gold</span>
                      </div>
                      <p className="text-sm text-gray-600">500-999 points</p>
                      <p className="text-xs text-yellow-700 mt-1">15% de réduction</p>
                    </div>

                    {/* Platinum */}
                    <div 
                      className="p-4 border-2 border-purple-200 rounded-lg bg-purple-50"
                      style={getMiniCardStyle()}
                    >
                      <div className="flex items-center mb-2">
                        <Crown className="h-5 w-5 text-purple-600 mr-2" />
                        <span className="font-medium">Platinum</span>
                      </div>
                      <p className="text-sm text-gray-600">1000+ points</p>
                      <p className="text-xs text-purple-700 mt-1">20% de réduction</p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Comment gagner des points</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Scanner le QR code : +{loyaltyProgram?.pointsPerScan || 1} point(s)</li>
                      <li>• Passer une commande : +1 point par euro</li>
                      <li>• Visiter régulièrement : +5 points bonus</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

              {activeTab === 'rewards' && (
                <div className="space-y-6">
                  <RewardsManager merchantId={loyaltyProgram?.merchantId} />
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
