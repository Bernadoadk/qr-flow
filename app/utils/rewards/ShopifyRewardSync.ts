import { authenticate } from "~/shopify.server";
import { prisma } from "~/db.server";
import { RewardTemplate } from "./RewardStateManager";

export interface ShopifyResource {
  id: string;
  type: "price_rule" | "shipping_discount" | "customer_tag" | "product_rule";
  status: "active" | "expired" | "disabled" | "deleted";
  last_sync: Date;
}

export class ShopifyRewardSync {
  /**
   * Synchronise une récompense avec Shopify
   */
  static async syncRewardWithShopify(reward: RewardTemplate, request?: Request): Promise<ShopifyResource | null> {
    try {
      if (!request) {
        console.log("⚠️ Pas de requête fournie pour l'authentification Shopify");
        return null;
      }

      const { admin } = await authenticate.admin(request);
      
      switch (reward.rewardType) {
        case "discount":
          return await this.syncDiscountReward(reward, admin);
        case "free_shipping":
          return await this.syncFreeShippingReward(reward, admin);
        case "exclusive_product":
          return await this.syncExclusiveProductReward(reward, admin);
        case "early_access":
          return await this.syncEarlyAccessReward(reward, admin);
        default:
          throw new Error(`Type de récompense non supporté: ${reward.rewardType}`);
      }
    } catch (error) {
      console.error(`❌ Erreur synchronisation Shopify pour ${reward.id}:`, error);
      return null;
    }
  }
  
