import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { motion } from 'framer-motion';
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
} from 'lucide-react';

interface CampaignPersonalizationProps {
  campaign: any;
  onSave: (data: any) => void;
  onPreview: () => void;
  isLoading?: boolean;
}

export default function CampaignPersonalization({ 
  campaign, 
  onSave, 
  onPreview, 
  isLoading = false 
}: CampaignPersonalizationProps) {
  const [activeTab, setActiveTab] = useState('design');
  const [formData, setFormData] = useState({
    // 🎨 Design et branding
    primaryColor: campaign?.primaryColor || '#007b5c',
    secondaryColor: campaign?.secondaryColor || '#ffffff',
    backgroundColor: campaign?.backgroundColor || '#f8f9fa',
    logoUrl: campaign?.logoUrl || '',
    bannerUrl: campaign?.bannerUrl || '',
    fontFamily: campaign?.fontFamily || 'Inter',
    
    // 📝 Contenu dynamique
    mainOffer: campaign?.mainOffer || '',
    ctaText: campaign?.ctaText || 'Découvrir les offres',
    ctaButtonColor: campaign?.ctaButtonColor || '#007b5c',
    
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
  });

  const tabs = [
    { id: 'design', label: 'Design', icon: Palette },
    { id: 'content', label: 'Contenu', icon: Type },
    { id: 'goals', label: 'Objectifs', icon: Target },
    { id: 'integrations', label: 'Intégrations', icon: Link },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  const handlePreview = () => {
    onPreview();
  };

  return (
    <div className="space-y-6">
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>Couleurs et branding</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Couleur principale
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <Input
                        value={formData.primaryColor}
                        onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                        placeholder="#007b5c"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Couleur secondaire
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.secondaryColor}
                        onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <Input
                        value={formData.secondaryColor}
                        onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                        placeholder="#ffffff"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Couleur de fond
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.backgroundColor}
                        onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <Input
                        value={formData.backgroundColor}
                        onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                        placeholder="#f8f9fa"
                        className="flex-1"
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
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL du logo
                    </label>
                    <Input
                      value={formData.logoUrl}
                      onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL de la bannière
                    </label>
                    <Input
                      value={formData.bannerUrl}
                      onChange={(e) => handleInputChange('bannerUrl', e.target.value)}
                      placeholder="https://example.com/banner.jpg"
                    />
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
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-6">
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <input
                        type="color"
                        value={formData.ctaButtonColor}
                        onChange={(e) => handleInputChange('ctaButtonColor', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <Input
                        value={formData.ctaButtonColor}
                        onChange={(e) => handleInputChange('ctaButtonColor', e.target.value)}
                        placeholder="#007b5c"
                        className="flex-1"
                      />
                    </div>
                  </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button
          variant="outline"
          onClick={handlePreview}
          className="flex items-center space-x-2"
        >
          <Eye className="h-4 w-4" />
          <span>Aperçu</span>
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
  );
}

