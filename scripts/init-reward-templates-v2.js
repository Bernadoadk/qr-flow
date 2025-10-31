#!/usr/bin/env node

/**
 * Script pour initialiser les templates de récompenses par défaut avec les nouveaux schémas
 * Usage: node scripts/init-reward-templates-v2.js [merchantId]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initDefaultRewardTemplates(merchantId) {
  try {
    console.log('🎁 Initialisation des templates de récompenses par défaut (v2)...');

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

      // Créer les templates par défaut avec la nouvelle structure
      const defaultTemplates = [
        // Bronze tier - Réduction
        {
          merchantId: merchant.id,
          tier: "Bronze",
          rewardType: "discount",
          value: {
            title: "Réduction Bronze 5%",
            description: "Profitez de 5% de réduction sur votre commande",
            usage_count: 0,
            max_uses: null,
            duration_days: 30,
            activation_delay_days: 0,
            discount_scope: "order",
            percentage: 5,
            code_prefix: "BRONZE",
            minimum_order_amount: 0,
            maximum_discount_amount: null,
            target_products: [],
            target_collections: [],
            applies_once_per_customer: true
          },
          isActive: true
        },
        
        // Silver tier - Réduction
        {
          merchantId: merchant.id,
          tier: "Silver",
          rewardType: "discount",
          value: {
            title: "Réduction Silver 10%",
            description: "Profitez de 10% de réduction sur votre commande",
            usage_count: 0,
            max_uses: null,
            duration_days: 30,
            activation_delay_days: 0,
            discount_scope: "order",
            percentage: 10,
            code_prefix: "SILVER",
            minimum_order_amount: 0,
            maximum_discount_amount: null,
            target_products: [],
            target_collections: [],
            applies_once_per_customer: true
          },
          isActive: true
        },
        
        // Silver tier - Livraison gratuite
        {
          merchantId: merchant.id,
          tier: "Silver",
          rewardType: "free_shipping",
          value: {
            title: "Livraison gratuite Silver",
            description: "Livraison gratuite dès 50€ d'achat",
            usage_count: 0,
            max_uses: null,
            duration_days: 30,
            activation_delay_days: 0,
            eligible_zones: "all",
            minimum_order_amount: 50,
            requires_code: true,
            shipping_methods: [],
            excluded_zones: []
          },
          isActive: true
        },
        
        // Gold tier - Réduction
        {
          merchantId: merchant.id,
          tier: "Gold",
          rewardType: "discount",
          value: {
            title: "Réduction Gold 15%",
            description: "Profitez de 15% de réduction sur votre commande",
            usage_count: 0,
            max_uses: null,
            duration_days: 30,
            activation_delay_days: 0,
            discount_scope: "order",
            percentage: 15,
            code_prefix: "GOLD",
            minimum_order_amount: 0,
            maximum_discount_amount: null,
            target_products: [],
            target_collections: [],
            applies_once_per_customer: true
          },
          isActive: true
        },
        
        // Gold tier - Livraison gratuite
        {
          merchantId: merchant.id,
          tier: "Gold",
          rewardType: "free_shipping",
          value: {
            title: "Livraison gratuite Gold",
            description: "Livraison gratuite dès 30€ d'achat",
            usage_count: 0,
            max_uses: null,
            duration_days: 30,
            activation_delay_days: 0,
            eligible_zones: "all",
            minimum_order_amount: 30,
            requires_code: true,
            shipping_methods: [],
            excluded_zones: []
          },
          isActive: true
        },
        
        // Gold tier - Produit exclusif
        {
          merchantId: merchant.id,
          tier: "Gold",
          rewardType: "exclusive_product",
          value: {
            title: "Accès produits exclusifs Gold",
            description: "Accès exclusif à nos produits premium",
            usage_count: 0,
            max_uses: null,
            duration_days: 30,
            activation_delay_days: 0,
            access_type: "exclusive",
            access_logic: "hidden_from_non_members",
            product_ids: [],
            collection_ids: [],
            max_quantity_per_customer: null,
            discount_percentage: 0,
            priority_access: true,
            auto_add_to_cart: false,
            shopify_customer_tag: "exclusive_gold_access"
          },
          isActive: true
        },
        
        // Platinum tier - Réduction
        {
          merchantId: merchant.id,
          tier: "Platinum",
          rewardType: "discount",
          value: {
            title: "Réduction Platinum 20%",
            description: "Profitez de 20% de réduction sur votre commande",
            usage_count: 0,
            max_uses: null,
            duration_days: 30,
            activation_delay_days: 0,
            discount_scope: "order",
            percentage: 20,
            code_prefix: "PLATINUM",
            minimum_order_amount: 0,
            maximum_discount_amount: null,
            target_products: [],
            target_collections: [],
            applies_once_per_customer: true
          },
          isActive: true
        },
        
        // Platinum tier - Livraison gratuite
        {
          merchantId: merchant.id,
          tier: "Platinum",
          rewardType: "free_shipping",
          value: {
            title: "Livraison gratuite Platinum",
            description: "Livraison gratuite sans minimum d'achat",
            usage_count: 0,
            max_uses: null,
            duration_days: 30,
            activation_delay_days: 0,
            eligible_zones: "all",
            minimum_order_amount: 0,
            requires_code: true,
            shipping_methods: [],
            excluded_zones: []
          },
          isActive: true
        },
        
        // Platinum tier - Produit exclusif
        {
          merchantId: merchant.id,
          tier: "Platinum",
          rewardType: "exclusive_product",
          value: {
            title: "Accès produits exclusifs Platinum",
            description: "Accès exclusif à tous nos produits premium avec réduction",
            usage_count: 0,
            max_uses: null,
            duration_days: 30,
            activation_delay_days: 0,
            access_type: "exclusive",
            access_logic: "hidden_from_non_members",
            product_ids: [],
            collection_ids: [],
            max_quantity_per_customer: null,
            discount_percentage: 10,
            priority_access: true,
            auto_add_to_cart: false,
            shopify_customer_tag: "exclusive_platinum_access"
          },
          isActive: true
        },
        
        // Platinum tier - Accès anticipé
        {
          merchantId: merchant.id,
          tier: "Platinum",
          rewardType: "early_access",
          value: {
            title: "Accès anticipé Platinum",
            description: "Accès anticipé à nos ventes privées",
            usage_count: 0,
            max_uses: null,
            duration_days: 7,
            activation_delay_days: 0,
            event_type: "private_sale",
            access_start_date: new Date().toISOString(),
            access_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            grace_period_hours: 24,
            collections_concerned: [],
            product_ids: [],
            discount_percentage: 0,
            notification_enabled: true,
            shopify_customer_tag: "early_access_platinum"
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

