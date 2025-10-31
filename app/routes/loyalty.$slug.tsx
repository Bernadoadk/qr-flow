import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, useFetcher, useRevalidator } from "@remix-run/react";
import { prisma } from "~/db.server";
import { LoyaltyService } from "~/utils/loyalty.server";
import { useState, useEffect } from "react";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";
import { Input } from "~/components/ui/Input";
import { 
  Star, 
  Gift, 
  Trophy, 
  Crown,
  Heart,
  Award,
  CheckCircle,
  Sparkles,
  Target,
  Zap,
  TrendingUp,
  Calendar,
  Clock,
  Users,
  Share2,
  Download,
  ExternalLink,
  Bell,
  Package,
  Percent,
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
  Truck
} from "lucide-react";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { slug } = params;
  
  if (!slug) {
    throw new Response("Loyalty program not found", { status: 404 });
  }

  try {
    console.log(`Looking for loyalty QR code with slug: ${slug}`);
    
    // Find QR code by slug or by title (for loyalty programs)
    let qrCode = await prisma.qRCode.findFirst({
      where: {
        OR: [
          { slug: slug },
          { 
            AND: [
              { type: "LOYALTY" },
              { title: { contains: slug } }
            ]
          }
        ],
        active: true,
      },
      include: {
        merchant: true,
      },
    });

    // Si aucun QR code trouvé, vérifier si le slug est un ID de programme de fidélité
    if (!qrCode) {
      console.log(`No QR code found, checking if slug is a loyalty program ID: ${slug}`);
      
      // Vérifier si le slug est un ID de programme de fidélité
      const loyaltyProgram = await prisma.loyaltyProgram.findUnique({
        where: { id: slug },
        include: { merchant: true }
      });

      if (loyaltyProgram) {
        console.log(`Found loyalty program by ID: ${loyaltyProgram.id}`);
        
        // Créer un QR code LOYALTY pour ce programme s'il n'en existe pas
        qrCode = await prisma.qRCode.findFirst({
          where: {
            merchantId: loyaltyProgram.merchantId,
            type: "LOYALTY",
            active: true
          },
          include: {
            merchant: true,
          },
        });

        if (!qrCode) {
          // Créer un QR code LOYALTY
          qrCode = await prisma.qRCode.create({
            data: {
              merchantId: loyaltyProgram.merchantId,
              title: "Programme de fidélité",
              type: "LOYALTY",
              destination: `/loyalty/${loyaltyProgram.id}`,
              slug: `loyalty-${loyaltyProgram.id}`,
              active: true
            },
            include: {
              merchant: true,
            },
          });
          console.log(`Created new LOYALTY QR code: ${qrCode.id}`);
        }
      }
    }

    console.log(`Found QR code:`, qrCode ? { id: qrCode.id, title: qrCode.title, type: qrCode.type, destination: qrCode.destination } : 'null');

    if (!qrCode || qrCode.type !== "LOYALTY") {
      throw new Response("Loyalty QR Code not found or inactive", { status: 404 });
    }

    // Get loyalty program with reward templates
    const loyaltyProgram = await prisma.loyaltyProgram.findUnique({
      where: { merchantId: qrCode.merchantId },
      include: {
        merchant: true
      }
    });

    if (!loyaltyProgram || !loyaltyProgram.active) {
      throw new Response("Loyalty program not found or inactive", { status: 404 });
    }

    // Get customer ID from URL parameters
    const url = new URL(request.url);
    const customerId = url.searchParams.get("customer_id") || "anonymous";

    // Get customer points
    let customerPoints = 0;
    let customerTier = "Bronze";
    
    try {
      const pointsData = await LoyaltyService.getCustomerPoints(qrCode.merchantId, customerId);
      customerPoints = pointsData.points;
      customerTier = pointsData.tier;
    } catch (error) {
      console.error("Error getting customer points:", error);
    }

    // Get active reward templates for this merchant
    const rewardTemplates = await prisma.rewardTemplates.findMany({
      where: { 
        merchantId: qrCode.merchantId,
        isActive: true 
      },
      orderBy: [
        { tier: 'asc' },
        { rewardType: 'asc' }
      ]
    });

    // Get customer's personal rewards (with discount codes)
    const customerRewards = await prisma.customerRewards.findUnique({
      where: {
        merchantId_customerId: {
          merchantId: qrCode.merchantId,
          customerId: customerId
        }
      }
    });

    // Get active rewards for current customer tier
    const activeRewards = rewardTemplates.filter(reward => 
      reward.tier === customerTier
    );

    // Get next tier rewards
    const nextTierRewards = rewardTemplates.filter(reward => {
      const tierOrder = ['Bronze', 'Silver', 'Gold', 'Platinum'];
      const currentTierIndex = tierOrder.indexOf(customerTier);
      const nextTierIndex = currentTierIndex + 1;
      
      if (nextTierIndex < tierOrder.length) {
        return reward.tier === tierOrder[nextTierIndex];
      }
      return false;
    });

    return json({
      qrCode,
      loyaltyProgram,
      customerId,
      customerPoints,
      customerTier,
      shopDomain: qrCode.merchant.shopifyDomain,
      rewardTemplates,
      activeRewards,
      nextTierRewards,
      customerRewards,
    });

  } catch (error) {
    console.error("Error in loyalty route:", error);
    
    if (error instanceof Response) {
      throw error;
    }
    
    throw new Response("Internal Server Error", { status: 500 });
  }
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { slug } = params;
  const formData = await request.formData();
  const action = formData.get("action") as string;

  try {
    if (action === "register_email") {
      const email = formData.get("email") as string;
      const customerId = formData.get("customer_id") as string;
      
      if (!email || !customerId) {
        return json({ error: "Email and customer ID are required" }, { status: 400 });
      }

      // Find the QR code to get merchant ID
      const qrCode = await prisma.qRCode.findUnique({
        where: { slug },
        include: { merchant: true }
      });

      if (!qrCode) {
        return json({ error: "QR Code not found" }, { status: 404 });
      }

      // Update customer points with email
      await prisma.customerPoints.update({
        where: { id: `${qrCode.merchantId}_${customerId}` },
        data: {
          customerId: email, // Update to use email as customer ID
          meta: {
            email,
            registeredAt: new Date().toISOString(),
          }
        }
      });

      return json({ success: true, message: "Email registered successfully!" });
    }

    return json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in loyalty action:", error);
    return json({ error: "An error occurred" }, { status: 500 });
  }
};

