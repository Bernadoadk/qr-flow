import { prisma } from "~/db.server";
import { authenticate } from "../shopify.server";

export interface DiscountRewardConfig {
  percentage: number;
  codePrefix: string;
  expiresInDays: number;
  appliesOncePerCustomer: boolean;
}

export interface FreeShippingRewardConfig {
  minimumOrder: number;
  shippingZones: string[];
  expiresInDays: number;
}

export interface ExclusiveProductRewardConfig {
  productIds: string[];
  collectionIds: string[];
  expiresInDays: number;
}

export interface EarlyAccessRewardConfig {
  saleStartDate: Date;
  saleEndDate: Date;
  expiresInDays: number;
}

export type RewardConfig = 
  | DiscountRewardConfig 
  | FreeShippingRewardConfig 
  | ExclusiveProductRewardConfig 
  | EarlyAccessRewardConfig;

export class ShopifyRewardsService {
  /**
   * Créer un code de réduction Shopify
   */
  static async createDiscountCode(
    merchantId: string,
    customerId: string,
    tier: string,
    config: DiscountRewardConfig,
    request?: Request
  ): Promise<string> {
    try {
      // Générer un code unique avec suffixe aléatoire
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const code = `${config.codePrefix}${tier.toUpperCase()}${config.percentage}_${randomSuffix}`;
      
      let shopifyId = `discount_${Date.now()}`;
      
      // Intégration avec Shopify Admin API si disponible
      if (request) {
        try {
          const { admin } = await authenticate.admin(request);
          
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
              title: `Loyalty ${tier} - ${config.percentage}%`,
              code: code,
              startsAt: new Date().toISOString(),
              endsAt: new Date(Date.now() + config.expiresInDays * 24 * 60 * 60 * 1000).toISOString(),
              appliesOncePerCustomer: config.appliesOncePerCustomer,
              customerGets: {
                value: {
                  percentage: config.percentage
                },
                items: {
                  allItems: true
                }
              },
              customerSelection: {
                all: true
              }
            }
          };

          const response = await admin.graphql(mutation, { variables });
          const data = await response.json();

          if (data.data?.discountCodeBasicCreate?.codeDiscountNode?.id) {
            shopifyId = data.data.discountCodeBasicCreate.codeDiscountNode.id;
            console.log(`✅ Code de réduction Shopify créé: ${code} (ID: ${shopifyId})`);
          } else if (data.data?.discountCodeBasicCreate?.userErrors?.length > 0) {
            console.error("❌ Erreurs Shopify:", data.data.discountCodeBasicCreate.userErrors);
            // Continuer avec le code généré même si Shopify échoue
          }
        } catch (shopifyError) {
          console.error("❌ Erreur API Shopify:", shopifyError);
          // Continuer avec le code généré même si Shopify échoue
        }
      }
      
      // Sauvegarder en base
      await prisma.shopifyDiscountCodes.create({
        data: {
          merchantId,
          customerId,
          tier,
          code,
          shopifyId,
          percentage: config.percentage,
          expiresAt: new Date(Date.now() + config.expiresInDays * 24 * 60 * 60 * 1000)
        }
      });

