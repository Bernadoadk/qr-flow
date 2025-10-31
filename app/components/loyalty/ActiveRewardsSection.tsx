import React from 'react';

interface ActiveRewardsSectionProps {
  rewards: {
    tier: string;
    activeRewards: string[];
    discountCode?: string;
    expiresAt?: Date;
    discountValue?: number;
  } | null;
  nextTierRewards?: Array<{
    type: string;
    value: any;
    description: string;
  }> | null;
  pointsToNextTier?: number;
}

export function ActiveRewardsSection({ rewards, nextTierRewards, pointsToNextTier }: ActiveRewardsSectionProps) {
  if (!rewards) {
    return (
      <div className="p-6 rounded-2xl bg-gray-100 text-center">
        <p className="text-gray-600">Aucune récompense active pour le moment</p>
        <p className="text-sm text-gray-500 mt-2">
          Scannez des QR codes pour gagner des points et débloquer des récompenses !
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Récompenses actives */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">
          🎁 Vos récompenses {rewards.tier}
        </h3>
        
        {rewards.activeRewards.includes("discount") && rewards.discountCode && (
          <div className="p-4 rounded-2xl bg-green-100 border-2 border-green-200 text-center">
            <div className="flex items-center justify-center mb-2">
              <span className="text-2xl">🎁</span>
              <span className="ml-2 text-lg font-semibold text-green-800">
                Réduction de {rewards.discountValue}% !
              </span>
            </div>
            <div className="bg-white rounded-lg p-3 mb-2">
              <p className="text-sm text-gray-600 mb-1">Votre code promo :</p>
              <p className="text-2xl font-bold text-green-600 font-mono tracking-wider">
                {rewards.discountCode}
              </p>
            </div>
            {rewards.expiresAt && (
              <p className="text-sm text-green-700">
                Valide jusqu'au {new Date(rewards.expiresAt).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
        )}

        {rewards.activeRewards.includes("free_shipping") && (
          <div className="p-4 rounded-2xl bg-blue-100 border-2 border-blue-200 text-center">
            <div className="flex items-center justify-center mb-2">
              <span className="text-2xl">🚚</span>
              <span className="ml-2 text-lg font-semibold text-blue-800">
                Livraison gratuite activée !
              </span>
            </div>
            <p className="text-blue-700">
              Profitez de la livraison gratuite sur votre prochaine commande
            </p>
          </div>
        )}

        {rewards.activeRewards.includes("exclusive_access") && (
          <div className="p-4 rounded-2xl bg-purple-100 border-2 border-purple-200 text-center">
            <div className="flex items-center justify-center mb-2">
              <span className="text-2xl">💎</span>
              <span className="ml-2 text-lg font-semibold text-purple-800">
                Accès aux produits exclusifs !
              </span>
            </div>
            <p className="text-purple-700">
              Découvrez des produits réservés aux membres {rewards.tier}
            </p>
          </div>
        )}

        {rewards.activeRewards.includes("early_access") && (
          <div className="p-4 rounded-2xl bg-yellow-100 border-2 border-yellow-200 text-center">
            <div className="flex items-center justify-center mb-2">
              <span className="text-2xl">⚡</span>
              <span className="ml-2 text-lg font-semibold text-yellow-800">
                Accès anticipé activé !
              </span>
            </div>
            <p className="text-yellow-700">
              Soyez le premier à profiter des ventes spéciales
            </p>
          </div>
        )}
      </div>

      {/* Récompenses du palier suivant */}
      {nextTierRewards && nextTierRewards.length > 0 && (
        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200">
          <h4 className="text-md font-semibold text-gray-800 mb-3">
            🎯 Récompenses du palier suivant
          </h4>
          <div className="space-y-2">
            {nextTierRewards.map((reward, index) => (
              <div key={index} className="flex items-center text-sm text-gray-700">
                <span className="w-2 h-2 bg-gray-400 rounded-full mr-3"></span>
                {reward.description}
              </div>
            ))}
          </div>
          {pointsToNextTier && pointsToNextTier > 0 && (
            <div className="mt-3 p-2 bg-white rounded-lg">
              <p className="text-sm text-gray-600">
                Plus que <span className="font-semibold text-gray-800">{pointsToNextTier} points</span> pour débloquer ces récompenses !
              </p>
            </div>
          )}
        </div>
      )}

      {/* Instructions d'utilisation */}
      <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
        <p className="text-sm text-blue-800">
          💡 <strong>Comment utiliser vos récompenses :</strong>
        </p>
        <ul className="text-xs text-blue-700 mt-1 space-y-1">
          <li>• Copiez votre code promo lors du checkout</li>
          <li>• Les récompenses sont automatiquement appliquées</li>
          <li>• Continuez à scanner pour gagner plus de points</li>
        </ul>
      </div>
    </div>
  );
}
