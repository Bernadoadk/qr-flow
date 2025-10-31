import React from 'react';
import { Badge } from "~/components/ui/Badge";
import { Truck, MapPin, Clock, Tag } from "lucide-react";

interface FreeShippingRewardContentProps {
  reward: {
    value: {
      eligible_zones?: string;
      minimum_order_amount?: number;
      requires_code?: boolean;
      shipping_methods?: string[];
      excluded_zones?: string[];
    };
  };
}

export function FreeShippingRewardContent({ reward }: FreeShippingRewardContentProps) {
  const config = reward.value;

  const getZoneLabel = (zone: string) => {
    switch (zone) {
      case 'all':
        return 'Toutes les zones';
      case 'local':
        return 'Zone locale';
      case 'international':
        return 'International';
      default:
        return zone;
    }
  };

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'all':
        return 'bg-green-100 text-green-800';
      case 'local':
        return 'bg-blue-100 text-blue-800';
      case 'international':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-3">
      {/* Type de livraison */}
      <div className="flex items-center gap-2">
        <Truck className="h-4 w-4 text-green-600" />
        <span className="font-medium">Livraison gratuite</span>
        {config.requires_code && (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            Avec code
          </Badge>
        )}
      </div>

      {/* Zones éligibles */}
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-gray-600" />
        <span className="text-sm text-gray-700">Zones:</span>
        <Badge className={getZoneColor(config.eligible_zones || 'all')}>
          {getZoneLabel(config.eligible_zones || 'all')}
        </Badge>
      </div>

      {/* Montant minimum */}
      {config.minimum_order_amount && config.minimum_order_amount > 0 && (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-600" />
          <span className="text-sm text-gray-700">Minimum:</span>
          <span className="text-sm font-medium">{config.minimum_order_amount}€</span>
        </div>
      )}

      {/* Méthodes de livraison spécifiques */}
      {config.shipping_methods && config.shipping_methods.length > 0 && (
        <div>
          <span className="text-sm font-medium text-gray-700">Méthodes:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {config.shipping_methods.map((method, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {method}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Zones exclues */}
      {config.excluded_zones && config.excluded_zones.length > 0 && (
        <div>
          <span className="text-sm font-medium text-gray-700">Zones exclues:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {config.excluded_zones.map((zone, index) => (
              <Badge key={index} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                {zone}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Code requis */}
      {config.requires_code && (
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-orange-600" />
          <span className="text-sm text-orange-700 font-medium">
            Un code de livraison gratuite sera généré automatiquement
          </span>
        </div>
      )}
    </div>
  );
}

