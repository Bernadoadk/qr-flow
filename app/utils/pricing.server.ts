import { Plan } from "@prisma/client";

export interface PlanLimits {
  qrCodes: number; // -1 = unlimited
  campaigns: number; // -1 = unlimited
  analyticsDays: number;
  features: string[];
  price: number; // in cents
  currency: string;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  [Plan.FREE]: {
    qrCodes: 5,
    campaigns: 1,
    analyticsDays: 7,
    features: [
      "5 QR codes",
      "1 campagne",
      "Analytics 7 jours",
      "Support email",
    ],
    price: 0,
    currency: "EUR",
  },
  [Plan.BASIC]: {
    qrCodes: 50,
    campaigns: 10,
    analyticsDays: 30,
    features: [
      "50 QR codes",
      "10 campagnes",
      "Analytics 30 jours",
      "Support prioritaire",
      "Export des données",
    ],
    price: 900, // 9€
    currency: "EUR",
  },
  [Plan.PRO]: {
    qrCodes: -1, // unlimited
    campaigns: -1, // unlimited
    analyticsDays: 90,
    features: [
      "QR codes illimités",
      "Campagnes illimitées",
      "Analytics 90 jours",
      "Support prioritaire",
      "Export des données",
      "Programme de fidélité",
      "API access",
    ],
    price: 2900, // 29€
    currency: "EUR",
  },
  [Plan.ENTERPRISE]: {
    qrCodes: -1, // unlimited
    campaigns: -1, // unlimited
    analyticsDays: 365,
    features: [
      "QR codes illimités",
      "Campagnes illimitées",
      "Analytics 1 an",
      "Support dédié",
      "Export des données",
      "Programme de fidélité",
      "API access",
      "Intégrations personnalisées",
      "SLA 99.9%",
    ],
    price: 9900, // 99€
    currency: "EUR",
  },
};

export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function canUpgrade(currentPlan: Plan, targetPlan: Plan): boolean {
  const planOrder = [Plan.FREE, Plan.BASIC, Plan.PRO, Plan.ENTERPRISE];
  const currentIndex = planOrder.indexOf(currentPlan);
  const targetIndex = planOrder.indexOf(targetPlan);
  
  return targetIndex > currentIndex;
}

export function formatPrice(priceInCents: number, currency: string = "EUR"): string {
  const price = priceInCents / 100;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency,
  }).format(price);
}

export function getUpgradeMessage(currentPlan: Plan, targetPlan: Plan): string {
  const currentLimits = getPlanLimits(currentPlan);
  const targetLimits = getPlanLimits(targetPlan);
  
  if (targetLimits.qrCodes === -1) {
    return `Passez à ${targetPlan} pour des QR codes illimités et plus de fonctionnalités !`;
  }
  
  const qrIncrease = targetLimits.qrCodes - currentLimits.qrCodes;
  return `Passez à ${targetPlan} pour ${qrIncrease} QR codes supplémentaires et plus de fonctionnalités !`;
}
