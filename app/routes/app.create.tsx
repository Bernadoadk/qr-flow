import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigation, useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { Page } from "@shopify/polaris";
import React, { useState, useEffect, useCallback } from 'react';
import { prisma } from "../db.server";
import { getOrCreateMerchant } from "../utils/merchant.server";
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingButton } from '../components/ui/LoadingButton';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/ui/Toast';
import { useLoading } from '../hooks/useLoading';
import { useQuickNotifications } from '../components/ui/NotificationSystem';
import { QRCodeSVG } from 'qrcode.react';
import { Tooltip } from '../components/ui/Tooltip';
import { DesignOption } from '../components/qr/DesignOption';
import Modal from '../components/ui/Modal';
import { FileUpload } from '../components/ui/FileUpload';
import { StyledQRCode } from '../components/qr/StyledQRCode';
import { FEATURES } from '../config/features';
import {
  QrCode,
  Palette,
  Upload,
  Eye,
  Download,
  Copy,
  Check,
  Sparkles,
  Link,
  Package,
  Gift,
  FileText,
  Smartphone,
  Globe,
  ArrowLeft,
  Zap,
  Star,
  Heart,
  Settings,
  Home,
  ShoppingCart,
  CreditCard,
  Percent,
  Mail,
  Phone,
  MessageSquare,
  Type,
  Layers,
  Image,
  Frame,
  Circle,
  Square,
  Hexagon,
  Dot,
  Minus,
  ChevronDown,
  ChevronUp,
  Plus,
  RotateCcw,
  RotateCw
} from 'lucide-react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  
  // Get or create merchant
  const merchant = await getOrCreateMerchant(
    session?.shop || (admin as any).shopifyDomain || (admin as any).shop || (admin as any).domain,
    session?.accessToken
  );

  // Get products from Shopify
  const products = await admin.graphql(
    `#graphql
      query getProducts($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              title
              handle
              variants(first: 1) {
                edges {
                  node {
                    price
                    id
                  }
                }
              }
            }
          }
        }
      }`,
    {
      variables: { first: 50 },
    }
  );

  const productsData = await products.json();
  const productsList = productsData.data?.products?.edges?.map((edge: any) => edge.node) || [];

  // Get collections from Shopify
  const collections = await admin.graphql(
    `#graphql
      query getCollections($first: Int!) {
        collections(first: $first) {
          edges {
            node {
              id
              title
              handle
              description
            }
          }
        }
      }`,
    {
      variables: { first: 50 },
    }
  );

  const collectionsData = await collections.json();
  const collectionsList = collectionsData.data?.collections?.edges?.map((edge: any) => edge.node) || [];

  // Get discount codes from Shopify (with error handling for permissions)
  let discountCodesList: any[] = [];
  try {
    const discountCodes = await admin.graphql(
      `#graphql
        query getDiscountCodes($first: Int!) {
          codeDiscountNodes(first: $first) {
            edges {
              node {
                id
                codeDiscount {
                  ... on DiscountCodeBasic {
                    title
                    codes(first: 1) {
                      edges {
                        node {
                          code
                        }
                      }
                    }
                    status
                    startsAt
                    endsAt
                  }
                }
              }
            }
          }
        }`,
      {
        variables: { first: 50 },
      }
    );

    const discountCodesData = await discountCodes.json();
    discountCodesList = discountCodesData.data?.codeDiscountNodes?.edges?.map((edge: any) => {
      const node = edge.node;
      const discount = node.codeDiscount;
      return {
        id: node.id,
        title: discount.title,
        code: discount.codes.edges[0]?.node?.code || '',
        status: discount.status,
        startsAt: discount.startsAt,
        endsAt: discount.endsAt,
      };
    }).filter((discount: any) => discount.code && discount.status === 'ACTIVE') || [];
  } catch (error) {
    console.warn('Impossible de récupérer les codes de réduction Shopify (permissions manquantes):', error);
    // Continuer sans les codes de réduction - l'utilisateur pourra toujours saisir manuellement
  }

  // Get campaigns for QR code creation
  const campaigns = await prisma.campaign.findMany({
    where: { merchantId: merchant.id },
    orderBy: { createdAt: 'desc' },
  });

  // Get loyalty program
  const loyaltyProgram = await prisma.loyaltyProgram.findFirst({
    where: { merchantId: merchant.id },
  });

  return json({
    shop: session?.shop || (admin as any).shopifyDomain || (admin as any).shop || (admin as any).domain,
    merchant,
    products: productsList,
    collections: collectionsList,
    discountCodes: discountCodesList,
    campaigns,
    loyaltyProgram,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    console.log('Action called with request:', request.url);
    
    let admin, session;
    try {
      const authResult = await authenticate.admin(request);
      admin = authResult.admin;
      session = authResult.session;
      console.log('Authentication successful:', { 
        shop: session?.shop, 
        hasAdmin: !!admin,
        hasSession: !!session 
      });
    } catch (authError) {
      console.error('Authentication failed:', authError);
      return json({ 
        error: "Authentication failed", 
        details: authError instanceof Error ? authError.message : "Unknown auth error"
      }, { 
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }
    
    const formData = await request.formData();
    const action = formData.get("action") as string;
    console.log('Form data received:', { action });

    // Get or create merchant
    let merchant;
    try {
      merchant = await getOrCreateMerchant(
        session?.shop || (admin as any).shopifyDomain || (admin as any).shop || (admin as any).domain,
        session?.accessToken
      );
      console.log('Merchant retrieved:', { id: merchant.id, domain: merchant.shopifyDomain });
    } catch (merchantError) {
      console.error('Merchant creation/retrieval failed:', merchantError);
      return json({ 
        error: "Merchant error", 
        details: merchantError instanceof Error ? merchantError.message : "Unknown merchant error"
      }, { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }

    switch (action) {
      case "create_qr_code": {
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const type = formData.get("type") as string;
        const destination = formData.get("destination") as string;
        const scanUrl = formData.get("scanUrl") as string;
        const color = formData.get("color") as string;
        const backgroundColor = formData.get("backgroundColor") as string;
        const size = Number(formData.get("size"));
        
        // New customization fields
        const backgroundImage = formData.get("backgroundImage") as string;
        const frameStyle = formData.get("frameStyle") as string;
        const logoStyle = formData.get("logoStyle") as string;
        const logoBackground = formData.get("logoBackground") as string;
        const designOptions = formData.get("designOptions") as string;
        const additionalData = formData.get("additionalData") as string;
        const logoUrl = formData.get("logoUrl") as string;

        console.log('Creating QR code with data:', { title, type, destination, scanUrl });

        // For LOYALTY type, get the loyalty program ID
        let finalDestination = destination;
        if (type === 'LOYALTY') {
          console.log('Processing LOYALTY type, looking for loyalty program...');
          const loyaltyProgram = await prisma.loyaltyProgram.findFirst({
            where: { merchantId: merchant.id }
          });
          console.log('Loyalty program found:', loyaltyProgram ? loyaltyProgram.id : 'none');
          if (!loyaltyProgram) {
            console.log('No loyalty program found, returning error');
            return json({ error: "No loyalty program found. Please create one first." }, { 
              status: 400,
              headers: {
                'Content-Type': 'application/json',
              }
            });
          }
          finalDestination = `/loyalty/${loyaltyProgram.id}`;
          console.log('Final destination for LOYALTY:', finalDestination);
        }

        // Generate a unique slug for the QR code
        const slug = `${type.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log('Generated slug:', slug);

        console.log('Creating QR code with data:', {
          title: title || 'QR Code',
          type: type as any,
          destination: finalDestination,
          slug,
          color: color || '#000000',
          merchantId: merchant.id,
          campaignId: type === 'CAMPAIGN' ? destination : null,
        });

        let qrCode;
        try {
          const qrCodeData: any = {
              title: title || 'QR Code',
              type: type as any,
              destination: finalDestination,
              slug,
              color: color || '#000000',
              merchantId: merchant.id,
              campaignId: type === 'CAMPAIGN' ? destination : null,
          };

          // Add optional fields if they exist
          if (backgroundColor) qrCodeData.backgroundColor = backgroundColor;
          if (backgroundImage) qrCodeData.backgroundImage = backgroundImage;
          if (frameStyle) qrCodeData.frameStyle = JSON.parse(frameStyle);
          if (logoStyle) qrCodeData.logoStyle = JSON.parse(logoStyle);
          if (logoBackground) qrCodeData.logoBackground = JSON.parse(logoBackground);
          if (designOptions) qrCodeData.designOptions = JSON.parse(designOptions);
          if (additionalData) qrCodeData.additionalData = JSON.parse(additionalData);
          if (logoUrl) qrCodeData.logoUrl = logoUrl;

          qrCode = await prisma.qRCode.create({
            data: qrCodeData,
          });
          console.log('QR code created successfully:', qrCode.id);
        } catch (dbError) {
          console.error('Database error creating QR code:', dbError);
          return json({ 
            error: "Database error", 
            details: dbError instanceof Error ? dbError.message : "Unknown database error"
          }, { 
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            }
          });
        }

        return json({ success: true, qrCode }, {
          headers: {
            'Content-Type': 'application/json',
          }
        });
      }

      default:
        return json({ error: "Invalid action" }, { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        });
    }
  } catch (error) {
    console.error("Create QR code action error:", error);
    return json({ 
      error: "An error occurred", 
      details: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
};

export default function CreateQRRoute() {
  const { shop, merchant, products, collections, discountCodes, campaigns, loyaltyProgram } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrData, setQrData] = useState({
    name: '',
    type: '',
    url: '',
    description: '',
    foregroundColor: '#000000',
    backgroundColor: '#ffffff',
    logo: null as string | null,
    size: 256,
    campaignId: '',
    
    // New customization options
    backgroundImage: '',
    frameStyle: {
      enabled: false,
      color: '#000000',
      thickness: 2,
      cornerRadius: 8,
    },
    logoStyle: {
      enabled: false,
      size: 50,
      position: 'center',
    },
    logoBackground: {
      enabled: false,
      color: '#FFFFFF',
      shape: 'circle' as 'circle' | 'square' | 'rounded' | 'diamond',
      padding: 10,
    },
    designOptions: {
      pattern: 'default',
      marker: 'default',
      centerDotStyle: 'default',
      customMarkers: {
        enabled: false,
        markerBorder: '#000000',
        markerCenter: '#000000',
        differentMarkerColor: false,
        topLeftBorder: '#000000',
        topLeftCenter: '#000000',
        topRightBorder: '#000000',
        topRightCenter: '#000000',
        bottomLeftBorder: '#000000',
        bottomLeftCenter: '#000000',
      },
    },
    
    // Additional data for specific QR types
    additionalData: {
      // Email fields
      email: '',
      subject: '',
      message: '',
      
      // Phone fields
      countryCode: '+33',
      phone: '',
      
      // SMS fields
      smsMessage: '',
      
      // Product fields for ADD_TO_CART
      productId: '',
      variantId: '',
      quantity: 1,
      
      // Collection field
      collectionHandle: '',
      
      // Discount field
      discountCode: '',
      
      // Checkout products
      checkoutProducts: [] as Array<{
        productId: string;
        variantId: string;
        title: string;
        quantity: number;
      }>,
    },
  });
  const [generatedUrl, setGeneratedUrl] = useState('');
  // Convert an image URL to a data URL so the QR renderer can embed it reliably
  const toDataUrl = useCallback(async (url: string): Promise<string> => {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string) || '');
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      // Fallback to original URL if conversion fails
      return url;
    }
  }, []);

  // Ensure image data URL is limited to 524x524 to avoid oversized logos/frames
  const clampImageDataUrl = useCallback(async (dataUrlOrUrl: string): Promise<string> => {
    try {
      const img = new window.Image();
      const src = dataUrlOrUrl.startsWith('data:') ? dataUrlOrUrl : await toDataUrl(dataUrlOrUrl);
      return await new Promise<string>((resolve) => {
        img.onload = () => {
          const max = 524;
          const ratio = Math.min(1, max / Math.max(img.width, img.height));
          const targetW = Math.max(1, Math.round(img.width * ratio));
          const targetH = Math.max(1, Math.round(img.height * ratio));
          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, targetW, targetH);
            resolve(canvas.toDataURL('image/png'));
          } else {
            resolve(src);
          }
        };
        img.onerror = () => resolve(src);
        img.src = src;
      });
    } catch {
      return dataUrlOrUrl;
    }
  }, [toDataUrl]);
  const [isBgGalleryOpen, setIsBgGalleryOpen] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [pendingType, setPendingType] = useState<string | null>(null);
  const [tempData, setTempData] = useState<any>({});
  const [availableLogos, setAvailableLogos] = useState<string[]>([]);
  const [isLogosExpanded, setIsLogosExpanded] = useState(false);

  // Charger la liste des logos disponibles depuis l'API
  useEffect(() => {
    const fetchLogos = async () => {
      try {
        const response = await fetch('/api/logos/list');
        const data = await response.json();
        if (data.logos && Array.isArray(data.logos)) {
          setAvailableLogos(data.logos);
        }
      } catch (error) {
        console.error('Error loading logos:', error);
      }
    };
    fetchLogos();
  }, []);

  const TYPES_WITH_FORM = new Set([
    'LINK', 'TEXT', 'PRODUCT', 'COLLECTION', 'ADD_TO_CART', 'DISCOUNT', 'CHECKOUT',
    'EMAIL', 'PHONE', 'SMS', 'CAMPAIGN'
  ]);

  const handleSelectType = (value: string) => {
    if (TYPES_WITH_FORM.has(value)) {
      setPendingType(value);
      // init tempData defaults from current qrData to keep continuity
      setTempData({
        url: qrData.url,
        additionalData: { ...qrData.additionalData },
        campaignId: qrData.campaignId,
      });
      setIsTypeModalOpen(true);
    } else {
      setQrData({ ...qrData, type: value });
    }
  };

  const applyTypeForm = () => {
    if (!pendingType) return;
    const next = { ...qrData, type: pendingType } as any;

    switch (pendingType) {
      case 'LINK':
        next.url = tempData.url || '';
        break;
      case 'TEXT':
        next.url = tempData.url || '';
        break;
      case 'PRODUCT':
        next.url = tempData.url || '';
        break;
      case 'COLLECTION':
        next.additionalData = {
          ...qrData.additionalData,
          collectionHandle: tempData.additionalData?.collectionHandle || ''
        };
        break;
      case 'ADD_TO_CART':
        next.additionalData = {
          ...qrData.additionalData,
          productId: tempData.additionalData?.productId || '',
          variantId: tempData.additionalData?.variantId || '',
          quantity: Number(tempData.additionalData?.quantity || 1)
        };
        break;
      case 'CHECKOUT':
        next.additionalData = {
          ...qrData.additionalData,
          checkoutProducts: tempData.additionalData?.checkoutProducts || []
        };
        break;
      case 'DISCOUNT':
        next.additionalData = {
          ...qrData.additionalData,
          discountCode: tempData.additionalData?.discountCode || ''
        };
        break;
      case 'EMAIL':
        next.additionalData = {
          ...qrData.additionalData,
          email: tempData.additionalData?.email || '',
          subject: tempData.additionalData?.subject || '',
          message: tempData.additionalData?.message || ''
        };
        break;
      case 'PHONE':
        next.additionalData = {
          ...qrData.additionalData,
          countryCode: tempData.additionalData?.countryCode || '+33',
          phone: tempData.additionalData?.phone || ''
        };
        break;
      case 'SMS':
        next.additionalData = {
          ...qrData.additionalData,
          countryCode: tempData.additionalData?.countryCode || '+33',
          phone: tempData.additionalData?.phone || '',
          smsMessage: tempData.additionalData?.smsMessage || ''
        };
        break;
      case 'CAMPAIGN':
        next.campaignId = tempData.campaignId || '';
        next.url = tempData.campaignId || '';
        break;
    }

    setQrData(next);
    setIsTypeModalOpen(false);
    setPendingType(null);
  };

  const isLoading = navigation.state === "loading";
  const { success, error: showError } = useToast();
  const { success: notifySuccess, error: notifyError, info: notifyInfo } = useQuickNotifications();
  const { isLoading: isGenerating, withLoading } = useLoading();

  // Update generated URL when type or url changes
  useEffect(() => {
    setGeneratedUrl(generateQRCodeURL());
  }, [qrData.type, qrData.url, loyaltyProgram]);

  // Auto-fill loyalty program ID when LOYALTY type is selected
  useEffect(() => {
    if (qrData.type === 'LOYALTY' && loyaltyProgram) {
      console.log('Setting loyalty program ID:', loyaltyProgram.id);
      setQrData(prev => ({ ...prev, url: loyaltyProgram.id }));
    }
  }, [qrData.type, loyaltyProgram]);

  const qrTypes = [
    // Shopify QR Codes
    { value: 'HOMEPAGE', label: 'Page d\'accueil', icon: Home, category: 'shopify' },
    { value: 'PRODUCT', label: 'Page produit', icon: Package, category: 'shopify' },
    { value: 'COLLECTION', label: 'Collection', icon: Layers, category: 'shopify' },
    { value: 'ADD_TO_CART', label: 'Ajouter au panier', icon: ShoppingCart, category: 'shopify' },
    { value: 'CHECKOUT', label: 'Checkout', icon: CreditCard, category: 'shopify' },
    { value: 'DISCOUNT', label: 'Code promo', icon: Percent, category: 'shopify' },
    
    // Custom QR Codes
    { value: 'LINK', label: 'URL personnalisée', icon: Link, category: 'custom' },
    { value: 'TEXT', label: 'Texte', icon: Type, category: 'custom' },
    { value: 'EMAIL', label: 'Email', icon: Mail, category: 'custom' },
    { value: 'PHONE', label: 'Téléphone', icon: Phone, category: 'custom' },
    { value: 'SMS', label: 'SMS', icon: MessageSquare, category: 'custom' },
    
    // Campaign & Loyalty
    { value: 'CAMPAIGN', label: 'Campagne', icon: Gift, category: 'campaign' },
    { value: 'LOYALTY', label: 'Fidélité', icon: Star, category: 'loyalty' },
  ];

  // Get the original destination URL (what the QR code should redirect to)
  const getOriginalDestination = () => {
    if (!qrData.url && !qrData.additionalData) return '';
    
    // For different types, generate the actual destination URLs
    switch (qrData.type) {
      case 'HOMEPAGE':
        return `https://${shop}`;
      case 'PRODUCT':
        return `https://${shop}/products/${qrData.url}`;
      case 'COLLECTION':
        return `https://${shop}/collections/${qrData.additionalData.collectionHandle}`;
      case 'ADD_TO_CART':
        return `https://${shop}/cart/add?id=${qrData.additionalData.variantId}&quantity=${qrData.additionalData.quantity}`;
      case 'CHECKOUT':
        // Generate checkout URL with selected products
        if (qrData.additionalData?.checkoutProducts && qrData.additionalData.checkoutProducts.length > 0) {
          const productIds = qrData.additionalData.checkoutProducts.map((p: any) => `id=${p.variantId}&quantity=${p.quantity}`).join('&');
          return `https://${shop}/cart/add?${productIds}&return_to=/checkout`;
        }
        return `https://${shop}/checkout`;
      case 'DISCOUNT':
        return `https://${shop}?discount=${qrData.additionalData.discountCode}`;
      case 'TEXT':
        return qrData.url;
      case 'EMAIL':
        const emailParams = new URLSearchParams();
        if (qrData.additionalData.subject) emailParams.set('subject', qrData.additionalData.subject);
        if (qrData.additionalData.message) emailParams.set('body', qrData.additionalData.message);
        return `mailto:${qrData.additionalData.email}${emailParams.toString() ? '?' + emailParams.toString() : ''}`;
      case 'PHONE':
        return `tel:${qrData.additionalData.countryCode}${qrData.additionalData.phone}`;
      case 'SMS':
        const smsParams = new URLSearchParams();
        if (qrData.additionalData.smsMessage) smsParams.set('body', qrData.additionalData.smsMessage);
        return `sms:${qrData.additionalData.countryCode}${qrData.additionalData.phone}${smsParams.toString() ? '?' + smsParams.toString() : ''}`;
      case 'CAMPAIGN':
        // For campaign QR codes, store the campaign ID
        // The scan route will handle the redirection
        return qrData.campaignId;
      case 'LOYALTY':
        // For loyalty QR codes, use the program ID
        // The scan route will handle the redirection
        return loyaltyProgram ? loyaltyProgram.id : '';
      default:
        return qrData.url.startsWith('http') ? qrData.url : `https://${qrData.url}`;
    }
  };

  // Generate QR code URL based on type and destination
  const generateQRCodeURL = () => {
    console.log('Generating QR URL for type:', qrData.type, 'url:', qrData.url, 'loyaltyProgram:', loyaltyProgram?.id);
    
    if (qrData.type === 'LOYALTY') {
      if (!loyaltyProgram) return '';
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${baseUrl}/api/scan/loyalty-${loyaltyProgram.id}`;
      console.log('Generated LOYALTY URL:', url);
      return url;
    }
    
    // For types that don't need scan URLs, return the direct destination
    if (['TEXT', 'EMAIL', 'PHONE', 'SMS'].includes(qrData.type)) {
      return getOriginalDestination();
    }
    
    if (!qrData.url && !qrData.additionalData) return '';
    
    // IMPORTANT: All QR codes should go through our scan routes to check active status
    // This ensures inactive QR codes don't work
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    
    // For different types, we might want to generate different URLs
    switch (qrData.type) {
      case 'HOMEPAGE':
        return `${baseUrl}/api/scan/homepage-${shop}`;
      case 'PRODUCT':
        return `${baseUrl}/api/scan/product-${qrData.url}`;
      case 'COLLECTION':
        return `${baseUrl}/api/scan/collection-${qrData.additionalData.collectionHandle}`;
      case 'ADD_TO_CART':
        return `${baseUrl}/api/scan/addtocart-${qrData.additionalData.variantId}`;
      case 'CHECKOUT':
        // Generate checkout scan URL with products
        if (qrData.additionalData?.checkoutProducts && qrData.additionalData.checkoutProducts.length > 0) {
          const productIds = qrData.additionalData.checkoutProducts.map((p: any) => p.variantId).join('-');
          return `${baseUrl}/api/scan/checkout-${productIds}`;
        }
        return `${baseUrl}/api/scan/checkout-${shop}`;
      case 'DISCOUNT':
        return `${baseUrl}/api/scan/discount-${qrData.additionalData.discountCode}`;
      case 'CAMPAIGN':
        return `${baseUrl}/api/scan/campaign-${qrData.campaignId}`;
      default:
        return `${baseUrl}/api/scan/link-${qrData.url}`;
    }
  };

  // Validate URL
  const isValidURL = (url: string) => {
    if (!url) return false;
    try {
      // For validation, we need to check if the original URL is valid
      // not the generated scan URL
      if (url.startsWith('http')) {
        new URL(url);
        return true;
      }
      // For non-http URLs, check if they're valid identifiers
      return url.length > 0;
    } catch {
      return false;
    }
  };

  // Validate QR data based on type
  const validateQRData = () => {
    if (!qrData.name.trim()) {
      return { valid: false, error: 'Le nom du QR code est requis.' };
    }

    switch (qrData.type) {
      case 'HOMEPAGE':
        return { valid: true };
      case 'PRODUCT':
        if (!qrData.url.trim()) {
          return { valid: false, error: 'Veuillez sélectionner un produit.' };
        }
        return { valid: true };
      case 'COLLECTION':
        if (!qrData.additionalData.collectionHandle.trim()) {
          return { valid: false, error: 'Veuillez sélectionner une collection.' };
        }
        return { valid: true };
      case 'ADD_TO_CART':
        if (!qrData.additionalData.productId.trim()) {
          return { valid: false, error: 'Veuillez sélectionner un produit.' };
        }
        return { valid: true };
      case 'CHECKOUT':
        if (!qrData.additionalData?.checkoutProducts || qrData.additionalData.checkoutProducts.length === 0) {
          return { valid: false, error: 'Veuillez sélectionner au moins un produit pour le checkout.' };
        }
        return { valid: true };
      case 'DISCOUNT':
        if (!qrData.additionalData.discountCode.trim()) {
          return { valid: false, error: 'Veuillez sélectionner un code de réduction.' };
        }
        return { valid: true };
      case 'TEXT':
        if (!qrData.url.trim()) {
          return { valid: false, error: 'Le texte est requis.' };
        }
        return { valid: true };
      case 'EMAIL':
        if (!qrData.additionalData.email.trim()) {
          return { valid: false, error: 'L\'adresse email est requise.' };
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(qrData.additionalData.email)) {
          return { valid: false, error: 'L\'adresse email n\'est pas valide.' };
        }
        return { valid: true };
      case 'PHONE':
        if (!qrData.additionalData.phone.trim()) {
          return { valid: false, error: 'Le numéro de téléphone est requis.' };
        }
        return { valid: true };
      case 'SMS':
        if (!qrData.additionalData.phone.trim()) {
          return { valid: false, error: 'Le numéro de téléphone est requis.' };
        }
        return { valid: true };
      case 'CAMPAIGN':
        if (!qrData.campaignId.trim()) {
          return { valid: false, error: 'Veuillez sélectionner une campagne.' };
        }
        return { valid: true };
      case 'LOYALTY':
        if (!loyaltyProgram) {
          return { valid: false, error: 'Vous devez d\'abord créer un programme de fidélité.' };
        }
        return { valid: true };
      default:
        if (!qrData.url.trim()) {
          return { valid: false, error: 'L\'URL de destination est requise.' };
        }
        if (!isValidURL(qrData.url)) {
          return { valid: false, error: 'L\'URL saisie n\'est pas valide.' };
        }
        return { valid: true };
    }
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Handle action results
  useEffect(() => {
    if (actionData && 'success' in actionData && actionData.success) {
      success('QR Code créé avec succès!', 'Votre QR code a été généré et sauvegardé.');
    } else if (actionData && 'error' in actionData && actionData.error) {
      showError('Erreur lors de la création', actionData.error);
    }
  }, [actionData, success, showError]);

  const handleCopy = async () => {
    try {
      const urlToCopy = generatedUrl;
      if (!urlToCopy) {
        showError('Erreur de copie', 'Aucune URL valide à copier.');
        return;
      }
      
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      success('Copié!', 'L\'URL du QR code a été copiée dans le presse-papiers.');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showError('Erreur de copie', 'Impossible de copier le lien.');
    }
  };

  const previewContainerRef = React.useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    try {
      await withLoading('download', async () => {
        // Capture the complete preview container with all customizations
        const previewContainer = previewContainerRef.current;
        if (!previewContainer) {
          showError('Erreur de téléchargement', 'Impossible de trouver l\'aperçu du QR code.');
          return;
        }

        // Use html2canvas to capture the entire preview container
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(previewContainer, {
          backgroundColor: qrData.backgroundColor || '#ffffff',
          scale: 4, // Very high quality for perfect resolution
          logging: false,
          useCORS: true,
          allowTaint: true,
          windowWidth: previewContainer.scrollWidth,
          windowHeight: previewContainer.scrollHeight,
        });

        // Create download link with maximum quality
        const link = document.createElement('a');
        link.download = `qr-code-${qrData.name || 'generated'}.png`;
        link.href = canvas.toDataURL('image/png', 1.0); // Maximum quality
        link.click();
        
        success('Téléchargement réussi!', 'Le QR code a été téléchargé avec toutes les personnalisations.');
      });
    } catch (err) {
      console.error('Download error:', err);
      showError('Erreur de téléchargement', 'Impossible de télécharger le QR code.');
    }
  };

  const generateQRCode = async () => {
    // Validation
    const validation = validateQRData();
    if (!validation.valid) {
      notifyError('Erreur de validation', validation.error);
      return;
    }

    try {
      notifyInfo('Génération en cours...', 'Création de votre QR code, veuillez patienter.');
      
      await withLoading('generate', async () => {
        const formData = new FormData();
        formData.append("action", "create_qr_code");
        formData.append("title", qrData.name);
        formData.append("description", qrData.description);
        formData.append("type", qrData.type);
        // Store the original destination, not the scan URL
        const originalDestination = getOriginalDestination();
        formData.append("destination", originalDestination);
        
        // Also store the scan URL for the QR code itself
        const scanUrl = generateQRCodeURL();
        formData.append("scanUrl", scanUrl);
        formData.append("color", qrData.foregroundColor);
        formData.append("backgroundColor", qrData.backgroundColor);
        formData.append("size", qrData.size.toString());
        
        // Add new customization fields
        formData.append("backgroundImage", qrData.backgroundImage);
        formData.append("frameStyle", JSON.stringify(qrData.frameStyle));
        formData.append("logoStyle", JSON.stringify(qrData.logoStyle));
        formData.append("logoBackground", JSON.stringify(qrData.logoBackground));
        formData.append("designOptions", JSON.stringify(qrData.designOptions));
        formData.append("additionalData", JSON.stringify(qrData.additionalData));
        // Save logo URL if logo is provided
        if (qrData.logo) {
          formData.append("logoUrl", qrData.logo);
        }

        const response = await fetch("/app/create", {
          method: "POST",
          body: formData,
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
          // Check if response is JSON
          const contentType = response.headers.get('content-type');
          console.log('Content-Type:', contentType);
          
          if (contentType && contentType.includes('application/json')) {
            try {
              const result = await response.json();
              console.log('QR code created:', result.qrCode);
              notifySuccess('QR Code généré avec succès !', 'Votre QR code a été créé et sauvegardé. Redirection vers le gestionnaire...');
              
              // Optionally redirect to QR manager or reset form
              setTimeout(() => {
                navigate('/app/qr-manager');
              }, 2000);
            } catch (jsonError) {
              console.error('Failed to parse JSON response:', jsonError);
              // Even if JSON parsing fails, the QR code might have been created
              notifySuccess('QR Code généré avec succès !', 'Votre QR code a été créé. Redirection vers le gestionnaire...');
              setTimeout(() => {
                navigate('/app/qr-manager');
              }, 2000);
            }
          } else {
            // Response is not JSON, but might be successful
            console.log('Non-JSON response received, assuming success');
            notifySuccess('QR Code généré avec succès !', 'Votre QR code a été créé. Redirection vers le gestionnaire...');
            setTimeout(() => {
              navigate('/app/qr-manager');
            }, 2000);
          }
        } else {
          let errorMessage = 'Erreur lors de la génération';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.details || errorMessage;
            console.error('Server error details:', errorData);
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError);
            errorMessage = `Erreur serveur (${response.status}): ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }
      });
    } catch (error) {
      console.error("Error creating QR code:", error);
      notifyError('Erreur de génération', error instanceof Error ? error.message : 'Une erreur est survenue lors de la création du QR code.');
    }
  };

  return (
    <Page>
      <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center space-x-4 mb-6">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/app')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Créer un QR Code
                </h1>
                <p className={`mt-2 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Personnalisez votre QR code et générez-le en temps réel
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Form Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
                <CardHeader>
                  <CardTitle className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Configuration du QR Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Nom du QR Code
                      </label>
                      <Input
                        value={qrData.name}
                        onChange={(e) => setQrData({ ...qrData, name: e.target.value })}
                        placeholder="Mon QR Code"
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Description (optionnelle)
                      </label>
                      <Input
                        value={qrData.description}
                        onChange={(e) => setQrData({ ...qrData, description: e.target.value })}
                        placeholder="Description du QR code"
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* QR Type */}
                  <div>
                    <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Type de contenu
                    </label>
                    
                    {/* Shopify QR Codes */}
                    <div className="mb-4">
                      <h4 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        🛍️ Shopify QR Codes
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {qrTypes.filter(type => type.category === 'shopify').map((type) => (
                          <motion.div
                            key={type.value}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <button
                              onClick={() => handleSelectType(type.value)}
                              className={`w-full p-3 rounded-lg border-2 transition-all duration-200 ${
                                qrData.type === type.value
                                  ? 'border-blue-500 bg-blue-50'
                                  : isDarkMode
                                  ? 'border-gray-600 bg-gray-700 hover:border-gray-500'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <type.icon className={`h-4 w-4 ${
                                  qrData.type === type.value ? 'text-blue-600' : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`} />
                                <span className={`text-sm font-medium ${
                                  qrData.type === type.value ? 'text-blue-900' : isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {type.label}
                                </span>
                              </div>
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Custom QR Codes */}
                    <div className="mb-4">
                      <h4 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        🎨 Custom QR Codes
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {qrTypes.filter(type => type.category === 'custom').map((type) => (
                          <motion.div
                            key={type.value}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <button
                              onClick={() => handleSelectType(type.value)}
                              className={`w-full p-3 rounded-lg border-2 transition-all duration-200 ${
                                qrData.type === type.value
                                  ? 'border-blue-500 bg-blue-50'
                                  : isDarkMode
                                  ? 'border-gray-600 bg-gray-700 hover:border-gray-500'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <type.icon className={`h-4 w-4 ${
                                  qrData.type === type.value ? 'text-blue-600' : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`} />
                                <span className={`text-sm font-medium ${
                                  qrData.type === type.value ? 'text-blue-900' : isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {type.label}
                                </span>
                              </div>
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Campaign & Loyalty */}
                    <div>
                      <h4 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        🎯 Campagnes & Fidélité
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {qrTypes.filter(type => type.category === 'campaign' || type.category === 'loyalty').map((type) => {
                        const isFidelityType = type.value === 'LOYALTY';
                        const isFidelityDisabled = isFidelityType && !FEATURES.FIDELITY_ENABLED;
                        
                        const typeButton = (
                          <motion.div
                            key={type.value}
                            whileHover={isFidelityDisabled ? {} : { scale: 1.02 }}
                            whileTap={isFidelityDisabled ? {} : { scale: 0.98 }}
                          >
                            <button
                              onClick={isFidelityDisabled ? undefined : () => handleSelectType(type.value)}
                              disabled={isFidelityDisabled}
                                className={`w-full p-3 rounded-lg border-2 transition-all duration-200 ${
                                isFidelityDisabled
                                  ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60'
                                  : qrData.type === type.value
                                  ? 'border-blue-500 bg-blue-50'
                                  : isDarkMode
                                  ? 'border-gray-600 bg-gray-700 hover:border-gray-500'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                              }`}
                            >
                                <div className="flex items-center space-x-2">
                                  <type.icon className={`h-4 w-4 ${
                                  isFidelityDisabled
                                    ? 'text-gray-400'
                                    : qrData.type === type.value ? 'text-blue-600' : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`} />
                                  <span className={`text-sm font-medium ${
                                  isFidelityDisabled
                                    ? 'text-gray-400'
                                    : qrData.type === type.value ? 'text-blue-900' : isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {type.label}
                                </span>
                              </div>
                            </button>
                          </motion.div>
                        );

                        if (isFidelityDisabled) {
                          return (
                            <Tooltip
                              key={type.value}
                              content="Fonctionnalité en cours de développement - Le module de fidélité sera bientôt disponible pour créer des récompenses et points clients. 🧠"
                            >
                              {typeButton}
                            </Tooltip>
                          );
                        }

                        return typeButton;
                      })}
                      </div>
                    </div>
                  </div>

                  {/* Content Configuration */}
                  <AnimatePresence mode="wait">
                    {/* Shopify QR Codes */}
                    {qrData.type === 'HOMEPAGE' && (
                    <motion.div
                        key="homepage"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Home className="h-5 w-5 text-blue-600" />
                            <span className="font-medium text-blue-800">Page d'accueil Shopify</span>
                          </div>
                          <p className="text-sm text-blue-700">
                            Le QR code redirigera vers la page d'accueil de votre boutique : <strong>{shop}</strong>
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {qrData.type === 'PRODUCT' && (
                      <motion.div
                        key="product"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Sélectionner un produit
                        </label>
                          <Select
                          value={qrData.url}
                          onChange={(e) => setQrData({ ...qrData, url: e.target.value })}
                            className="w-full"
                          >
                            <option value="">Choisir un produit</option>
                            {products.map((product: any) => (
                              <option key={product.id} value={product.handle}>
                                {product.title} - {product.variants?.[0]?.price || 'N/A'}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </motion.div>
                    )}

                    {qrData.type === 'COLLECTION' && (
                      <motion.div
                        key="collection"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Sélectionner une collection
                          </label>
                          <Select
                            value={qrData.additionalData.collectionHandle}
                            onChange={(e) => setQrData({ 
                              ...qrData, 
                              additionalData: { 
                                ...qrData.additionalData, 
                                collectionHandle: e.target.value 
                              } 
                            })}
                            className="w-full"
                          >
                            <option value="">Choisir une collection</option>
                            {collections.map((collection: any) => (
                              <option key={collection.id} value={collection.handle}>
                                {collection.title}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </motion.div>
                    )}

                    {qrData.type === 'ADD_TO_CART' && (
                      <motion.div
                        key="addtocart"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="space-y-3">
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Sélectionner un produit
                            </label>
                            <Select
                              value={qrData.additionalData.productId}
                              onChange={(e) => {
                                const product = products.find((p: any) => p.id === e.target.value);
                                setQrData({ 
                                  ...qrData, 
                                  additionalData: { 
                                    ...qrData.additionalData, 
                                    productId: e.target.value,
                                    variantId: product?.variants?.[0]?.id || ''
                                  } 
                                });
                              }}
                              className="w-full"
                            >
                              <option value="">Choisir un produit</option>
                              {products.map((product: any) => (
                                <option key={product.id} value={product.id}>
                                  {product.title} - {product.variants?.[0]?.price || 'N/A'}
                                </option>
                              ))}
                            </Select>
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Quantité
                            </label>
                            <Input
                              type="number"
                              min="1"
                              value={qrData.additionalData.quantity}
                              onChange={(e) => setQrData({ 
                                ...qrData, 
                                additionalData: { 
                                  ...qrData.additionalData, 
                                  quantity: parseInt(e.target.value) || 1 
                                } 
                              })}
                          className="w-full"
                        />
                          </div>
                      </div>
                    </motion.div>
                  )}

                    {qrData.type === 'CHECKOUT' && (
                    <motion.div
                        key="checkout"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <CreditCard className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-green-800">Checkout Shopify</span>
                          </div>
                          <p className="text-sm text-green-700">
                            Le QR code redirigera directement vers le checkout de votre boutique.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {qrData.type === 'DISCOUNT' && (
                      <motion.div
                        key="discount"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Sélectionner un code de réduction
                        </label>
                          {discountCodes.length > 0 ? (
                        <Select
                              value={qrData.additionalData.discountCode}
                              onChange={(e) => setQrData({ 
                                ...qrData, 
                                additionalData: { 
                                  ...qrData.additionalData, 
                                  discountCode: e.target.value 
                                } 
                              })}
                          className="w-full"
                        >
                              <option value="">Choisir un code de réduction</option>
                              {discountCodes.map((discount: any) => (
                                <option key={discount.id} value={discount.code}>
                                  {discount.title} - {discount.code}
                            </option>
                          ))}
                        </Select>
                          ) : (
                            <div className="space-y-2">
                              <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-yellow-900/20 border-yellow-600/30' : 'bg-yellow-50 border-yellow-200'}`}>
                                <p className={`text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                                  ⚠️ Les codes de réduction Shopify ne sont pas disponibles. 
                                  <br />
                                  <span className="text-xs">
                                    L'application n'a pas les permissions nécessaires pour accéder aux codes de réduction.
                                  </span>
                                </p>
                              </div>
                              <div>
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Saisir manuellement un code de réduction
                                </label>
                                <Input
                                  value={qrData.additionalData.discountCode}
                                  onChange={(e) => setQrData({ 
                                    ...qrData, 
                                    additionalData: { 
                                      ...qrData.additionalData, 
                                      discountCode: e.target.value 
                                    } 
                                  })}
                                  placeholder="Ex: SUMMER20, WELCOME10..."
                                  className="w-full"
                                />
                              </div>
                            </div>
                          )}
                      </div>
                    </motion.div>
                  )}

                    {/* Custom QR Codes */}
                    {qrData.type === 'LINK' && (
                      <motion.div
                        key="link"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Link className="h-5 w-5 text-blue-600" />
                            <span className="font-medium text-blue-800">URL personnalisée</span>
                          </div>
                          <p className="text-sm text-blue-700">
                            Le QR code redirigera vers l'URL que vous avez configurée dans la modal.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {qrData.type === 'TEXT' && (
                      <motion.div
                        key="text"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Type className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-green-800">Texte</span>
                          </div>
                          <p className="text-sm text-green-700">
                            Le QR code contiendra le texte que vous avez configuré dans la modal.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {qrData.type === 'EMAIL' && (
                      <motion.div
                        key="email"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="space-y-3">
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Adresse email
                            </label>
                            <Input
                              type="email"
                              value={qrData.additionalData.email}
                              onChange={(e) => setQrData({ 
                                ...qrData, 
                                additionalData: { 
                                  ...qrData.additionalData, 
                                  email: e.target.value 
                                } 
                              })}
                              placeholder="contact@example.com"
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Sujet (optionnel)
                            </label>
                            <Input
                              value={qrData.additionalData.subject}
                              onChange={(e) => setQrData({ 
                                ...qrData, 
                                additionalData: { 
                                  ...qrData.additionalData, 
                                  subject: e.target.value 
                                } 
                              })}
                              placeholder="Sujet de l'email"
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Message (optionnel)
                            </label>
                            <textarea
                              value={qrData.additionalData.message}
                              onChange={(e) => setQrData({ 
                                ...qrData, 
                                additionalData: { 
                                  ...qrData.additionalData, 
                                  message: e.target.value 
                                } 
                              })}
                              placeholder="Message pré-rempli"
                              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                              rows={3}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {qrData.type === 'PHONE' && (
                      <motion.div
                        key="phone"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="space-y-3">
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Indicatif pays
                            </label>
                            <Select
                              value={qrData.additionalData.countryCode}
                              onChange={(e) => setQrData({ 
                                ...qrData, 
                                additionalData: { 
                                  ...qrData.additionalData, 
                                  countryCode: e.target.value 
                                } 
                              })}
                              className="w-full"
                            >
                              <option value="+33">🇫🇷 +33 (France)</option>
                              <option value="+1">🇺🇸 +1 (États-Unis)</option>
                              <option value="+44">🇬🇧 +44 (Royaume-Uni)</option>
                              <option value="+49">🇩🇪 +49 (Allemagne)</option>
                              <option value="+39">🇮🇹 +39 (Italie)</option>
                              <option value="+34">🇪🇸 +34 (Espagne)</option>
                              <option value="+32">🇧🇪 +32 (Belgique)</option>
                              <option value="+41">🇨🇭 +41 (Suisse)</option>
                            </Select>
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Numéro de téléphone
                            </label>
                            <Input
                              value={qrData.additionalData.phone}
                              onChange={(e) => setQrData({ 
                                ...qrData, 
                                additionalData: { 
                                  ...qrData.additionalData, 
                                  phone: e.target.value 
                                } 
                              })}
                              placeholder="0123456789"
                              className="w-full"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {qrData.type === 'SMS' && (
                      <motion.div
                        key="sms"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="space-y-3">
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Indicatif pays
                            </label>
                            <Select
                              value={qrData.additionalData.countryCode}
                              onChange={(e) => setQrData({ 
                                ...qrData, 
                                additionalData: { 
                                  ...qrData.additionalData, 
                                  countryCode: e.target.value 
                                } 
                              })}
                              className="w-full"
                            >
                              <option value="+33">🇫🇷 +33 (France)</option>
                              <option value="+1">🇺🇸 +1 (États-Unis)</option>
                              <option value="+44">🇬🇧 +44 (Royaume-Uni)</option>
                              <option value="+49">🇩🇪 +49 (Allemagne)</option>
                              <option value="+39">🇮🇹 +39 (Italie)</option>
                              <option value="+34">🇪🇸 +34 (Espagne)</option>
                              <option value="+32">🇧🇪 +32 (Belgique)</option>
                              <option value="+41">🇨🇭 +41 (Suisse)</option>
                            </Select>
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Numéro de téléphone
                            </label>
                            <Input
                              value={qrData.additionalData.phone}
                              onChange={(e) => setQrData({ 
                                ...qrData, 
                                additionalData: { 
                                  ...qrData.additionalData, 
                                  phone: e.target.value 
                                } 
                              })}
                              placeholder="0123456789"
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Message (optionnel)
                            </label>
                            <textarea
                              value={qrData.additionalData.smsMessage}
                              onChange={(e) => setQrData({ 
                                ...qrData, 
                                additionalData: { 
                                  ...qrData.additionalData, 
                                  smsMessage: e.target.value 
                                } 
                              })}
                              placeholder="Message pré-rempli"
                              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                              rows={3}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Campaign & Loyalty */}
                    {qrData.type === 'CAMPAIGN' && (
                      <motion.div
                        key="campaign"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Sélectionner une campagne
                          </label>
                          <Select
                            value={qrData.campaignId || ''}
                            onChange={(e) => setQrData({ ...qrData, campaignId: e.target.value, url: e.target.value })}
                            className="w-full"
                          >
                            <option value="">Choisir une campagne</option>
                            {campaigns.map((campaign: any) => (
                              <option key={campaign.id} value={campaign.id}>
                                {campaign.name} - {campaign.status === 'active' ? '🟢' : campaign.status === 'paused' ? '🟡' : '🔴'} {campaign.status}
                              </option>
                            ))}
                          </Select>
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Sélectionnez une campagne existante pour créer son QR code
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {qrData.type === 'LOYALTY' && (
                    <motion.div
                        key="loyalty"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      {loyaltyProgram ? (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Star className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-green-800">Programme de fidélité trouvé</span>
                          </div>
                          <p className="text-sm text-green-700 mb-2">
                            <strong>Nom :</strong> {loyaltyProgram.name}
                          </p>
                          <p className="text-sm text-green-700 mb-2">
                            <strong>Points par scan :</strong> {loyaltyProgram.pointsPerScan}
                          </p>
                          <p className="text-xs text-green-600 mb-2">
                            Le QR code utilisera automatiquement ce programme de fidélité.
                          </p>
                          <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded">
                            <strong>URL générée :</strong> {generatedUrl || 'Génération en cours...'}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Star className="h-5 w-5 text-red-600" />
                            <span className="font-medium text-red-800">Aucun programme de fidélité</span>
                          </div>
                          <p className="text-sm text-red-700 mb-3">
                            Vous devez d'abord créer un programme de fidélité avant de pouvoir générer un QR code.
                          </p>
                          <Button
                            onClick={() => navigate('/app/loyalty')}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Créer un programme de fidélité
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  )}
                  </AnimatePresence>

                  {/* Customization */}
                  <div className="space-y-6">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Personnalisation
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Couleur principale
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={qrData.foregroundColor}
                            onChange={(e) => setQrData({ ...qrData, foregroundColor: e.target.value })}
                            className="w-12 h-10 rounded-lg border border-gray-300"
                          />
                          <Input
                            value={qrData.foregroundColor}
                            onChange={(e) => setQrData({ ...qrData, foregroundColor: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Couleur de fond
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={qrData.backgroundColor}
                            onChange={(e) => setQrData({ ...qrData, backgroundColor: e.target.value })}
                            className="w-12 h-10 rounded-lg border border-gray-300"
                          />
                          <Input
                            value={qrData.backgroundColor}
                            onChange={(e) => setQrData({ ...qrData, backgroundColor: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Taille (px)
                      </label>
                      <Input
                        type="number"
                        value={qrData.size}
                        onChange={(e) => setQrData({ ...qrData, size: parseInt(e.target.value) })}
                        min="100"
                        max="1000"
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Background image feature removed */}

                  {/* Background gallery permanently removed */}

                  {/* Type configuration modal */}
                  <Modal isOpen={isTypeModalOpen} onClose={() => setIsTypeModalOpen(false)} title="Configurer le type">
                    {pendingType === 'LINK' && (
                      <div className="space-y-3">
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>URL de destination</label>
                        <Input
                          value={tempData.url || ''}
                          onChange={(e) => setTempData((p: any) => ({ ...p, url: e.target.value }))}
                          placeholder="https://example.com"
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsTypeModalOpen(false)}>Annuler</Button>
                          <Button onClick={applyTypeForm}>Enregistrer</Button>
                        </div>
                      </div>
                    )}

                    {pendingType === 'TEXT' && (
                      <div className="space-y-3">
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Texte à encoder</label>
                        <textarea
                          value={tempData.url || ''}
                          onChange={(e) => setTempData((p: any) => ({ ...p, url: e.target.value }))}
                          placeholder="Entrez le texte à encoder dans le QR code..."
                          className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                          rows={3}
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsTypeModalOpen(false)}>Annuler</Button>
                          <Button onClick={applyTypeForm}>Enregistrer</Button>
                        </div>
                      </div>
                    )}

                    {pendingType === 'PRODUCT' && (
                      <div className="space-y-3">
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sélectionner un produit</label>
                        <Select
                          value={tempData.url || ''}
                          onChange={(e) => setTempData((p: any) => ({ ...p, url: e.target.value }))}
                        >
                          <option value="">Choisir un produit</option>
                          {products.map((product: any) => (
                            <option key={product.id} value={product.handle}>{product.title}</option>
                          ))}
                        </Select>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsTypeModalOpen(false)}>Annuler</Button>
                          <Button onClick={applyTypeForm}>Enregistrer</Button>
                        </div>
                      </div>
                    )}

                    {pendingType === 'COLLECTION' && (
                      <div className="space-y-3">
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sélectionner une collection</label>
                        <Select
                          value={tempData.additionalData?.collectionHandle || ''}
                          onChange={(e) => setTempData((p: any) => ({ ...p, additionalData: { ...(p.additionalData||{}), collectionHandle: e.target.value } }))}
                        >
                          <option value="">Choisir une collection</option>
                          {collections.map((c: any) => (
                            <option key={c.id} value={c.handle}>{c.title}</option>
                          ))}
                        </Select>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsTypeModalOpen(false)}>Annuler</Button>
                          <Button onClick={applyTypeForm}>Enregistrer</Button>
                        </div>
                      </div>
                    )}

                    {pendingType === 'ADD_TO_CART' && (
                      <div className="space-y-3">
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Produit</label>
                        <Select
                          value={tempData.additionalData?.productId || ''}
                          onChange={(e) => {
                            const prod = products.find((p: any) => p.id === e.target.value);
                            setTempData((p: any) => ({ ...p, additionalData: { ...(p.additionalData||{}), productId: e.target.value, variantId: prod?.variants?.[0]?.id || '' } }));
                          }}
                        >
                          <option value="">Choisir un produit</option>
                          {products.map((product: any) => (
                            <option key={product.id} value={product.id}>{product.title}</option>
                          ))}
                        </Select>
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Quantité</label>
                        <Input
                          type="number"
                          value={tempData.additionalData?.quantity || 1}
                          onChange={(e) => setTempData((p: any) => ({ ...p, additionalData: { ...(p.additionalData||{}), quantity: Number(e.target.value) } }))}
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsTypeModalOpen(false)}>Annuler</Button>
                          <Button onClick={applyTypeForm}>Enregistrer</Button>
                        </div>
                      </div>
                    )}

                    {pendingType === 'DISCOUNT' && (
                      <div className="space-y-3">
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Code de réduction</label>
                        <Select
                          value={tempData.additionalData?.discountCode || ''}
                          onChange={(e) => setTempData((p: any) => ({ ...p, additionalData: { ...(p.additionalData||{}), discountCode: e.target.value } }))}
                        >
                          <option value="">Choisir un code</option>
                          {discountCodes.map((d: any) => (
                            <option key={d.id} value={d.code}>{d.title} - {d.code}</option>
                          ))}
                        </Select>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsTypeModalOpen(false)}>Annuler</Button>
                          <Button onClick={applyTypeForm}>Enregistrer</Button>
                        </div>
                      </div>
                    )}

                    {pendingType === 'EMAIL' && (
                      <div className="space-y-3">
                        <Input placeholder="Email" value={tempData.additionalData?.email||''} onChange={(e)=>setTempData((p:any)=>({...p, additionalData:{...(p.additionalData||{}), email:e.target.value}}))} />
                        <Input placeholder="Sujet (optionnel)" value={tempData.additionalData?.subject||''} onChange={(e)=>setTempData((p:any)=>({...p, additionalData:{...(p.additionalData||{}), subject:e.target.value}}))} />
                        <Input placeholder="Message (optionnel)" value={tempData.additionalData?.message||''} onChange={(e)=>setTempData((p:any)=>({...p, additionalData:{...(p.additionalData||{}), message:e.target.value}}))} />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsTypeModalOpen(false)}>Annuler</Button>
                          <Button onClick={applyTypeForm}>Enregistrer</Button>
                        </div>
                      </div>
                    )}

                    {pendingType === 'PHONE' && (
                      <div className="space-y-3">
                        <Input placeholder="Indicatif (ex: +33)" value={tempData.additionalData?.countryCode||'+33'} onChange={(e)=>setTempData((p:any)=>({...p, additionalData:{...(p.additionalData||{}), countryCode:e.target.value}}))} />
                        <Input placeholder="Numéro" value={tempData.additionalData?.phone||''} onChange={(e)=>setTempData((p:any)=>({...p, additionalData:{...(p.additionalData||{}), phone:e.target.value}}))} />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsTypeModalOpen(false)}>Annuler</Button>
                          <Button onClick={applyTypeForm}>Enregistrer</Button>
                        </div>
                      </div>
                    )}

                    {pendingType === 'SMS' && (
                      <div className="space-y-3">
                        <Input placeholder="Indicatif (ex: +33)" value={tempData.additionalData?.countryCode||'+33'} onChange={(e)=>setTempData((p:any)=>({...p, additionalData:{...(p.additionalData||{}), countryCode:e.target.value}}))} />
                        <Input placeholder="Numéro" value={tempData.additionalData?.phone||''} onChange={(e)=>setTempData((p:any)=>({...p, additionalData:{...(p.additionalData||{}), phone:e.target.value}}))} />
                        <Input placeholder="Message (optionnel)" value={tempData.additionalData?.smsMessage||''} onChange={(e)=>setTempData((p:any)=>({...p, additionalData:{...(p.additionalData||{}), smsMessage:e.target.value}}))} />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsTypeModalOpen(false)}>Annuler</Button>
                          <Button onClick={applyTypeForm}>Enregistrer</Button>
                        </div>
                      </div>
                    )}

                    {pendingType === 'CHECKOUT' && (
                      <div className="space-y-3">
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sélectionner les produits pour le checkout</label>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {products.map((product: any) => (
                            <div key={product.id} className="flex items-center space-x-3 p-2 border rounded-lg">
                              <input
                                type="checkbox"
                                id={`checkout-${product.id}`}
                                checked={tempData.additionalData?.checkoutProducts?.some((p: any) => p.productId === product.id) || false}
                                onChange={(e) => {
                                  const currentProducts = tempData.additionalData?.checkoutProducts || [];
                                  if (e.target.checked) {
                                    const newProduct = {
                                      productId: product.id,
                                      variantId: product.variants?.[0]?.id || '',
                                      title: product.title,
                                      quantity: 1
                                    };
                                    setTempData((p: any) => ({
                                      ...p,
                                      additionalData: {
                                        ...(p.additionalData || {}),
                                        checkoutProducts: [...currentProducts, newProduct]
                                      }
                                    }));
                                  } else {
                                    setTempData((p: any) => ({
                                      ...p,
                                      additionalData: {
                                        ...(p.additionalData || {}),
                                        checkoutProducts: currentProducts.filter((p: any) => p.productId !== product.id)
                                      }
                                    }));
                                  }
                                }}
                                className="rounded"
                              />
                              <label htmlFor={`checkout-${product.id}`} className="flex-1 cursor-pointer">
                                <div className="font-medium">{product.title}</div>
                                <div className="text-sm text-gray-500">{product.variants?.[0]?.price || 'N/A'}</div>
                              </label>
                              {tempData.additionalData?.checkoutProducts?.some((p: any) => p.productId === product.id) && (
                                <div className="flex items-center space-x-2">
                                  <label className="text-sm">Qté:</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={tempData.additionalData.checkoutProducts.find((p: any) => p.productId === product.id)?.quantity || 1}
                                    onChange={(e) => {
                                      const currentProducts = tempData.additionalData?.checkoutProducts || [];
                                      setTempData((p: any) => ({
                                        ...p,
                                        additionalData: {
                                          ...(p.additionalData || {}),
                                          checkoutProducts: currentProducts.map((prod: any) =>
                                            prod.productId === product.id
                                              ? { ...prod, quantity: Number(e.target.value) || 1 }
                                              : prod
                                          )
                                        }
                                      }));
                                    }}
                                    className="w-16 px-2 py-1 border rounded text-sm"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {tempData.additionalData?.checkoutProducts?.length > 0 && (
                          <div className="text-sm text-green-600">
                            {tempData.additionalData.checkoutProducts.length} produit(s) sélectionné(s)
                          </div>
                        )}
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsTypeModalOpen(false)}>Annuler</Button>
                          <Button onClick={applyTypeForm}>Enregistrer</Button>
                        </div>
                      </div>
                    )}

                    {pendingType === 'CAMPAIGN' && (
                      <div className="space-y-3">
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sélectionner une campagne</label>
                        <Select
                          value={tempData.campaignId || ''}
                          onChange={(e) => setTempData((p:any)=>({ ...p, campaignId: e.target.value }))}
                        >
                          <option value="">Choisir une campagne</option>
                          {campaigns.map((c:any)=>(
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </Select>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsTypeModalOpen(false)}>Annuler</Button>
                          <Button onClick={applyTypeForm}>Enregistrer</Button>
                        </div>
                      </div>
                    )}
                  </Modal>
                  {/* Design */}
                  <div className="space-y-6">
                    <div>
                      <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        🎨 Design
                      </h3>
                      <div className={`mt-2 p-3 rounded-lg ${isDarkMode ? 'bg-green-900/20 border-green-600/30' : 'bg-green-50 border-green-200'} border`}>
                        <p className={`text-sm ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                          ✅ <strong>Design appliqué :</strong> Toutes les options de design (Pattern, Marker, Center dot, couleurs personnalisées) sont maintenant visibles dans l'aperçu en temps réel !
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Pattern */}
                      <DesignOption
                        label="Pattern"
                        value={qrData.designOptions.pattern}
                        onChange={useCallback((value: string) => setQrData(prev => ({ 
                          ...prev, 
                          designOptions: { 
                            ...prev.designOptions, 
                            pattern: value 
                          } 
                        })), [])}
                        isDarkMode={isDarkMode}
                        options={[
                          {
                            value: "default",
                            label: "Default",
                            icon: <Square className="w-4 h-4" />,
                            description: "Motif carré classique"
                          },
                          {
                            value: "square",
                            label: "Square",
                            icon: <Square className="w-4 h-4" />,
                            description: "Motif carré net"
                          },
                          {
                            value: "rounded",
                            label: "Rounded",
                            icon: <Circle className="w-4 h-4" />,
                            description: "Motif avec coins arrondis"
                          },
                          {
                            value: "extra-rounded",
                            label: "Extra Rounded",
                            icon: <Circle className="w-4 h-4" />,
                            description: "Motif très arrondi"
                          },
                          {
                            value: "dots",
                            label: "Dots",
                            icon: <Dot className="w-4 h-4" />,
                            description: "Motif en points"
                          },
                          {
                            value: "classy",
                            label: "Classy",
                            icon: <Hexagon className="w-4 h-4" />,
                            description: "Motif élégant"
                          },
                          {
                            value: "classy-rounded",
                            label: "Classy Rounded",
                            icon: <Circle className="w-4 h-4" />,
                            description: "Motif élégant arrondi"
                          }
                        ]}
                      />

                      {/* Marker */}
                      <DesignOption
                        label="Marker"
                        value={qrData.designOptions.marker}
                        onChange={(value) => setQrData({ 
                          ...qrData, 
                          designOptions: { 
                            ...qrData.designOptions, 
                            marker: value 
                          } 
                        })}
                        isDarkMode={isDarkMode}
                        options={[
                          {
                            value: "default",
                            label: "Default",
                            icon: <Square className="w-4 h-4" />,
                            description: "Marqueur carré standard"
                          },
                          {
                            value: "square",
                            label: "Square",
                            icon: <Square className="w-4 h-4" />,
                            description: "Marqueur carré net"
                          },
                          {
                            value: "dot",
                            label: "Dot",
                            icon: <Dot className="w-4 h-4" />,
                            description: "Marqueur en point"
                          },
                          {
                            value: "extra-rounded",
                            label: "Extra Rounded",
                            icon: <Circle className="w-4 h-4" />,
                            description: "Marqueur très arrondi"
                          }
                        ]}
                      />

                      {/* Center dot style */}
                      <DesignOption
                        label="Center dot style"
                        value={qrData.designOptions.centerDotStyle}
                        onChange={(value) => setQrData({ 
                          ...qrData, 
                          designOptions: { 
                            ...qrData.designOptions, 
                            centerDotStyle: value 
                          } 
                        })}
                        isDarkMode={isDarkMode}
                        options={[
                          {
                            value: "default",
                            label: "Default",
                            icon: <Dot className="w-4 h-4" />,
                            description: "Point central standard"
                          },
                          {
                            value: "dot",
                            label: "Dot",
                            icon: <Dot className="w-4 h-4" />,
                            description: "Point central rond"
                          },
                          {
                            value: "square",
                            label: "Square",
                            icon: <Square className="w-4 h-4" />,
                            description: "Point central carré"
                          }
                        ]}
                      />

                      {/* Custom markers color */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="customMarkers"
                            checked={qrData.designOptions.customMarkers.enabled}
                            onChange={(e) => setQrData({ 
                              ...qrData, 
                              designOptions: { 
                                ...qrData.designOptions, 
                                customMarkers: { 
                                  ...qrData.designOptions.customMarkers, 
                                  enabled: e.target.checked 
                                } 
                              } 
                            })}
                            className="rounded"
                          />
                          <label htmlFor="customMarkers" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Custom markers color
                          </label>
                        </div>

                        {qrData.designOptions.customMarkers.enabled && (
                          <div className="space-y-3 pl-6">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Marker border
                                </label>
                                <div className="flex items-center space-x-1">
                                  <input
                                    type="color"
                                    value={qrData.designOptions.customMarkers.markerBorder}
                                    onChange={(e) => setQrData({ 
                                      ...qrData, 
                                      designOptions: { 
                                        ...qrData.designOptions, 
                                        customMarkers: { 
                                          ...qrData.designOptions.customMarkers, 
                                          markerBorder: e.target.value 
                                        } 
                                      } 
                                    })}
                                    className="w-8 h-6 rounded border border-gray-300"
                                  />
                                  <Input
                                    value={qrData.designOptions.customMarkers.markerBorder}
                                    onChange={(e) => setQrData({ 
                                      ...qrData, 
                                      designOptions: { 
                                        ...qrData.designOptions, 
                                        customMarkers: { 
                                          ...qrData.designOptions.customMarkers, 
                                          markerBorder: e.target.value 
                                        } 
                                      } 
                                    })}
                                    className="flex-1 text-xs"
                                  />
                                </div>
                              </div>
                              
                              <div>
                                <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Marker center
                                </label>
                                <div className="flex items-center space-x-1">
                                  <input
                                    type="color"
                                    value={qrData.designOptions.customMarkers.markerCenter}
                                    onChange={(e) => setQrData({ 
                                      ...qrData, 
                                      designOptions: { 
                                        ...qrData.designOptions, 
                                        customMarkers: { 
                                          ...qrData.designOptions.customMarkers, 
                                          markerCenter: e.target.value 
                                        } 
                                      } 
                                    })}
                                    className="w-8 h-6 rounded border border-gray-300"
                                  />
                                  <Input
                                    value={qrData.designOptions.customMarkers.markerCenter}
                                    onChange={(e) => setQrData({ 
                                      ...qrData, 
                                      designOptions: { 
                                        ...qrData.designOptions, 
                                        customMarkers: { 
                                          ...qrData.designOptions.customMarkers, 
                                          markerCenter: e.target.value 
                                        } 
                                      } 
                                    })}
                                    className="flex-1 text-xs"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="differentMarkerColor"
                                checked={qrData.designOptions.customMarkers.differentMarkerColor}
                                onChange={(e) => setQrData({ 
                                  ...qrData, 
                                  designOptions: { 
                                    ...qrData.designOptions, 
                                    customMarkers: { 
                                      ...qrData.designOptions.customMarkers, 
                                      differentMarkerColor: e.target.checked 
                                    } 
                                  } 
                                })}
                                className="rounded"
                              />
                              <label htmlFor="differentMarkerColor" className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Different marker color
                              </label>
                            </div>

                            {qrData.designOptions.customMarkers.differentMarkerColor && (
                              <div className="space-y-2">
                                <div className="text-xs font-medium text-orange-600 bg-orange-50 p-2 rounded">
                                  ⚠️ Évitez d'utiliser trop de couleurs dans les marqueurs — cela peut réduire la fiabilité du scan.
                                </div>
                                
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                      Top left border
                                    </label>
                                    <input
                                      type="color"
                                      value={qrData.designOptions.customMarkers.topLeftBorder}
                                      onChange={(e) => setQrData({ 
                                        ...qrData, 
                                        designOptions: { 
                                          ...qrData.designOptions, 
                                          customMarkers: { 
                                            ...qrData.designOptions.customMarkers, 
                                            topLeftBorder: e.target.value 
                                          } 
                                        } 
                                      })}
                                      className="w-full h-6 rounded border border-gray-300"
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                      Top left center
                                    </label>
                                    <input
                                      type="color"
                                      value={qrData.designOptions.customMarkers.topLeftCenter}
                                      onChange={(e) => setQrData({ 
                                        ...qrData, 
                                        designOptions: { 
                                          ...qrData.designOptions, 
                                          customMarkers: { 
                                            ...qrData.designOptions.customMarkers, 
                                            topLeftCenter: e.target.value 
                                          } 
                                        } 
                                      })}
                                      className="w-full h-6 rounded border border-gray-300"
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                      Top right border
                                    </label>
                                    <input
                                      type="color"
                                      value={qrData.designOptions.customMarkers.topRightBorder}
                                      onChange={(e) => setQrData({ 
                                        ...qrData, 
                                        designOptions: { 
                                          ...qrData.designOptions, 
                                          customMarkers: { 
                                            ...qrData.designOptions.customMarkers, 
                                            topRightBorder: e.target.value 
                                          } 
                                        } 
                                      })}
                                      className="w-full h-6 rounded border border-gray-300"
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                      Top right center
                                    </label>
                                    <input
                                      type="color"
                                      value={qrData.designOptions.customMarkers.topRightCenter}
                                      onChange={(e) => setQrData({ 
                                        ...qrData, 
                                        designOptions: { 
                                          ...qrData.designOptions, 
                                          customMarkers: { 
                                            ...qrData.designOptions.customMarkers, 
                                            topRightCenter: e.target.value 
                                          } 
                                        } 
                                      })}
                                      className="w-full h-6 rounded border border-gray-300"
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                      Bottom left border
                                    </label>
                                    <input
                                      type="color"
                                      value={qrData.designOptions.customMarkers.bottomLeftBorder}
                                      onChange={(e) => setQrData({ 
                                        ...qrData, 
                                        designOptions: { 
                                          ...qrData.designOptions, 
                                          customMarkers: { 
                                            ...qrData.designOptions.customMarkers, 
                                            bottomLeftBorder: e.target.value 
                                          } 
                                        } 
                                      })}
                                      className="w-full h-6 rounded border border-gray-300"
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                      Bottom left center
                                    </label>
                                    <input
                                      type="color"
                                      value={qrData.designOptions.customMarkers.bottomLeftCenter}
                                      onChange={(e) => setQrData({ 
                                        ...qrData, 
                                        designOptions: { 
                                          ...qrData.designOptions, 
                                          customMarkers: { 
                                            ...qrData.designOptions.customMarkers, 
                                            bottomLeftCenter: e.target.value 
                                          } 
                                        } 
                                      })}
                                      className="w-full h-6 rounded border border-gray-300"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Frame & Logo */}
                  <div className="space-y-4">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      🖼️ Frame & Logo
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Frame */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="frameEnabled"
                            checked={qrData.frameStyle.enabled}
                            onChange={(e) => setQrData({ 
                              ...qrData, 
                              frameStyle: { 
                                ...qrData.frameStyle, 
                                enabled: e.target.checked 
                              } 
                            })}
                            className="rounded"
                          />
                          <label htmlFor="frameEnabled" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Ajouter un cadre
                          </label>
                        </div>

                        {qrData.frameStyle.enabled && (
                          <div className="space-y-3 pl-6">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Couleur du cadre
                                </label>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="color"
                                    value={qrData.frameStyle.color}
                                    onChange={(e) => setQrData({ 
                                      ...qrData, 
                                      frameStyle: { 
                                        ...qrData.frameStyle, 
                                        color: e.target.value 
                                      } 
                                    })}
                                    className="w-12 h-10 rounded-lg border border-gray-300"
                                  />
                                  <Input
                                    value={qrData.frameStyle.color}
                                    onChange={(e) => setQrData({ 
                                      ...qrData, 
                                      frameStyle: { 
                                        ...qrData.frameStyle, 
                                        color: e.target.value 
                                      } 
                                    })}
                                    className="flex-1"
                                  />
                                </div>
                              </div>
                              
                              <div>
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Épaisseur (px)
                                </label>
                                <Input
                                  type="number"
                                  min="1"
                                  max="20"
                                  value={qrData.frameStyle.thickness}
                                  onChange={(e) => setQrData({ 
                                    ...qrData, 
                                    frameStyle: { 
                                      ...qrData.frameStyle, 
                                      thickness: parseInt(e.target.value) || 2 
                                    } 
                                  })}
                                  className="w-full"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Rayon des coins (px)
                              </label>
                              <Input
                                type="number"
                                min="0"
                                max="50"
                                value={qrData.frameStyle.cornerRadius}
                                onChange={(e) => setQrData({ 
                                  ...qrData, 
                                  frameStyle: { 
                                    ...qrData.frameStyle, 
                                    cornerRadius: parseInt(e.target.value) || 8 
                                  } 
                                })}
                                className="w-full"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Logo */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="logoEnabled"
                            checked={qrData.logoStyle.enabled}
                            onChange={(e) => setQrData({ 
                              ...qrData, 
                              logoStyle: { 
                                ...qrData.logoStyle, 
                                enabled: e.target.checked 
                              } 
                            })}
                            className="rounded"
                          />
                          <label htmlFor="logoEnabled" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Ajouter un logo
                          </label>
                        </div>

                        {qrData.logoStyle.enabled && (
                          <div className="space-y-3 pl-6">
                            <div>
                              <FileUpload
                                label="Uploader un logo"
                                onFileSelect={(file) => {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    setQrData({ ...qrData, logo: event.target?.result as string | null });
                                  };
                                  reader.readAsDataURL(file);
                                }}
                                acceptedTypes={['image/*']}
                                maxSize={2}
                                helpText="Formats supportés: JPG, PNG, GIF, WebP. Taille maximale: 2MB"
                              />
                            </div>

                            {/* Predefined images for quick selection */}
                            <div>
                              <button
                                type="button"
                                onClick={() => setIsLogosExpanded(!isLogosExpanded)}
                                className={`flex items-center justify-between w-full mb-2 ${isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-700 hover:text-gray-900'}`}
                              >
                                <label className={`text-sm font-medium cursor-pointer`}>
                                  Logos prédéfinis
                                </label>
                                {isLogosExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </button>
                              <div className="grid grid-cols-6 gap-2">
                                {availableLogos.length > 0 ? (
                                  (isLogosExpanded ? availableLogos : availableLogos.slice(0, 6)).map((src, idx) => (
                                    <button
                                      key={`preset-logo-${idx}`}
                                      className={`relative w-12 h-12 rounded-md overflow-hidden border ${qrData.logo === src ? 'border-blue-500' : 'border-gray-300'}`}
                                      onClick={async () => {
                                        const dataUrl = await clampImageDataUrl(src);
                                        setQrData({ ...qrData, logo: dataUrl, logoStyle: { ...qrData.logoStyle, enabled: true } });
                                      }}
                                      title="Utiliser ce logo"
                                    >
                                      <img src={src} alt={`Logo ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                                    </button>
                                  ))
                                ) : (
                                  <div className="col-span-6 text-sm text-gray-500">Chargement des logos...</div>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Taille (%)
                                </label>
                                <Input
                                  type="number"
                                  min="10"
                                  max="50"
                                  value={qrData.logoStyle.size}
                                  onChange={(e) => setQrData({ 
                                    ...qrData, 
                                    logoStyle: { 
                                      ...qrData.logoStyle, 
                                      size: parseInt(e.target.value) || 50 
                                    } 
                                  })}
                                  className="w-full"
                                />
                              </div>
                              
                              <div>
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Position
                                </label>
                                <Select
                                  value={qrData.logoStyle.position}
                                  onChange={(e) => setQrData({ 
                                    ...qrData, 
                                    logoStyle: { 
                                      ...qrData.logoStyle, 
                                      position: e.target.value 
                                    } 
                                  })}
                                  className="w-full"
                                >
                                  <option value="center">Center</option>
                                  <option value="top-left">Top Left</option>
                                  <option value="top-right">Top Right</option>
                                  <option value="bottom-left">Bottom Left</option>
                                  <option value="bottom-right">Bottom Right</option>
                                </Select>
                              </div>
                            </div>
                            
                            {/* Logo preview */}
                            {qrData.logo && (
                              <div>
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Aperçu du logo
                                </label>
                                <div className="relative w-20 h-20 border border-gray-300 rounded-lg overflow-hidden">
                                  <img
                                    src={qrData.logo}
                                    alt="Logo preview"
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    onClick={() => setQrData({ ...qrData, logo: null })}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Logo Background */}
                            <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="logoBackgroundEnabled"
                                  checked={qrData.logoBackground.enabled}
                                  onChange={(e) => setQrData({ 
                                    ...qrData, 
                                    logoBackground: { 
                                      ...qrData.logoBackground, 
                                      enabled: e.target.checked 
                                    } 
                                  })}
                                  className="rounded"
                                />
                                <label htmlFor="logoBackgroundEnabled" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Ajouter un fond au logo
                                </label>
                              </div>

                              {qrData.logoBackground.enabled && (
                                <div className="space-y-3 pl-6">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Couleur du fond
                                      </label>
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="color"
                                          value={qrData.logoBackground.color}
                                          onChange={(e) => setQrData({ 
                                            ...qrData, 
                                            logoBackground: { 
                                              ...qrData.logoBackground, 
                                              color: e.target.value 
                                            } 
                                          })}
                                          className="w-12 h-10 rounded-lg border border-gray-300"
                                        />
                                        <Input
                                          value={qrData.logoBackground.color}
                                          onChange={(e) => setQrData({ 
                                            ...qrData, 
                                            logoBackground: { 
                                              ...qrData.logoBackground, 
                                              color: e.target.value 
                                            } 
                                          })}
                                          className="flex-1"
                                        />
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Forme du fond
                                      </label>
                                      <Select
                                        value={qrData.logoBackground.shape}
                                        onChange={(e) => setQrData({ 
                                          ...qrData, 
                                          logoBackground: { 
                                            ...qrData.logoBackground, 
                                            shape: e.target.value as 'circle' | 'square' | 'rounded' | 'diamond'
                                          } 
                                        })}
                                        className="w-full"
                                      >
                                        <option value="circle">Cercle</option>
                                        <option value="square">Carré</option>
                                        <option value="rounded">Carré arrondi</option>
                                        <option value="diamond">Losange</option>
                                      </Select>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                      Marge autour du logo (px)
                                    </label>
                                    <Input
                                      type="number"
                                      min="0"
                                      max="50"
                                      value={qrData.logoBackground.padding}
                                      onChange={(e) => setQrData({ 
                                        ...qrData, 
                                        logoBackground: { 
                                          ...qrData.logoBackground, 
                                          padding: parseInt(e.target.value) || 10 
                                        } 
                                      })}
                                      className="w-full"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <LoadingButton
                      onClick={generateQRCode}
                      loading={isGenerating('generate')}
                      loadingText="Génération en cours..."
                      disabled={qrData.type === 'LOYALTY' && !loyaltyProgram}
                      className={`w-full py-3 rounded-xl ${
                        qrData.type === 'LOYALTY' && !loyaltyProgram
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                      } text-white`}
                    >
                      <Zap className="h-5 w-5 mr-2" />
                      {qrData.type === 'LOYALTY' && !loyaltyProgram 
                        ? 'Créer d\'abord un programme de fidélité' 
                        : 'Générer le QR Code'
                      }
                    </LoadingButton>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Preview Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto"
            >
              <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
                <CardHeader>
                  <CardTitle className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Aperçu en temps réel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* QR Code Preview */}
                    <div className="flex justify-center">
                      <div className="p-8 rounded-2xl shadow-lg" style={{ backgroundColor: qrData.backgroundColor || 'rgb(168, 0, 0)' }}>
                        <div
                          ref={previewContainerRef}
                          className="w-64 h-64 flex items-center justify-center rounded-xl relative"
                          style={{ backgroundColor: qrData.backgroundColor }}
                        >
                          {(() => {
                            const validation = validateQRData();
                            if (validation.valid) {
                              return (
                                <div className="relative">
                            <StyledQRCode
                              value={generatedUrl}
                              size={qrData.size}
                              foregroundColor={qrData.foregroundColor}
                              backgroundColor={qrData.backgroundColor}
                              backgroundImage={qrData.backgroundImage || undefined}
                              logo={qrData.logo || undefined}
                              logoSize={qrData.logoStyle.enabled ? qrData.logoStyle.size : 0}
                              logoBackground={qrData.logoBackground.enabled ? {
                                color: qrData.logoBackground.color,
                                shape: qrData.logoBackground.shape,
                                padding: qrData.logoBackground.padding
                              } : undefined}
                              frameStyle={qrData.frameStyle}
                              designOptions={qrData.designOptions}
                            />
                                </div>
                              );
                            } else {
                              return (
                            <div className="text-center text-gray-500">
                              <QrCode className="h-16 w-16 mx-auto mb-2" />
                              <p className="text-sm">
                                    {validation.error || 'Configurez le QR code pour voir l\'aperçu'}
                              </p>
                            </div>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* QR Code Info */}
                    <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Nom:
                          </span>
                          <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {qrData.name || 'Non défini'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Type:
                          </span>
                          <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {qrTypes.find(t => t.value === qrData.type)?.label}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Taille:
                          </span>
                          <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {qrData.size}px
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            URL générée:
                          </span>
                          <span className={`text-xs ${isDarkMode ? 'text-white' : 'text-gray-900'} break-all`}>
                            {(() => {
                              const validation = validateQRData();
                              return validation.valid ? generatedUrl : 'Non disponible';
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <LoadingButton 
                          variant="outline" 
                          className="flex items-center justify-center"
                          onClick={handleDownload}
                          loading={isGenerating('download')}
                          loadingText="Téléchargement..."
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger
                        </LoadingButton>
                        <Button
                          variant="outline"
                          onClick={handleCopy}
                          className="flex items-center justify-center"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 mr-2 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4 mr-2" />
                          )}
                          {copied ? 'Copié!' : 'Copier'}
                        </Button>
                      </div>
                      
                      {(() => {
                        const validation = validateQRData();
                        return validation.valid && (
                        <Button
                          variant="outline"
                          onClick={() => window.open(generatedUrl, '_blank')}
                          className="w-full flex items-center justify-center"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Tester le QR Code
                        </Button>
                        );
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </Page>
  );
}
