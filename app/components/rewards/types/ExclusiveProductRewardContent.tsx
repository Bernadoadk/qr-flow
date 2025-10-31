import React from 'react';
import { Badge } from "~/components/ui/Badge";
import { Package, Tag, Users, ShoppingCart, Crown } from "lucide-react";

interface ExclusiveProductRewardContentProps {
  reward: {
    value: {
      access_type?: string;
      access_logic?: string;
      product_ids?: string[];
      collection_ids?: string[];
      max_quantity_per_customer?: number;
      discount_percentage?: number;
      priority_access?: boolean;
      auto_add_to_cart?: boolean;
      shopify_customer_tag?: string;
    };
  };
}

export function ExclusiveProductRewardContent({ reward }: ExclusiveProductRewardContentProps) {
  const config = reward.value;

  const getAccessTypeLabel = (type: string) => {
    switch (type) {
      case 'exclusive':
        return 'Exclusif';
      case 'offered':
        return 'Offert';
      default:
        return type;
    }
  };

  const getAccessTypeColor = (type: string) => {
    switch (type) {
      case 'exclusive':
        return 'bg-purple-100 text-purple-800';
      case 'offered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccessLogicLabel = (logic: string) => {
    switch (logic) {
      case 'hidden_from_non_members':
        return 'Masqué aux non-membres';
      case 'public_with_tag_filter':
        return 'Public avec filtre par tag';
      default:
        return logic;
    }
  };

  return (
    <div className="space-y-3">
      {/* Type d'accès */}
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-purple-600" />
        <span className="font-medium">Accès exclusif</span>
        <Badge className={getAccessTypeColor(config.access_type || 'exclusive')}>
          {getAccessTypeLabel(config.access_type || 'exclusive')}
        </Badge>
      </div>

      {/* Logique d'accès */}
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-gray-600" />
        <span className="text-sm text-gray-700">Logique:</span>
        <Badge variant="outline">
          {getAccessLogicLabel(config.access_logic || 'hidden_from_non_members')}
        </Badge>
      </div>

      {/* Produits et collections */}
      <div className="space-y-2">
        {config.product_ids && config.product_ids.length > 0 && (
          <div>
            <span className="text-sm font-medium text-gray-700">Produits exclusifs:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {config.product_ids.map((productId, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {productId}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {config.collection_ids && config.collection_ids.length > 0 && (
          <div>
            <span className="text-sm font-medium text-gray-700">Collections exclusives:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {config.collection_ids.map((collectionId, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {collectionId}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quantité maximum par client */}
      {config.max_quantity_per_customer && (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-600" />
          <span className="text-sm text-gray-700">Max par client:</span>
          <span className="text-sm font-medium">{config.max_quantity_per_customer}</span>
        </div>
      )}

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

      {/* Accès prioritaire */}
      {config.priority_access && (
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-700 font-medium">
            Accès prioritaire aux nouveaux produits
          </span>
        </div>
      )}

      {/* Ajout automatique au panier */}
      {config.auto_add_to_cart && (
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-700 font-medium">
            Ajout automatique au panier
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
    </div>
  );
}

