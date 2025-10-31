import { prisma } from "~/db.server";

export interface RewardTemplate {
  id: string;
  merchantId: string;
  tier: string;
  rewardType: "discount" | "free_shipping" | "exclusive_product" | "early_access";
  value: any; // Configuration spécifique selon le type (JSON)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface pour les données de création/mise à jour
export interface RewardTemplateInput {
  merchantId: string;
  tier: string;
  rewardType: "discount" | "free_shipping" | "exclusive_product" | "early_access";
  value: {
    // Champs communs
    title?: string;
    description?: string;
    usage_count?: number;
    max_uses?: number | null;
    duration_days?: number | null;
    activation_delay_days?: number;
    
    // Champs spécifiques selon le type
    [key: string]: any;
  };
  isActive?: boolean;
}

export interface CalculatedFields {
  activation_date: Date | null;
  expiration_date: Date | null;
  is_expired: boolean;
  is_active: boolean;
  remaining_uses: number | null;
  can_be_used: boolean;
  days_until_expiry: number | null;
  activation_status: "pending" | "active" | "expired" | "disabled";
  shopify_status: "synced" | "pending" | "error" | "not_synced";
}

export class RewardStateManager {
  /**
   * Calcule tous les champs dynamiques d'une récompense
   */
  static calculateDynamicFields(reward: RewardTemplate): CalculatedFields {
    const now = new Date();
    const config = reward.value || {};
    
    // Calcul de la date d'activation (basé sur createdAt + activation_delay_days)
    const activationDelayDays = config.activation_delay_days || 0;
    const activationDate = new Date(
      reward.createdAt.getTime() + (activationDelayDays * 24 * 60 * 60 * 1000)
    );
    
    // Calcul de la date d'expiration (basé sur duration_days)
    const durationDays = config.duration_days || config.expiresInDays || null;
    const expirationDate = durationDays ? 
      new Date(activationDate.getTime() + (durationDays * 24 * 60 * 60 * 1000)) : 
      null;
    
    // Statut d'expiration
    const isExpired = expirationDate ? expirationDate < now : false;
    
    // Statut d'activation
    const isActive = reward.isActive && !isExpired && activationDate <= now;
    
    // Utilisations restantes (basé sur usage_count et max_uses)
    const usageCount = config.usage_count || 0;
    const maxUses = config.max_uses || null;
    const remainingUses = maxUses ? maxUses - usageCount : null;
    
    // Possibilité d'utilisation
    const canBeUsed = isActive && (remainingUses === null || remainingUses > 0);
    
    // Jours jusqu'à expiration
    const daysUntilExpiry = expirationDate ? 
      Math.ceil((expirationDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) : 
      null;
    
    // Statut d'activation global
    let activationStatus: CalculatedFields['activation_status'];
    if (!reward.isActive) {
      activationStatus = "disabled";
    } else if (isExpired) {
      activationStatus = "expired";
    } else if (activationDate > now) {
      activationStatus = "pending";
    } else {
      activationStatus = "active";
    }
    
    // Statut Shopify (simplifié pour l'instant)
    const shopifyStatus: CalculatedFields['shopify_status'] = "not_synced";
    
    return {
      activation_date: activationDate,
      expiration_date: expirationDate,
      is_expired: isExpired,
      is_active: isActive,
      remaining_uses: remainingUses,
      can_be_used: canBeUsed,
      days_until_expiry: daysUntilExpiry,
      activation_status: activationStatus,
      shopify_status: shopifyStatus
    };
  }
  
  /**
   * Calcule le statut de synchronisation Shopify (simplifié)
   */
  private static calculateShopifyStatus(reward: RewardTemplate): CalculatedFields['shopify_status'] {
    // Pour l'instant, retourner "not_synced" par défaut
    // TODO: Implémenter la logique de vérification Shopify
    return "not_synced";
  }
  
  /**
   * Active automatiquement les récompenses en attente
   */
  static async activatePendingRewards(): Promise<void> {
    const now = new Date();
    
    const pendingRewards = await prisma.rewardTemplates.findMany({
      where: {
        isActive: true,
        createdAt: {
          lte: new Date(now.getTime() - (1 * 24 * 60 * 60 * 1000)) // Au moins 1 jour d'ancienneté
        }
      }
    });
    
    for (const reward of pendingRewards) {
      const calculated = this.calculateDynamicFields(reward as RewardTemplate);
      
      if (calculated.activation_status === "pending" && calculated.activation_date && calculated.activation_date <= now) {
        console.log(`🔄 Activation automatique de la récompense ${reward.id}`);
        
        // Déclencher les notifications d'activation
        await this.notifyRewardActivation(reward as RewardTemplate);
      }
    }
  }
  
  /**
   * Expire automatiquement les récompenses actives
   */
  static async expireActiveRewards(): Promise<void> {
    const now = new Date();
    
    const activeRewards = await prisma.rewardTemplates.findMany({
      where: {
        isActive: true
      }
    });
    
    for (const reward of activeRewards) {
      const calculated = this.calculateDynamicFields(reward as RewardTemplate);
      
      if (calculated.is_expired && calculated.activation_status === "active") {
        console.log(`⏰ Expiration automatique de la récompense ${reward.id}`);
        
        // Désactiver la récompense
        await prisma.rewardTemplates.update({
          where: { id: reward.id },
          data: { isActive: false }
        });
        
        // Déclencher les notifications d'expiration
        await this.notifyRewardExpiration(reward as RewardTemplate);
      }
    }
  }
  
  /**
   * Envoie les notifications d'expiration proche (J-3)
   */
  static async sendExpirationNotifications(): Promise<void> {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
    
    const activeRewards = await prisma.rewardTemplates.findMany({
      where: {
        isActive: true
      }
    });
    
    for (const reward of activeRewards) {
      const calculated = this.calculateDynamicFields(reward as RewardTemplate);
      
      if (calculated.expiration_date && 
          calculated.expiration_date <= threeDaysFromNow && 
          calculated.expiration_date > now &&
          calculated.activation_status === "active") {
        
        console.log(`📧 Notification d'expiration proche pour la récompense ${reward.id}`);
        
        // Déclencher les notifications d'expiration proche
        await this.notifyRewardExpirationWarning(reward as RewardTemplate, calculated.days_until_expiry || 0);
      }
    }
  }
  
  /**
   * Traite toutes les récompenses programmées (cron job)
   */
  static async processScheduledRewards(): Promise<void> {
    console.log("🔄 Traitement des récompenses programmées...");
    
    try {
      await this.activatePendingRewards();
      await this.expireActiveRewards();
      await this.sendExpirationNotifications();
      
      console.log("✅ Traitement des récompenses terminé");
    } catch (error) {
      console.error("❌ Erreur lors du traitement des récompenses:", error);
    }
  }
  
  /**
   * Notifie l'activation d'une récompense
   */
  private static async notifyRewardActivation(reward: RewardTemplate): Promise<void> {
    // TODO: Implémenter avec RewardNotificationService
    const config = reward.value as any;
    console.log(`📢 Notification d'activation pour ${config.title || reward.rewardType} ${reward.tier}`);
  }
  
  /**
   * Notifie l'expiration d'une récompense
   */
  private static async notifyRewardExpiration(reward: RewardTemplate): Promise<void> {
    // TODO: Implémenter avec RewardNotificationService
    const config = reward.value as any;
    console.log(`📢 Notification d'expiration pour ${config.title || reward.rewardType} ${reward.tier}`);
  }
  
  /**
   * Notifie l'expiration proche d'une récompense
   */
  private static async notifyRewardExpirationWarning(reward: RewardTemplate, daysLeft: number): Promise<void> {
    // TODO: Implémenter avec RewardNotificationService
    const config = reward.value as any;
    console.log(`📢 Notification d'expiration proche (${daysLeft} jours) pour ${config.title || reward.rewardType} ${reward.tier}`);
  }
  
  /**
   * Met à jour le compteur d'utilisation d'une récompense
   */
  static async incrementUsageCount(rewardId: string): Promise<void> {
    // Récupérer la récompense actuelle
    const reward = await prisma.rewardTemplates.findUnique({
      where: { id: rewardId }
    });
    
    if (!reward) return;
    
    const currentValue = reward.value as any;
    const newValue = {
      ...currentValue,
      usage_count: (currentValue.usage_count || 0) + 1
    };
    
    await prisma.rewardTemplates.update({
      where: { id: rewardId },
      data: {
        value: newValue
      }
    });
  }
  
  /**
   * Vérifie si une récompense peut être utilisée
   */
  static async canUseReward(rewardId: string): Promise<boolean> {
    const reward = await prisma.rewardTemplates.findUnique({
      where: { id: rewardId }
    });
    
    if (!reward) return false;
    
    const calculated = this.calculateDynamicFields(reward as RewardTemplate);
    return calculated.can_be_used;
  }
}
