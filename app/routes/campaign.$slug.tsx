import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, useFetcher } from "@remix-run/react";
import { prisma } from "~/db.server";
import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";
import { Badge } from "~/components/ui/Badge";
import type { LinksFunction } from "@remix-run/node";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: "/fonts.css" },
];
import { 
  Gift, 
  Star, 
  Clock, 
  Users, 
  Share2, 
  Mail, 
  Phone, 
  MapPin,
  CheckCircle,
  Sparkles,
  Target,
  Zap,
  Heart,
  Award,
  TrendingUp,
  Calendar,
  ArrowRight,
  ExternalLink,
  Download,
  Bell
} from "lucide-react";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { slug } = params;
  
  if (!slug) {
    throw new Response("Campaign not found", { status: 404 });
  }

  try {
    // Find campaign directly by ID (slug is the campaign ID)
    const campaign = await prisma.campaign.findUnique({
      where: { id: slug },
      include: {
        merchant: true,
      }
    });

    console.log(`[CAMPAIGN] Found campaign:`, campaign);

    if (!campaign) {
      throw new Response("Campaign not found", { status: 404 });
    }

    if (campaign.status !== 'active') {
      throw new Response("Campaign not active", { status: 404 });
    }

    // Get customer ID from URL parameters
    const url = new URL(request.url);
    const customerId = url.searchParams.get("customer_id") || "anonymous";

    return json({
      campaign,
      customerId,
      shopDomain: campaign.merchant?.shopifyDomain || "unknown",
    });

  } catch (error) {
    console.error("Error in campaign route:", error);
    
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
    if (action === "subscribe_campaign") {
      const email = formData.get("email") as string;
      const name = formData.get("name") as string;
      const phone = formData.get("phone") as string;
      
      if (!email) {
        return json({ error: "Email is required" }, { status: 400 });
      }

      // Find the QR code to get campaign ID
      const qrCode = await prisma.qRCode.findFirst({
        where: { 
          OR: [
            { slug },
            { title: { contains: slug } }
          ],
          type: "CAMPAIGN"
        },
        include: { campaign: true }
      });

      if (!qrCode) {
        return json({ error: "Campaign not found" }, { status: 404 });
      }

      // Store subscription (you might want to create a CampaignSubscription model)
      // For now, we'll just return success
      return json({ 
        success: true, 
        message: "Inscription réussie ! Vous recevrez nos offres exclusives." 
      });
    }

    return json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in campaign action:", error);
    return json({ error: "An error occurred" }, { status: 500 });
  }
};

