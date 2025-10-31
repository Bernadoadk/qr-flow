import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/db.server";
import { RewardStateManager, RewardTemplate } from "~/utils/rewards/RewardStateManager";
import { ShopifyRewardSync } from "~/utils/rewards/ShopifyRewardSync";
import { validateRewardTemplate } from "~/utils/rewards/schemas";

// GET - Récupérer toutes les récompenses d'un marchand
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const merchantId = url.searchParams.get("merchantId");
  const tier = url.searchParams.get("tier");
  const rewardType = url.searchParams.get("rewardType");
  const includeCalculated = url.searchParams.get("includeCalculated") === "true";

  if (!merchantId) {
    return json({ error: "Missing merchantId" }, { status: 400 });
  }

  try {
    const whereClause: any = { merchantId: merchantId };
    
    if (tier) {
      whereClause.tier = tier;
    }
    
    if (rewardType) {
      whereClause.rewardType = rewardType;
    }

    const rewards = await prisma.rewardTemplates.findMany({
      where: whereClause,
      orderBy: [
        { tier: 'asc' },
        { rewardType: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // Ajouter les champs calculés si demandé
    if (includeCalculated) {
      const rewardsWithCalculated = rewards.map(reward => ({
        ...reward,
        calculated_fields: RewardStateManager.calculateDynamicFields(reward as RewardTemplate)
      }));
      
      return json({ 
        success: true, 
        rewards: rewardsWithCalculated,
        count: rewardsWithCalculated.length
      });
    }

    return json({ 
      success: true, 
      rewards,
      count: rewards.length
    });

  } catch (error) {
    console.error("Error fetching reward templates:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Créer ou mettre à jour une récompense
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST" && request.method !== "PUT" && request.method !== "DELETE") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { merchantId, reward, rewardId } = body;

    if (!merchantId) {
      return json({ error: "Missing merchantId" }, { status: 400 });
    }

    if (request.method === "POST" || request.method === "PUT") {
      // Créer ou mettre à jour une récompense
      if (!reward) {
        return json({ error: "Missing reward data" }, { status: 400 });
      }

      // Validation du schéma
      const validation = validateRewardTemplate(reward);
      if (!validation.valid) {
        return json({ 
          error: "Validation failed", 
          details: validation.errors 
        }, { status: 400 });
      }

      // Préparer les données pour la base (structure Prisma)
      const rewardData = {
        merchantId: merchantId,
        tier: reward.tier,
        rewardType: reward.reward_type,
        value: {
          // Champs communs
          title: reward.title,
          description: reward.description,
          usage_count: reward.usage_count ?? 0,
          max_uses: reward.max_uses,
          duration_days: reward.duration_days,
          activation_delay_days: reward.activation_delay_days ?? 0,
          
          // Configuration spécifique selon le type
          ...reward.configuration || {}
        },
        isActive: reward.active ?? true
      };

      let savedReward;
      
      if (request.method === "PUT" && rewardId) {
        // Mise à jour
        savedReward = await prisma.rewardTemplates.update({
          where: { id: rewardId },
          data: rewardData
        });
      } else {
        // Création
        savedReward = await prisma.rewardTemplates.create({
          data: rewardData
        });
      }

      // Calculer les champs dynamiques
      const calculatedFields = RewardStateManager.calculateDynamicFields(savedReward as RewardTemplate);

      return json({ 
        success: true, 
        reward: savedReward,
        calculated_fields: calculatedFields,
        message: request.method === "PUT" ? "Récompense modifiée avec succès" : "Récompense créée avec succès"
      });
    }

    if (request.method === "DELETE") {
      // Supprimer une récompense
      if (!rewardId) {
        return json({ error: "Missing rewardId" }, { status: 400 });
      }

      // Vérifier que la récompense appartient au marchand
      const existingReward = await prisma.rewardTemplates.findFirst({
        where: { 
          id: rewardId,
          merchantId: merchantId
        }
      });

      if (!existingReward) {
        return json({ error: "Reward not found" }, { status: 404 });
      }

      await prisma.rewardTemplates.delete({
        where: { id: rewardId }
      });

      return json({ 
        success: true, 
        message: "Récompense supprimée avec succès"
      });
    }

  } catch (error) {
    console.error("Error managing reward templates:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}