  /**
   * Synchronise une récompense de type "discount"
   */
  private static async syncDiscountReward(reward: RewardTemplate, admin: any): Promise<ShopifyResource> {
    const config = reward.value || {};
    
    // Générer un code unique
    const codeSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const discountCode = `${config.code_prefix || 'LOYALTY'}_${reward.tier.toUpperCase()}_${codeSuffix}`;
    
    const mutation = `
      mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
        discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
          codeDiscountNode {
            id
            codeDiscount {
              ... on DiscountCodeBasic {
                codes(first: 1) {
                  edges {
                    node {
                      code
                    }
                  }
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    
    const variables = {
      basicCodeDiscount: {
        title: `${reward.tier} ${config.percentage || 10}% Discount`,
        code: discountCode,
        startsAt: new Date().toISOString(),
        endsAt: config.duration_days ? 
          new Date(Date.now() + config.duration_days * 24 * 60 * 60 * 1000).toISOString() : 
          null,
        appliesOncePerCustomer: config.applies_once_per_customer || true,
        customerGets: {
          value: {
            percentage: config.percentage || 10
          },
          items: config.discount_scope === "product" ? {
            products: {
              productIds: config.target_products || []
            }
          } : {
            allItems: true
          }
        },
        customerSelection: {
          all: true
        },
        minimumRequirement: config.minimum_order_amount > 0 ? {
          greaterThanOrEqualToSubtotal: config.minimum_order_amount
        } : null
      }
    };
    
    const response = await admin.graphql(mutation, { variables });
    const data = await response.json();
    
    if (data.data?.discountCodeBasicCreate?.userErrors?.length > 0) {
      throw new Error(`Erreurs Shopify: ${JSON.stringify(data.data.discountCodeBasicCreate.userErrors)}`);
    }
    
    const priceRuleId = data.data?.discountCodeBasicCreate?.codeDiscountNode?.id;
    
    if (!priceRuleId) {
      throw new Error("Impossible de créer la PriceRule Shopify");
    }
    
    // Mettre à jour la base de données avec les informations Shopify
    const updatedValue = {
      ...config,
      shopify_price_rule_id: priceRuleId,
      shopify_discount_code: discountCode,
      last_sync: new Date().toISOString()
    };
    
    await prisma.rewardTemplates.update({
      where: { id: reward.id },
      data: {
        value: updatedValue
      }
    });
    
    console.log(`✅ Récompense discount synchronisée: ${discountCode} (ID: ${priceRuleId})`);
    
    return {
      id: priceRuleId,
      type: "price_rule",
      status: "active",
      last_sync: new Date()
    };
  }
  
  /**
   * Synchronise une récompense de type "free_shipping"
   */
  private static async syncFreeShippingReward(reward: RewardTemplate, admin: any): Promise<ShopifyResource> {
    const config = reward.value || {};
    
    if (!config.requires_code) {
      // Pas de code requis, juste un tag client
      return await this.syncCustomerTag(reward, admin, "free_shipping");
    }
    
    // Générer un code de livraison gratuite
    const codeSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const shippingCode = `SHIP_${reward.tier.toUpperCase()}_${codeSuffix}`;
    
    const mutation = `
      mutation discountCodeFreeShippingCreate($freeShippingCodeDiscount: DiscountCodeFreeShippingInput!) {
        discountCodeFreeShippingCreate(freeShippingCodeDiscount: $freeShippingCodeDiscount) {
          codeDiscountNode {
            id
            codeDiscount {
              ... on DiscountCodeFreeShipping {
                codes(first: 1) {
                  edges {
                    node {
                      code
                    }
                  }
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    
    const variables = {
      freeShippingCodeDiscount: {
        title: `${reward.tier} Free Shipping`,
        code: shippingCode,
        startsAt: new Date().toISOString(),
        endsAt: config.duration_days ? 
          new Date(Date.now() + config.duration_days * 24 * 60 * 60 * 1000).toISOString() : 
          null,
        appliesOncePerCustomer: true,
        minimumRequirement: {
          greaterThanOrEqualToSubtotal: config.minimum_order_amount || 0
        }
      }
    };
    
    const response = await admin.graphql(mutation, { variables });
    const data = await response.json();
    
    if (data.data?.discountCodeFreeShippingCreate?.userErrors?.length > 0) {
      throw new Error(`Erreurs Shopify: ${JSON.stringify(data.data.discountCodeFreeShippingCreate.userErrors)}`);
    }
    
    const shippingDiscountId = data.data?.discountCodeFreeShippingCreate?.codeDiscountNode?.id;
    
    if (!shippingDiscountId) {
      throw new Error("Impossible de créer le code de livraison gratuite Shopify");
    }
    
    // Mettre à jour la base de données avec les informations Shopify
    const updatedValue = {
      ...config,
      shopify_shipping_discount_id: shippingDiscountId,
      shopify_shipping_code: shippingCode,
      last_sync: new Date().toISOString()
    };
    
    await prisma.rewardTemplates.update({
      where: { id: reward.id },
      data: {
        value: updatedValue
      }
    });
    
    console.log(`✅ Récompense livraison gratuite synchronisée: ${shippingCode} (ID: ${shippingDiscountId})`);
    
    return {
      id: shippingDiscountId,
      type: "shipping_discount",
      status: "active",
      last_sync: new Date()
    };
  }
  
  /**
   * Synchronise une récompense de type "exclusive_product"
   */
  private static async syncExclusiveProductReward(reward: RewardTemplate, admin: any): Promise<ShopifyResource> {
    const config = reward.value || {};
    const customerTag = config.shopify_customer_tag || `exclusive_${reward.tier.toLowerCase()}_access`;
    
    return await this.syncCustomerTag(reward, admin, customerTag);
  }
  
  /**
   * Synchronise une récompense de type "early_access"
   */
  private static async syncEarlyAccessReward(reward: RewardTemplate, admin: any): Promise<ShopifyResource> {
    const config = reward.value || {};
    const customerTag = config.shopify_customer_tag || `early_access_${reward.tier.toLowerCase()}`;
    
    return await this.syncCustomerTag(reward, admin, customerTag);
  }
  
  /**
   * Synchronise un tag client Shopify
   */
  private static async syncCustomerTag(reward: RewardTemplate, admin: any, tag: string): Promise<ShopifyResource> {
    // Pour les tags clients, on ne crée pas de ressource Shopify directement
    // On stocke juste le tag qui sera appliqué aux clients lors de l'attribution
    
    const config = reward.value || {};
    const updatedValue = {
      ...config,
      shopify_customer_tag: tag,
      last_sync: new Date().toISOString()
    };
    
    await prisma.rewardTemplates.update({
      where: { id: reward.id },
      data: {
        value: updatedValue
      }
    });
    
    console.log(`✅ Tag client Shopify configuré: ${tag}`);
    
    return {
      id: tag,
      type: "customer_tag",
      status: "active",
      last_sync: new Date()
    };
  }
  
  /**
   * Applique un tag client à un client Shopify
   */
  static async applyCustomerTag(customerId: string, tag: string, request?: Request): Promise<boolean> {
    try {
      if (!request) {
        console.log("⚠️ Pas de requête fournie pour l'authentification Shopify");
        return false;
      }

      const { admin } = await authenticate.admin(request);
      
      const mutation = `
        mutation customerUpdate($input: CustomerInput!) {
          customerUpdate(input: $input) {
            customer {
              id
              tags
            }
            userErrors {
              field
              message
            }
          }
        }
      `;
      
      // Récupérer les tags existants du client
      const customerQuery = `
        query getCustomer($id: ID!) {
          customer(id: $id) {
            id
            tags
          }
        }
      `;
      
      const customerResponse = await admin.graphql(customerQuery, { 
        variables: { id: customerId } 
      });
      const customerData = await customerResponse.json();
      
      const existingTags = customerData.data?.customer?.tags || [];
      const updatedTags = [...existingTags];
      
      // Ajouter le nouveau tag s'il n'existe pas déjà
      if (!updatedTags.includes(tag)) {
        updatedTags.push(tag);
      }
      
      const variables = {
        input: {
          id: customerId,
          tags: updatedTags
        }
      };
      
      const response = await admin.graphql(mutation, { variables });
      const data = await response.json();
      
      if (data.data?.customerUpdate?.userErrors?.length > 0) {
        console.error("Erreurs Shopify:", data.data.customerUpdate.userErrors);
        return false;
      }
      
      console.log(`✅ Tag ${tag} appliqué au client ${customerId}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Erreur application tag client:`, error);
      return false;
    }
  }
  
  /**
   * Vérifie le statut d'une ressource Shopify
   */
  static async checkShopifyResourceStatus(reward: RewardTemplate, request?: Request): Promise<ShopifyResource['status']> {
    try {
      if (!request) {
        return "disabled";
      }

      const { admin } = await authenticate.admin(request);
      const config = reward.value || {};
      
      // Vérifier selon le type de ressource
      if (config.shopify_price_rule_id) {
        return await this.checkPriceRuleStatus(config.shopify_price_rule_id, admin);
      }
      
      if (config.shopify_shipping_discount_id) {
        return await this.checkShippingDiscountStatus(config.shopify_shipping_discount_id, admin);
      }
      
      if (config.shopify_customer_tag) {
        return "active"; // Les tags clients sont toujours "actifs"
      }
      
      return "disabled";
      
    } catch (error) {
      console.error(`❌ Erreur vérification statut Shopify:`, error);
      return "disabled";
    }
  }
  
  /**
   * Vérifie le statut d'une PriceRule
   */
  private static async checkPriceRuleStatus(priceRuleId: string, admin: any): Promise<ShopifyResource['status']> {
    const query = `
      query getPriceRule($id: ID!) {
        priceRule(id: $id) {
          id
          status
          startsAt
          endsAt
        }
      }
    `;
    
    const response = await admin.graphql(query, { 
      variables: { id: priceRuleId } 
    });
    const data = await response.json();
    
    const priceRule = data.data?.priceRule;
    if (!priceRule) return "deleted";
    
    const now = new Date();
    const startsAt = new Date(priceRule.startsAt);
    const endsAt = priceRule.endsAt ? new Date(priceRule.endsAt) : null;
    
    if (endsAt && endsAt < now) return "expired";
    if (startsAt > now) return "disabled";
    if (priceRule.status === "ACTIVE") return "active";
    
    return "disabled";
  }
  
  /**
   * Vérifie le statut d'un code de livraison gratuite
   */
  private static async checkShippingDiscountStatus(shippingDiscountId: string, admin: any): Promise<ShopifyResource['status']> {
    // Même logique que pour les PriceRules
    return await this.checkPriceRuleStatus(shippingDiscountId, admin);
  }
  
  /**
   * Synchronise toutes les récompenses d'un marchand
   */
  static async syncAllMerchantRewards(merchantId: string, request?: Request): Promise<void> {
    const rewards = await prisma.rewardTemplates.findMany({
      where: { merchantId: merchantId }
    });
    
    console.log(`🔄 Synchronisation de ${rewards.length} récompenses pour le marchand ${merchantId}`);
    
    for (const reward of rewards) {
      try {
        await this.syncRewardWithShopify(reward as RewardTemplate, request);
      } catch (error) {
        console.error(`❌ Erreur sync récompense ${reward.id}:`, error);
      }
    }
    
    console.log(`✅ Synchronisation terminée pour le marchand ${merchantId}`);
  }
}