      console.log(`✅ Code de réduction créé: ${code} pour ${tier}`);
      return code;
    } catch (error) {
      console.error("❌ Erreur création code de réduction:", error);
      throw error;
    }
  }

  /**
   * Appliquer la livraison gratuite
   */
  static async applyFreeShipping(
    merchantId: string,
    customerId: string,
    tier: string,
    config: FreeShippingRewardConfig,
    request?: Request
  ): Promise<string> {
    try {
      // Générer un code unique pour la livraison gratuite
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const code = `SHIP${tier.toUpperCase()}_${randomSuffix}`;
      
      let shopifyId = `freeship_${Date.now()}`;
      
      // Intégration avec Shopify Admin API si disponible
      if (request) {
        try {
          const { admin } = await authenticate.admin(request);
          
          const mutation = `
            mutation discountCodeFreeShippingCreate($freeShippingCodeDiscount: DiscountCodeFreeShippingInput!) {
              discountCodeFreeShippingCreate(freeShippingCodeDiscount: $freeShippingCodeDiscount) {
                codeDiscountNode {
                  id
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
              title: `Livraison gratuite ${tier}`,
              code: code,
              startsAt: new Date().toISOString(),
              endsAt: new Date(Date.now() + config.expiresInDays * 24 * 60 * 60 * 1000).toISOString(),
              appliesOncePerCustomer: true,
              minimumRequirement: {
                quantity: 1,
                subtotal: config.minimumOrder
              },
              customerSelection: {
                all: true
              }
            }
          };

          const response = await admin.graphql(mutation, { variables });
          const data = await response.json();

          if (data.data?.discountCodeFreeShippingCreate?.codeDiscountNode?.id) {
            shopifyId = data.data.discountCodeFreeShippingCreate.codeDiscountNode.id;
            console.log(`✅ Code livraison gratuite Shopify créé: ${code} (ID: ${shopifyId})`);
          } else if (data.data?.discountCodeFreeShippingCreate?.userErrors?.length > 0) {
            console.error("❌ Erreurs Shopify:", data.data.discountCodeFreeShippingCreate.userErrors);
          }
        } catch (shopifyError) {
          console.error("❌ Erreur API Shopify:", shopifyError);
        }
      }
      
      // Sauvegarder en base
      await prisma.shopifyDiscountCodes.create({
        data: {
          merchantId,
          customerId,
          tier,
          code,
          shopifyId,
          percentage: null, // Pas de pourcentage pour la livraison gratuite
          expiresAt: new Date(Date.now() + config.expiresInDays * 24 * 60 * 60 * 1000)
        }
      });

      console.log(`✅ Livraison gratuite appliquée pour ${tier} (min: ${config.minimumOrder}€)`);
      return code;
    } catch (error) {
      console.error("❌ Erreur application livraison gratuite:", error);
      throw error;
    }
  }

  /**
   * Accorder l'accès aux produits exclusifs
   */
  static async grantExclusiveProductAccess(
    merchantId: string,
    customerId: string,
    tier: string,
    config: ExclusiveProductRewardConfig,
    request?: Request
  ): Promise<void> {
    try {
      // Ajouter un tag spécial sur le client Shopify
      const tag = `exclusive_${tier.toLowerCase()}_access`;
      
      if (request) {
        try {
          const { admin } = await authenticate.admin(request);
          
          // Récupérer le client Shopify par email ou ID
          const customerQuery = `
            query getCustomer($query: String!) {
              customers(first: 1, query: $query) {
                edges {
                  node {
                    id
                    tags
                  }
                }
              }
            }
          `;

          // Essayer de trouver le client par email ou ID
          const customerResponse = await admin.graphql(customerQuery, {
            variables: { query: customerId.includes('@') ? `email:${customerId}` : `id:${customerId}` }
          });
          const customerData = await customerResponse.json();

          if (customerData.data?.customers?.edges?.length > 0) {
            const customer = customerData.data.customers.edges[0].node;
            const currentTags = customer.tags || [];
            
            if (!currentTags.includes(tag)) {
              const updatedTags = [...currentTags, tag];
              
              const updateMutation = `
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

              await admin.graphql(updateMutation, {
                variables: {
                  input: {
                    id: customer.id,
                    tags: updatedTags
                  }
                }
              });

              console.log(`✅ Tag exclusif ajouté: ${tag} pour le client ${customerId}`);
            }
          } else {
            console.log(`⚠️ Client Shopify non trouvé: ${customerId}`);
          }
        } catch (shopifyError) {
          console.error("❌ Erreur API Shopify:", shopifyError);
        }
      }
      
      // Sauvegarder l'accès dans CustomerRewards
      await prisma.customerRewards.upsert({
        where: {
          merchantId_customerId: {
            merchantId,
            customerId
          }
        },
        update: {
          activeRewards: {
            push: `exclusive_access_${tier.toLowerCase()}`
          }
        },
        create: {
          merchantId,
          customerId,
          tier,
          activeRewards: [`exclusive_access_${tier.toLowerCase()}`]
        }
      });

      console.log(`✅ Accès produits exclusifs accordé pour ${tier}:`, config.productIds);
    } catch (error) {
      console.error("❌ Erreur accès produits exclusifs:", error);
      throw error;
    }
  }

  /**
   * Accorder l'accès anticipé aux ventes
   */
  static async grantEarlyAccess(
    merchantId: string,
    customerId: string,
    tier: string,
    config: EarlyAccessRewardConfig,
    request?: Request
  ): Promise<void> {
    try {
      // Ajouter un tag spécial pour l'accès anticipé
      const tag = `early_access_${tier.toLowerCase()}`;
      
      if (request) {
        try {
          const { admin } = await authenticate.admin(request);
          
          // Récupérer le client Shopify par email ou ID
          const customerQuery = `
            query getCustomer($query: String!) {
              customers(first: 1, query: $query) {
                edges {
                  node {
                    id
                    tags
                  }
                }
              }
            }
          `;

          // Essayer de trouver le client par email ou ID
          const customerResponse = await admin.graphql(customerQuery, {
            variables: { query: customerId.includes('@') ? `email:${customerId}` : `id:${customerId}` }
          });
          const customerData = await customerResponse.json();

          if (customerData.data?.customers?.edges?.length > 0) {
            const customer = customerData.data.customers.edges[0].node;
            const currentTags = customer.tags || [];
            
            if (!currentTags.includes(tag)) {
              const updatedTags = [...currentTags, tag];
              
              const updateMutation = `
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

              await admin.graphql(updateMutation, {
                variables: {
                  input: {
                    id: customer.id,
                    tags: updatedTags
                  }
                }
              });

              console.log(`✅ Tag accès anticipé ajouté: ${tag} pour le client ${customerId}`);
            }
          } else {
            console.log(`⚠️ Client Shopify non trouvé: ${customerId}`);
          }
        } catch (shopifyError) {
          console.error("❌ Erreur API Shopify:", shopifyError);
        }
      }
      
      // Sauvegarder l'accès dans CustomerRewards
      await prisma.customerRewards.upsert({
        where: {
          merchantId_customerId: {
            merchantId,
            customerId
          }
        },
        update: {
          activeRewards: {
            push: `early_access_${tier.toLowerCase()}`
          }
        },
        create: {
          merchantId,
          customerId,
          tier,
          activeRewards: [`early_access_${tier.toLowerCase()}`]
        }
      });

      console.log(`✅ Accès anticipé accordé pour ${tier}: ${config.saleStartDate} - ${config.saleEndDate}`);
    } catch (error) {
      console.error("❌ Erreur accès anticipé:", error);
      throw error;
    }
  }

  /**
   * Appliquer toutes les récompenses d'un palier
   */
  static async applyTierRewards(
    merchantId: string,
    customerId: string,
    tier: string,
    request?: Request
  ): Promise<void> {
    try {
      // Récupérer les templates de récompenses pour ce palier
      const rewardTemplates = await prisma.rewardTemplates.findMany({
        where: {
          merchantId,
          tier,
          isActive: true
        }
      });

      if (rewardTemplates.length === 0) {
        console.log(`⚠️ Aucune récompense configurée pour le palier ${tier}`);
        return;
      }

      const activeRewards: string[] = [];
      let discountCode: string | null = null;

      // Appliquer chaque récompense
      for (const template of rewardTemplates) {
        const config = template.value as any;
        
        switch (template.rewardType) {
          case 'discount':
            const code = await this.createDiscountCode(
              merchantId, customerId, tier, config as DiscountRewardConfig, request
            );
            activeRewards.push(`discount_${config.percentage}`);
            discountCode = code;
            break;
            
          case 'free_shipping':
            const shipCode = await this.applyFreeShipping(
              merchantId, customerId, tier, config as FreeShippingRewardConfig, request
            );
            activeRewards.push('free_shipping');
            if (!discountCode) discountCode = shipCode;
            break;
            
          case 'exclusive_product':
            await this.grantExclusiveProductAccess(
              merchantId, customerId, tier, config as ExclusiveProductRewardConfig, request
            );
            activeRewards.push('exclusive_access');
            break;
            
          case 'early_access':
            await this.grantEarlyAccess(
              merchantId, customerId, tier, config as EarlyAccessRewardConfig, request
            );
            activeRewards.push('early_access');
            break;
        }
      }

      // Sauvegarder les récompenses actives du client
      await prisma.customerRewards.upsert({
        where: {
          merchantId_customerId: {
            merchantId,
            customerId
          }
        },
        update: {
          tier,
          activeRewards,
          discountCode,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours par défaut
          updatedAt: new Date()
        },
        create: {
          merchantId,
          customerId,
          tier,
          activeRewards,
          discountCode,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });

      console.log(`✅ Récompenses appliquées pour ${tier}:`, activeRewards);
    } catch (error) {
      console.error("❌ Erreur application récompenses:", error);
      throw error;
    }
  }

  /**
   * Récupérer les récompenses actives d'un client
   */
  static async getCustomerActiveRewards(
    merchantId: string,
    customerId: string
  ): Promise<{
    tier: string;
    activeRewards: string[];
    discountCode?: string;
    expiresAt?: Date;
    discountValue?: number;
  } | null> {
    try {
      const customerRewards = await prisma.customerRewards.findUnique({
        where: {
          merchantId_customerId: {
            merchantId,
            customerId
          }
        }
      });

      if (!customerRewards) {
        return null;
      }

      // Récupérer le code de réduction si disponible
      const discountCodeRecord = await prisma.shopifyDiscountCodes.findFirst({
        where: {
          merchantId,
          customerId,
          tier: customerRewards.tier,
          isUsed: false,
          expiresAt: {
            gt: new Date()
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return {
        tier: customerRewards.tier,
        activeRewards: customerRewards.activeRewards as string[],
        discountCode: customerRewards.discountCode || discountCodeRecord?.code,
        expiresAt: customerRewards.expiresAt || discountCodeRecord?.expiresAt || undefined,
        discountValue: discountCodeRecord?.percentage || undefined
      };
    } catch (error) {
      console.error("❌ Erreur récupération récompenses client:", error);
      throw error;
    }
  }

  /**
   * Marquer un code de réduction comme utilisé
   */
  static async markDiscountCodeAsUsed(
    merchantId: string,
    customerId: string,
    code: string
  ): Promise<void> {
    try {
      await prisma.shopifyDiscountCodes.updateMany({
        where: {
          merchantId,
          customerId,
          code,
          isUsed: false
        },
        data: {
          isUsed: true,
          usedAt: new Date()
        }
      });

      console.log(`✅ Code de réduction marqué comme utilisé: ${code}`);
    } catch (error) {
      console.error("❌ Erreur marquage code utilisé:", error);
      throw error;
    }
  }

  /**
   * Créer des templates de récompenses par défaut pour un marchand
   */
  static async createDefaultRewardTemplates(merchantId: string): Promise<void> {
    try {
      const defaultTemplates = [
        // Bronze tier
        {
          merchantId,
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
          merchantId,
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
          merchantId,
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
          merchantId,
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
          merchantId,
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
          merchantId,
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
          merchantId,
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
          merchantId,
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
          merchantId,
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
          merchantId,
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

      // Créer les templates s'ils n'existent pas déjà
      for (const template of defaultTemplates) {
        await prisma.rewardTemplates.upsert({
          where: {
            merchantId_tier_rewardType: {
              merchantId: template.merchantId,
              tier: template.tier,
              rewardType: template.rewardType
            }
          },
          update: template,
          create: template
        });
      }

      console.log(`✅ Templates de récompenses par défaut créés pour le marchand ${merchantId}`);
    } catch (error) {
      console.error("❌ Erreur création templates par défaut:", error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques des récompenses pour un marchand
   */
  static async getRewardsStats(merchantId: string): Promise<{
    totalActiveRewards: number;
    totalDiscountCodesCreated: number;
    totalDiscountCodesUsed: number;
    rewardsByTier: Record<string, number>;
  }> {
    try {
      const [
        totalActiveRewards,
        totalDiscountCodesCreated,
        totalDiscountCodesUsed,
        rewardsByTier
      ] = await Promise.all([
        prisma.customerRewards.count({
          where: { merchantId }
        }),
        prisma.shopifyDiscountCodes.count({
          where: { merchantId }
        }),
        prisma.shopifyDiscountCodes.count({
          where: { 
            merchantId,
            isUsed: true
          }
        }),
        prisma.customerRewards.groupBy({
          by: ['tier'],
          where: { merchantId },
          _count: {
            tier: true
          }
        })
      ]);

      const rewardsByTierMap = rewardsByTier.reduce((acc, item) => {
        acc[item.tier] = item._count.tier;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalActiveRewards,
        totalDiscountCodesCreated,
        totalDiscountCodesUsed,
        rewardsByTier: rewardsByTierMap
      };
    } catch (error) {
      console.error("❌ Erreur récupération stats récompenses:", error);
      throw error;
    }
  }
}

