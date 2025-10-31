import { json, type ActionFunctionArgs } from "@remix-run/node";
import { ShopifyRewardsService } from "~/utils/shopify-rewards.server";
import { LoyaltyService } from "~/utils/loyalty.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { merchantId, customerId } = body;

    if (!merchantId || !customerId) {
      return json({ error: "Missing merchantId or customerId" }, { status: 400 });
    }

    // Récupérer les points et le palier du client
    const customerPoints = await LoyaltyService.getCustomerPoints(merchantId, customerId);
    
    // Récupérer les récompenses actives
    const activeRewards = await ShopifyRewardsService.getCustomerActiveRewards(merchantId, customerId);

    // Calculer les récompenses du palier suivant
    const nextTierRewards = await getNextTierRewards(merchantId, customerPoints);

    return json({
      success: true,
      data: {
        points: customerPoints.points,
        currentTier: customerPoints.tier,
        nextTier: customerPoints.nextTier,
        pointsToNextTier: customerPoints.pointsToNextTier,
        activeRewards: activeRewards || {
          tier: customerPoints.tier,
          activeRewards: [],
          discountCode: null,
          expiresAt: null,
          discountValue: null
        },
        nextTierRewards
      }
    });

  } catch (error) {
    console.error("Error fetching loyalty rewards:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Récupérer les récompenses du palier suivant
 */
async function getNextTierRewards(merchantId: string, customerPoints: any) {
  try {
    if (!customerPoints.nextTier) {
      return null;
    }

    // Récupérer les templates de récompenses pour le palier suivant
    const { prisma } = await import("~/db.server");
    const rewardTemplates = await prisma.rewardTemplates.findMany({
      where: {
        merchantId,
        tier: customerPoints.nextTier,
        isActive: true
      }
    });

    return rewardTemplates.map(template => ({
      type: template.rewardType,
      value: template.value,
      description: getRewardDescription(template.rewardType, template.value)
    }));
  } catch (error) {
    console.error("Error fetching next tier rewards:", error);
    return null;
  }
}

/**
 * Générer une description lisible pour une récompense
 */
function getRewardDescription(rewardType: string, value: any): string {
  switch (rewardType) {
    case 'discount':
      return `Réduction de ${value.percentage}% sur votre prochaine commande`;
    case 'free_shipping':
      return `Livraison gratuite dès ${value.minimumOrder}€`;
    case 'exclusive_product':
      return `Accès à des produits exclusifs`;
    case 'early_access':
      return `Accès anticipé aux ventes spéciales`;
    default:
      return 'Récompense spéciale';
  }
}