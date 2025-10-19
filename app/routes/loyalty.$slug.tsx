import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, useFetcher } from "@remix-run/react";
import { prisma } from "~/db.server";
import { LoyaltyService } from "~/utils/loyalty.server";
import { useState } from "react";
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
  Mail
} from "lucide-react";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { slug } = params;
  
  if (!slug) {
    throw new Response("Loyalty program not found", { status: 404 });
  }

  try {
    console.log(`Looking for loyalty QR code with slug: ${slug}`);
    
    // Find QR code by slug or by title (for loyalty programs)
    const qrCode = await prisma.qRCode.findFirst({
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

    console.log(`Found QR code:`, qrCode ? { id: qrCode.id, title: qrCode.title, type: qrCode.type, destination: qrCode.destination } : 'null');

    if (!qrCode || qrCode.type !== "LOYALTY") {
      throw new Response("Loyalty QR Code not found or inactive", { status: 404 });
    }

    // Get loyalty program
    const loyaltyProgram = await prisma.loyaltyProgram.findUnique({
      where: { merchantId: qrCode.merchantId }
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

    return json({
      qrCode,
      loyaltyProgram,
      customerId,
      customerPoints,
      customerTier,
      shopDomain: qrCode.merchant.shopifyDomain,
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
  const { qrCode, loyaltyProgram, customerId, customerPoints, customerTier, shopDomain } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const fetcher = useFetcher();
  const [email, setEmail] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  const getTierInfo = (tier: string) => {
    const tiers = {
      Bronze: { color: "from-amber-500 to-orange-600", icon: Star, bgColor: "bg-amber-100", textColor: "text-amber-800" },
      Silver: { color: "from-gray-400 to-gray-600", icon: Award, bgColor: "bg-gray-100", textColor: "text-gray-800" },
      Gold: { color: "from-yellow-400 to-yellow-600", icon: Trophy, bgColor: "bg-yellow-100", textColor: "text-yellow-800" },
      Platinum: { color: "from-purple-500 to-pink-600", icon: Crown, bgColor: "bg-purple-100", textColor: "text-purple-800" }
    };
    return tiers[tier as keyof typeof tiers] || tiers.Bronze;
  };

  const tierInfo = getTierInfo(customerTier);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Programme de fidélité
          </h1>
          <p className="text-lg text-gray-600">
            Gagnez des points et débloquez des récompenses exclusives !
          </p>
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
          <Card className="shadow-lg lg:col-span-2">
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
                <h3 className="text-3xl font-bold text-gray-900 mb-2">{customerTier}</h3>
                <p className="text-5xl font-bold text-purple-600 mb-2">{customerPoints}</p>
                <p className="text-gray-600 text-lg">points accumulés</p>
              </div>

              {/* Progress to next tier */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progression vers le niveau suivant</span>
                  <span>{customerPoints} / 100 points</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((customerPoints / 100) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Il vous manque {Math.max(0, 100 - customerPoints)} points pour le niveau Silver
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
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gift className="h-5 w-5 mr-2 text-green-600" />
                Récompenses disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Bronze Tier */}
                <div className={`p-4 rounded-lg border-2 ${customerTier === "Bronze" ? "border-amber-300 bg-amber-50" : "border-gray-200"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-amber-600 mr-2" />
                      <span className="font-medium">Bronze (0-99 pts)</span>
                    </div>
                    <Badge className={customerTier === "Bronze" ? "bg-amber-100 text-amber-800" : "bg-gray-100"}>
                      {customerTier === "Bronze" ? "Actuel" : "Débloqué"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">5% de réduction sur votre prochaine commande</p>
                </div>

                {/* Silver Tier */}
                <div className={`p-4 rounded-lg border-2 ${customerTier === "Silver" ? "border-gray-300 bg-gray-50" : "border-gray-200"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Award className="h-5 w-5 text-gray-600 mr-2" />
                      <span className="font-medium">Silver (100-499 pts)</span>
                    </div>
                    <Badge className={customerTier === "Silver" ? "bg-gray-100 text-gray-800" : customerPoints >= 100 ? "bg-green-100 text-green-800" : "bg-gray-100"}>
                      {customerTier === "Silver" ? "Actuel" : customerPoints >= 100 ? "Débloqué" : "Verrouillé"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">10% de réduction + livraison gratuite</p>
                </div>

                {/* Gold Tier */}
                <div className={`p-4 rounded-lg border-2 ${customerTier === "Gold" ? "border-yellow-300 bg-yellow-50" : "border-gray-200"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Trophy className="h-5 w-5 text-yellow-600 mr-2" />
                      <span className="font-medium">Gold (500-999 pts)</span>
                    </div>
                    <Badge className={customerTier === "Gold" ? "bg-yellow-100 text-yellow-800" : customerPoints >= 500 ? "bg-green-100 text-green-800" : "bg-gray-100"}>
                      {customerTier === "Gold" ? "Actuel" : customerPoints >= 500 ? "Débloqué" : "Verrouillé"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">15% de réduction + produit offert</p>
                </div>

                {/* Platinum Tier */}
                <div className={`p-4 rounded-lg border-2 ${customerTier === "Platinum" ? "border-purple-300 bg-purple-50" : "border-gray-200"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Crown className="h-5 w-5 text-purple-600 mr-2" />
                      <span className="font-medium">Platinum (1000+ pts)</span>
                    </div>
                    <Badge className={customerTier === "Platinum" ? "bg-purple-100 text-purple-800" : customerPoints >= 1000 ? "bg-green-100 text-green-800" : "bg-gray-100"}>
                      {customerTier === "Platinum" ? "Actuel" : customerPoints >= 1000 ? "Débloqué" : "Verrouillé"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">20% de réduction + accès VIP</p>
                </div>
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
        <Card className="shadow-lg mt-8">
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
          <Card className="shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
                <Package className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Récompenses exclusives</h3>
              <p className="text-sm text-gray-600">Accédez à des offres et produits réservés aux membres</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-full mb-4">
                <Percent className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Réductions progressives</h3>
              <p className="text-sm text-gray-600">Plus vous achetez, plus vous économisez</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mb-4">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Notifications VIP</h3>
              <p className="text-sm text-gray-600">Soyez les premiers informés des nouveautés</p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <Button 
            onClick={() => window.open(`https://${shopDomain}`, '_blank')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 text-lg"
          >
            <Zap className="h-5 w-5 mr-2" />
            Découvrir la boutique
          </Button>
        </div>
      </div>
    </div>
  );
}
