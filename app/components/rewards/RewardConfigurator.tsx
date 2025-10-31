import React, { useState, useEffect } from 'react';
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Badge } from "~/components/ui/Badge";
import Modal from "~/components/ui/Modal";
import { 
  Save, 
  X, 
  Plus, 
  Percent, 
  Truck, 
  Package, 
  Zap,
  Clock,
  Target,
  Settings,
  Search,
  Check,
  X as XIcon
} from "lucide-react";

export interface RewardTemplate {
  id?: string;
  merchantId?: string;
  tier: string;
  rewardType: "discount" | "free_shipping" | "exclusive_product" | "early_access";
  value: {
    title?: string;
    description?: string;
    usage_count?: number;
    max_uses?: number | null;
    duration_days?: number | null;
    activation_delay_days?: number;
    [key: string]: any; // Configuration spécifique selon le type
  };
  isActive?: boolean;
}

interface RewardConfiguratorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reward: RewardTemplate) => void;
  reward?: RewardTemplate | null;
  selectedTier: string;
}

const REWARD_TYPES = [
  { 
    type: 'discount', 
    label: 'Réduction en %', 
    icon: Percent,
    description: 'Code de réduction en pourcentage',
    color: 'bg-blue-100 text-blue-800'
  },
  { 
    type: 'free_shipping', 
    label: 'Livraison gratuite', 
    icon: Truck,
    description: 'Livraison gratuite sur commande',
    color: 'bg-green-100 text-green-800'
  },
  { 
    type: 'exclusive_product', 
    label: 'Produit exclusif', 
    icon: Package,
    description: 'Accès à des produits exclusifs',
    color: 'bg-purple-100 text-purple-800'
  },
  { 
    type: 'early_access', 
    label: 'Accès anticipé', 
    icon: Zap,
    description: 'Accès anticipé aux ventes',
    color: 'bg-orange-100 text-orange-800'
  }
];

const TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum'];

