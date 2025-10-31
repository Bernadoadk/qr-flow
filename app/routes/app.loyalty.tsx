import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigation, useSubmit } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { Page } from "@shopify/polaris";
import React, { useState, useEffect } from 'react';
import { prisma } from "../db.server";
import { getOrCreateMerchant } from "../utils/merchant.server";
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import Loader from '../components/ui/Loader';
import LoyaltyPersonalization from '../components/loyalty/LoyaltyPersonalization';
import { LoyaltyRewardsManager } from '../components/loyalty/LoyaltyRewardsManager';
import { formatNumber, formatDate, formatCurrency, formatPercentage } from '../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuickNotifications } from '../components/ui/NotificationSystem';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import {
  Plus,
  Edit,
  Search,
  Users,
  Star,
  Gift,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Calendar,
  Award,
  Target,
  Zap,
  Crown,
  Heart,
  Trophy,
  Activity,
  Clock,
  Check,
  Trash2,
  Eye,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  
  // Get or create merchant
  const merchant = await getOrCreateMerchant(
    session?.shop || (admin as any).shopifyDomain || (admin as any).shop || (admin as any).domain,
    session?.accessToken
  );

  // Get loyalty programs
  const loyaltyPrograms = await prisma.loyaltyProgram.findMany({
    where: {
      merchantId: merchant.id,
    },
  });

  // Get customer points
  const customerPoints = await prisma.customerPoints.findMany({
    where: {
      merchantId: merchant.id,
    },
  });

  // Get reward templates for this merchant
  const rewardTemplates = await prisma.rewardTemplates.findMany({
    where: {
      merchantId: merchant.id,
      isActive: true
    },
    orderBy: [
      { tier: 'asc' },
      { rewardType: 'asc' }
    ]
  });

  return json({
    shop: session?.shop || (admin as any).shopifyDomain || (admin as any).shop || (admin as any).domain,
    loyaltyPrograms,
    customerPoints,
    rewardTemplates,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action") as string;

  // Get or create merchant
  const merchant = await getOrCreateMerchant(
    session?.shop || (admin as any).shopifyDomain || (admin as any).shop || (admin as any).domain,
    session?.accessToken
  );

  try {
    switch (action) {
      case "create_loyalty_program": {
        const name = formData.get("name") as string;
        const description = formData.get("description") as string;
        const pointsPerScan = Number(formData.get("pointsPerScan"));
        const pointsPerPurchase = Number(formData.get("pointsPerPurchase"));
        const pointsPerDollar = Number(formData.get("pointsPerDollar"));
        const isActive = formData.get("isActive") === "true";

        const loyaltyProgram = await prisma.loyaltyProgram.create({
          data: {
            name,
            description,
            pointsPerScan,
            active: isActive,
            merchantId: merchant.id,
          },
        });

        return json({ success: true, loyaltyProgram });
      }

      case "update_loyalty_program": {
        const id = formData.get("id") as string;
        const name = formData.get("name") as string;
        const description = formData.get("description") as string;
        const pointsPerScan = Number(formData.get("pointsPerScan"));
        const pointsPerPurchase = Number(formData.get("pointsPerPurchase"));
        const pointsPerDollar = Number(formData.get("pointsPerDollar"));
        const isActive = formData.get("isActive") === "true";

        const loyaltyProgram = await prisma.loyaltyProgram.update({
          where: { id },
          data: {
            name,
            description,
            pointsPerScan,
            active: isActive,
          },
        });

        return json({ success: true, loyaltyProgram });
      }

      case "delete_loyalty_program": {
        const id = formData.get("id") as string;

        console.log(`🗑️ Suppression du programme de fidélité ${id} pour le marchand ${merchant.id}`);

        // 1. Supprimer d'abord les données associées (dans l'ordre des dépendances)
        
        // Supprimer les récompenses clients actives
        await prisma.customerRewards.deleteMany({
          where: { merchantId: merchant.id }
        });
        console.log(`✅ Récompenses clients supprimées`);

        // Supprimer les codes de réduction Shopify générés
        await prisma.shopifyDiscountCodes.deleteMany({
          where: { merchantId: merchant.id }
        });
        console.log(`✅ Codes de réduction Shopify supprimés`);

        // Supprimer les templates de récompenses
        await prisma.rewardTemplates.deleteMany({
          where: { merchantId: merchant.id }
        });
        console.log(`✅ Templates de récompenses supprimés`);

        // Supprimer les points des clients
        await prisma.customerPoints.deleteMany({
          where: { merchantId: merchant.id }
        });
        console.log(`✅ Points clients supprimés`);

        // Supprimer les QR codes LOYALTY associés
        await prisma.qRCode.deleteMany({
          where: { 
            merchantId: merchant.id,
            type: "LOYALTY"
          }
        });
        console.log(`✅ QR codes LOYALTY supprimés`);

        // Supprimer le programme de fidélité lui-même
        await prisma.loyaltyProgram.delete({
          where: { id },
        });
        console.log(`✅ Programme de fidélité supprimé`);

        console.log(`🎉 Programme de fidélité ${id} supprimé avec TOUTES ses données associées`);
        return json({ success: true });
      }

      case "add_customer_points": {
        const customerId = formData.get("customerId") as string;
        const points = Number(formData.get("points"));
        const name = formData.get("name") as string;
        const tier = formData.get("tier") as string;

        const customerPoints = await prisma.customerPoints.upsert({
          where: {
            id: `${merchant.id}_${customerId}`,
          },
          update: {
            points: {
              increment: points,
            },
            meta: {
              name,
              tier,
              addedManually: true,
              addedAt: new Date().toISOString(),
            },
          },
          create: {
            merchantId: merchant.id,
            customerId,
            points,
            meta: {
              name,
              tier,
              addedManually: true,
              addedAt: new Date().toISOString(),
            },
          },
        });

        return json({ success: true, customerPoints });
      }

      case "update_loyalty_personalization": {
        const loyaltyProgramId = formData.get("loyaltyProgramId") as string;
        console.log("🔄 Mise à jour personnalisation loyalty:", loyaltyProgramId);
        
        // Récupérer toutes les données de personnalisation
        const personalizationData = {
          primaryColor: formData.get("primaryColor") as string,
          primaryColorGradient: formData.get("primaryColorGradient") === "true",
          primaryGradientColors: formData.get("primaryGradientColors") ? JSON.parse(formData.get("primaryGradientColors") as string) : null,
          primaryGradientDirection: formData.get("primaryGradientDirection") as string,
          secondaryColor: formData.get("secondaryColor") as string,
          secondaryColorGradient: formData.get("secondaryColorGradient") === "true",
          secondaryGradientColors: formData.get("secondaryGradientColors") ? JSON.parse(formData.get("secondaryGradientColors") as string) : null,
          secondaryGradientDirection: formData.get("secondaryGradientDirection") as string,
          backgroundColor: formData.get("backgroundColor") as string,
          backgroundColorGradient: formData.get("backgroundColorGradient") === "true",
          backgroundGradientColors: formData.get("backgroundGradientColors") ? JSON.parse(formData.get("backgroundGradientColors") as string) : null,
          backgroundGradientDirection: formData.get("backgroundGradientDirection") as string,
          backgroundImage: formData.get("backgroundImage") as string,
          
          // 🎨 Personnalisation des cartes
          cardBackgroundColor: formData.get("cardBackgroundColor") as string,
          cardBackgroundGradient: formData.get("cardBackgroundGradient") === "true",
          cardBackgroundGradientColors: formData.get("cardBackgroundGradientColors") ? JSON.parse(formData.get("cardBackgroundGradientColors") as string) : null,
          cardBackgroundGradientDirection: formData.get("cardBackgroundGradientDirection") as string,
          cardBorderColor: formData.get("cardBorderColor") as string,
          cardBorderWidth: formData.get("cardBorderWidth") ? parseInt(formData.get("cardBorderWidth") as string) : null,
          cardBorderRadius: formData.get("cardBorderRadius") ? parseInt(formData.get("cardBorderRadius") as string) : null,
          cardShadow: formData.get("cardShadow") as string,
          
          // 🎨 Personnalisation des mini-cartes (tiers)
          miniCardBackgroundColor: formData.get("miniCardBackgroundColor") as string,
          miniCardBackgroundGradient: formData.get("miniCardBackgroundGradient") === "true",
          miniCardBackgroundGradientColors: formData.get("miniCardBackgroundGradientColors") ? JSON.parse(formData.get("miniCardBackgroundGradientColors") as string) : null,
          miniCardBackgroundGradientDirection: formData.get("miniCardBackgroundGradientDirection") as string,
          miniCardBorderColor: formData.get("miniCardBorderColor") as string,
          miniCardBorderWidth: formData.get("miniCardBorderWidth") ? parseInt(formData.get("miniCardBorderWidth") as string) : null,
          miniCardBorderRadius: formData.get("miniCardBorderRadius") ? parseInt(formData.get("miniCardBorderRadius") as string) : null,
          miniCardShadow: formData.get("miniCardShadow") as string,
          
          // 🎨 Typographie
          fontFamily: formData.get("fontFamily") as string,
          fontSize: formData.get("fontSize") ? parseInt(formData.get("fontSize") as string) : null,
          fontWeight: formData.get("fontWeight") as string,
          
          // 🎨 Boutons et CTA
          ctaButtonColor: formData.get("ctaButtonColor") as string,
          ctaButtonColorGradient: formData.get("ctaButtonColorGradient") === "true",
          ctaButtonColorGradientColors: formData.get("ctaButtonColorGradientColors") ? JSON.parse(formData.get("ctaButtonColorGradientColors") as string) : null,
          ctaButtonColorGradientDirection: formData.get("ctaButtonColorGradientDirection") as string,
          ctaText: formData.get("ctaText") as string,
          
          // 🎨 Images et branding
          logoUrl: formData.get("logoUrl") as string,
          bannerUrl: formData.get("bannerUrl") as string,
        };

        console.log("💾 Données loyalty à sauvegarder:", personalizationData);
        
        const loyaltyProgram = await prisma.loyaltyProgram.update({
          where: { id: loyaltyProgramId },
          data: personalizationData as any,
        });

        console.log("✅ Loyalty program mis à jour:", loyaltyProgram.id);
        return json({ success: true, loyaltyProgram });
      }

      case "update_loyalty_rewards": {
        const loyaltyProgramId = formData.get("loyaltyProgramId") as string;
        const rewardsData = JSON.parse(formData.get("rewards") as string);
        const tiersData = JSON.parse(formData.get("tiers") as string);
        
        console.log("🎁 Mise à jour des récompenses loyalty:", loyaltyProgramId);
        console.log("🏆 Données paliers:", tiersData);
        
        // Mettre à jour le champ rewards avec la nouvelle structure simplifiée
        const updatedRewards = {
          tiers: tiersData
        };
        
        const loyaltyProgram = await prisma.loyaltyProgram.update({
          where: { id: loyaltyProgramId },
          data: {
            rewards: updatedRewards
          }
        });

        console.log("✅ Récompenses loyalty mises à jour:", loyaltyProgram.id);
        
        // Sauvegarder les templates de récompenses fonctionnelles
        await saveRewardTemplates(merchant.id, tiersData);
        
        // Recharger les données mises à jour
        const updatedLoyaltyProgram = await prisma.loyaltyProgram.findUnique({
          where: { id: loyaltyProgramId }
        });
        
        return json({ 
          success: true, 
          loyaltyProgram: updatedLoyaltyProgram,
          message: "Récompenses mises à jour avec succès !"
        });
      }

      case "get_loyalty_qr_code": {
        // Trouver le QR code de type LOYALTY pour ce marchand
        let qrCode = await prisma.qRCode.findFirst({
          where: {
            merchantId: merchant.id,
            type: "LOYALTY",
            active: true
          }
        });

        // Si aucun QR code LOYALTY n'existe, en créer un
        if (!qrCode) {
          const loyaltyProgram = await prisma.loyaltyProgram.findFirst({
            where: { merchantId: merchant.id }
          });

          if (loyaltyProgram) {
            qrCode = await prisma.qRCode.create({
              data: {
                merchantId: merchant.id,
                title: "Programme de fidélité",
                type: "LOYALTY",
                destination: `/loyalty/${loyaltyProgram.id}`,
                slug: `loyalty-${loyaltyProgram.id}`,
                active: true
              }
            });
          }
        }

        if (qrCode) {
          return json({ success: true, qrCode });
        } else {
          return json({ success: false, error: "No loyalty QR code found and could not create one" });
        }
      }

      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Loyalty action error:", error);
    return json({ error: "An error occurred" }, { status: 500 });
  }
};

export default function LoyaltyRoute() {
  const { shop, loyaltyPrograms, customerPoints, rewardTemplates } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPersonalizationModalOpen, setIsPersonalizationModalOpen] = useState(false);
  const [isRewardsModalOpen, setIsRewardsModalOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewSuccess, setPreviewSuccess] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Handlers pour la personnalisation
  const handlePersonalizationSave = (data: any) => {
    const formData = new FormData();
    formData.append('action', 'update_loyalty_personalization');
    formData.append('loyaltyProgramId', loyaltyPrograms[0]?.id || '');
    
    // Ajouter toutes les données de personnalisation
    Object.keys(data).forEach(key => {
      if (Array.isArray(data[key])) {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key]);
      }
    });

    fetch('/app/loyalty', {
      method: 'POST',
      body: formData,
    }).then(() => {
      success('Personnalisation sauvegardée !', 'Vos modifications ont été enregistrées avec succès');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }).catch(() => {
      error('Erreur', 'Impossible de sauvegarder la personnalisation');
    });
  };

  const handlePersonalizationSaveForPreview = (data: any) => {
    console.log("💾 Sauvegarde pour aperçu loyalty...");
    
    // Sauvegarder d'abord, puis ouvrir l'aperçu
    const formData = new FormData();
    formData.append('action', 'update_loyalty_personalization');
    formData.append('loyaltyProgramId', loyaltyPrograms[0]?.id || '');
    
    // Ajouter toutes les données de personnalisation
    Object.keys(data).forEach(key => {
      if (Array.isArray(data[key])) {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key]);
      }
    });

    fetch('/app/loyalty', {
      method: 'POST',
      body: formData,
    }).then((response) => {
      console.log("✅ Sauvegarde loyalty terminée, ouverture de l'aperçu...");
      success('Aperçu généré !', 'La page loyalty s\'ouvre dans un nouvel onglet');
      // Après sauvegarde, ouvrir l'aperçu
      handlePersonalizationPreview();
    }).catch((error) => {
      console.error("❌ Erreur lors de la sauvegarde:", error);
      error('Erreur', 'Impossible de sauvegarder pour l\'aperçu');
      // Ouvrir l'aperçu même en cas d'erreur
      handlePersonalizationPreview();
    });
  };

  const handlePersonalizationPreview = async () => {
    const programId = loyaltyPrograms[0]?.id;
    console.log("🔍 Tentative d'ouverture de l'aperçu loyalty avec l'ID:", programId);
    
    if (!programId) {
      console.error("❌ Aucun programme de fidélité trouvé");
      error("Aucun programme de fidélité trouvé", "Veuillez d'abord créer un programme de fidélité.");
      return;
    }

    try {
      // Vérifier si un QR code LOYALTY existe déjà
      const response = await fetch('/app/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'action=get_loyalty_qr_code'
      });
      
      const data = await response.json();
      
      if (data.success && data.qrCode) {
        const loyaltyUrl = `/loyalty/${data.qrCode.slug}`;
        console.log("🔗 URL loyalty (QR code existant):", loyaltyUrl);
        window.open(loyaltyUrl, '_blank');
      } else {
        // Fallback: utiliser l'ID du programme directement
        const loyaltyUrl = `/loyalty/${programId}`;
        console.log("🔗 URL loyalty (fallback):", loyaltyUrl);
        window.open(loyaltyUrl, '_blank');
      }
      
      setPreviewSuccess(true);
      setTimeout(() => setPreviewSuccess(false), 3000);
    } catch (error) {
      console.error("❌ Erreur lors de l'aperçu:", error);
      // Fallback: utiliser l'ID du programme directement
      const loyaltyUrl = `/loyalty/${programId}`;
      console.log("🔗 URL loyalty (fallback après erreur):", loyaltyUrl);
      window.open(loyaltyUrl, '_blank');
      
      setPreviewSuccess(true);
      setTimeout(() => setPreviewSuccess(false), 3000);
    }
  };

  const handleRewardsSave = (rewardsData: any, tiers: any) => {
    const formData = new FormData();
    formData.append('action', 'update_loyalty_rewards');
    formData.append('loyaltyProgramId', loyaltyPrograms[0]?.id || '');
    formData.append('rewards', JSON.stringify(rewardsData));
    formData.append('tiers', JSON.stringify(tiers));
    
    submit(formData, { method: 'post' });
    setIsRewardsModalOpen(false);
    success('Récompenses sauvegardées', 'Les récompenses ont été mises à jour avec succès');
  };

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [newMemberData, setNewMemberData] = useState({
    name: '',
    email: '',
    tier: 'bronze',
    points: 0
  });

  // Notifications
  const { success, error, info } = useQuickNotifications();

  const isLoading = navigation.state === "loading";
  const submit = useSubmit();

  // Handler pour supprimer un programme
  const handleDeleteProgram = () => {
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteProgram = () => {
    const programName = loyaltyPrograms[0]?.name || 'ce programme';
    
    const formData = new FormData();
    formData.append("action", "delete_loyalty_program");
    formData.append("id", loyaltyPrograms[0]?.id || '');

    submit(formData, { method: "post" });
    
    // Show success notification
    success('Programme supprimé !', `"${programName}" a été supprimé avec succès`);
    
    // Close confirmation dialog
    setIsDeleteConfirmOpen(false);
  };

  const handleAddMember = () => {
    if (loyaltyPrograms.length === 0) {
      // Créer un programme de fidélité
      if (!newMemberData.name) {
        error('Erreur', 'Veuillez remplir le nom du programme');
        return;
      }

      const formData = new FormData();
      formData.append("action", "create_loyalty_program");
      formData.append("name", newMemberData.name);
      formData.append("description", newMemberData.email); // Utilise le champ email pour la description
      formData.append("pointsPerScan", newMemberData.points.toString());
      formData.append("isActive", "true");

      submit(formData, { method: "post" });
      
      // Show success notification
      success('Programme créé !', 'Votre programme de fidélité a été créé avec succès');
      
      // Reset form and close modal
      setNewMemberData({ name: '', email: '', tier: 'bronze', points: 0 });
      setIsCreateModalOpen(false);
    } else {
      // Ajouter un membre
      if (!newMemberData.name || !newMemberData.email) {
        error('Erreur', 'Veuillez remplir tous les champs obligatoires');
        return;
      }

      // Calculate initial points based on tier
      const tierPoints = {
        bronze: 0,
        silver: 100,
        gold: 500,
        platinum: 1000
      };

      const formData = new FormData();
      formData.append("action", "add_customer_points");
      formData.append("customerId", newMemberData.email);
      formData.append("points", (tierPoints[newMemberData.tier as keyof typeof tierPoints] + newMemberData.points).toString());
      formData.append("name", newMemberData.name);
      formData.append("tier", newMemberData.tier);

      submit(formData, { method: "post" });
      
      // Show success notification
      success('Membre ajouté !', `${newMemberData.name} a été ajouté au programme de fidélité`);
      
      // Reset form and close modal
      setNewMemberData({ name: '', email: '', tier: 'bronze', points: 0 });
      setIsCreateModalOpen(false);
    }
  };

  useEffect(() => {
    // Detect dark mode preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Show success message when member is added
  useEffect(() => {
    if (actionData && 'success' in actionData && actionData.success) {
      success('Membre ajouté !', 'Le membre a été ajouté au programme de fidélité');
    }
  }, [actionData, success]);

  // Calculate summary stats from real data
  const summary = {
    activeMembers: customerPoints.length,
    totalPoints: customerPoints.reduce((sum, cp) => sum + cp.points, 0),
    redeemedRewards: 0, // This would need to be calculated from actual reward redemptions
    totalValue: customerPoints.reduce((sum, cp) => sum + (cp.points * 0.01), 0), // Assuming 1 point = $0.01
    newMembersThisMonth: customerPoints.filter(cp => {
      const createdAt = new Date(cp.createdAt);
      const now = new Date();
      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    }).length,
    averagePointsPerMember: customerPoints.length > 0 ? customerPoints.reduce((sum, cp) => sum + cp.points, 0) / customerPoints.length : 0,
  };

  // Define tiers dynamically from reward templates
  const tiers = (() => {
    // Grouper les récompenses par tier
    const tiersMap = new Map();
    rewardTemplates.forEach(reward => {
      if (!tiersMap.has(reward.tier)) {
        tiersMap.set(reward.tier, []);
      }
      tiersMap.get(reward.tier).push(reward);
    });

    // Configuration des tiers avec leurs récompenses
    const tierOrder = ['Bronze', 'Silver', 'Gold', 'Platinum'];
    const tierConfig = {
      Bronze: { minPoints: 0, maxPoints: 999, color: 'from-amber-500 to-amber-600', bgColor: 'bg-amber-50', iconColor: 'text-amber-600' },
      Silver: { minPoints: 1000, maxPoints: 2499, color: 'from-gray-400 to-gray-500', bgColor: 'bg-gray-50', iconColor: 'text-gray-600' },
      Gold: { minPoints: 2500, maxPoints: 9999, color: 'from-yellow-400 to-yellow-500', bgColor: 'bg-yellow-50', iconColor: 'text-yellow-600' },
      Platinum: { minPoints: 10000, maxPoints: 99999, color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50', iconColor: 'text-purple-600' },
    };

    return tierOrder.map(tierName => {
      const rewards = tiersMap.get(tierName) || [];
      const config = tierConfig[tierName as keyof typeof tierConfig];
      
      return {
        name: tierName,
        minPoints: config.minPoints,
        maxPoints: config.maxPoints,
        color: config.color,
        bgColor: config.bgColor,
        iconColor: config.iconColor,
        rewards: rewards,
        rewardCount: rewards.length
      };
    });
  })();

  // Transform customer points to members format
  const members = customerPoints.map(cp => {
    const tier = tiers.find(t => cp.points >= t.minPoints && cp.points <= t.maxPoints) || tiers[0];
    return {
      id: cp.id,
      name: cp.customerId || 'Customer',
      email: cp.customerId || 'No email',
      tier: tier.name,
      points: cp.points,
      scans: 0, // This would need to be calculated from analytics
      joinedAt: cp.createdAt,
      lastActivity: cp.updatedAt,
      totalSpent: 0, // This would need to be calculated from orders
      rewardsRedeemed: 0, // This would need to be calculated from redemptions
      avatar: (cp.customerId || 'C').charAt(0).toUpperCase(),
    };
  });

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === 'all' || member.tier.toLowerCase() === tierFilter.toLowerCase();
    return matchesSearch && matchesTier;
  });

  const getTierInfo = (tier: string) => {
    return tiers.find(t => t.name === tier) || tiers[0];
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Bronze': return <Award className="h-4 w-4" />;
      case 'Silver': return <Star className="h-4 w-4" />;
      case 'Gold': return <Crown className="h-4 w-4" />;
      case 'Platinum': return <Trophy className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const stats = [
    {
      name: 'Membres actifs',
      value: formatNumber(summary.activeMembers),
      change: `+${summary.newMembersThisMonth}`,
      changeType: 'positive' as const,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      name: 'Points distribués',
      value: formatNumber(summary.totalPoints),
      change: '+8%',
      changeType: 'positive' as const,
      icon: Star,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
    },
    {
      name: 'Récompenses échangées',
      value: summary.redeemedRewards,
      change: '+15%',
      changeType: 'positive' as const,
      icon: Gift,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      name: 'Valeur totale',
      value: formatCurrency(summary.totalValue),
      change: '+5%',
      changeType: 'positive' as const,
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
  ];

  if (isLoading) {
    return (
      <Page>
        <Loader />
      </Page>
    );
  }

  return (
    <Page>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Programme de fidélité
                </h1>
                <p className={`mt-2 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Gérez votre programme de fidélité QR
                </p>
              </div>
              <div className="flex space-x-3">
                {loyaltyPrograms.length === 0 ? (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={() => setIsCreateModalOpen(true)}
                      className="flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Créer un programme</span>
                    </Button>
                  </motion.div>
                ) : (
                  <>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        onClick={() => setIsPersonalizationModalOpen(true)}
                        variant="outline"
                        className="flex items-center space-x-2"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Personnaliser</span>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        onClick={() => setIsRewardsModalOpen(true)}
                        variant="outline"
                        className="flex items-center space-x-2"
                      >
                        <Gift className="h-4 w-4" />
                        <span>Récompenses</span>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        onClick={() => handleDeleteProgram()}
                        variant="outline"
                        className="flex items-center space-x-2 text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Supprimer</span>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau membre
                      </Button>
                    </motion.div>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg hover:shadow-xl transition-all duration-300`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {stat.name}
                        </p>
                        <p className={`text-3xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {stat.value}
                        </p>
                        <div className="flex items-center mt-2">
                          <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                        </div>
                      </div>
                      <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                        <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Tiers Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
              <CardHeader>
                <CardTitle className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Niveaux de fidélité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {tiers.map((tier, index) => {
                    const memberCount = members.filter(m => m.tier === tier.name).length;
                    const percentage = members.length > 0 ? (memberCount / members.length) * 100 : 0;
                    
                    return (
                      <motion.div
                        key={tier.name}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`p-2 rounded-lg ${tier.bgColor}`}>
                            {getTierIcon(tier.name)}
                          </div>
                          <div>
                            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {tier.name}
                            </h3>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {tier.minPoints} - {tier.maxPoints === 99999 ? '∞' : tier.maxPoints} points
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Membres</span>
                            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {memberCount}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className={`bg-gradient-to-r ${tier.color} h-2 rounded-full transition-all duration-1000`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="text-xs text-right">
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                          
                          {/* Afficher les récompenses disponibles */}
                          <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex justify-between text-xs mb-1">
                              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Récompenses</span>
                              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {tier.rewardCount}
                              </span>
                            </div>
                            {tier.rewards && tier.rewards.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {tier.rewards.slice(0, 3).map((reward: any, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {(reward.value as any)?.title || reward.rewardType}
                                  </Badge>
                                ))}
                                {tier.rewards.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{tier.rewards.length - 3}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                Aucune récompense configurée
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4 mb-8">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher des membres..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                />
              </div>
            </div>
            <Select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className={`w-40 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
            >
              <option value="all">Tous les niveaux</option>
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
            </Select>
          </div>

          {/* Members Grid */}
          {filteredMembers.length === 0 ? (
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title={loyaltyPrograms.length === 0 ? "Aucun programme de fidélité" : "Aucun membre trouvé"}
              description={loyaltyPrograms.length === 0 ? "Créez d'abord un programme de fidélité pour commencer" : "Commencez par ajouter des membres à votre programme"}
              action={loyaltyPrograms.length === 0 ? undefined : {
                label: "Ajouter un membre",
                onClick: () => setIsCreateModalOpen(true)
              }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMembers.map((member, index) => {
                const tierInfo = getTierInfo(member.tier);
                
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="group"
                  >
                    <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg hover:shadow-xl transition-all duration-300`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${tierInfo.color} flex items-center justify-center text-white font-bold text-lg`}>
                              {member.avatar}
                            </div>
                            <div>
                              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {member.name}
                              </h3>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {member.email}
                              </p>
                            </div>
                          </div>
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${tierInfo.bgColor} ${tierInfo.iconColor} border-current`}>
                            {getTierIcon(member.tier)}
                            <span className="ml-1">{member.tier}</span>
                          </div>
                        </div>

                        {/* Member Stats */}
                        <div className="grid grid-cols-2 gap-4 text-center mb-4">
                          <div>
                            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {formatNumber(member.points)}
                            </p>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Points</p>
                          </div>
                          <div>
                            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {member.scans}
                            </p>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Scans</p>
                          </div>
                        </div>

                        {/* Member Info */}
                        <div className={`space-y-2 text-sm pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                          <div className="flex items-center justify-between">
                            <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              <Calendar className="h-4 w-4 inline mr-1" />
                              Membre depuis
                            </span>
                            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {formatDate(member.joinedAt, 'DD/MM/YYYY')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              <Clock className="h-4 w-4 inline mr-1" />
                              Dernière activité
                            </span>
                            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {formatDate(member.lastActivity, 'DD/MM/YYYY')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              <DollarSign className="h-4 w-4 inline mr-1" />
                              Total dépensé
                            </span>
                            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {formatCurrency(member.totalSpent)}
                            </span>
                          </div>
                        </div>

                        {/* Rewards */}
                        <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-purple-50'} border ${isDarkMode ? 'border-gray-600' : 'border-purple-200'}`}>
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-purple-800'}`}>
                              <Gift className="h-4 w-4 inline mr-1" />
                              Récompenses échangées
                            </span>
                            <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-purple-900'}`}>
                              {member.rewardsRedeemed}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Create Modal */}
          <Modal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            title={loyaltyPrograms.length === 0 ? "Créer un programme de fidélité" : "Ajouter un nouveau membre"}
          >
            <div className="space-y-4">
              {loyaltyPrograms.length === 0 ? (
                // Formulaire de création de programme de fidélité
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom du programme *
                    </label>
                    <Input
                      value={newMemberData.name}
                      onChange={(e) => setNewMemberData({ ...newMemberData, name: e.target.value })}
                      placeholder="Mon programme de fidélité"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <Input
                      value={newMemberData.email}
                      onChange={(e) => setNewMemberData({ ...newMemberData, email: e.target.value })}
                      placeholder="Description du programme..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Points par scan
                    </label>
                    <Input
                      type="number"
                      value={newMemberData.points}
                      onChange={(e) => setNewMemberData({ ...newMemberData, points: parseInt(e.target.value) || 0 })}
                      placeholder="10"
                    />
                  </div>
                </>
              ) : (
                // Formulaire d'ajout de membre
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom du membre *
                    </label>
                    <Input
                      value={newMemberData.name}
                      onChange={(e) => setNewMemberData({ ...newMemberData, name: e.target.value })}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <Input
                      type="email"
                      value={newMemberData.email}
                      onChange={(e) => setNewMemberData({ ...newMemberData, email: e.target.value })}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </>
              )}
              {loyaltyPrograms.length > 0 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Niveau initial
                    </label>
                    <Select
                      value={newMemberData.tier}
                      onChange={(e) => setNewMemberData({ ...newMemberData, tier: e.target.value })}
                    >
                      <option value="bronze">Bronze (0 points)</option>
                      <option value="silver">Silver (100 points)</option>
                      <option value="gold">Gold (500 points)</option>
                      <option value="platinum">Platinum (1000 points)</option>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Points bonus (optionnel)
                    </label>
                    <Input
                      type="number"
                      value={newMemberData.points}
                      onChange={(e) => setNewMemberData({ ...newMemberData, points: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewMemberData({ name: '', email: '', tier: 'bronze', points: 0 });
                  }}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleAddMember}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0"
                  disabled={isLoading}
                >
                  {isLoading ? (loyaltyPrograms.length === 0 ? "Création..." : "Ajout...") : (loyaltyPrograms.length === 0 ? "Créer le programme" : "Ajouter")}
                </Button>
              </div>
            </div>
          </Modal>

          {/* Modal de gestion des récompenses */}
          <Modal
            isOpen={isRewardsModalOpen}
            onClose={() => setIsRewardsModalOpen(false)}
            title="Gérer les récompenses"
            size="2xl"
          >
            <LoyaltyRewardsManager
              merchantId={loyaltyPrograms[0]?.merchantId || ''}
            />
          </Modal>

          {/* Modal de personnalisation */}
          <Modal
            isOpen={isPersonalizationModalOpen}
            onClose={() => setIsPersonalizationModalOpen(false)}
            title="Personnaliser la page loyalty"
            size="2xl"
          >
            <LoyaltyPersonalization
              loyaltyProgram={loyaltyPrograms[0]}
              onSave={handlePersonalizationSave}
              onSaveForPreview={handlePersonalizationSaveForPreview}
              onPreview={handlePersonalizationPreview}
              onClose={() => setIsPersonalizationModalOpen(false)}
              isLoading={navigation.state === "submitting"}
              saveSuccess={saveSuccess}
              previewSuccess={previewSuccess}
            />
          </Modal>

          {/* Confirmation de suppression */}
          <ConfirmDialog
            isOpen={isDeleteConfirmOpen}
            onClose={() => setIsDeleteConfirmOpen(false)}
            onConfirm={confirmDeleteProgram}
            title="Supprimer le programme de fidélité"
            message={`Êtes-vous sûr de vouloir supprimer "${loyaltyPrograms[0]?.name || 'ce programme'}" ?\n\nCette action supprimera définitivement :\n• Le programme de fidélité\n• Tous les points des clients (${customerPoints.length} membres)\n• Tous les templates de récompenses\n• Toutes les récompenses clients actives\n• Tous les codes de réduction Shopify générés\n• Les QR codes associés\n\nCette action est irréversible.`}
            confirmText="Supprimer définitivement"
            cancelText="Annuler"
            type="danger"
            isLoading={navigation.state === "submitting"}
          />
        </div>
    </Page>
  );
}

/**
 * Sauvegarder les templates de récompenses fonctionnelles
 */
async function saveRewardTemplates(merchantId: string, tiersData: any[]) {
  try {
    console.log("💾 Sauvegarde des templates de récompenses...");
    
    for (const tier of tiersData) {
      if (tier.rewards && tier.rewards.length > 0) {
        for (const reward of tier.rewards) {
          if (reward.isActive) {
            // Sauvegarder ou mettre à jour le template
            await prisma.rewardTemplates.upsert({
              where: {
                merchantId_tier_rewardType: {
                  merchantId,
                  tier: tier.name,
                  rewardType: reward.type
                }
              },
              update: {
                value: reward.config,
                isActive: reward.isActive,
                updatedAt: new Date()
              },
              create: {
                merchantId,
                tier: tier.name,
                rewardType: reward.type,
                value: reward.config,
                isActive: reward.isActive
              }
            });
            
            console.log(`✅ Template sauvegardé: ${tier.name} - ${reward.type}`);
          } else {
            // Désactiver le template
            await prisma.rewardTemplates.updateMany({
              where: {
                merchantId,
                tier: tier.name,
                rewardType: reward.type
              },
              data: {
                isActive: false,
                updatedAt: new Date()
              }
            });
          }
        }
      }
    }
    
    console.log("🎉 Tous les templates de récompenses sauvegardés !");
  } catch (error) {
    console.error("❌ Erreur sauvegarde templates:", error);
    throw error;
  }
}