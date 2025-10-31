import { json, type ActionFunctionArgs } from "@remix-run/node";
import { ShopifyRewardSync } from "~/utils/rewards/ShopifyRewardSync";
import { RewardStateManager, RewardTemplate } from "~/utils/rewards/RewardStateManager";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { merchantId, rewardId, syncType } = body;

    if (!merchantId) {
      return json({ error: "Missing merchantId" }, { status: 400 });
    }

    switch (syncType) {
      case "single":
        return await handleSingleRewardSync(rewardId, request);
      
      case "all":
        return await handleAllRewardsSync(merchantId, request);
      
      case "check_status":
        return await handleStatusCheck(merchantId, request);
      
      default:
        return json({ error: "Invalid sync type" }, { status: 400 });
    }

  } catch (error) {
    console.error("Error in reward sync:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Synchronise une récompense spécifique
 */
async function handleSingleRewardSync(rewardId: string, request: Request) {
  if (!rewardId) {
    return json({ error: "Missing rewardId" }, { status: 400 });
  }

  try {
    // Récupérer la récompense
    const { prisma } = await import("~/db.server");
    const reward = await prisma.rewardTemplates.findUnique({
      where: { id: rewardId }
    });

    if (!reward) {
      return json({ error: "Reward not found" }, { status: 404 });
    }

    // Synchroniser avec Shopify
    const shopifyResource = await ShopifyRewardSync.syncRewardWithShopify(reward as RewardTemplate, request);
    
    if (!shopifyResource) {
      return json({ 
        error: "Impossible de synchroniser avec Shopify" 
      }, { status: 500 });
    }

    // Récupérer la récompense mise à jour
    const updatedReward = await prisma.rewardTemplates.findUnique({
      where: { id: rewardId }
    });

    const calculatedFields = RewardStateManager.calculateDynamicFields(updatedReward! as RewardTemplate);

    return json({ 
      success: true, 
      message: "Récompense synchronisée avec succès",
      reward: updatedReward,
      calculated_fields: calculatedFields,
      shopify_resource: shopifyResource
    });

  } catch (error) {
    console.error("Erreur synchronisation récompense:", error);
    return json({ 
      error: "Erreur lors de la synchronisation",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 });
  }
}

/**
 * Synchronise toutes les récompenses d'un marchand
 */
async function handleAllRewardsSync(merchantId: string, request: Request) {
  try {
    await ShopifyRewardSync.syncAllMerchantRewards(merchantId, request);

    // Récupérer toutes les récompenses mises à jour
    const { prisma } = await import("~/db.server");
    const rewards = await prisma.rewardTemplates.findMany({
      where: { merchantId: merchantId },
      orderBy: [
        { tier: 'asc' },
        { rewardType: 'asc' }
      ]
    });

    const rewardsWithCalculated = rewards.map(reward => ({
      ...reward,
      calculated_fields: RewardStateManager.calculateDynamicFields(reward as RewardTemplate)
    }));

    return json({ 
      success: true, 
      message: "Toutes les récompenses ont été synchronisées",
      rewards: rewardsWithCalculated,
      count: rewardsWithCalculated.length
    });

  } catch (error) {
    console.error("Erreur synchronisation globale:", error);
    return json({ 
      error: "Erreur lors de la synchronisation globale",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 });
  }
}

/**
 * Vérifie le statut de synchronisation de toutes les récompenses
 */
async function handleStatusCheck(merchantId: string, request: Request) {
  try {
    const { prisma } = await import("~/db.server");
    const rewards = await prisma.rewardTemplates.findMany({
      where: { merchantId: merchantId }
    });

    const statusReport = [];

    for (const reward of rewards) {
      const calculatedFields = RewardStateManager.calculateDynamicFields(reward as RewardTemplate);
      
      // Vérifier le statut Shopify
      const shopifyStatus = await ShopifyRewardSync.checkShopifyResourceStatus(reward as RewardTemplate, request);
      
      statusReport.push({
        reward_id: reward.id,
        title: (reward.value as any)?.title || 'Récompense',
        tier: reward.tier,
        reward_type: reward.rewardType,
        calculated_fields: calculatedFields,
        shopify_status: shopifyStatus,
        needs_sync: calculatedFields.shopify_status === "error" || calculatedFields.shopify_status === "pending"
      });
    }

    const needsSyncCount = statusReport.filter(r => r.needs_sync).length;
    const syncedCount = statusReport.filter(r => r.shopify_status === "active").length;

    return json({ 
      success: true, 
      message: "Statut de synchronisation vérifié",
      status_report: statusReport,
      summary: {
        total_rewards: rewards.length,
        synced: syncedCount,
        needs_sync: needsSyncCount,
        errors: statusReport.filter(r => r.shopify_status === "disabled").length
      }
    });

  } catch (error) {
    console.error("Erreur vérification statut:", error);
    return json({ 
      error: "Erreur lors de la vérification du statut",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 });
  }
}