export function RewardConfigurator({ 
  isOpen, 
  onClose, 
  onSave, 
  reward, 
  selectedTier 
}: RewardConfiguratorProps) {
  const [formData, setFormData] = useState<RewardTemplate>({
    tier: selectedTier,
    rewardType: 'discount',
    value: {
      title: '',
      description: '',
      usage_count: 0,
      max_uses: null,
      duration_days: 30,
      activation_delay_days: 0
    },
    isActive: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialiser le formulaire avec les données de la récompense existante
  useEffect(() => {
    if (reward) {
      setFormData({
        ...reward,
        tier: reward.tier || selectedTier
      });
    } else {
      setFormData({
        tier: selectedTier,
        rewardType: 'discount',
        value: {
          title: '',
          description: '',
          usage_count: 0,
          max_uses: null,
          duration_days: 30,
          activation_delay_days: 0
        },
        isActive: true
      });
    }
  }, [reward, selectedTier]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Effacer l'erreur pour ce champ
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleConfigChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      value: {
        ...prev.value,
        [field]: value
      }
    }));
  };

  const handleRewardTypeChange = (rewardType: string) => {
    setFormData(prev => ({
      ...prev,
      rewardType: rewardType as any,
      value: getDefaultConfig(rewardType)
    }));
  };

  const getDefaultConfig = (rewardType: string) => {
    switch (rewardType) {
      case 'discount':
        return {
          discount_scope: 'order',
          percentage: 10,
          code_prefix: 'LOYALTY',
          minimum_order_amount: 0,
          maximum_discount_amount: null,
          target_products: [],
          target_collections: [],
          applies_once_per_customer: true
        };
      case 'free_shipping':
        return {
          eligible_zones: 'all',
          minimum_order_amount: 50,
          requires_code: true,
          shipping_methods: [],
          excluded_zones: []
        };
      case 'exclusive_product':
        return {
          access_type: 'exclusive',
          access_logic: 'hidden_from_non_members',
          product_ids: [],
          collection_ids: [],
          max_quantity_per_customer: null,
          discount_percentage: 0,
          priority_access: true,
          auto_add_to_cart: false,
          shopify_customer_tag: `exclusive_${selectedTier.toLowerCase()}_access`
        };
      case 'early_access':
        return {
          event_type: 'product_launch',
          access_start_date: new Date().toISOString(),
          access_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          grace_period_hours: 24,
          collections_concerned: [],
          product_ids: [],
          discount_percentage: 0,
          notification_enabled: true,
          shopify_customer_tag: `early_access_${selectedTier.toLowerCase()}`
        };
      default:
        return {};
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.value.title?.trim()) {
      newErrors.title = 'Le titre est requis';
    }

    if (!formData.value.description?.trim()) {
      newErrors.description = 'La description est requise';
    }

    if (!formData.tier) {
      newErrors.tier = 'Le palier est requis';
    }

    // Validation spécifique selon le type
    switch (formData.rewardType) {
      case 'discount':
        if (!formData.value.percentage || formData.value.percentage < 1 || formData.value.percentage > 100) {
          newErrors.percentage = 'Le pourcentage doit être entre 1 et 100';
        }
        if (!formData.value.code_prefix?.trim()) {
          newErrors.code_prefix = 'Le préfixe du code est requis';
        }
        break;
      case 'free_shipping':
        if (formData.value.minimum_order_amount < 0) {
          newErrors.minimum_order_amount = 'Le montant minimum ne peut pas être négatif';
        }
        break;
      case 'early_access':
        if (!formData.value.access_start_date) {
          newErrors.access_start_date = 'La date de début est requise';
        }
        if (!formData.value.access_end_date) {
          newErrors.access_end_date = 'La date de fin est requise';
        }
        if (formData.value.access_start_date && formData.value.access_end_date) {
          if (new Date(formData.value.access_start_date) >= new Date(formData.value.access_end_date)) {
            newErrors.access_end_date = 'La date de fin doit être postérieure à la date de début';
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    onSave(formData);
    onClose();
  };

  const getRewardTypeInfo = (type: string) => {
    return REWARD_TYPES.find(rt => rt.type === type) || REWARD_TYPES[0];
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={reward ? "Modifier la récompense" : "Créer une récompense"}
      size="xl"
    >
      <div className="space-y-6">
        {/* Informations de base */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Informations de base
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre *
              </label>
              <Input
                value={formData.value.title || ''}
                onChange={(e) => handleConfigChange('title', e.target.value)}
                placeholder="Nom de la récompense"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Palier *
              </label>
              <select
                value={formData.tier}
                onChange={(e) => handleInputChange('tier', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TIERS.map(tier => (
                  <option key={tier} value={tier}>{tier}</option>
                ))}
              </select>
              {errors.tier && <p className="text-red-500 text-xs mt-1">{errors.tier}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.value.description || ''}
              onChange={(e) => handleConfigChange('description', e.target.value)}
              placeholder="Description de la récompense pour le client"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>
        </div>

        {/* Type de récompense */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5" />
            Type de récompense
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            {REWARD_TYPES.map(type => {
              const IconComponent = type.icon;
              const isSelected = formData.rewardType === type.type;
              
              return (
                <button
                  key={type.type}
                  onClick={() => handleRewardTypeChange(type.type)}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <IconComponent className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                    </div>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-gray-600">{type.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Configuration spécifique */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration
          </h3>
          
          <RewardConfigurationForm
            rewardType={formData.rewardType}
            configuration={formData.value}
            onConfigChange={handleConfigChange}
            errors={errors}
          />
        </div>

        {/* Paramètres généraux */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Paramètres généraux
          </h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée (jours)
              </label>
              <Input
                type="number"
                value={formData.value.duration_days || ''}
                onChange={(e) => handleConfigChange('duration_days', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="30"
                min="1"
                max="365"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Délai d'activation (jours)
              </label>
              <Input
                type="number"
                value={formData.value.activation_delay_days || 0}
                onChange={(e) => handleConfigChange('activation_delay_days', parseInt(e.target.value))}
                placeholder="0"
                min="0"
                max="30"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Limite d'utilisations
              </label>
              <Input
                type="number"
                value={formData.value.max_uses || ''}
                onChange={(e) => handleConfigChange('max_uses', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Illimité"
                min="1"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={formData.isActive || false}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="active" className="text-sm text-gray-700">
              Récompense active
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            {reward ? 'Modifier' : 'Créer'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Composant pour la configuration spécifique selon le type de récompense
 */
function RewardConfigurationForm({ 
  rewardType, 
  configuration, 
  onConfigChange, 
  errors 
}: {
  rewardType: string;
  configuration: any;
  onConfigChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}) {
  switch (rewardType) {
    case 'discount':
      return <DiscountConfigurationForm configuration={configuration} onConfigChange={onConfigChange} errors={errors} />;
    case 'free_shipping':
      return <FreeShippingConfigurationForm configuration={configuration} onConfigChange={onConfigChange} errors={errors} />;
    case 'exclusive_product':
      return <ExclusiveProductConfigurationForm configuration={configuration} onConfigChange={onConfigChange} errors={errors} />;
    case 'early_access':
      return <EarlyAccessConfigurationForm configuration={configuration} onConfigChange={onConfigChange} errors={errors} />;
    default:
      return null;
  }
}

// Composants de configuration spécifiques (simplifiés pour l'exemple)
function DiscountConfigurationForm({ configuration, onConfigChange, errors }: any) {
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showCollectionSelector, setShowCollectionSelector] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Portée</label>
          <select
            value={configuration.discount_scope || 'order'}
            onChange={(e) => onConfigChange('discount_scope', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="order">Commande entière</option>
            <option value="product">Produits spécifiques</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Pourcentage (%)</label>
          <Input
            type="number"
            value={configuration.percentage || 10}
            onChange={(e) => onConfigChange('percentage', parseInt(e.target.value))}
            min="1"
            max="100"
            className={errors.percentage ? 'border-red-500' : ''}
          />
          {errors.percentage && <p className="text-red-500 text-xs mt-1">{errors.percentage}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Préfixe du code</label>
          <Input
            value={configuration.code_prefix || 'LOYALTY'}
            onChange={(e) => onConfigChange('code_prefix', e.target.value)}
            className={errors.code_prefix ? 'border-red-500' : ''}
          />
          {errors.code_prefix && <p className="text-red-500 text-xs mt-1">{errors.code_prefix}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Montant minimum (€)</label>
          <Input
            type="number"
            value={configuration.minimum_order_amount || 0}
            onChange={(e) => onConfigChange('minimum_order_amount', parseInt(e.target.value))}
            min="0"
          />
        </div>
      </div>

      {/* Configuration des produits spécifiques */}
      {configuration.discount_scope === 'product' && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-800 mb-3">Configuration des produits éligibles</h4>
          
          <div className="space-y-4">
            {/* Sélection des produits */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Produits éligibles
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowProductSelector(!showProductSelector)}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    {showProductSelector ? 'Masquer' : 'Sélectionner'} les produits
                  </button>
                  <span className="text-sm text-gray-600">
                    {configuration.target_products?.length || 0} produit(s) sélectionné(s)
                  </span>
                </div>
                
                {showProductSelector && (
                  <ProductSelector
                    selectedProducts={configuration.target_products || []}
                    onProductsChange={(products) => onConfigChange('target_products', products)}
                  />
                )}
              </div>
            </div>

            {/* Sélection des collections */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collections éligibles
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCollectionSelector(!showCollectionSelector)}
                    className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    {showCollectionSelector ? 'Masquer' : 'Sélectionner'} les collections
                  </button>
                  <span className="text-sm text-gray-600">
                    {configuration.target_collections?.length || 0} collection(s) sélectionnée(s)
                  </span>
                </div>
                
                {showCollectionSelector && (
                  <CollectionSelector
                    selectedCollections={configuration.target_collections || []}
                    onCollectionsChange={(collections) => onConfigChange('target_collections', collections)}
                  />
                )}
              </div>
            </div>

            {/* Informations sur la configuration */}
            <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
              <p className="text-xs text-yellow-800">
                💡 <strong>Astuce :</strong> Vous pouvez sélectionner des produits spécifiques ET/OU des collections. 
                La réduction s'appliquera sur tous les produits correspondants.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Configuration supplémentaire */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Montant maximum de réduction (€)</label>
          <Input
            type="number"
            value={configuration.maximum_discount_amount || ''}
            onChange={(e) => onConfigChange('maximum_discount_amount', e.target.value ? parseInt(e.target.value) : null)}
            min="0"
            placeholder="Illimité"
          />
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={configuration.applies_once_per_customer || false}
            onChange={(e) => onConfigChange('applies_once_per_customer', e.target.checked)}
            className="mr-2"
          />
          <label className="text-sm text-gray-700">Une seule utilisation par client</label>
        </div>
      </div>
    </div>
  );
}

function FreeShippingConfigurationForm({ configuration, onConfigChange, errors }: any) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Zones éligibles</label>
        <select
          value={configuration.eligible_zones || 'all'}
          onChange={(e) => onConfigChange('eligible_zones', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="all">Toutes les zones</option>
          <option value="local">Zone locale</option>
          <option value="international">International</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Montant minimum (€)</label>
        <Input
          type="number"
          value={configuration.minimum_order_amount || 50}
          onChange={(e) => onConfigChange('minimum_order_amount', parseInt(e.target.value))}
          min="0"
          className={errors.minimum_order_amount ? 'border-red-500' : ''}
        />
        {errors.minimum_order_amount && <p className="text-red-500 text-xs mt-1">{errors.minimum_order_amount}</p>}
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={configuration.requires_code || false}
          onChange={(e) => onConfigChange('requires_code', e.target.checked)}
          className="mr-2"
        />
        <label className="text-sm text-gray-700">Générer un code</label>
      </div>
    </div>
  );
}

function ExclusiveProductConfigurationForm({ configuration, onConfigChange, errors }: any) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type d'accès</label>
          <select
            value={configuration.access_type || 'exclusive'}
            onChange={(e) => onConfigChange('access_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="exclusive">Exclusif</option>
            <option value="offered">Offert</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Logique d'accès</label>
          <select
            value={configuration.access_logic || 'hidden_from_non_members'}
            onChange={(e) => onConfigChange('access_logic', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="hidden_from_non_members">Masqué aux non-membres</option>
            <option value="public_with_tag_filter">Public avec filtre par tag</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tag Shopify</label>
        <Input
          value={configuration.shopify_customer_tag || ''}
          onChange={(e) => onConfigChange('shopify_customer_tag', e.target.value)}
          placeholder="exclusive_gold_access"
        />
      </div>
    </div>
  );
}

function EarlyAccessConfigurationForm({ configuration, onConfigChange, errors }: any) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type d'événement</label>
          <select
            value={configuration.event_type || 'product_launch'}
            onChange={(e) => onConfigChange('event_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="product_launch">Lancement de produit</option>
            <option value="collection_sale">Vente de collection</option>
            <option value="private_sale">Vente privée</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Période de grâce (heures)</label>
          <Input
            type="number"
            value={configuration.grace_period_hours || 24}
            onChange={(e) => onConfigChange('grace_period_hours', parseInt(e.target.value))}
            min="0"
            max="168"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
          <Input
            type="datetime-local"
            value={configuration.access_start_date ? new Date(configuration.access_start_date).toISOString().slice(0, 16) : ''}
            onChange={(e) => onConfigChange('access_start_date', new Date(e.target.value).toISOString())}
            className={errors.access_start_date ? 'border-red-500' : ''}
          />
          {errors.access_start_date && <p className="text-red-500 text-xs mt-1">{errors.access_start_date}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date de fin</label>
          <Input
            type="datetime-local"
            value={configuration.access_end_date ? new Date(configuration.access_end_date).toISOString().slice(0, 16) : ''}
            onChange={(e) => onConfigChange('access_end_date', new Date(e.target.value).toISOString())}
            className={errors.access_end_date ? 'border-red-500' : ''}
          />
          {errors.access_end_date && <p className="text-red-500 text-xs mt-1">{errors.access_end_date}</p>}
        </div>
      </div>
    </div>
  );
}

/**
 * Composant pour sélectionner les produits Shopify
 */
function ProductSelector({ selectedProducts, onProductsChange }: {
  selectedProducts: string[];
  onProductsChange: (products: string[]) => void;
}) {
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Simuler le chargement des produits Shopify
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      // TODO: Remplacer par un vrai appel API Shopify
      // Pour l'instant, on simule avec des données fictives
      const mockProducts = [
        { id: 'prod_123', title: 'T-shirt Premium', handle: 't-shirt-premium', price: '29.99' },
        { id: 'prod_456', title: 'Casquette Sport', handle: 'casquette-sport', price: '19.99' },
        { id: 'prod_789', title: 'Sneakers Comfort', handle: 'sneakers-comfort', price: '89.99' },
        { id: 'prod_101', title: 'Sac à dos Voyage', handle: 'sac-voyage', price: '49.99' },
        { id: 'prod_202', title: 'Montre Connectée', handle: 'montre-connectee', price: '199.99' },
      ];
      setProducts(mockProducts);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      onProductsChange(selectedProducts.filter(id => id !== productId));
    } else {
      onProductsChange([...selectedProducts, productId]);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Chargement des produits...</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {filteredProducts.map((product) => {
            const isSelected = selectedProducts.includes(product.id);
            return (
              <div
                key={product.id}
                onClick={() => toggleProduct(product.id)}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{product.title}</h4>
                    <p className="text-sm text-gray-500">€{product.price}</p>
                  </div>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300'
                  }`}>
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedProducts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Produits sélectionnés :</h5>
          <div className="flex flex-wrap gap-2">
            {selectedProducts.map(productId => {
              const product = products.find(p => p.id === productId);
              return (
                <div key={productId} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  <span>{product?.title || productId}</span>
                  <button
                    onClick={() => toggleProduct(productId)}
                    className="hover:bg-blue-200 rounded p-0.5"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Composant pour sélectionner les collections Shopify
 */
function CollectionSelector({ selectedCollections, onCollectionsChange }: {
  selectedCollections: string[];
  onCollectionsChange: (collections: string[]) => void;
}) {
  const [collections, setCollections] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Simuler le chargement des collections Shopify
  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setIsLoading(true);
    try {
      // TODO: Remplacer par un vrai appel API Shopify
      // Pour l'instant, on simule avec des données fictives
      const mockCollections = [
        { id: 'coll_123', title: 'Nouveautés', handle: 'nouveautes', productCount: 15 },
        { id: 'coll_456', title: 'Soldes', handle: 'soldes', productCount: 8 },
        { id: 'coll_789', title: 'Accessoires', handle: 'accessoires', productCount: 25 },
        { id: 'coll_101', title: 'Vêtements', handle: 'vetements', productCount: 40 },
        { id: 'coll_202', title: 'Chaussures', handle: 'chaussures', productCount: 20 },
      ];
      setCollections(mockCollections);
    } catch (error) {
      console.error('Erreur lors du chargement des collections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCollections = collections.filter(collection =>
    collection.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleCollection = (collectionId: string) => {
    if (selectedCollections.includes(collectionId)) {
      onCollectionsChange(selectedCollections.filter(id => id !== collectionId));
    } else {
      onCollectionsChange([...selectedCollections, collectionId]);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher une collection..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Chargement des collections...</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {filteredCollections.map((collection) => {
            const isSelected = selectedCollections.includes(collection.id);
            return (
              <div
                key={collection.id}
                onClick={() => toggleCollection(collection.id)}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  isSelected 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{collection.title}</h4>
                    <p className="text-sm text-gray-500">{collection.productCount} produit(s)</p>
                  </div>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isSelected 
                      ? 'border-green-500 bg-green-500' 
                      : 'border-gray-300'
                  }`}>
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedCollections.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Collections sélectionnées :</h5>
          <div className="flex flex-wrap gap-2">
            {selectedCollections.map(collectionId => {
              const collection = collections.find(c => c.id === collectionId);
              return (
                <div key={collectionId} className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                  <span>{collection?.title || collectionId}</span>
                  <button
                    onClick={() => toggleCollection(collectionId)}
                    className="hover:bg-green-200 rounded p-0.5"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

