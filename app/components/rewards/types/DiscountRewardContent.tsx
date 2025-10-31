import React from 'react';
import { Badge } from "~/components/ui/Badge";
import { Percent, Target, Tag, Clock } from "lucide-react";

interface DiscountRewardContentProps {
  reward: {
    value: {
      discount_scope?: string;
      percentage?: number;
      code_prefix?: string;
      minimum_order_amount?: number;
      maximum_discount_amount?: number;
      target_products?: string[];
      target_collections?: string[];
      applies_once_per_customer?: boolean;
    };
  };
}

export function DiscountRewardContent({ reward }: DiscountRewardContentProps) {
  const config = reward.value;

  return (
    <div className="space-y-3">
      {/* Pourcentage de réduction */}
      <div className="flex items-center gap-2">
        <Percent className="h-4 w-4 text-blue-600" />
        <span className="font-medium">Réduction:</span>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          {config.percentage || 0}%
        </Badge>
      </div>

      {/* Portée de la réduction */}
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-gray-600" />
        <span className="text-sm text-gray-700">Portée:</span>
        <Badge variant="outline">
          {config.discount_scope === 'product' ? 'Produits spécifiques' : 'Commande entière'}
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

      {/* Montant maximum */}
      {config.maximum_discount_amount && config.maximum_discount_amount > 0 && (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-600" />
          <span className="text-sm text-gray-700">Maximum:</span>
          <span className="text-sm font-medium">{config.maximum_discount_amount}€</span>
        </div>
      )}

      {/* Produits ciblés */}
      {config.discount_scope === 'product' && (
        <div className="space-y-2">
          {config.target_products && config.target_products.length > 0 && (
            <div>
              <span className="text-sm font-medium text-gray-700">Produits ciblés:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {config.target_products.map((productId, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {productId}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {config.target_collections && config.target_collections.length > 0 && (
            <div>
              <span className="text-sm font-medium text-gray-700">Collections ciblées:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {config.target_collections.map((collectionId, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {collectionId}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Usage unique */}
      {config.applies_once_per_customer && (
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-orange-600" />
          <span className="text-sm text-orange-700 font-medium">
            Une seule utilisation par client
          </span>
        </div>
      )}

      {/* Préfixe du code */}
      {config.code_prefix && (
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-gray-600" />
          <span className="text-sm text-gray-700">Préfixe:</span>
          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
            {config.code_prefix}
          </code>
        </div>
      )}
    </div>
  );
}

