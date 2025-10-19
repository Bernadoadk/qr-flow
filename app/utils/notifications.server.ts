import { prisma } from '../db.server';
import { logger } from './logger.server';

export interface NotificationData {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  merchantId?: string;
  metadata?: any;
}

export interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class NotificationManager {
  private static instance: NotificationManager;

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  /**
   * Send notification to merchant
   */
  async sendNotification(data: NotificationData): Promise<void> {
    try {
      // Log the notification
      await logger.info(
        `Notification sent: ${data.title}`,
        data.merchantId,
        {
          type: 'notification',
          notificationType: data.type,
          title: data.title,
          message: data.message,
          metadata: data.metadata,
        }
      );

      // Store in database for future reference
      if (data.merchantId) {
        await prisma.webhookLog.create({
          data: {
            merchantId: data.merchantId,
            topic: 'notification',
            payload: {
              type: data.type,
              title: data.title,
              message: data.message,
              metadata: data.metadata,
              timestamp: new Date().toISOString(),
            },
          },
        });
      }

      // Send email if configured
      if (data.type === 'error' || data.type === 'warning') {
        await this.sendEmailNotification(data);
      }
    } catch (error) {
      await logger.error(
        'Failed to send notification',
        data.merchantId,
        {
          type: 'notification_error',
          error: error instanceof Error ? error.message : 'Unknown error',
          notificationData: data,
        }
      );
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(data: NotificationData): Promise<void> {
    try {
      // Get merchant email from settings
      if (!data.merchantId) return;

      const merchant = await prisma.merchant.findUnique({
        where: { id: data.merchantId },
        select: { settings: true },
      });

      if (!merchant?.settings) return;

      const settings = merchant.settings as any;
      if (!settings.notifications?.email) return;

      // For now, we'll just log the email notification
      // In a real implementation, you would integrate with an email service
      await logger.info(
        `Email notification would be sent: ${data.title}`,
        data.merchantId,
        {
          type: 'email_notification',
          subject: data.title,
          message: data.message,
        }
      );
    } catch (error) {
      await logger.error(
        'Failed to send email notification',
        data.merchantId,
        {
          type: 'email_notification_error',
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
    }
  }

  /**
   * Send QR code creation notification
   */
  async notifyQRCodeCreated(
    merchantId: string,
    qrTitle: string,
    qrType: string
  ): Promise<void> {
    await this.sendNotification({
      type: 'success',
      title: 'QR Code créé',
      message: `Votre QR code "${qrTitle}" (${qrType}) a été créé avec succès.`,
      merchantId,
      metadata: {
        qrTitle,
        qrType,
        action: 'qr_created',
      },
    });
  }

  /**
   * Send campaign creation notification
   */
  async notifyCampaignCreated(
    merchantId: string,
    campaignName: string
  ): Promise<void> {
    await this.sendNotification({
      type: 'success',
      title: 'Campagne créée',
      message: `Votre campagne "${campaignName}" a été créée avec succès.`,
      merchantId,
      metadata: {
        campaignName,
        action: 'campaign_created',
      },
    });
  }

  /**
   * Send plan upgrade notification
   */
  async notifyPlanUpgrade(
    merchantId: string,
    oldPlan: string,
    newPlan: string
  ): Promise<void> {
    await this.sendNotification({
      type: 'success',
      title: 'Plan mis à niveau',
      message: `Votre plan a été mis à niveau de ${oldPlan} à ${newPlan}.`,
      merchantId,
      metadata: {
        oldPlan,
        newPlan,
        action: 'plan_upgrade',
      },
    });
  }

  /**
   * Send plan limit reached notification
   */
  async notifyPlanLimitReached(
    merchantId: string,
    limitType: string,
    currentPlan: string
  ): Promise<void> {
    await this.sendNotification({
      type: 'warning',
      title: 'Limite du plan atteinte',
      message: `Vous avez atteint la limite de ${limitType} pour votre plan ${currentPlan}. Pensez à mettre à niveau votre plan.`,
      merchantId,
      metadata: {
        limitType,
        currentPlan,
        action: 'plan_limit_reached',
      },
    });
  }

  /**
   * Send high scan volume notification
   */
  async notifyHighScanVolume(
    merchantId: string,
    qrTitle: string,
    scanCount: number
  ): Promise<void> {
    await this.sendNotification({
      type: 'info',
      title: 'Volume de scans élevé',
      message: `Votre QR code "${qrTitle}" a atteint ${scanCount} scans. Excellent travail !`,
      merchantId,
      metadata: {
        qrTitle,
        scanCount,
        action: 'high_scan_volume',
      },
    });
  }

  /**
   * Send error notification
   */
  async notifyError(
    merchantId: string,
    error: string,
    context?: string
  ): Promise<void> {
    await this.sendNotification({
      type: 'error',
      title: 'Erreur détectée',
      message: `Une erreur s'est produite${context ? ` dans ${context}` : ''}: ${error}`,
      merchantId,
      metadata: {
        error,
        context,
        action: 'error',
      },
    });
  }

  /**
   * Send webhook failure notification
   */
  async notifyWebhookFailure(
    merchantId: string,
    webhookTopic: string,
    error: string
  ): Promise<void> {
    await this.sendNotification({
      type: 'error',
      title: 'Échec du webhook',
      message: `Le webhook ${webhookTopic} a échoué: ${error}`,
      merchantId,
      metadata: {
        webhookTopic,
        error,
        action: 'webhook_failure',
      },
    });
  }

  /**
   * Send security alert notification
   */
  async notifySecurityAlert(
    merchantId: string,
    alert: string,
    details?: any
  ): Promise<void> {
    await this.sendNotification({
      type: 'error',
      title: 'Alerte de sécurité',
      message: `Alerte de sécurité détectée: ${alert}`,
      merchantId,
      metadata: {
        alert,
        details,
        action: 'security_alert',
      },
    });
  }

  /**
   * Send maintenance notification
   */
  async notifyMaintenance(
    merchantId: string,
    maintenanceDate: Date,
    duration: string
  ): Promise<void> {
    await this.sendNotification({
      type: 'info',
      title: 'Maintenance programmée',
      message: `Une maintenance est programmée le ${maintenanceDate.toLocaleDateString('fr-FR')} pour une durée de ${duration}.`,
      merchantId,
      metadata: {
        maintenanceDate: maintenanceDate.toISOString(),
        duration,
        action: 'maintenance',
      },
    });
  }

  /**
   * Send feature announcement
   */
  async notifyFeatureAnnouncement(
    merchantId: string,
    featureName: string,
    description: string
  ): Promise<void> {
    await this.sendNotification({
      type: 'info',
      title: 'Nouvelle fonctionnalité',
      message: `Découvrez notre nouvelle fonctionnalité: ${featureName}. ${description}`,
      merchantId,
      metadata: {
        featureName,
        description,
        action: 'feature_announcement',
      },
    });
  }
}

// Export singleton instance
export const notifications = NotificationManager.getInstance();

/**
 * Utility function to send success notification
 */
export function notifySuccess(
  title: string,
  message: string,
  merchantId?: string,
  metadata?: any
): void {
  notifications.sendNotification({
    type: 'success',
    title,
    message,
    merchantId,
    metadata,
  });
}

/**
 * Utility function to send error notification
 */
export function notifyError(
  title: string,
  message: string,
  merchantId?: string,
  metadata?: any
): void {
  notifications.sendNotification({
    type: 'error',
    title,
    message,
    merchantId,
    metadata,
  });
}

/**
 * Utility function to send warning notification
 */
export function notifyWarning(
  title: string,
  message: string,
  merchantId?: string,
  metadata?: any
): void {
  notifications.sendNotification({
    type: 'warning',
    title,
    message,
    merchantId,
    metadata,
  });
}

/**
 * Utility function to send info notification
 */
export function notifyInfo(
  title: string,
  message: string,
  merchantId?: string,
  metadata?: any
): void {
  notifications.sendNotification({
    type: 'info',
    title,
    message,
    merchantId,
    metadata,
  });
}
