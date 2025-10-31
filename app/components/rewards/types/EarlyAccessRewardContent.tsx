import React from 'react';
import { Badge } from "~/components/ui/Badge";
import { Zap, Clock, Calendar, Bell, Tag, Package } from "lucide-react";

interface EarlyAccessRewardContentProps {
  reward: {
    value: {
      event_type?: string;
      access_start_date?: string;
      access_end_date?: string;
      grace_period_hours?: number;
      collections_concerned?: string[];
      product_ids?: string[];
      discount_percentage?: number;
      notification_enabled?: boolean;
      shopify_customer_tag?: string;
    };
  };
}

export function EarlyAccessRewardContent({ reward }: EarlyAccessRewardContentProps) {
  const config = reward.value;

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'product_launch':
        return 'Lancement de produit';
      case 'collection_sale':
        return 'Vente de collection';
      case 'private_sale':
        return 'Vente privée';
      default:
        return type;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'product_launch':
        return 'bg-blue-100 text-blue-800';
      case 'collection_sale':
        return 'bg-green-100 text-green-800';
      case 'private_sale':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-3">
      {/* Type d'événement */}
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-orange-600" />
        <span className="font-medium">Accès anticipé</span>
        <Badge className={getEventTypeColor(config.event_type || 'product_launch')}>
          {getEventTypeLabel(config.event_type || 'product_launch')}
        </Badge>
      </div>

      {/* Période d'accès */}
      {config.access_start_date && config.access_end_date && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            <span className="text-sm text-gray-700">Période d'accès:</span>
          </div>
          
          <div className="ml-6 space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-green-600" />
              <span className="text-sm">
                <strong>Début:</strong> {formatDate(config.access_start_date)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-red-600" />
              <span className="text-sm">
                <strong>Fin:</strong> {formatDate(config.access_end_date)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Période de grâce */}
      {config.grace_period_hours && config.grace_period_hours > 0 && (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-gray-700">Période de grâce:</span>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            {config.grace_period_hours}h après la fin officielle
          </Badge>
        </div>
      )}

      {/* Collections et produits concernés */}
      <div className="space-y-2">
        {config.collections_concerned && config.collections_concerned.length > 0 && (
          <div>
            <span className="text-sm font-medium text-gray-700">Collections concernées:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {config.collections_concerned.map((collectionId, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {collectionId}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {config.product_ids && config.product_ids.length > 0 && (
          <div>
            <span className="text-sm font-medium text-gray-700">Produits concernés:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {config.product_ids.map((productId, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {productId}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Réduction supplémentaire */}
      {config.discount_percentage && config.discount_percentage > 0 && (
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-green-600" />
          <span className="text-sm text-gray-700">Réduction supplémentaire:</span>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {config.discount_percentage}%
          </Badge>
        </div>
      )}

      {/* Notifications activées */}
      {config.notification_enabled && (
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-700 font-medium">
            Notifications automatiques activées
          </span>
        </div>
      )}

      {/* Tag Shopify */}
      {config.shopify_customer_tag && (
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-gray-600" />
          <span className="text-sm text-gray-700">Tag Shopify:</span>
          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
            {config.shopify_customer_tag}
          </code>
        </div>
      )}

      {/* Statut temporel */}
      {config.access_start_date && config.access_end_date && (
        <div className="mt-3 p-2 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 space-y-1">
            <div>Accès anticipé de {formatTime(config.access_start_date)} à {formatTime(config.access_end_date)}</div>
            {config.grace_period_hours && config.grace_period_hours > 0 && (
              <div>Période de grâce jusqu'à {config.grace_period_hours}h après</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

