import React, { useState } from 'react';
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { 
  Power, 
  PowerOff, 
  RefreshCw, 
  Edit, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Loader2
} from "lucide-react";

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
    [key: string]: any;
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

interface RewardActionsProps {
  reward: RewardTemplate;
  calculatedFields: CalculatedFields;
  onEdit: (reward: RewardTemplate) => void;
  onDelete: (reward: RewardTemplate) => void;
  onToggle: (reward: RewardTemplate) => void;
  onSync: (reward: RewardTemplate) => void;
  isLoading?: boolean;
}

export function RewardActions({ 
  reward, 
  calculatedFields, 
  onEdit, 
  onDelete, 
  onToggle, 
  onSync,
  isLoading = false
}: RewardActionsProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: string, actionFn: () => Promise<void>) => {
    setActionLoading(action);
    try {
      await actionFn();
    } catch (error) {
      console.error(`Erreur lors de l'action ${action}:`, error);
    } finally {
      setActionLoading(null);
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
    <div className="space-y-4">
      {/* Statuts */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Statut:</span>
          <Badge className={`flex items-center gap-1 ${getStatusColor()}`}>
            {getStatusIcon()}
            {calculatedFields.activation_status}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Shopify:</span>
          <Badge className={getShopifyStatusColor()}>
            {calculatedFields.shopify_status}
          </Badge>
        </div>
      </div>

      {/* Informations temporelles */}
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

      {/* Utilisations */}
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-gray-700">Utilisations:</span>
        <span>
          {reward.value.usage_count || 0}
          {reward.value.max_uses && ` / ${reward.value.max_uses}`}
        </span>
        {calculatedFields.remaining_uses !== null && (
          <Badge variant="outline">
            {calculatedFields.remaining_uses} restantes
          </Badge>
        )}
      </div>

      {/* Actions principales */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction('toggle', async () => onToggle(reward))}
          disabled={isLoading || actionLoading === 'toggle'}
          className="flex items-center gap-1"
        >
          {actionLoading === 'toggle' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : calculatedFields.activation_status === 'active' ? (
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
          onClick={() => handleAction('sync', async () => onSync(reward))}
          disabled={isLoading || actionLoading === 'sync'}
          className="flex items-center gap-1"
        >
          {actionLoading === 'sync' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Synchroniser
            </>
          )}
        </Button>
      </div>

      {/* Actions secondaires */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(reward)}
          disabled={isLoading}
          className="flex items-center gap-1"
        >
          <Edit className="h-4 w-4" />
          Modifier
        </Button>
        
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(reward)}
          disabled={isLoading}
          className="flex items-center gap-1"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </Button>
      </div>

      {/* Messages d'état */}
      {calculatedFields.activation_status === 'pending' && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Cette récompense sera activée automatiquement à la date prévue.
            </span>
          </div>
        </div>
      )}

      {calculatedFields.activation_status === 'expired' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-800">
              Cette récompense a expiré et ne peut plus être utilisée.
            </span>
          </div>
        </div>
      )}

      {calculatedFields.shopify_status === 'error' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-800">
              Erreur de synchronisation avec Shopify. Cliquez sur "Synchroniser" pour réessayer.
            </span>
          </div>
        </div>
      )}

      {calculatedFields.shopify_status === 'not_synced' && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-gray-600" />
            <span className="text-sm text-gray-800">
              Cette récompense n'a pas encore été synchronisée avec Shopify.
            </span>
          </div>
        </div>
      )}

      {/* Informations Shopify */}
      {(reward.value as any)?.shopify_integration && (
        <div className="text-xs text-gray-500 space-y-1">
          {(reward.value as any).shopify_integration.price_rule_id && (
            <div>PriceRule: {(reward.value as any).shopify_integration.price_rule_id}</div>
          )}
          {(reward.value as any).shopify_integration.shipping_discount_id && (
            <div>Shipping: {(reward.value as any).shopify_integration.shipping_discount_id}</div>
          )}
          {(reward.value as any).shopify_integration.customer_tag && (
            <div>Tag: {(reward.value as any).shopify_integration.customer_tag}</div>
          )}
          {(reward.value as any).shopify_integration.last_sync && (
            <div>Dernière sync: {formatDate((reward.value as any).shopify_integration.last_sync)}</div>
          )}
        </div>
      )}
    </div>
  );
}

