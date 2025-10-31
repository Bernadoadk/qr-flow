import { RewardTemplate } from "./RewardStateManager";

export interface NotificationTemplate {
  id: string;
  type: "reward_activation" | "reward_expiration_warning" | "reward_expiration";
  subject: string;
  content: string;
  channels: ("email" | "in_app" | "sms")[];
}

export interface NotificationRecipient {
  customer_id: string;
  email?: string;
  phone?: string;
  name?: string;
}

export class RewardNotificationService {
  /**
   * Envoie une notification d'activation de récompense
   */
  static async notifyRewardActivation(
    reward: RewardTemplate, 
    recipient: NotificationRecipient
  ): Promise<void> {
    const template = this.getNotificationTemplate("reward_activation");
    
    const personalizedContent = this.personalizeContent(template.content, {
      customer_name: recipient.name || "Cher client",
      reward_title: reward.value.title,
      reward_description: reward.value.description,
      tier: reward.tier,
      reward_type: this.getRewardTypeLabel(reward.rewardType)
    });
    
    await this.sendNotification({
      recipient,
      template: {
        ...template,
        content: personalizedContent
      }
    });
    
    console.log(`📧 Notification d'activation envoyée à ${recipient.email} pour ${reward.value.title}`);
  }
  
  /**
   * Envoie une notification d'expiration proche
   */
  static async notifyRewardExpirationWarning(
    reward: RewardTemplate, 
    recipient: NotificationRecipient,
    daysLeft: number
  ): Promise<void> {
    const template = this.getNotificationTemplate("reward_expiration_warning");
    
    const personalizedContent = this.personalizeContent(template.content, {
      customer_name: recipient.name || "Cher client",
      reward_title: reward.value.title,
      reward_description: reward.value.description,
      tier: reward.tier,
      days_left: daysLeft.toString(),
      reward_type: this.getRewardTypeLabel(reward.rewardType)
    });
    
    await this.sendNotification({
      recipient,
      template: {
        ...template,
        content: personalizedContent
      }
    });
    
    console.log(`📧 Notification d'expiration proche envoyée à ${recipient.email} pour ${reward.value.title} (${daysLeft} jours)`);
  }
  
  /**
   * Envoie une notification d'expiration
   */
  static async notifyRewardExpiration(
    reward: RewardTemplate, 
    recipient: NotificationRecipient
  ): Promise<void> {
    const template = this.getNotificationTemplate("reward_expiration");
    
    const personalizedContent = this.personalizeContent(template.content, {
      customer_name: recipient.name || "Cher client",
      reward_title: reward.value.title,
      reward_description: reward.value.description,
      tier: reward.tier,
      reward_type: this.getRewardTypeLabel(reward.rewardType)
    });
    
    await this.sendNotification({
      recipient,
      template: {
        ...template,
        content: personalizedContent
      }
    });
    
    console.log(`📧 Notification d'expiration envoyée à ${recipient.email} pour ${reward.value.title}`);
  }
  
  /**
   * Envoie une notification générique
   */
  private static async sendNotification(params: {
    recipient: NotificationRecipient;
    template: NotificationTemplate;
  }): Promise<void> {
    const { recipient, template } = params;
    
    // Envoyer selon les canaux configurés
    for (const channel of template.channels) {
      try {
        switch (channel) {
          case "email":
            await this.sendEmailNotification(recipient, template);
            break;
          case "in_app":
            await this.sendInAppNotification(recipient, template);
            break;
          case "sms":
            await this.sendSmsNotification(recipient, template);
            break;
        }
      } catch (error) {
        console.error(`❌ Erreur envoi notification ${channel} à ${recipient.email}:`, error);
      }
    }
  }
  
  /**
   * Envoie une notification par email
   */
  private static async sendEmailNotification(
    recipient: NotificationRecipient, 
    template: NotificationTemplate
  ): Promise<void> {
    if (!recipient.email) {
      console.log("⚠️ Pas d'email pour le destinataire");
      return;
    }
    
    // TODO: Intégrer avec un service d'email (SendGrid, Mailgun, etc.)
    console.log(`📧 Email envoyé à ${recipient.email}: ${template.subject}`);
    console.log(`Contenu: ${template.content}`);
  }
  
