import { RewardStateManager } from "../app/utils/rewards/RewardStateManager.ts";
import { ShopifyRewardSync } from "../app/utils/rewards/ShopifyRewardSync.ts";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Script de traitement des récompenses programmées
 * À exécuter via un cron job (ex: toutes les heures)
 */
async function processScheduledRewards() {
  console.log("🔄 Démarrage du traitement des récompenses programmées...");
  
  try {
    // Récupérer tous les marchands
    const merchants = await prisma.merchant.findMany();

    for (const merchant of merchants) {
      console.log(`\n🏪 Traitement des récompenses pour ${merchant.shopifyDomain}`);

      // Activer les récompenses en attente
      await RewardStateManager.activatePendingRewards(merchant.id);

      // Expirer les récompenses actives
      await RewardStateManager.expireActiveRewards(merchant.id);

      // Envoyer les notifications d'expiration
      await RewardStateManager.sendExpirationNotifications(merchant.id);

      // Synchroniser avec Shopify
      await ShopifyRewardSync.syncAllMerchantRewards(merchant.id);
    }

    console.log("✅ Traitement des récompenses terminé avec succès");
  } catch (error) {
    console.error("❌ Erreur lors du traitement des récompenses:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  processScheduledRewards()
    .then(() => {
      console.log("🎉 Script terminé");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Erreur fatale:", error);
      process.exit(1);
    });
}

export { processScheduledRewards };