export default function CampaignPage() {
  const { campaign, customerId, shopDomain } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const fetcher = useFetcher();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Log des données de campagne pour déboguer
  console.log("🎨 Campaign data reçue:", campaign);
  console.log("🎨 Featured Products:", (campaign as any).featuredProducts);
  console.log("🎨 Special Offers:", (campaign as any).specialOffers);
  console.log("🎨 Primary Color:", (campaign as any).primaryColor);
  console.log("🎨 Primary Gradient:", (campaign as any).primaryColorGradient);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      fetcher.submit(
        {
          action: "subscribe_campaign",
          email,
          name,
          phone,
        },
        { method: "post" }
      );
      setIsSubscribed(true);
    }
  };

  const getCampaignStatus = () => {
    const now = new Date();
    const startDate = new Date(campaign.startDate);
    const endDate = campaign.endDate ? new Date(campaign.endDate) : null;

    if (now < startDate) {
      return { status: "upcoming", text: "Bientôt disponible", color: "bg-blue-100 text-blue-800" };
    }
    if (endDate && now > endDate) {
      return { status: "ended", text: "Terminée", color: "bg-gray-100 text-gray-800" };
    }
    return { status: "active", text: "En cours", color: "bg-green-100 text-green-800" };
  };

  const campaignStatus = getCampaignStatus();

  // Log des données de la campagne pour déboguer
  console.log("🎨 Campaign data:", {
    primaryColor: (campaign as any).primaryColor,
    primaryColorGradient: (campaign as any).primaryColorGradient,
    primaryGradientColors: (campaign as any).primaryGradientColors,
    ctaButtonColor: (campaign as any).ctaButtonColor,
    ctaButtonColorGradient: (campaign as any).ctaButtonColorGradient,
    ctaButtonColorGradientColors: (campaign as any).ctaButtonColorGradientColors,
    cardBackgroundColor: (campaign as any).cardBackgroundColor,
    cardBackgroundGradient: (campaign as any).cardBackgroundGradient,
    cardBackgroundGradientColors: (campaign as any).cardBackgroundGradientColors,
  });

  // Styles personnalisés basés sur la campagne
  const customStyles = {
    primaryColor: (campaign as any).primaryColor || '#007b5c',
    primaryColorGradient: (campaign as any).primaryColorGradient || false,
    primaryGradientColors: (campaign as any).primaryGradientColors || ['#007b5c', '#00a86b'],
    primaryGradientDirection: (campaign as any).primaryGradientDirection || 'to right',
    secondaryColor: (campaign as any).secondaryColor || '#ffffff',
    secondaryColorGradient: (campaign as any).secondaryColorGradient || false,
    secondaryGradientColors: (campaign as any).secondaryGradientColors || ['#ffffff', '#f0f0f0'],
    secondaryGradientDirection: (campaign as any).secondaryGradientDirection || 'to right',
    backgroundColor: (campaign as any).backgroundColor || '#f8f9fa',
    backgroundColorGradient: (campaign as any).backgroundColorGradient || false,
    backgroundGradientColors: (campaign as any).backgroundGradientColors || ['#f8f9fa', '#e9ecef'],
    backgroundGradientDirection: (campaign as any).backgroundGradientDirection || 'to right',
    fontFamily: (campaign as any).fontFamily || 'Inter',
    fontSize: (campaign as any).fontSize || 16,
    fontWeight: (campaign as any).fontWeight || 'normal',
    ctaButtonColor: (campaign as any).ctaButtonColor || '#007b5c',
    ctaButtonColorGradient: (campaign as any).ctaButtonColorGradient || false,
    ctaButtonColorGradientColors: (campaign as any).ctaButtonColorGradientColors || ['#007b5c', '#00a86b'],
    ctaButtonColorGradientDirection: (campaign as any).ctaButtonColorGradientDirection || 'to right',
    backgroundImage: (campaign as any).backgroundImage || null,
    // 🎨 Personnalisation des cartes
    cardBackgroundColor: (campaign as any).cardBackgroundColor || '#ffffff',
    cardBackgroundGradient: (campaign as any).cardBackgroundGradient || false,
    cardBackgroundGradientColors: (campaign as any).cardBackgroundGradientColors || ['#ffffff', '#f8f9fa'],
    cardBackgroundGradientDirection: (campaign as any).cardBackgroundGradientDirection || 'to right',
    cardBorderColor: (campaign as any).cardBorderColor || '#e5e7eb',
    cardBorderWidth: (campaign as any).cardBorderWidth || 1,
    cardBorderRadius: (campaign as any).cardBorderRadius || 8,
    cardShadow: (campaign as any).cardShadow || 'lg',
    // 🎨 Personnalisation des mini-cartes
    miniCardBackgroundColor: (campaign as any).miniCardBackgroundColor || '#ffffff',
    miniCardBackgroundGradient: (campaign as any).miniCardBackgroundGradient || false,
    miniCardBackgroundGradientColors: (campaign as any).miniCardBackgroundGradientColors || ['#ffffff', '#f8f9fa'],
    miniCardBackgroundGradientDirection: (campaign as any).miniCardBackgroundGradientDirection || 'to right',
    miniCardBorderColor: (campaign as any).miniCardBorderColor || '#e5e7eb',
    miniCardBorderWidth: (campaign as any).miniCardBorderWidth || 1,
    miniCardBorderRadius: (campaign as any).miniCardBorderRadius || 8,
    miniCardShadow: (campaign as any).miniCardShadow || 'md',
  };

  // Fonction pour obtenir le style de couleur (simple ou dégradé)
  const getColorStyle = (colorType: 'primary' | 'secondary' | 'background') => {
    const gradient = customStyles[`${colorType}ColorGradient` as keyof typeof customStyles] as boolean;
    const colors = customStyles[`${colorType}GradientColors` as keyof typeof customStyles] as string[];
    const direction = customStyles[`${colorType}GradientDirection` as keyof typeof customStyles] as string;
    const simpleColor = customStyles[`${colorType}Color` as keyof typeof customStyles] as string;
    
    if (gradient && colors && colors.length > 1) {
      return {
        background: `linear-gradient(${direction}, ${colors.join(', ')})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        color: 'transparent'
      };
    }
    return { color: simpleColor };
  };

  // Fonction pour obtenir le style de fond (simple ou dégradé)
  const getBackgroundStyle = (colorType: 'primary' | 'secondary' | 'background') => {
    const gradient = customStyles[`${colorType}ColorGradient` as keyof typeof customStyles] as boolean;
    const colors = customStyles[`${colorType}GradientColors` as keyof typeof customStyles] as string[];
    const direction = customStyles[`${colorType}GradientDirection` as keyof typeof customStyles] as string;
    const simpleColor = customStyles[`${colorType}Color` as keyof typeof customStyles] as string;
    
    if (gradient && colors && colors.length > 1) {
      return {
        background: `linear-gradient(${direction}, ${colors.join(', ')})`
      };
    }
    return { backgroundColor: simpleColor };
  };

  // Fonction pour obtenir le style du bouton CTA (simple ou dégradé)
  const getCTAButtonStyle = () => {
    const color = customStyles.ctaButtonColor;
    
    console.log("🎨 CTA Button - Color:", color);
    
    // Le CSS généré est déjà dans ctaButtonColor
    return { 
      background: color,
      border: 'none'
    };
  };

  // Fonction pour obtenir le style des cartes
  const getCardStyle = () => {
    const background = customStyles.cardBackgroundColor;
    
    console.log("🎨 Cartes - Background:", background);

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

  // Fonction pour obtenir le style des mini-cartes (produits et offres)
  const getMiniCardStyle = () => {
    const background = customStyles.miniCardBackgroundColor;
    
    console.log("🎨 Mini-cartes - Background:", background);

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

  return (
    <div 
      className="min-h-screen"
      style={{ 
        ...getBackgroundStyle('background'),
        ...(customStyles.backgroundImage && {
          backgroundImage: `url(${customStyles.backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }),
        fontFamily: customStyles.fontFamily,
        fontSize: `${customStyles.fontSize}px`,
        fontWeight: customStyles.fontWeight
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          {/* Bannière personnalisée */}
          {(campaign as any).bannerUrl && (
            <div className="mb-6">
              <img 
                src={(campaign as any).bannerUrl} 
                alt={`Bannière ${campaign.name}`}
                className="w-full max-w-4xl mx-auto rounded-lg shadow-lg object-cover"
                style={{ maxHeight: '300px' }}
              />
            </div>
          )}
          
          {(campaign as any).logoUrl ? (
            <img 
              src={(campaign as any).logoUrl} 
              alt={campaign.name}
              className="w-16 h-16 mx-auto mb-4 rounded-full object-cover"
            />
          ) : (
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{ backgroundColor: customStyles.primaryColor }}
            >
              <Gift className="h-8 w-8 text-white" />
            </div>
          )}
          <h1 
            className="text-4xl font-bold mb-2"
            style={getColorStyle('primary')}
          >
            {campaign.name}
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            {campaign.description}
          </p>
          {(campaign as any).mainOffer && (
            <div 
              className="inline-block px-6 py-3 rounded-full text-white font-semibold mb-4"
              style={getBackgroundStyle('primary')}
            >
              {(campaign as any).mainOffer}
            </div>
          )}
          <div className="flex items-center justify-center space-x-4">
            <Badge className={campaignStatus.color}>
              {campaignStatus.text}
            </Badge>
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-1" />
              {new Date(campaign.startDate).toLocaleDateString('fr-FR')}
              {campaign.endDate && (
                <>
                  <span className="mx-2">-</span>
                  {new Date(campaign.endDate).toLocaleDateString('fr-FR')}
                </>
              )}
            </div>
          </div>
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
          {/* Main Campaign Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Special Offers */}
            {(campaign as any).specialOffers && (campaign as any).specialOffers.length > 0 && (
              <Card 
                className="backdrop-blur-sm"
                style={getCardStyle()}
              >
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-yellow-600" />
                    Offres exceptionnelles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(campaign as any).specialOffers
                      .filter((offer: any) => offer.enabled)
                      .map((offer: any, index: number) => (
                      <div 
                        key={index} 
                        className="p-4 hover:shadow-md transition-shadow"
                        style={getMiniCardStyle()}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-lg">{offer.title}</h4>
                          <span 
                            className="px-3 py-1 rounded-full text-sm font-medium"
                            style={{ 
                              backgroundColor: offer.color + '20', 
                              color: offer.color 
                            }}
                          >
                            Spécial
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{offer.description}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          Offre limitée
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Featured Products */}
            {(campaign as any).featuredProducts && (campaign as any).featuredProducts.length > 0 && (
              <Card 
                className="backdrop-blur-sm"
                style={getCardStyle()}
              >
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2 text-green-600" />
                    Produits vedettes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(campaign as any).featuredProducts.map((product: any, index: number) => (
                      <div 
                        key={index} 
                        className="p-4 hover:shadow-md transition-shadow"
                        style={getMiniCardStyle()}
                      >
                        <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Gift className="h-12 w-12 text-gray-400" />
                          )}
                        </div>
                        <h4 className="font-semibold mb-1">{product.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-purple-600">
                            {product.discountPrice ? `${product.discountPrice.toFixed(2)}€` : `${product.originalPrice.toFixed(2)}€`}
                          </span>
                          {product.discountPrice && product.discountPrice < product.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              {product.originalPrice.toFixed(2)}€
                            </span>
                          )}
                        </div>
                        {product.discountPrice && product.discountPrice < product.originalPrice && (
                          <div className="mt-2">
                            <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                              -{Math.round(((product.originalPrice - product.discountPrice) / product.originalPrice) * 100)}% de réduction
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Call to Action */}
            <div className="text-center">
              <Button 
                onClick={() => window.open(`https://${shopDomain}`, '_blank')}
                className="text-white px-8 py-3 text-lg"
                style={getCTAButtonStyle()}
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                {(campaign as any).ctaText || "Découvrir la boutique"}
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Subscription Form */}
            <Card 
              className="backdrop-blur-sm"
              style={getCardStyle()}
            >
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-blue-600" />
                  Restez informé
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isSubscribed ? (
                  <form onSubmit={handleSubscribe} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom (optionnel)
                      </label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Votre nom"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre@email.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone (optionnel)
                      </label>
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="06 12 34 56 78"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full text-white"
                      style={getCTAButtonStyle()}
                      disabled={fetcher.state === "submitting"}
                    >
                      {fetcher.state === "submitting" ? "Inscription..." : "S'inscrire aux offres"}
                    </Button>
                  </form>
                ) : (
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <p className="text-green-800 font-medium">Inscription réussie !</p>
                    <p className="text-sm text-green-600">Vous recevrez nos offres exclusives</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Campaign Stats */}
            <Card 
              className="backdrop-blur-sm"
              style={getCardStyle()}
            >
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Statistiques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Participants</span>
                    <span className="font-semibold">{(campaign as any).subscriberCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Scans QR</span>
                    <span className="font-semibold">{(campaign as any).scanCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Taux de conversion</span>
                    <span className="font-semibold text-green-600">
                      {(campaign as any).scanCount > 0 
                        ? `${(((campaign as any).subscriberCount / (campaign as any).scanCount) * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                  {(campaign as any).endDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Fin de campagne</span>
                      <span className="font-semibold text-orange-600">
                        {new Date((campaign as any).endDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Share Campaign */}
            <Card 
              className="backdrop-blur-sm"
              style={getCardStyle()}
            >
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Share2 className="h-5 w-5 mr-2 text-blue-600" />
                  Partager la campagne
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-center"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: campaign.name,
                          text: campaign.description || '',
                          url: window.location.href
                        });
                      }
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Partager
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-center"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      // Notification sera gérée par le système de notifications si disponible
                      console.log('Lien copié !');
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Copier le lien
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