export default function LoyaltyPage() {
  const { qrCode, loyaltyProgram, customerId, customerPoints, customerTier, shopDomain, rewardTemplates, activeRewards, nextTierRewards, customerRewards } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const [email, setEmail] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [currentPoints, setCurrentPoints] = useState(customerPoints);
  const [currentTier, setCurrentTier] = useState(customerTier);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh points every 30 seconds pour synchroniser les récompenses
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Synchronisation des données de fidélité...');
      setIsRefreshing(true);
      revalidator.revalidate();
      setTimeout(() => setIsRefreshing(false), 1000);
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [revalidator]);

  // Update local state when loader data changes
  useEffect(() => {
    setCurrentPoints(customerPoints);
    setCurrentTier(customerTier);
  }, [customerPoints, customerTier]);

  // Les récompenses sont maintenant chargées directement depuis le loader

  const getTierInfo = (tier: string) => {
    const tiers = {
      Bronze: { color: "from-amber-500 to-orange-600", icon: Star, bgColor: "bg-amber-100", textColor: "text-amber-800" },
      Silver: { color: "from-gray-400 to-gray-600", icon: Award, bgColor: "bg-gray-100", textColor: "text-gray-800" },
      Gold: { color: "from-yellow-400 to-yellow-600", icon: Trophy, bgColor: "bg-yellow-100", textColor: "text-yellow-800" },
      Platinum: { color: "from-purple-500 to-pink-600", icon: Crown, bgColor: "bg-purple-100", textColor: "text-purple-800" }
    };
    return tiers[tier as keyof typeof tiers] || tiers.Bronze;
  };

  const tierInfo = getTierInfo(currentTier);

  // Enrichir les récompenses avec les informations du client
  const getEnrichedRewards = () => {
    if (!customerRewards) return activeRewards;

    return activeRewards.map(reward => {
      const config = reward.value as any;
      const enrichedReward = { 
        ...reward,
        customerDiscountCode: undefined as string | undefined,
        expiresAt: undefined as string | undefined
      };

      // Ajouter les informations spécifiques au client
      if (customerRewards.discountCode && reward.rewardType === 'discount') {
        enrichedReward.customerDiscountCode = customerRewards.discountCode;
        enrichedReward.expiresAt = customerRewards.expiresAt || undefined;
      }

      return enrichedReward;
    });
  };

  const enrichedActiveRewards = getEnrichedRewards();

  const handleEmailRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      fetcher.submit(
        {
          action: "register_email",
          email,
          customer_id: customerId,
        },
        { method: "post" }
      );
      setIsRegistered(true);
    }
  };

  const handleRefreshPoints = () => {
    console.log('Manually refreshing loyalty data...');
    setIsRefreshing(true);
    revalidator.revalidate();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Styles personnalisés basés sur le loyaltyProgram
  const customStyles = {
    primaryColor: (loyaltyProgram as any).primaryColor || '#007b5c',
    primaryColorGradient: (loyaltyProgram as any).primaryColorGradient || false,
    primaryGradientColors: (loyaltyProgram as any).primaryGradientColors || ['#007b5c', '#00a86b'],
    primaryGradientDirection: (loyaltyProgram as any).primaryGradientDirection || 'to right',
    secondaryColor: (loyaltyProgram as any).secondaryColor || '#ffffff',
    secondaryColorGradient: (loyaltyProgram as any).secondaryColorGradient || false,
    secondaryGradientColors: (loyaltyProgram as any).secondaryGradientColors || ['#ffffff', '#f0f0f0'],
    secondaryGradientDirection: (loyaltyProgram as any).secondaryGradientDirection || 'to right',
    backgroundColor: (loyaltyProgram as any).backgroundColor || '#f8f9fa',
    backgroundColorGradient: (loyaltyProgram as any).backgroundColorGradient || false,
    backgroundGradientColors: (loyaltyProgram as any).backgroundGradientColors || ['#f8f9fa', '#e9ecef'],
    backgroundGradientDirection: (loyaltyProgram as any).backgroundGradientDirection || 'to right',
    backgroundImage: (loyaltyProgram as any).backgroundImage || '',
    
    // Cartes
    cardBackgroundColor: (loyaltyProgram as any).cardBackgroundColor || '#ffffff',
    cardBackgroundGradient: (loyaltyProgram as any).cardBackgroundGradient || false,
    cardBackgroundGradientColors: (loyaltyProgram as any).cardBackgroundGradientColors || ['#ffffff', '#f8f9fa'],
    cardBackgroundGradientDirection: (loyaltyProgram as any).cardBackgroundGradientDirection || 'to right',
    cardBorderColor: (loyaltyProgram as any).cardBorderColor || '#e5e7eb',
    cardBorderWidth: (loyaltyProgram as any).cardBorderWidth || 1,
    cardBorderRadius: (loyaltyProgram as any).cardBorderRadius || 8,
    cardShadow: (loyaltyProgram as any).cardShadow || 'lg',
    
    // Mini-cartes (tiers)
    miniCardBackgroundColor: (loyaltyProgram as any).miniCardBackgroundColor || '#ffffff',
    miniCardBackgroundGradient: (loyaltyProgram as any).miniCardBackgroundGradient || false,
    miniCardBackgroundGradientColors: (loyaltyProgram as any).miniCardBackgroundGradientColors || ['#ffffff', '#f8f9fa'],
    miniCardBackgroundGradientDirection: (loyaltyProgram as any).miniCardBackgroundGradientDirection || 'to right',
    miniCardBorderColor: (loyaltyProgram as any).miniCardBorderColor || '#e5e7eb',
    miniCardBorderWidth: (loyaltyProgram as any).miniCardBorderWidth || 1,
    miniCardBorderRadius: (loyaltyProgram as any).miniCardBorderRadius || 8,
    miniCardShadow: (loyaltyProgram as any).miniCardShadow || 'md',
    
    // Typographie
    fontFamily: (loyaltyProgram as any).fontFamily || 'Inter',
    fontSize: (loyaltyProgram as any).fontSize || 16,
    fontWeight: (loyaltyProgram as any).fontWeight || 'normal',
    
    // CTA
    ctaButtonColor: (loyaltyProgram as any).ctaButtonColor || '#007b5c',
    ctaButtonColorGradient: (loyaltyProgram as any).ctaButtonColorGradient || false,
    ctaButtonColorGradientColors: (loyaltyProgram as any).ctaButtonColorGradientColors || ['#007b5c', '#00a86b'],
    ctaButtonColorGradientDirection: (loyaltyProgram as any).ctaButtonColorGradientDirection || 'to right',
    ctaText: (loyaltyProgram as any).ctaText || 'Découvrir la boutique',
    
    // Images
    logoUrl: (loyaltyProgram as any).logoUrl || '',
    bannerUrl: (loyaltyProgram as any).bannerUrl || '',
  };

  // Fonction pour obtenir le style de fond
  const getBackgroundStyle = () => {
    if (customStyles.backgroundImage) {
      return {
        backgroundImage: `url(${customStyles.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }
    
    if (customStyles.backgroundColorGradient) {
      return {
        background: `linear-gradient(${customStyles.backgroundGradientDirection}, ${customStyles.backgroundGradientColors.join(', ')})`
      };
    }
    
    return { backgroundColor: customStyles.backgroundColor };
  };

  // Fonction pour obtenir le style des cartes
  const getCardStyle = () => {
    const background = customStyles.cardBackgroundColor;
    
    const shadowMap = {
      'none': 'none',
      'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      'md': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      'xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)'
    };

    return {
      background,
      borderColor: customStyles.cardBorderColor,
      borderWidth: `${customStyles.cardBorderWidth}px`,
      borderRadius: `${customStyles.cardBorderRadius}px`,
      boxShadow: shadowMap[customStyles.cardShadow as keyof typeof shadowMap] || shadowMap.lg
    };
  };

  // Fonction pour obtenir le style des mini-cartes (tiers)
  const getMiniCardStyle = () => {
    const background = customStyles.miniCardBackgroundColor;
    
    const shadowMap = {
      'none': 'none',
      'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      'md': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      'xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)'
    };

    return {
      background,
      borderColor: customStyles.miniCardBorderColor,
      borderWidth: `${customStyles.miniCardBorderWidth}px`,
      borderRadius: `${customStyles.miniCardBorderRadius}px`,
      boxShadow: shadowMap[customStyles.miniCardShadow as keyof typeof shadowMap] || shadowMap.md
    };
  };

  // Fonction pour obtenir le style du bouton CTA
  const getCTAButtonStyle = () => {
    const color = customStyles.ctaButtonColor;
    
    return { 
      background: color,
      border: 'none'
    };
  };

  return (
    <div 
      className="min-h-screen"
      style={{ 
        ...getBackgroundStyle(),
        fontFamily: customStyles.fontFamily,
        fontSize: `${customStyles.fontSize}px`,
        fontWeight: customStyles.fontWeight
      }}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          {customStyles.logoUrl ? (
            <img
              src={customStyles.logoUrl}
              alt="Logo"
              className="w-16 h-16 mx-auto mb-4 rounded-full object-cover"
            />
          ) : (
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{ backgroundColor: customStyles.primaryColor }}
            >
              <Heart className="h-8 w-8 text-white" />
            </div>
          )}
          <h1 
            className="text-4xl font-bold mb-2"
            style={{ color: customStyles.primaryColor }}
          >
            Programme de fidélité
          </h1>
          <p 
            className="text-lg"
            style={{ color: customStyles.secondaryColor }}
          >
            Gagnez des points et débloquez des récompenses exclusives !
          </p>
          {isRefreshing && (
            <div className="mt-2 flex items-center justify-center gap-2 text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Synchronisation des données...
            </div>
          )}
        </div>

        {/* Success Message */}
        {actionData && 'success' in actionData && actionData.success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              {'message' in actionData ? actionData.message : 'Action réussie'}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Customer Status */}
          <Card 
            className="shadow-lg lg:col-span-2 backdrop-blur-sm"
            style={getCardStyle()}
          >
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
                Votre statut de fidélité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r ${tierInfo.color} rounded-full mb-4 shadow-lg`}>
                  <tierInfo.icon className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">{currentTier}</h3>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-5xl font-bold text-purple-600 mb-2">{currentPoints}</p>
                  {isRefreshing && (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  )}
                </div>
                <p className="text-gray-600 text-lg">points accumulés</p>
                <button
                  onClick={handleRefreshPoints}
                  disabled={isRefreshing}
                  className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  {isRefreshing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Actualisation...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Actualiser les points
                    </>
                  )}
                </button>
              </div>

              {/* Progress to next tier */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progression vers le niveau suivant</span>
                  <span>{currentPoints} / 100 points</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((currentPoints / 100) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Il vous manque {Math.max(0, 100 - currentPoints)} points pour le niveau Silver
                </p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Button 
                  variant="outline" 
                  className="flex items-center justify-center"
                  onClick={() => window.open(`https://${shopDomain}`, '_blank')}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Acheter
                </Button>
                <Button 
                  variant="outline" 
                  className="flex items-center justify-center"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: "Rejoignez le programme de fidélité",
                        text: "Gagnez des points et débloquez des récompenses exclusives !",
                        url: window.location.href
                      });
                    }
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Partager
                </Button>
              </div>

              {/* Email Registration */}
              {!isRegistered && (
                <form onSubmit={handleEmailRegistration} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Enregistrez votre email pour sauvegarder vos points
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                    disabled={fetcher.state === "submitting"}
                  >
                    {fetcher.state === "submitting" ? "Enregistrement..." : "Enregistrer mon email"}
                  </Button>
                </form>
              )}

              {isRegistered && (
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-green-800 font-medium">Email enregistré !</p>
                  <p className="text-sm text-green-600">Vos points sont maintenant sauvegardés</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rewards & Benefits */}
          <Card 
            className="shadow-lg backdrop-blur-sm"
            style={getCardStyle()}
          >
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gift className="h-5 w-5 mr-2 text-green-600" />
                Récompenses disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Dynamic Tiers from RewardTemplates */}
                {(() => {
                  // Grouper les récompenses par tier
                  const tiersMap = new Map();
                  rewardTemplates.forEach(reward => {
                    if (!tiersMap.has(reward.tier)) {
                      tiersMap.set(reward.tier, []);
                    }
                    tiersMap.get(reward.tier).push(reward);
                  });

                  // Créer les tiers avec leurs récompenses
                  const tierOrder = ['Bronze', 'Silver', 'Gold', 'Platinum'];
                  const tierConfig = {
                    Bronze: { minPoints: 0, maxPoints: 99, color: "from-amber-500 to-orange-600", icon: Star },
                    Silver: { minPoints: 100, maxPoints: 299, color: "from-gray-400 to-gray-600", icon: Award },
                    Gold: { minPoints: 300, maxPoints: 599, color: "from-yellow-400 to-yellow-600", icon: Trophy },
                    Platinum: { minPoints: 600, maxPoints: 999, color: "from-purple-500 to-pink-600", icon: Crown }
                  };

                  return tierOrder.map(tierName => {
                    const rewards = tiersMap.get(tierName) || [];
                    const config = tierConfig[tierName as keyof typeof tierConfig];
                    const TierIcon = config.icon;
                    const isCurrentTier = currentTier === tierName;
                    const isUnlocked = currentPoints >= config.minPoints;
                    
                    return (
                      <div 
                        key={tierName}
                        className={`p-4 rounded-lg border-2 ${
                          isCurrentTier 
                            ? "border-blue-300 bg-blue-50" 
                            : isUnlocked 
                              ? "border-green-300 bg-green-50" 
                              : "border-gray-200"
                        }`}
                        style={getMiniCardStyle()}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <TierIcon className="h-5 w-5 mr-2" />
                            <span className="font-medium">
                              {tierName} ({config.minPoints}+ pts)
                            </span>
                          </div>
                          <Badge className={
                            isCurrentTier 
                              ? "bg-blue-100 text-blue-800" 
                              : isUnlocked 
                                ? "bg-green-100 text-green-800" 
                                : "bg-gray-100"
                          }>
                            {isCurrentTier ? "Actuel" : isUnlocked ? "Débloqué" : "Verrouillé"}
                          </Badge>
                        </div>
                        <div className="mt-2">
                          {rewards.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {rewards.map((reward: any, i: number) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {(reward.value as any)?.title || reward.rewardType}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600">
                              Aucune récompense configurée
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* How to earn points */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  Comment gagner des points
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Scanner ce QR code : +{loyaltyProgram.pointsPerScan} points</li>
                  <li>• Passer une commande : +1 point par euro dépensé</li>
                  <li>• Visiter régulièrement : +5 points bonus</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Recent Activity */}
        <Card 
          className="shadow-lg mt-8 backdrop-blur-sm"
          style={getCardStyle()}
        >
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-600" />
              Activité récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center p-3 bg-green-50 rounded-lg">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">Points gagnés</p>
                  <p className="text-xs text-green-600">+{loyaltyProgram.pointsPerScan} points pour le scan de ce QR code</p>
                  <p className="text-xs text-gray-500">Il y a quelques minutes</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                <div className="flex-shrink-0">
                  <Heart className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">Bienvenue dans le programme !</p>
                  <p className="text-xs text-blue-600">Vous avez rejoint notre programme de fidélité</p>
                  <p className="text-xs text-gray-500">Aujourd'hui</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Program Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card 
            className="shadow-lg backdrop-blur-sm"
            style={getCardStyle()}
          >
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
                <Package className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Récompenses exclusives</h3>
              <p className="text-sm text-gray-600">Accédez à des offres et produits réservés aux membres</p>
            </CardContent>
          </Card>

          <Card 
            className="shadow-lg backdrop-blur-sm"
            style={getCardStyle()}
          >
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-full mb-4">
                <Percent className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Réductions progressives</h3>
              <p className="text-sm text-gray-600">Plus vous achetez, plus vous économisez</p>
            </CardContent>
          </Card>

          <Card 
            className="shadow-lg backdrop-blur-sm"
            style={getCardStyle()}
          >
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mb-4">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Notifications VIP</h3>
              <p className="text-sm text-gray-600">Soyez les premiers informés des nouveautés</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Rewards Section */}
        <Card className="mt-8 shadow-lg backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Gift className="h-5 w-5 mr-2 text-green-600" />
              Vos récompenses actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enrichedActiveRewards && enrichedActiveRewards.length > 0 ? (
              <div className="space-y-4">
                {enrichedActiveRewards.map((reward: any) => {
                  const config = reward.value as any;
                  const isDiscount = reward.rewardType === 'discount';
                  const hasDiscountCode = reward.customerDiscountCode;
                  
                  return (
                    <div key={reward.id} className="p-4 border rounded-lg bg-green-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-green-800">
                            {config?.title || reward.rewardType}
                          </h4>
                          <p className="text-sm text-green-600 mt-1">
                            {config?.description || 'Récompense disponible'}
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          {reward.rewardType === 'discount' ? 'Réduction' :
                           reward.rewardType === 'free_shipping' ? 'Livraison gratuite' :
                           reward.rewardType === 'exclusive_product' ? 'Produit exclusif' :
                           reward.rewardType === 'early_access' ? 'Accès anticipé' :
                           reward.rewardType}
                        </Badge>
                      </div>

                      {/* Détails spécifiques selon le type de récompense */}
                      {isDiscount && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                          <div className="space-y-2">
                            {/* Code de réduction */}
                            {hasDiscountCode ? (
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Votre code :</span>
                                <div className="flex items-center gap-2">
                                  <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                                    {reward.customerDiscountCode}
                                  </code>
                                  <button
                                    onClick={() => navigator.clipboard.writeText(reward.customerDiscountCode)}
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                    title="Copier le code"
                                  >
                                    📋
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                                ⏳ Code de réduction en cours de génération...
                              </div>
                            )}

                            {/* Pourcentage de réduction */}
                            {config?.percentage && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Réduction :</span>
                                <span className="text-sm font-medium text-green-700">
                                  {config.percentage}%
                                </span>
                              </div>
                            )}

                            {/* Montant minimum */}
                            {config?.minimum_order_amount && config.minimum_order_amount > 0 && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Commande minimum :</span>
                                <span className="text-sm font-medium text-gray-700">
                                  {config.minimum_order_amount}€
                                </span>
                              </div>
                            )}

                            {/* Portée de la réduction */}
                            {config?.discount_scope && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Applicable sur :</span>
                                <span className="text-sm font-medium text-gray-700">
                                  {config.discount_scope === 'order' ? 'Commande entière' : 'Produits spécifiques'}
                                </span>
                              </div>
                            )}

                            {/* Produits ciblés */}
                            {config?.discount_scope === 'product' && config?.target_products && config.target_products.length > 0 && (
                              <div className="mt-2">
                                <span className="text-sm text-gray-600">Produits éligibles :</span>
                                <div className="mt-1 text-xs text-gray-500">
                                  {config.target_products.length} produit(s) sélectionné(s)
                                </div>
                                <div className="mt-2 text-xs text-blue-600">
                                  💡 <strong>Astuce :</strong> Cette réduction s'applique uniquement aux produits sélectionnés par le marchand
                                </div>
                              </div>
                            )}

                            {/* Collections ciblées */}
                            {config?.discount_scope === 'product' && config?.target_collections && config.target_collections.length > 0 && (
                              <div className="mt-2">
                                <span className="text-sm text-gray-600">Collections éligibles :</span>
                                <div className="mt-1 text-xs text-gray-500">
                                  {config.target_collections.length} collection(s) sélectionnée(s)
                                </div>
                                <div className="mt-2 text-xs text-blue-600">
                                  💡 <strong>Astuce :</strong> Cette réduction s'applique aux produits des collections sélectionnées
                                </div>
                              </div>
                            )}

                            {/* Commande entière */}
                            {config?.discount_scope === 'order' && (
                              <div className="mt-2">
                                <div className="text-xs text-blue-600">
                                  💡 <strong>Astuce :</strong> Cette réduction s'applique à toute votre commande
                                </div>
                              </div>
                            )}

                            {/* Date d'expiration */}
                            {reward.expiresAt && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Expire le :</span>
                                <span className="text-sm font-medium text-orange-600">
                                  {new Date(reward.expiresAt).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                            )}

                            {/* Instructions d'utilisation */}
                            {hasDiscountCode && (
                              <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                                <p className="text-xs text-blue-800 mb-2">
                                  💡 <strong>Comment utiliser :</strong> Ajoutez ce code lors du checkout sur {shopDomain}
                                </p>
                                <button
                                  onClick={() => window.open(`https://${shopDomain}`, '_blank')}
                                  className="w-full bg-blue-600 text-white text-xs py-2 px-3 rounded hover:bg-blue-700 transition-colors"
                                >
                                  🛒 Aller à la boutique
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Autres types de récompenses */}
                      {!isDiscount && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                          <div className="text-sm text-gray-600">
                            {reward.rewardType === 'free_shipping' && 'Livraison gratuite sur toutes vos commandes'}
                            {reward.rewardType === 'exclusive_product' && 'Accès à des produits exclusifs'}
                            {reward.rewardType === 'early_access' && 'Accès anticipé aux nouveautés'}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucune récompense active pour votre niveau actuel</p>
                <p className="text-sm text-gray-500 mt-2">
                  Gagnez plus de points pour débloquer de nouvelles récompenses !
                </p>
              </div>
            )}

            {/* Next Tier Rewards */}
            {nextTierRewards && nextTierRewards.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                  <Trophy className="h-4 w-4 mr-2 text-yellow-600" />
                  Récompenses du niveau suivant
                </h4>
                <div className="space-y-2">
                  {nextTierRewards.map((reward: any) => (
                    <div key={reward.id} className="p-3 border rounded-lg bg-yellow-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-yellow-800">
                            {(reward.value as any)?.title || reward.rewardType}
                          </span>
                          <span className="text-sm text-yellow-600 ml-2">
                            - {reward.tier}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-yellow-800 border-yellow-300">
                          Verrouillé
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <Button 
            onClick={() => window.open(`https://${shopDomain}`, '_blank')}
            className="text-white px-8 py-3 text-lg"
            style={getCTAButtonStyle()}
          >
            <Zap className="h-5 w-5 mr-2" />
            {customStyles.ctaText}
          </Button>
        </div>
      </div>
    </div>
  );
}
