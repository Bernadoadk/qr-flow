import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { RewardConfigurator, type RewardTemplate } from "~/components/rewards/RewardConfigurator";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Percent, 
  Truck, 
  Package, 
  Zap,
  Gift,
  Eye,
  EyeOff
} from "lucide-react";

interface LoyaltyRewardsManagerProps {
  merchantId: string;
}

const REWARD_TYPES = [
  { 
    type: 'discount', 
    label: 'Réduction en %', 
    icon: Percent,
    description: 'Code de réduction en pourcentage'
  },
  { 
    type: 'free_shipping', 
    label: 'Livraison gratuite', 
    icon: Truck,
    description: 'Livraison gratuite sur commande'
  },
  { 
    type: 'exclusive_product', 
    label: 'Produit exclusif', 
    icon: Package,
    description: 'Accès à des produits exclusifs'
  },
  { 
    type: 'early_access', 
    label: 'Accès anticipé', 
    icon: Zap,
    description: 'Accès anticipé aux ventes'
  }
];

const TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum'];

export function LoyaltyRewardsManager({ merchantId }: LoyaltyRewardsManagerProps) {
  const [rewardTemplates, setRewardTemplates] = useState<RewardTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RewardTemplate | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>('Bronze');

  // Fallback: utiliser le domaine de la boutique si merchantId n'est pas fourni
  const effectiveMerchantId = merchantId || window.location.hostname.replace('.trycloudflare.com', '');

  useEffect(() => {
    loadRewardTemplates();
  }, [effectiveMerchantId]);

  const loadRewardTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/loyalty/rewards/templates?merchantId=${effectiveMerchantId}`);
      
      if (response.ok) {
        const data = await response.json();
        setRewardTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Erreur chargement templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleEditTemplate = (template: RewardTemplate) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleSaveTemplate = async (template: RewardTemplate) => {
    try {
      const requestBody = { 
        merchantId: effectiveMerchantId,
        template: {
          ...template
        }
      };
      
      const response = await fetch('/api/loyalty/rewards/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (response.ok) {
        await loadRewardTemplates();
        setIsModalOpen(false);
        setEditingTemplate(null);
      } else {
        const errorData = await response.json();
        console.error('Erreur API:', errorData);
        alert(`Erreur: ${errorData.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette récompense ?')) {
      return;
    }

    try {
      const response = await fetch('/api/loyalty/rewards/templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          merchantId: effectiveMerchantId,
          templateId 
        })
      });
      
      if (response.ok) {
        await loadRewardTemplates();
      } else {
        const errorData = await response.json();
        alert(`Erreur: ${errorData.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const toggleTemplateActive = async (template: RewardTemplate) => {
    try {
      const updatedTemplate = { ...template, isActive: !template.isActive };
      await handleSaveTemplate(updatedTemplate);
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    }
  };

  const getTemplatesForTier = (tier: string) => {
    return rewardTemplates.filter(template => template.tier === tier);
  };

  const getRewardTypeInfo = (type: string) => {
    return REWARD_TYPES.find(rt => rt.type === type) || REWARD_TYPES[0];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement des récompenses...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Gift className="h-5 w-5 mr-2 text-purple-600" />
              Gestion des récompenses par palier
            </CardTitle>
            <Button onClick={handleCreateTemplate} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Ajouter une récompense
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-6">
            Configurez les récompenses automatiques pour chaque palier de votre programme de fidélité.
            Les récompenses sont appliquées automatiquement quand un client atteint un nouveau palier.
          </p>

          {/* Tiers Navigation */}
          <div className="flex gap-2 mb-6">
            {TIERS.map(tier => (
              <Button
                key={tier}
                variant={selectedTier === tier ? "default" : "outline"}
                onClick={() => setSelectedTier(tier)}
                className="flex items-center gap-2"
              >
                {tier}
                <Badge variant="secondary" className="ml-1">
                  {getTemplatesForTier(tier).length}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Templates for selected tier */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Récompenses {selectedTier}
            </h3>
            
            {getTemplatesForTier(selectedTier).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Gift className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucune récompense configurée pour le palier {selectedTier}</p>
                <Button 
                  onClick={handleCreateTemplate}
                  variant="outline"
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter la première récompense
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getTemplatesForTier(selectedTier).map((template, index) => {
                  const rewardTypeInfo = getRewardTypeInfo(template.rewardType);
                  const IconComponent = rewardTypeInfo.icon;
                  
                  return (
                    <Card key={template.id || index} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              template.isActive ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                              <IconComponent className={`h-5 w-5 ${
                                template.isActive ? 'text-green-600' : 'text-gray-400'
                              }`} />
                            </div>
                            <div>
                              <h4 className="font-medium">{rewardTypeInfo.label}</h4>
                              <p className="text-sm text-gray-600">{rewardTypeInfo.description}</p>
                              {template.rewardType === 'discount' && (
                                <p className="text-sm text-blue-600 font-medium">
                                  {template.value?.percentage || 10}% de réduction
                                </p>
                              )}
                              {template.rewardType === 'free_shipping' && (
                                <p className="text-sm text-blue-600 font-medium">
                                  Livraison gratuite dès {template.value?.minimum_order_amount || 50}€
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleTemplateActive(template)}
                              className={template.isActive ? 'text-green-600' : 'text-gray-400'}
                            >
                              {template.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTemplate(template)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => template.id && handleDeleteTemplate(template.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center gap-2">
                          <Badge variant={template.isActive ? "default" : "secondary"}>
                            {template.isActive ? "Actif" : "Inactif"}
                          </Badge>
                          <Badge variant="outline">
                            {template.tier}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal for creating/editing templates */}
      <RewardConfigurator
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTemplate(null);
        }}
        onSave={handleSaveTemplate}
        reward={editingTemplate}
        selectedTier={selectedTier}
      />
    </div>
  );
}