  /**
   * Envoie une notification in-app
   */
  private static async sendInAppNotification(
    recipient: NotificationRecipient, 
    template: NotificationTemplate
  ): Promise<void> {
    // TODO: Stocker la notification dans la base de données pour affichage in-app
    console.log(`🔔 Notification in-app pour ${recipient.customer_id}: ${template.subject}`);
  }
  
  /**
   * Envoie une notification par SMS
   */
  private static async sendSmsNotification(
    recipient: NotificationRecipient, 
    template: NotificationTemplate
  ): Promise<void> {
    if (!recipient.phone) {
      console.log("⚠️ Pas de numéro de téléphone pour le destinataire");
      return;
    }
    
    // TODO: Intégrer avec un service SMS (Twilio, etc.)
    console.log(`📱 SMS envoyé à ${recipient.phone}: ${template.content}`);
  }
  
  /**
   * Récupère le template de notification selon le type
   */
  private static getNotificationTemplate(type: NotificationTemplate['type']): NotificationTemplate {
    const templates: Record<NotificationTemplate['type'], NotificationTemplate> = {
      reward_activation: {
        id: "reward_activation",
        type: "reward_activation",
        subject: "🎉 Nouvelle récompense activée !",
        content: `
Bonjour {{customer_name}},

Excellente nouvelle ! Votre récompense {{reward_title}} pour le palier {{tier}} est maintenant active.

{{reward_description}}

Profitez-en bien !

L'équipe QRFlow
        `.trim(),
        channels: ["email", "in_app"]
      },
      
      reward_expiration_warning: {
        id: "reward_expiration_warning",
        type: "reward_expiration_warning",
        subject: "⏰ Votre récompense expire bientôt",
        content: `
Bonjour {{customer_name}},

Attention ! Votre récompense {{reward_title}} expire dans {{days_left}} jour(s).

{{reward_description}}

N'hésitez pas à en profiter avant qu'il ne soit trop tard !

L'équipe QRFlow
        `.trim(),
        channels: ["email", "in_app"]
      },
      
      reward_expiration: {
        id: "reward_expiration",
        type: "reward_expiration",
        subject: "📅 Votre récompense a expiré",
        content: `
Bonjour {{customer_name}},

Votre récompense {{reward_title}} pour le palier {{tier}} a expiré.

{{reward_description}}

Continuez à accumuler des points pour débloquer de nouvelles récompenses !

L'équipe QRFlow
        `.trim(),
        channels: ["email", "in_app"]
      }
    };
    
    return templates[type];
  }
  
  /**
   * Personnalise le contenu avec les variables
   */
  private static personalizeContent(content: string, variables: Record<string, string>): string {
    let personalizedContent = content;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      personalizedContent = personalizedContent.replace(new RegExp(placeholder, 'g'), value);
    }
    
    return personalizedContent;
  }
  
  /**
   * Retourne le label du type de récompense
   */
  private static getRewardTypeLabel(rewardType: RewardTemplate['rewardType']): string {
    const labels = {
      discount: "Réduction",
      free_shipping: "Livraison gratuite",
      exclusive_product: "Produit exclusif",
      early_access: "Accès anticipé"
    };
    
    return labels[rewardType as keyof typeof labels] || "Récompense";
  }
  
  /**
   * Planifie les notifications pour une récompense
   */
  static async scheduleRewardNotifications(reward: RewardTemplate): Promise<void> {
    // TODO: Implémenter la planification des notifications
    // - Notification d'activation (immédiate)
    // - Notification d'expiration proche (J-3)
    // - Notification d'expiration (J-0)
    
    console.log(`📅 Notifications planifiées pour ${reward.value.title}`);
  }
  
  /**
   * Annule les notifications planifiées pour une récompense
   */
  static async cancelScheduledNotifications(rewardId: string): Promise<void> {
    // TODO: Implémenter l'annulation des notifications planifiées
    
    console.log(`❌ Notifications annulées pour la récompense ${rewardId}`);
  }
  
  /**
   * Envoie une notification de test
   */
  static async sendTestNotification(
    recipient: NotificationRecipient,
    template: NotificationTemplate
  ): Promise<void> {
    console.log("🧪 Envoi d'une notification de test...");
    
    await this.sendNotification({
      recipient,
      template
    });
    
    console.log("✅ Notification de test envoyée");
  }
}

