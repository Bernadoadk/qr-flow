import { json, type ActionFunctionArgs } from "@remix-run/node";
import { RewardNotificationService } from "~/utils/rewards/RewardNotificationService";
import { RewardStateManager, RewardTemplate } from "~/utils/rewards/RewardStateManager";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { merchantId, rewardId, notificationType, recipient, testMode } = body;

    if (!merchantId) {
      return json({ error: "Missing merchantId" }, { status: 400 });
    }

    switch (notificationType) {
      case "send_activation":
        return await handleSendActivationNotification(rewardId, recipient);
      
      case "send_expiration_warning":
        return await handleSendExpirationWarning(rewardId, recipient);
      
      case "send_expiration":
        return await handleSendExpirationNotification(rewardId, recipient);
      
      case "schedule_notifications":
        return await handleScheduleNotifications(rewardId);
      
      case "test_notification":
        return await handleTestNotification(recipient, testMode);
      
      case "process_scheduled":
        return await handleProcessScheduledNotifications();
      
      default:
        return json({ error: "Invalid notification type" }, { status: 400 });
    }

  } catch (error) {
    console.error("Error in reward notifications:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Envoie une notification d'activation
 */
async function handleSendActivationNotification(rewardId: string, recipient: any) {
  if (!rewardId || !recipient) {
    return json({ error: "Missing rewardId or recipient" }, { status: 400 });
  }

  try {
    const { prisma } = await import("~/db.server");
    const reward = await prisma.rewardTemplates.findUnique({
      where: { id: rewardId }
    });

    if (!reward) {
      return json({ error: "Reward not found" }, { status: 404 });
    }

    await RewardNotificationService.notifyRewardActivation(reward as RewardTemplate, recipient);

    return json({ 
      success: true, 
      message: "Notification d'activation envoyée",
      reward_title: (reward.value as any)?.title || 'Récompense',
      recipient_email: recipient.email
    });

  } catch (error) {
    console.error("Erreur envoi notification activation:", error);
    return json({ 
      error: "Erreur lors de l'envoi de la notification",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 });
  }
}

/**
 * Envoie une notification d'expiration proche
 */
async function handleSendExpirationWarning(rewardId: string, recipient: any) {
  if (!rewardId || !recipient) {
    return json({ error: "Missing rewardId or recipient" }, { status: 400 });
  }

  try {
    const { prisma } = await import("~/db.server");
    const reward = await prisma.rewardTemplates.findUnique({
      where: { id: rewardId }
    });

    if (!reward) {
      return json({ error: "Reward not found" }, { status: 404 });
    }

    const calculatedFields = RewardStateManager.calculateDynamicFields(reward as RewardTemplate);
    const daysLeft = calculatedFields.days_until_expiry || 0;

    await RewardNotificationService.notifyRewardExpirationWarning(reward as RewardTemplate, recipient, daysLeft);

    return json({ 
      success: true, 
      message: "Notification d'expiration proche envoyée",
      reward_title: (reward.value as any)?.title || 'Récompense',
      days_left: daysLeft,
      recipient_email: recipient.email
    });

  } catch (error) {
    console.error("Erreur envoi notification expiration:", error);
    return json({ 
      error: "Erreur lors de l'envoi de la notification",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 });
  }
}

/**
 * Envoie une notification d'expiration
 */
async function handleSendExpirationNotification(rewardId: string, recipient: any) {
  if (!rewardId || !recipient) {
    return json({ error: "Missing rewardId or recipient" }, { status: 400 });
  }

  try {
    const { prisma } = await import("~/db.server");
    const reward = await prisma.rewardTemplates.findUnique({
      where: { id: rewardId }
    });

    if (!reward) {
      return json({ error: "Reward not found" }, { status: 404 });
    }

    await RewardNotificationService.notifyRewardExpiration(reward as RewardTemplate, recipient);

    return json({ 
      success: true, 
      message: "Notification d'expiration envoyée",
      reward_title: (reward.value as any)?.title || 'Récompense',
      recipient_email: recipient.email
    });

  } catch (error) {
    console.error("Erreur envoi notification expiration:", error);
    return json({ 
      error: "Erreur lors de l'envoi de la notification",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 });
  }
}

/**
 * Planifie les notifications pour une récompense
 */
async function handleScheduleNotifications(rewardId: string) {
  if (!rewardId) {
    return json({ error: "Missing rewardId" }, { status: 400 });
  }

  try {
    const { prisma } = await import("~/db.server");
    const reward = await prisma.rewardTemplates.findUnique({
      where: { id: rewardId }
    });

    if (!reward) {
      return json({ error: "Reward not found" }, { status: 404 });
    }

    await RewardNotificationService.scheduleRewardNotifications(reward as RewardTemplate);

    return json({ 
      success: true, 
      message: "Notifications planifiées avec succès",
      reward_title: (reward.value as any)?.title || 'Récompense'
    });

  } catch (error) {
    console.error("Erreur planification notifications:", error);
    return json({ 
      error: "Erreur lors de la planification des notifications",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 });
  }
}

/**
 * Envoie une notification de test
 */
async function handleTestNotification(recipient: any, testMode: string) {
  if (!recipient) {
    return json({ error: "Missing recipient" }, { status: 400 });
  }

  try {
    const testTemplate = {
      id: "test",
      type: "reward_activation" as const,
      subject: "🧪 Test de notification QRFlow",
      content: `
Bonjour {{customer_name}},

Ceci est un test de notification pour vérifier que le système fonctionne correctement.

Date du test: ${new Date().toLocaleString()}

L'équipe QRFlow
      `.trim(),
      channels: ["email", "in_app"] as ("email" | "in_app" | "sms")[]
    };

    await RewardNotificationService.sendTestNotification(recipient, testTemplate);

    return json({ 
      success: true, 
      message: "Notification de test envoyée",
      test_mode: testMode,
      recipient_email: recipient.email
    });

  } catch (error) {
    console.error("Erreur notification test:", error);
    return json({ 
      error: "Erreur lors de l'envoi de la notification de test",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 });
  }
}

/**
 * Traite toutes les notifications programmées
 */
async function handleProcessScheduledNotifications() {
  try {
    // Traiter les récompenses programmées (inclut les notifications)
    await RewardStateManager.processScheduledRewards();

    return json({ 
      success: true, 
      message: "Notifications programmées traitées avec succès",
      processed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error("Erreur traitement notifications programmées:", error);
    return json({ 
      error: "Erreur lors du traitement des notifications programmées",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 });
  }
}

