import { useEffect, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, redirect, useLoaderData, useNavigate } from "@remix-run/react";
import { json } from "@remix-run/node";
import { Page } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";
import { getOrCreateMerchant } from "../utils/merchant.server";
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingButton } from '../components/ui/LoadingButton';
import { formatNumber, formatPercentage, formatDate } from '../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/ui/Toast';
import { useLoading } from '../hooks/useLoading';
import { useQuickNotifications } from '../components/ui/NotificationSystem';
import {
  QrCode,
  TrendingUp,
  Users,
  Target,
  BarChart3,
  Eye,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Sparkles,
  Zap,
  Star,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  Clock,
  Award,
  ChevronRight,
  Check,
  Heart,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  
  // Get or create merchant
  const merchant = await getOrCreateMerchant(
    session?.shop || (admin as any).shopifyDomain || (admin as any).shop || (admin as any).domain,
    session?.accessToken
  );

  // Get QR codes
  const qrCodes = await prisma.qRCode.findMany({
    where: {
      merchantId: merchant.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  // Get analytics events
  const analyticsEvents = await prisma.analyticsEvent.findMany({
    where: {
      qr: {
        merchantId: merchant.id,
      },
    },
    include: {
      qr: true,
    },
  });

  // Get campaigns
  const campaigns = await prisma.campaign.findMany({
    where: {
      merchantId: merchant.id,
    },
    include: {
      qrcodes: true,
    },
  });

  // Calculate stats
  const totalQRCodes = qrCodes.length;
  const totalScans = analyticsEvents.length;
  const totalConversions = analyticsEvents.filter(e => e.type === 'PURCHASE').length;
  const conversionRate = totalScans > 0 ? (totalConversions / totalScans) * 100 : 0;

  // Get recent activity
  const recentActivity = analyticsEvents
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(event => ({
      id: event.id,
      type: event.type,
      message: `Nouveau ${event.type} sur "${event.qr.title}"`,
      time: formatDate(event.createdAt, 'HH:mm'),
      location: (event.meta as any)?.location || 'Unknown',
    }));

  return json({
    shop: session?.shop || (admin as any).shopifyDomain || (admin as any).shop || (admin as any).domain,
    merchant,
    qrCodes,
    analyticsEvents,
    campaigns,
    stats: {
      totalQRCodes,
      totalScans,
      totalConversions,
      conversionRate,
    },
    recentActivity,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();

  const product = responseJson.data!.productCreate!.product!;
  const variantId = product.variants.edges[0]!.node!.id!;

  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyRemixTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    },
  );

  const variantResponseJson = await variantResponse.json();

  return {
    product: responseJson!.data!.productCreate!.product,
    variant:
      variantResponseJson!.data!.productVariantsBulkUpdate!.productVariants,
  };
};

export default function Index() {
  const { shop, merchant, qrCodes, analyticsEvents, campaigns, stats, recentActivity } = useLoaderData<typeof loader>();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { isLoading, withLoading } = useLoading();
  const { success: notifySuccess, error: notifyError, info: notifyInfo } = useQuickNotifications();

  useEffect(() => {
    // Detect dark mode preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Button handlers with loading states
  const handleCreateQR = async () => {
    await withLoading('createQR', async () => {
      navigate('/app/create');
    });
  };

  const handleViewAnalytics = async () => {
    await withLoading('viewAnalytics', async () => {
      navigate('/app/analytics');
    });
  };

  const handleViewTemplates = async () => {
    await withLoading('viewTemplates', async () => {
      success('Templates', 'Fonctionnalité bientôt disponible!');
    });
  };

  const handleViewAll = async () => {
    await withLoading('viewAll', async () => {
      navigate('/app/qr-manager');
    });
  };

  // Stats for dashboard
  const dashboardStats = [
    {
      name: 'QR Codes actifs',
      value: stats.totalQRCodes,
      change: '+12%',
      changeType: 'positive' as const,
      icon: QrCode,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      name: 'Scans total',
      value: stats.totalScans,
      change: '+8%',
      changeType: 'positive' as const,
      icon: Eye,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      name: 'Taux de conversion',
      value: `${stats.conversionRate.toFixed(1)}%`,
      change: '+2.1%',
      changeType: 'positive' as const,
      icon: Target,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      name: 'Conversions',
      value: stats.totalConversions,
      change: '+15%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
  ];

  return (
    <Page fullWidth>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Bienvenue sur QR Connect
                </h1>
                <p className={`mt-2 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Gérez vos QR codes interactifs et boostez vos ventes
                </p>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Créer un QR Code
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {dashboardStats.map((stat, index) => (
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

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* QR Codes List */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2"
            >
              <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Vos QR Codes récents
                    </CardTitle>
                    <LoadingButton 
                      variant="outline" 
                      size="sm"
                      onClick={handleViewAll}
                      loading={isLoading('viewAll')}
                      loadingText="Chargement..."
                    >
                      Voir tout
                      <ChevronRight className="h-4 w-4 ml-1" />
                  </LoadingButton>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {qrCodes.map((qr: any, index: number) => (
                      <motion.div
                        key={qr.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} hover:shadow-md transition-all duration-300`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <QrCode className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {qr.title}
                              </h3>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {formatNumber(qr.scanCount)} scans • {formatDate(qr.createdAt, 'DD/MM/YYYY')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge variant="success" className="bg-green-100 text-green-800">
                              Actif
                            </Badge>
                            <Button variant="ghost" size="sm">
                              <ChevronRight className="h-4 w-4" />
                    </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Activity Feed */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
                <CardHeader className="pb-4">
                  <CardTitle className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Activité récente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity: any, index: number) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        className="flex items-start space-x-3"
                      >
                        <div className={`p-2 rounded-full ${activity.type === 'conversion' ? 'bg-green-100' : 'bg-blue-100'}`}>
                          {activity.type === 'conversion' ? (
                            <Award className="h-4 w-4 text-green-600" />
                          ) : (
                            <Eye className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {activity.message}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {activity.time}
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <MapPin className="h-3 w-3 mr-1" />
                              {activity.location}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
            </Card>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8"
          >
            <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
              <CardHeader>
                <CardTitle className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Actions rapides
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <LoadingButton 
                      onClick={handleCreateQR}
                      loading={isLoading('createQR')}
                      loadingText="Chargement..."
                      className="w-full h-20 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl flex flex-col items-center justify-center space-y-2"
                    >
                      <QrCode className="h-6 w-6" />
                      <span className="font-medium">Créer QR Code</span>
                    </LoadingButton>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <LoadingButton 
                      onClick={handleViewAnalytics}
                      loading={isLoading('viewAnalytics')}
                      loadingText="Chargement..."
                      className="w-full h-20 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl flex flex-col items-center justify-center space-y-2"
                    >
                      <BarChart3 className="h-6 w-6" />
                      <span className="font-medium">Voir Analytics</span>
                    </LoadingButton>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <LoadingButton 
                      onClick={handleViewTemplates}
                      loading={isLoading('viewTemplates')}
                      loadingText="Chargement..."
                      className="w-full h-20 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl flex flex-col items-center justify-center space-y-2"
                    >
                      <Sparkles className="h-6 w-6" />
                      <span className="font-medium">Templates</span>
                    </LoadingButton>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pricing Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="mt-8"
          >
            <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
              <CardHeader className="text-center">
                <CardTitle className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Choisissez votre plan
                </CardTitle>
                <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Débloquez tout le potentiel de vos QR codes
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Free Plan */}
                  <motion.div
                    whileHover={{ y: -5 }}
                    className={`p-6 rounded-2xl border-2 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} hover:shadow-lg transition-all duration-300`}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <QrCode className="h-6 w-6 text-gray-600" />
                      </div>
                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Free
                      </h3>
                      <div className="mt-2">
                        <span className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          $0
                        </span>
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          /mois
                      </span>
                      </div>
                      <p className={`mt-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Parfait pour commencer
                      </p>
                    </div>
                    <ul className={`mt-6 space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        3 QR Codes
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        Stats de base
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        Support email
                      </li>
                    </ul>
                    <Button className="w-full mt-6" variant="outline">
                      Plan actuel
                    </Button>
                  </motion.div>

                  {/* Pro Plan */}
                  <motion.div
                    whileHover={{ y: -5 }}
                    className={`p-6 rounded-2xl border-2 border-blue-500 ${isDarkMode ? 'bg-gray-700' : 'bg-white'} hover:shadow-lg transition-all duration-300 relative`}
                  >
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500 text-white px-3 py-1">
                        Populaire
                      </Badge>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Star className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Pro
                      </h3>
                      <div className="mt-2">
                        <span className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          $9
                        </span>
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          /mois
                      </span>
                      </div>
                      <p className={`mt-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Pour les entreprises en croissance
                      </p>
                    </div>
                    <ul className={`mt-6 space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        QR Codes illimités
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        Analytics avancées
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        Personnalisation
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        Support prioritaire
                      </li>
                    </ul>
                    <Button className="w-full mt-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                      Passer au Pro
                    </Button>
                  </motion.div>

                  {/* Premium Plan */}
                  <motion.div
                    whileHover={{ y: -5 }}
                    className={`p-6 rounded-2xl border-2 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} hover:shadow-lg transition-all duration-300`}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Heart className="h-6 w-6 text-purple-600" />
                      </div>
                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Premium
                      </h3>
                      <div className="mt-2">
                        <span className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          $19
                        </span>
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          /mois
                        </span>
                      </div>
                      <p className={`mt-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Pour les grandes entreprises
                      </p>
                    </div>
                    <ul className={`mt-6 space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        Tout du Pro
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        Branding personnalisé
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        API access
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        Support 24/7
                      </li>
                    </ul>
                    <Button className="w-full mt-6" variant="outline">
                      Choisir Premium
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
              </Card>
          </motion.div>
        </div>
    </Page>
  );
}
