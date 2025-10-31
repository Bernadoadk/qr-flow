import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { 
  Edit, 
  Trash2, 
  Power, 
  PowerOff, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Gift,
  Percent,
  Truck,
  Package,
  Zap
} from "lucide-react";
import { DiscountRewardContent } from "./types/DiscountRewardContent";
import { FreeShippingRewardContent } from "./types/FreeShippingRewardContent";
import { ExclusiveProductRewardContent } from "./types/ExclusiveProductRewardContent";
import { EarlyAccessRewardContent } from "./types/EarlyAccessRewardContent";

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

interface RewardCardProps {
  reward: RewardTemplate;
  calculatedFields: CalculatedFields;
  onEdit: (reward: RewardTemplate) => void;
  onDelete: (reward: RewardTemplate) => void;
  onToggle: (reward: RewardTemplate) => void;
  onSync: (reward: RewardTemplate) => void;
}

export function RewardCard({ 
  reward, 
  calculatedFields, 
  onEdit, 
  onDelete, 
  onToggle, 
  onSync 
}: RewardCardProps) {
  
  const getRewardTypeIcon = () => {
    switch (reward.rewardType) {
      case 'discount':
        return <Percent className="h-4 w-4" />;
      case 'free_shipping':
        return <Truck className="h-4 w-4" />;
      case 'exclusive_product':
        return <Package className="h-4 w-4" />;
      case 'early_access':
        return <Zap className="h-4 w-4" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
  };

  const getRewardTypeLabel = () => {
    switch (reward.rewardType) {
      case 'discount':
        return 'Réduction';
      case 'free_shipping':
        return 'Livraison gratuite';
      case 'exclusive_product':
        return 'Produit exclusif';
      case 'early_access':
        return 'Accès anticipé';
      default:
        return reward.rewardType;
    }
  };

  const getStatusIcon = () => {
    switch (calculatedFields.activation_status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'disabled':
        return <PowerOff className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (calculatedFields.activation_status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'disabled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getShopifyStatusColor = () => {
    switch (calculatedFields.shopify_status) {
      case 'synced':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'not_synced':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className={`reward-card ${calculatedFields.activation_status}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              {getRewardTypeIcon()}
            </div>
            <div>
              <CardTitle className="text-lg">{reward.value.title}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{reward.value.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              {getRewardTypeIcon()}
              {getRewardTypeLabel()}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              {getStatusIcon()}
              {calculatedFields.activation_status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informations de base */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Palier:</span>
            <Badge variant="secondary" className="ml-2">{reward.tier}</Badge>
          </div>
          <div>
            <span className="font-medium text-gray-700">Utilisations:</span>
            <span className="ml-2">
              {reward.value.usage_count || 0}
              {reward.value.max_uses && ` / ${reward.value.max_uses}`}
            </span>
          </div>
        </div>

        {/* Dates importantes */}
        {(calculatedFields.activation_date || calculatedFields.expiration_date) && (
          <div className="space-y-2 text-sm">
            {calculatedFields.activation_date && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-gray-700">Activation:</span>
                <span>{formatDate(calculatedFields.activation_date)}</span>
              </div>
            )}
            {calculatedFields.expiration_date && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-gray-700">Expiration:</span>
                <span>{formatDate(calculatedFields.expiration_date)}</span>
                {calculatedFields.days_until_expiry && (
                  <Badge variant="outline" className="ml-2">
                    {calculatedFields.days_until_expiry} jours restants
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {/* Statut Shopify */}
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700 text-sm">Shopify:</span>
          <Badge className={getShopifyStatusColor()}>
            {calculatedFields.shopify_status}
          </Badge>
          {(reward.value as any)?.last_sync && (
            <span className="text-xs text-gray-500">
              Sync: {formatDate((reward.value as any).last_sync)}
            </span>
          )}
        </div>

        {/* Configuration spécifique */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <RewardContent reward={reward} />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggle(reward)}
              className="flex items-center gap-1"
            >
              {calculatedFields.activation_status === 'active' ? (
                <>
                  <PowerOff className="h-4 w-4" />
                  Désactiver
                </>
              ) : (
                <>
                  <Power className="h-4 w-4" />
                  Activer
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSync(reward)}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Sync
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(reward)}
              className="flex items-center gap-1"
            >
              <Edit className="h-4 w-4" />
              Modifier
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(reward)}
              className="flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Composant pour afficher le contenu spécifique selon le type de récompense
 */
function RewardContent({ reward }: { reward: RewardTemplate }) {
  switch (reward.rewardType) {
    case 'discount':
      return <DiscountRewardContent reward={reward as any} />;
    case 'free_shipping':
      return <FreeShippingRewardContent reward={reward as any} />;
    case 'exclusive_product':
      return <ExclusiveProductRewardContent reward={reward as any} />;
    case 'early_access':
      return <EarlyAccessRewardContent reward={reward as any} />;
    default:
      return (
        <div className="text-sm text-gray-600">
          Configuration: {JSON.stringify(reward.value, null, 2)}
        </div>
      );
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}
