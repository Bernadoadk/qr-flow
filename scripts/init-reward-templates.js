#!/usr/bin/env node

/**
 * Script pour initialiser les templates de récompenses par défaut
 * Usage: node scripts/init-reward-templates.js [merchantId]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initDefaultRewardTemplates(merchantId?: string) {
  try {
    console.log('🎁 Initialisation des templates de récompenses par défaut...');

    // Si aucun merchantId fourni, récupérer tous les marchands
    let merchants;
    if (merchantId) {
      merchants = await prisma.merchant.findMany({
        where: { id: merchantId }
      });
    } else {
      merchants = await prisma.merchant.findMany();
    }

    if (merchants.length === 0) {
      console.log('❌ Aucun marchand trouvé');
      return;
    }

    console.log(`📊 Trouvé ${merchants.length} marchand(s)`);

    for (const merchant of merchants) {
      console.log(`\n🏪 Traitement du marchand: ${merchant.shopifyDomain}`);

      // Vérifier si le marchand a déjà des templates
      const existingTemplates = await prisma.rewardTemplates.count({
        where: { merchantId: merchant.id }
      });

      if (existingTemplates > 0) {
        console.log(`⚠️  Templates déjà existants pour ${merchant.shopifyDomain} (${existingTemplates} templates)`);
        continue;
      }

      // Créer les templates par défaut
      const defaultTemplates = [
        // Bronze tier
        {
          merchantId: merchant.id,
          tier: "Bronze",
          rewardType: "discount",
          value: {
            percentage: 5,
            codePrefix: "BRONZE",
            expiresInDays: 30,
            appliesOncePerCustomer: true
          },
          isActive: true
        },
        
        // Silver tier
        {
          merchantId: merchant.id,
          tier: "Silver",
          rewardType: "discount",
          value: {
            percentage: 10,
            codePrefix: "SILVER",
            expiresInDays: 30,
            appliesOncePerCustomer: true
          },
          isActive: true
        },
        {
          merchantId: merchant.id,
          tier: "Silver",
          rewardType: "free_shipping",
          value: {
            minimumOrder: 50,
            shippingZones: ["FR", "EU"],
            expiresInDays: 30
          },
          isActive: true
        },
        
        // Gold tier
        {
          merchantId: merchant.id,
          tier: "Gold",
          rewardType: "discount",
          value: {
            percentage: 15,
            codePrefix: "GOLD",
            expiresInDays: 30,
            appliesOncePerCustomer: true
          },
          isActive: true
        },
        {
          merchantId: merchant.id,
          tier: "Gold",
          rewardType: "free_shipping",
          value: {
            minimumOrder: 30,
            shippingZones: ["FR", "EU"],
            expiresInDays: 30
          },
          isActive: true
        },
        {
          merchantId: merchant.id,
          tier: "Gold",
          rewardType: "exclusive_product",
          value: {
            productIds: [],
            collectionIds: [],
            expiresInDays: 30
          },
          isActive: true
        },
        
        // Platinum tier
        {
          merchantId: merchant.id,
          tier: "Platinum",
          rewardType: "discount",
          value: {
            percentage: 20,
            codePrefix: "PLATINUM",
            expiresInDays: 30,
            appliesOncePerCustomer: true
          },
          isActive: true
        },
        {
          merchantId: merchant.id,
          tier: "Platinum",
          rewardType: "free_shipping",
          value: {
            minimumOrder: 0,
            shippingZones: ["FR", "EU"],
            expiresInDays: 30
          },
          isActive: true
        },
        {
          merchantId: merchant.id,
          tier: "Platinum",
          rewardType: "exclusive_product",
          value: {
            productIds: [],
            collectionIds: [],
            expiresInDays: 30
          },
          isActive: true
        },
        {
          merchantId: merchant.id,
          tier: "Platinum",
          rewardType: "early_access",
          value: {
            saleStartDate: new Date(),
            saleEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            expiresInDays: 30
          },
          isActive: true
        }
      ];

      // Créer les templates
      for (const template of defaultTemplates) {
        await prisma.rewardTemplates.create({
          data: template
        });
      }

      console.log(`✅ ${defaultTemplates.length} templates créés pour ${merchant.shopifyDomain}`);
    }

    console.log('\n🎉 Initialisation terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Récupérer le merchantId depuis les arguments de ligne de commande
const merchantId = process.argv[2];

// Exécuter le script
initDefaultRewardTemplates(merchantId);
