import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, useFetcher } from "@remix-run/react";
import { prisma } from "~/db.server";
import { UpsellService } from "~/utils/upsell.server";
import { AnalyticsService } from "~/utils/analytics.server";
import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";
import { 
  ShoppingCart, 
  Star, 
  ArrowRight, 
  Tag, 
  Gift,
  CheckCircle,
  ExternalLink
} from "lucide-react";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { slug } = params;
  
  if (!slug) {
    throw new Response("QR Code not found", { status: 404 });
  }

  try {
    // Find QR code by slug
    const qrCode = await prisma.qRCode.findUnique({
      where: { slug },
      include: {
        merchant: true,
        campaign: true,
      },
    });

    if (!qrCode || !qrCode.active) {
      throw new Response("QR Code not found or inactive", { status: 404 });
    }

    // Check if QR code has expired
    if (qrCode.expiresAt && qrCode.expiresAt < new Date()) {
      throw new Response("QR Code has expired", { status: 410 });
    }

    // Get landing page data
    const landingData = await UpsellService.getLandingPageData(qrCode.id);
    
    if (!landingData) {
      // If no upsell config, redirect to original destination
      return json({ redirect: true, destination: qrCode.destination });
    }

    return json({ 
      landingData,
      qrCodeId: qrCode.id,
    });

  } catch (error) {
    console.error("Error in landing route:", error);
    
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
    const qrCode = await prisma.qRCode.findUnique({
      where: { slug },
    });

    if (!qrCode) {
      return json({ error: "QR Code not found" }, { status: 404 });
    }

    switch (action) {
      case "upsell_click": {
        const productId = formData.get("productId") as string;
        const productHandle = formData.get("productHandle") as string;
        const type = formData.get("type") as "upsell" | "cross_sell";
        
        await UpsellService.recordUpsellClick(qrCode.id, productId, type, {
          productHandle,
          userAgent: request.headers.get("User-Agent"),
          referrer: request.headers.get("Referer"),
        });

        return json({ success: true });
      }

      case "promo_used": {
        const promoCode = formData.get("promoCode") as string;
        
        await UpsellService.recordPromoCodeUsage(qrCode.id, promoCode, {
          userAgent: request.headers.get("User-Agent"),
          referrer: request.headers.get("Referer"),
        });

        return json({ success: true });
      }

      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error) {
    console.error("Error in landing action:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

export default function LandingPage() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [copiedPromo, setCopiedPromo] = useState<string | null>(null);
  const fetcher = useFetcher();

  // Type guard to check if we have landing data
  if ('redirect' in loaderData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
          <p className="text-gray-600">Please wait while we redirect you.</p>
        </div>
      </div>
    );
  }

  const { landingData, qrCodeId } = loaderData;
  const { qrCode, merchant, upsellConfig, primaryProduct, upsellProducts, crossSellProducts } = landingData;

  const handleProductClick = (product: any, type: "upsell" | "cross_sell") => {
    const formData = new FormData();
    formData.append("action", "upsell_click");
    formData.append("productId", product.id);
    formData.append("productHandle", product.handle);
    formData.append("type", type);
    
    fetcher.submit(formData, { method: "post" });
  };

  const handlePromoCopy = (promoCode: string) => {
    navigator.clipboard.writeText(promoCode);
    setCopiedPromo(promoCode);
    setTimeout(() => setCopiedPromo(null), 2000);
  };

  const getProductUrl = (product: any, promoCode?: string) => {
    const baseUrl = `https://${merchant.shopifyDomain}/products/${product.handle}`;
    if (promoCode) {
      return `${baseUrl}?discount=${promoCode}`;
    }
    return baseUrl;
  };

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: upsellConfig.landingPageConfig?.backgroundColor || '#ffffff',
        color: upsellConfig.landingPageConfig?.textColor || '#000000'
      }}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          {upsellConfig.landingPageConfig?.logoUrl && (
            <img 
              src={upsellConfig.landingPageConfig.logoUrl} 
              alt="Logo" 
              className="h-16 mx-auto mb-4"
            />
          )}
          <h1 className="text-4xl font-bold mb-4">
            {upsellConfig.landingPageConfig?.title || "Bienvenue !"}
          </h1>
          {upsellConfig.landingPageConfig?.subtitle && (
            <p className="text-xl text-gray-600 mb-6">
              {upsellConfig.landingPageConfig.subtitle}
            </p>
          )}
        </div>

        {/* Primary Product */}
        {primaryProduct && (
          <Card className="mb-8 border-2 border-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Produit Principal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                <img 
                  src={primaryProduct.image} 
                  alt={primaryProduct.title}
                  className="w-full md:w-48 h-48 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">{primaryProduct.title}</h3>
                  <p className="text-gray-600 mb-4">{primaryProduct.description}</p>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-3xl font-bold text-green-600">
                      €{primaryProduct.price}
                    </span>
                    {upsellConfig.promoCode && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Tag className="h-4 w-4 mr-1" />
                        Code: {upsellConfig.promoCode}
                      </Badge>
                    )}
                  </div>
                  <Button 
                    size="lg"
                    className="w-full md:w-auto"
                    onClick={() => window.open(getProductUrl(primaryProduct, upsellConfig.promoCode), '_blank')}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {upsellConfig.landingPageConfig?.primaryButtonText || "Acheter maintenant"}
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upsell Products */}
        {upsellProducts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Gift className="h-6 w-6 text-purple-500" />
              Offres Spéciales
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upsellProducts.map((product: any, index: number) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <img 
                      src={product.image} 
                      alt={product.title}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                    <h3 className="font-bold mb-2">{product.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        {product.discount && (
                          <div className="text-sm text-green-600 font-semibold">
                            -{product.discount}{product.discountType === 'percentage' ? '%' : '€'}
                          </div>
                        )}
                        <span className="text-lg font-bold">€{product.price}</span>
                      </div>
                      {product.promoCode && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePromoCopy(product.promoCode)}
                        >
                          {copiedPromo === product.promoCode ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Tag className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => {
                        handleProductClick(product, "upsell");
                        window.open(getProductUrl(product, product.promoCode), '_blank');
                      }}
                    >
                      Voir l'offre
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Cross-sell Products */}
        {crossSellProducts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Vous pourriez aussi aimer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {crossSellProducts.map((product: any, index: number) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <img 
                      src={product.image} 
                      alt={product.title}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                    <h3 className="font-semibold text-sm mb-2">{product.title}</h3>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold">€{product.price}</span>
                      {product.discount && (
                        <Badge variant="secondary" className="text-xs">
                          -{product.discount}{product.discountType === 'percentage' ? '%' : '€'}
                        </Badge>
                      )}
                    </div>
                    <Button 
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        handleProductClick(product, "cross_sell");
                        window.open(getProductUrl(product, product.promoCode), '_blank');
                      }}
                    >
                      Voir
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t">
          <p className="text-gray-500">
            Merci d'avoir scanné notre QR code ! 
            <br />
            Découvrez plus de produits sur{" "}
            <a 
              href={`https://${merchant.shopifyDomain}`}
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {merchant.shopifyDomain}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

