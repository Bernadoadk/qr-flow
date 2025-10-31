import { json, type ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/db.server";
import { RewardStateManager, RewardTemplate } from "~/utils/rewards/RewardStateManager";
import { ShopifyRewardSync } from "~/utils/rewards/ShopifyRewardSync";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { merchantId, rewardId, action: actionType } = body;

    if (!merchantId || !rewardId || !actionType) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }

    // Récupérer la récompense
    const reward = await prisma.rewardTemplates.findFirst({
      where: { 
        id: rewardId,
        merchantId: merchantId
      }
    });

    if (!reward) {
      return json({ error: "Reward not found" }, { status: 404 });
    }

    const calculatedFields = RewardStateManager.calculateDynamicFields(reward as RewardTemplate);

    switch (actionType) {
      case "activate":
        return await handleActivateReward(reward as RewardTemplate, request);
      
      case "deactivate":
        return await handleDeactivateReward(reward as RewardTemplate);
      
      case "sync":
        return await handleSyncReward(reward as RewardTemplate, request);
      
      case "use":
        return await handleUseReward(reward as RewardTemplate);
      
      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error) {
    console.error("Error in reward activation:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Active une récompense
 */
async function handleActivateReward(reward: RewardTemplate, request: Request) {
  // Vérifier si la récompense peut être activée
  const calculatedFields = RewardStateManager.calculateDynamicFields(reward);
  
  if (calculatedFields.activation_status === "active") {
    return json({ 
      success: true, 
      message: "Récompense déjà active",
      calculated_fields: calculatedFields
    });
  }

  if (calculatedFields.activation_status === "expired") {
    return json({ 
      error: "Impossible d'activer une récompense expirée" 
    }, { status: 400 });
  }

  // Activer la récompense
  const updatedReward = await prisma.rewardTemplates.update({
    where: { id: reward.id },
    data: { isActive: true }
  });

  // Synchroniser avec Shopify
  let shopifyResource = null;
  try {
    shopifyResource = await ShopifyRewardSync.syncRewardWithShopify(updatedReward as RewardTemplate, request);
  } catch (error) {
    console.error("Erreur synchronisation Shopify:", error);
    // Continuer même si Shopify échoue
  }

  const newCalculatedFields = RewardStateManager.calculateDynamicFields(updatedReward as RewardTemplate);

  return json({ 
    success: true, 
    message: "Récompense activée avec succès",
    reward: updatedReward,
    calculated_fields: newCalculatedFields,
    shopify_resource: shopifyResource
  });
}

/**
 * Désactive une récompense
 */
async function handleDeactivateReward(reward: RewardTemplate) {
  const updatedReward = await prisma.rewardTemplates.update({
    where: { id: reward.id },
    data: { isActive: false }
  });

  const calculatedFields = RewardStateManager.calculateDynamicFields(updatedReward as RewardTemplate);

  return json({ 
    success: true, 
    message: "Récompense désactivée avec succès",
    reward: updatedReward,
    calculated_fields: calculatedFields
  });
}

/**
 * Synchronise une récompense avec Shopify
 */
async function handleSyncReward(reward: RewardTemplate, request: Request) {
  try {
    const shopifyResource = await ShopifyRewardSync.syncRewardWithShopify(reward, request);
    
    if (!shopifyResource) {
      return json({ 
        error: "Impossible de synchroniser avec Shopify" 
      }, { status: 500 });
    }

    // Récupérer la récompense mise à jour
    const updatedReward = await prisma.rewardTemplates.findUnique({
      where: { id: reward.id }
    });

    const calculatedFields = RewardStateManager.calculateDynamicFields(updatedReward! as RewardTemplate);

    return json({ 
      success: true, 
      message: "Récompense synchronisée avec Shopify",
      reward: updatedReward,
      calculated_fields: calculatedFields,
      shopify_resource: shopifyResource
    });

  } catch (error) {
    console.error("Erreur synchronisation:", error);
    return json({ 
      error: "Erreur lors de la synchronisation avec Shopify",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 });
  }
}

/**
 * Utilise une récompense (incrémente le compteur)
 */
async function handleUseReward(reward: RewardTemplate) {
  // Vérifier si la récompense peut être utilisée
  const canUse = await RewardStateManager.canUseReward(reward.id);
  
  if (!canUse) {
    return json({ 
      error: "Cette récompense ne peut pas être utilisée actuellement" 
    }, { status: 400 });
  }

  // Incrémenter le compteur d'utilisation
  await RewardStateManager.incrementUsageCount(reward.id);

  // Récupérer la récompense mise à jour
  const updatedReward = await prisma.rewardTemplates.findUnique({
    where: { id: reward.id }
  });

  const calculatedFields = RewardStateManager.calculateDynamicFields(updatedReward! as RewardTemplate);

  return json({ 
    success: true, 
    message: "Récompense utilisée avec succès",
    reward: updatedReward,
    calculated_fields: calculatedFields
  });
}
