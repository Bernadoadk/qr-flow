import React, { useState, useEffect } from 'react';
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { 
  Plus, 
  RefreshCw, 
  Filter, 
  Search,
  Loader2,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { RewardCard } from "./RewardCard";
import { RewardConfigurator } from "./RewardConfigurator";
import { RewardActions } from "./RewardActions";

export interface RewardTemplate {
  id: string;
  merchantId: string;
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CalculatedFields {
  activation_date: string | null;
  expiration_date: string | null;
  is_expired: boolean;
  is_active: boolean;
  remaining_uses: number | null;
  can_be_used: boolean;
  days_until_expiry: number | null;
  activation_status: "pending" | "active" | "expired" | "disabled";
  shopify_status: "synced" | "pending" | "error" | "not_synced";
}

interface RewardsManagerProps {
  merchantId: string;
}

const TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum'];
const REWARD_TYPES = ['discount', 'free_shipping', 'exclusive_product', 'early_access'];

export function RewardsManager({ merchantId }: RewardsManagerProps) {
  const [rewards, setRewards] = useState<RewardTemplate[]>([]);
  const [calculatedFields, setCalculatedFields] = useState<Record<string, CalculatedFields>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<RewardTemplate | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>('Bronze');
  
  // Filtres
  const [filters, setFilters] = useState({
    tier: '',
    rewardType: '',
    status: '',
    search: ''
  });

  useEffect(() => {
    loadRewards();
  }, [merchantId]);

  const loadRewards = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/rewards/templates?merchantId=${merchantId}&includeCalculated=true`);
      
      if (response.ok) {
        const data = await response.json();
        setRewards(data.rewards || []);
        
        // Extraire les champs calculés
        const calculated: Record<string, CalculatedFields> = {};
        data.rewards?.forEach((reward: any) => {
          if (reward.calculated_fields) {
            calculated[reward.id] = reward.calculated_fields;
          }
        });
        setCalculatedFields(calculated);
      } else {
        console.error('Erreur chargement récompenses:', await response.text());
      }
    } catch (error) {
      console.error('Erreur chargement récompenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReward = () => {
    setEditingReward(null);
    setSelectedTier('Bronze');
    setIsModalOpen(true);
  };

  const handleEditReward = (reward: RewardTemplate) => {
    setEditingReward(reward);
    setSelectedTier(reward.tier);
    setIsModalOpen(true);
  };

  const handleSaveReward = async (rewardData: RewardTemplate) => {
    try {
      const method = editingReward ? 'PUT' : 'POST';
      
      // Préparer les données selon la structure attendue par l'API
      const apiData = {
        merchantId,
        reward: {
          tier: rewardData.tier,
          reward_type: rewardData.rewardType,
          title: rewardData.value.title,
          description: rewardData.value.description,
          configuration: rewardData.value,
          active: rewardData.isActive,
          usage_count: rewardData.value.usage_count || 0,
          max_uses: rewardData.value.max_uses,
          duration_days: rewardData.value.duration_days,
          activation_delay_days: rewardData.value.activation_delay_days || 0
        },
        rewardId: editingReward?.id
      };
      
      const response = await fetch('/api/rewards/templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData)
      });

      if (response.ok) {
        await loadRewards();
        setIsModalOpen(false);
        setEditingReward(null);
      } else {
        const errorData = await response.json();
        console.error('Erreur sauvegarde récompense:', errorData);
        alert(`Erreur: ${errorData.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Erreur sauvegarde récompense:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteReward = async (reward: RewardTemplate) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la récompense "${reward.value.title}" ?`)) {
      return;
    }

    try {
      const response = await fetch('/api/rewards/templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          rewardId: reward.id
        })
      });

      if (response.ok) {
        await loadRewards();
      } else {
        const errorData = await response.json();
        console.error('Erreur suppression récompense:', errorData);
        alert(`Erreur: ${errorData.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Erreur suppression récompense:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleToggleReward = async (reward: RewardTemplate) => {
    try {
      const response = await fetch('/api/rewards/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          rewardId: reward.id,
          action: calculatedFields[reward.id]?.activation_status === 'active' ? 'deactivate' : 'activate'
        })
      });

      if (response.ok) {
        await loadRewards();
      } else {
        const errorData = await response.json();
        console.error('Erreur toggle récompense:', errorData);
        alert(`Erreur: ${errorData.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Erreur toggle récompense:', error);
      alert('Erreur lors de la modification');
    }
  };

  const handleSyncReward = async (reward: RewardTemplate) => {
    try {
      const response = await fetch('/api/rewards/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          rewardId: reward.id,
          syncType: 'single'
        })
      });

      if (response.ok) {
        await loadRewards();
      } else {
        const errorData = await response.json();
        console.error('Erreur sync récompense:', errorData);
        alert(`Erreur: ${errorData.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Erreur sync récompense:', error);
      alert('Erreur lors de la synchronisation');
    }
  };

  const handleSyncAll = async () => {
    try {
      const response = await fetch('/api/rewards/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          syncType: 'all'
        })
      });

      if (response.ok) {
        await loadRewards();
      } else {
        const errorData = await response.json();
        console.error('Erreur sync globale:', errorData);
        alert(`Erreur: ${errorData.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Erreur sync globale:', error);
      alert('Erreur lors de la synchronisation globale');
    }
  };

  // Filtrer les récompenses
  const filteredRewards = rewards.filter(reward => {
    if (filters.tier && reward.tier !== filters.tier) return false;
    if (filters.rewardType && reward.rewardType !== filters.rewardType) return false;
    if (filters.status && calculatedFields[reward.id]?.activation_status !== filters.status) return false;
    if (filters.search && !reward.value.title?.toLowerCase().includes(filters.search.toLowerCase()) && 
        !reward.value.description?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  // Statistiques
  const stats = {
    total: rewards.length,
    active: rewards.filter(r => calculatedFields[r.id]?.activation_status === 'active').length,
    pending: rewards.filter(r => calculatedFields[r.id]?.activation_status === 'pending').length,
    expired: rewards.filter(r => calculatedFields[r.id]?.activation_status === 'expired').length,
    synced: rewards.filter(r => calculatedFields[r.id]?.shopify_status === 'synced').length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Chargement des récompenses...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Gestion des récompenses</h2>
          <div className="flex items-center gap-3">
            <Button onClick={handleSyncAll} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Sync Shopify
            </Button>
            <Button onClick={handleCreateReward} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle récompense
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Actives</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">En attente</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <div className="text-sm text-gray-600">Expirées</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.synced}</div>
            <div className="text-sm text-gray-600">Synchronisées</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="grid grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Palier</label>
            <select
              value={filters.tier}
              onChange={(e) => setFilters(prev => ({ ...prev, tier: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Tous les paliers</option>
              {TIERS.map(tier => (
                <option key={tier} value={tier}>{tier}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.rewardType}
              onChange={(e) => setFilters(prev => ({ ...prev, rewardType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Tous les types</option>
              <option value="discount">Réduction</option>
              <option value="free_shipping">Livraison gratuite</option>
              <option value="exclusive_product">Produit exclusif</option>
              <option value="early_access">Accès anticipé</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="pending">En attente</option>
              <option value="expired">Expiré</option>
              <option value="disabled">Désactivé</option>
            </select>
          </div>
          
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Rechercher par titre ou description..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Liste des récompenses */}
      {filteredRewards.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune récompense trouvée</h3>
          <p className="text-gray-600 mb-4">
            {rewards.length === 0 
              ? "Commencez par créer votre première récompense"
              : "Aucune récompense ne correspond aux filtres sélectionnés"
            }
          </p>
          {rewards.length === 0 && (
            <Button onClick={handleCreateReward} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Créer une récompense
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRewards.map(reward => (
            <RewardCard
              key={reward.id}
              reward={reward}
              calculatedFields={calculatedFields[reward.id] || {}}
              onEdit={handleEditReward}
              onDelete={handleDeleteReward}
              onToggle={handleToggleReward}
              onSync={handleSyncReward}
            />
          ))}
        </div>
      )}

      {/* Modal de configuration */}
      <RewardConfigurator
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingReward(null);
        }}
        onSave={handleSaveReward as any}
        reward={editingReward}
        selectedTier={selectedTier}
      />
    </div>
  );
}

