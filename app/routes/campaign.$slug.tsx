import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, useFetcher } from "@remix-run/react";
import { prisma } from "~/db.server";
import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";
import { Badge } from "~/components/ui/Badge";
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

  // Styles personnalisés basés sur la campagne
  const customStyles = {
    primaryColor: (campaign as any).primaryColor || '#007b5c',
    secondaryColor: (campaign as any).secondaryColor || '#ffffff',
    backgroundColor: (campaign as any).backgroundColor || '#f8f9fa',
    fontFamily: (campaign as any).fontFamily || 'Inter',
    ctaButtonColor: (campaign as any).ctaButtonColor || '#007b5c',
  };

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: customStyles.backgroundColor,
        fontFamily: customStyles.fontFamily,
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
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
            style={{ color: customStyles.primaryColor }}
          >
            {campaign.name}
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            {campaign.description}
          </p>
          {(campaign as any).mainOffer && (
            <div 
              className="inline-block px-6 py-3 rounded-full text-white font-semibold mb-4"
              style={{ backgroundColor: customStyles.primaryColor }}
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
            {/* Campaign Highlights */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
                  Offres exceptionnelles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Star className="h-5 w-5 text-yellow-500 mr-2" />
                      <h3 className="font-semibold">Réduction jusqu'à -70%</h3>
                    </div>
                    <p className="text-sm text-gray-600">Sur une sélection de produits</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Gift className="h-5 w-5 text-blue-500 mr-2" />
                      <h3 className="font-semibold">Cadeaux offerts</h3>
                    </div>
                    <p className="text-sm text-gray-600">Avec tout achat supérieur à 50€</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Zap className="h-5 w-5 text-green-500 mr-2" />
                      <h3 className="font-semibold">Livraison gratuite</h3>
                    </div>
                    <p className="text-sm text-gray-600">Sur toute la France métropolitaine</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Clock className="h-5 w-5 text-orange-500 mr-2" />
                      <h3 className="font-semibold">Offres limitées</h3>
                    </div>
                    <p className="text-sm text-gray-600">Quantités limitées, dépêchez-vous !</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Featured Products */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-green-600" />
                  Produits vedettes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                      <Gift className="h-12 w-12 text-gray-400" />
                    </div>
                    <h4 className="font-semibold mb-1">Produit Premium</h4>
                    <p className="text-sm text-gray-600 mb-2">Description du produit</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-purple-600">29,99€</span>
                      <span className="text-sm text-gray-500 line-through">59,99€</span>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                      <Gift className="h-12 w-12 text-gray-400" />
                    </div>
                    <h4 className="font-semibold mb-1">Collection Exclusive</h4>
                    <p className="text-sm text-gray-600 mb-2">Description du produit</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-purple-600">49,99€</span>
                      <span className="text-sm text-gray-500 line-through">99,99€</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <div className="text-center">
              <Button 
                onClick={() => window.open(`https://${shopDomain}`, '_blank')}
                className="text-white px-8 py-3 text-lg"
                style={{ backgroundColor: customStyles.ctaButtonColor }}
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                {(campaign as any).ctaText || "Découvrir la boutique"}
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Subscription Form */}
            <Card className="shadow-lg">
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
                      style={{ backgroundColor: customStyles.ctaButtonColor }}
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
            <Card className="shadow-lg">
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
                    <span className="font-semibold">1,247</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Temps restant</span>
                    <span className="font-semibold text-orange-600">3 jours</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Taux de conversion</span>
                    <span className="font-semibold text-green-600">12.5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share Campaign */}
            <Card className="shadow-lg">
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
                      alert('Lien copié !');
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
